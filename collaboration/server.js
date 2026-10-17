const http = require('http');
const path = require('path');
const { URL } = require('url');
const WebSocket = require('ws');
const Y = require('yjs');
const syncProtocol = require('y-protocols/sync');
const encoding = require('lib0/encoding');
const decoding = require('lib0/decoding');
const dotenv = require('dotenv');

// Load environment configuration
dotenv.config({ path: path.resolve(__dirname, '.env') });

const { MongoDBPersistence } = require('./persistence/MongoDBPersistence');
const {
  verifyToken,
  extractTokenFromCookies,
  fetchUserAndRoomAccess
} = require('./utils/auth');
const {
  MESSAGE_AWARENESS,
  createAwareness,
  handleAwarenessUpdate,
  createAwarenessMessage,
  removeClientStates
} = require('./utils/awareness');

// Configuration
const PORT = parseInt(process.env.PORT, 10) || 4444;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/codesync';
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_at_least_32_characters_long';
const MAX_CONNECTIONS_PER_ROOM = 50;
const MAX_PAYLOAD_BYTES = 1024 * 1024; // 1MB
const PING_INTERVAL_MS = 30000;
const DOC_CLEANUP_TIMEOUT_MS = 30000;
const PERSISTENCE_DEBOUNCE_MS = 1000;

// Protocol Message Constants
const MESSAGE_SYNC = 0;

// Initialize persistence adapter
const persistence = new MongoDBPersistence(MONGODB_URI);

/**
 * Active documents map:
 * Map<docName, {
 *   doc: Y.Doc,
 *   awareness: import('y-protocols/awareness').Awareness,
 *   conns: Map<WebSocket, Set<number>>,
 *   pendingUpdates: Buffer[],
 *   saveTimer: NodeJS.Timeout | null,
 *   cleanupTimer: NodeJS.Timeout | null
 * }>
 */
const documents = new Map();

/**
 * Send binary message to a WebSocket connection
 * @param {WebSocket} ws
 * @param {Uint8Array} message
 */
function send(ws, message) {
  if (ws.readyState !== WebSocket.OPEN) return;
  try {
    ws.send(message, (err) => {
      if (err) {
        console.error('[collaboration] WS send error:', err.message);
      }
    });
  } catch (err) {
    console.error('[collaboration] WS send exception:', err.message);
  }
}

/**
 * Flush debounced pending updates to MongoDB
 * @param {string} docName
 */
async function flushDoc(docName) {
  const activeDoc = documents.get(docName);
  if (!activeDoc || activeDoc.pendingUpdates.length === 0) return;

  if (activeDoc.saveTimer) {
    clearTimeout(activeDoc.saveTimer);
    activeDoc.saveTimer = null;
  }

  const updatesToStore = activeDoc.pendingUpdates;
  activeDoc.pendingUpdates = [];

  try {
    const merged = updatesToStore.length === 1 ? updatesToStore[0] : Y.mergeUpdates(updatesToStore);
    await persistence.storeUpdate(docName, Buffer.from(merged));
  } catch (err) {
    console.error(`[collaboration] Failed to persist updates for doc ${docName}:`, err.message);
    // Restore updates in queue on failure
    activeDoc.pendingUpdates.unshift(...updatesToStore);
  }
}

/**
 * Schedule debounced persistence for document
 * @param {string} docName
 * @param {Uint8Array|Buffer} update
 */
function schedulePersistence(docName, update) {
  const activeDoc = documents.get(docName);
  if (!activeDoc) return;

  const buf = Buffer.isBuffer(update) ? update : Buffer.from(update);
  activeDoc.pendingUpdates.push(buf);

  if (activeDoc.saveTimer) {
    clearTimeout(activeDoc.saveTimer);
  }

  activeDoc.saveTimer = setTimeout(() => {
    flushDoc(docName).catch((err) => {
      console.error(`[collaboration] Debounced persistence error for ${docName}:`, err.message);
    });
  }, PERSISTENCE_DEBOUNCE_MS);
}

/**
 * Retrieve or instantiate Y.Doc for given docName
 * @param {string} docName
 * @returns {Promise<object>}
 */
async function getOrCreateDoc(docName) {
  let activeDoc = documents.get(docName);

  if (activeDoc) {
    if (activeDoc.cleanupTimer) {
      clearTimeout(activeDoc.cleanupTimer);
      activeDoc.cleanupTimer = null;
    }
    return activeDoc;
  }

  // Load persisted state from MongoDB
  const doc = await persistence.getYDoc(docName);
  const awareness = createAwareness(doc);

  activeDoc = {
    doc,
    awareness,
    conns: new Map(),
    pendingUpdates: [],
    saveTimer: null,
    cleanupTimer: null
  };

  // Listen to document updates
  doc.on('update', (update, origin) => {
    // 1. Broadcast update to all other connected peers
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, MESSAGE_SYNC);
    syncProtocol.writeUpdate(encoder, update);
    const message = encoding.toUint8Array(encoder);

    for (const [conn] of activeDoc.conns) {
      if (conn !== origin && conn.readyState === WebSocket.OPEN) {
        send(conn, message);
      }
    }

    // 2. Schedule debounced MongoDB persistence
    schedulePersistence(docName, update);
  });

  // Listen to awareness changes
  awareness.on('update', ({ added, updated, removed }, origin) => {
    // Track client IDs per connection
    if (origin && activeDoc.conns.has(origin)) {
      const clientIds = activeDoc.conns.get(origin);
      added.forEach((id) => clientIds.add(id));
      updated.forEach((id) => clientIds.add(id));
      removed.forEach((id) => clientIds.delete(id));
    }

    const changedClients = added.concat(updated).concat(removed);
    if (changedClients.length === 0) return;

    const message = createAwarenessMessage(awareness, changedClients);
    for (const [conn] of activeDoc.conns) {
      if (conn !== origin && conn.readyState === WebSocket.OPEN) {
        send(conn, message);
      }
    }
  });

  documents.set(docName, activeDoc);
  return activeDoc;
}

// Create HTTP server
const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        activeDocuments: documents.size,
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
      })
    );
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

// Create WebSocket server attached to HTTP server
const wss = new WebSocket.Server({
  noServer: true,
  maxPayload: MAX_PAYLOAD_BYTES
});

// Handle WebSocket upgrade requests
server.on('upgrade', async (req, socket, head) => {
  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname.replace(/^\/+/, '');
    const docName = decodeURIComponent(pathname);

    // Validate docName structure (format: room:{roomId}:file:{fileId} or room-{roomId}-file-{fileId})
    if (!docName || (!docName.startsWith('room:') && !docName.startsWith('room-'))) {
      socket.write('HTTP/1.1 400 Bad Request\r\n\r\n');
      socket.destroy();
      return;
    }

    // Extract JWT token from Cookie or query param fallback
    let token = extractTokenFromCookies(req.headers.cookie);
    if (!token && parsedUrl.searchParams.has('token')) {
      token = parsedUrl.searchParams.get('token');
    }
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.slice(7).trim();
    }

    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    // Verify JWT token
    const decoded = verifyToken(token, JWT_SECRET);
    if (!decoded) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    const userId = decoded.id || decoded.userId || decoded._id || decoded.sub;
    if (!userId) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }

    // Verify room membership and determine role
    const access = await fetchUserAndRoomAccess(userId, docName, MONGODB_URI);
    if (!access) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      socket.destroy();
      return;
    }

    // Check room connection limits
    const existingDoc = documents.get(docName);
    if (existingDoc && existingDoc.conns.size >= MAX_CONNECTIONS_PER_ROOM) {
      socket.write('HTTP/1.1 429 Too Many Requests\r\n\r\n');
      socket.destroy();
      return;
    }

    // Complete upgrade
    wss.handleUpgrade(req, socket, head, (ws) => {
      ws.user = access.user;
      ws.role = access.role; // 'owner' | 'editor' | 'viewer'
      ws.roomId = access.roomId;
      ws.fileId = access.fileId;
      ws.docName = docName;
      ws.isAlive = true;

      wss.emit('connection', ws, req);
    });
  } catch (err) {
    console.error('[collaboration] Error during upgrade:', err);
    socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
    socket.destroy();
  }
});

// Handle WebSocket connections
wss.on('connection', async (ws) => {
  const { docName, role, user } = ws;

  let activeDoc;
  try {
    activeDoc = await getOrCreateDoc(docName);
  } catch (err) {
    console.error(`[collaboration] Failed to load doc ${docName}:`, err);
    ws.close(1011, 'Internal server error loading document');
    return;
  }

  // Register connection in document map
  activeDoc.conns.set(ws, new Set());

  // Set up ping-pong liveness
  ws.on('pong', () => {
    ws.isAlive = true;
  });

  // 1. Send initial Sync Step 1 to client
  const syncEncoder = encoding.createEncoder();
  encoding.writeVarUint(syncEncoder, MESSAGE_SYNC);
  syncProtocol.writeSyncStep1(syncEncoder, activeDoc.doc);
  send(ws, encoding.toUint8Array(syncEncoder));

  // 2. Send current awareness states to client
  const awarenessStates = activeDoc.awareness.getStates();
  if (awarenessStates.size > 0) {
    const awarenessMsg = createAwarenessMessage(
      activeDoc.awareness,
      Array.from(awarenessStates.keys())
    );
    send(ws, awarenessMsg);
  }

  // Handle incoming client messages
  ws.on('message', (message) => {
    try {
      const uint8 = message instanceof Uint8Array ? message : new Uint8Array(message);
      const decoder = decoding.createDecoder(uint8);
      const messageType = decoding.readVarUint(decoder);

      switch (messageType) {
        case MESSAGE_SYNC: {
          const syncMessageType = decoding.readVarUint(decoder);
          const replyEncoder = encoding.createEncoder();
          encoding.writeVarUint(replyEncoder, MESSAGE_SYNC);

          if (syncMessageType === syncProtocol.messageYjsSyncStep1) {
            // Client requests missing state from server (allowed for all roles)
            syncProtocol.readSyncStep1(decoder, replyEncoder, activeDoc.doc);
            if (encoding.length(replyEncoder) > 1) {
              send(ws, encoding.toUint8Array(replyEncoder));
            }
          } else if (syncMessageType === syncProtocol.messageYjsSyncStep2) {
            // Client response to server's SyncStep1
            if (role === 'viewer') {
              // VIEWER: Consume without applying updates to document
              decoding.readVarUint8Array(decoder);
              console.log(`[collaboration] Viewer ${user?._id || 'user'} SyncStep2 ignored`);
            } else {
              syncProtocol.readSyncStep2(decoder, activeDoc.doc, ws);
            }
          } else if (syncMessageType === syncProtocol.messageYjsUpdate) {
            // Document update sent by client
            if (role === 'viewer') {
              // VIEWER: Reject update (read-only enforcement)
              decoding.readVarUint8Array(decoder);
              console.warn(`[collaboration] Blocked update from read-only viewer ${user?._id || 'user'}`);
            } else {
              syncProtocol.readUpdate(decoder, activeDoc.doc, ws);
            }
          }
          break;
        }

        case MESSAGE_AWARENESS: {
          // Awareness protocol update (cursor, presence)
          const awarenessUpdate = decoding.readVarUint8Array(decoder);
          handleAwarenessUpdate(activeDoc.awareness, awarenessUpdate, ws);
          break;
        }

        default:
          console.warn(`[collaboration] Unrecognized message type: ${messageType}`);
      }
    } catch (err) {
      console.error(`[collaboration] Error handling message for doc ${docName}:`, err);
    }
  });

  // Handle connection close
  ws.on('close', () => {
    const clientIds = activeDoc.conns.get(ws);
    activeDoc.conns.delete(ws);

    // Clean up awareness states associated with this connection
    if (clientIds && clientIds.size > 0) {
      removeClientStates(activeDoc.awareness, Array.from(clientIds), null);
    }

    // When room becomes empty, schedule memory cleanup after timeout
    if (activeDoc.conns.size === 0) {
      flushDoc(docName).catch((err) => {
        console.error(`[collaboration] Error flushing doc on disconnect:`, err);
      });

      if (!activeDoc.cleanupTimer) {
        activeDoc.cleanupTimer = setTimeout(async () => {
          if (activeDoc.conns.size === 0) {
            await flushDoc(docName);
            activeDoc.doc.destroy();
            documents.delete(docName);
            console.log(`[collaboration] Evicted inactive document from memory: ${docName}`);
          }
        }, DOC_CLEANUP_TIMEOUT_MS);
      }
    }
  });

  ws.on('error', (err) => {
    console.error(`[collaboration] WS client error on ${docName}:`, err.message);
  });
});

// Periodic ping/pong health check (every 30s)
const pingInterval = setInterval(() => {
  wss.clients.forEach((ws) => {
    if (ws.isAlive === false) {
      console.log(`[collaboration] Terminating stale connection for doc: ${ws.docName}`);
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.ping();
  });
}, PING_INTERVAL_MS);

// Graceful shutdown handling
let isShuttingDown = false;
async function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`[collaboration] Received ${signal}. Initiating graceful shutdown...`);
  clearInterval(pingInterval);

  // 1. Flush all active documents to MongoDB
  for (const docName of documents.keys()) {
    try {
      await flushDoc(docName);
    } catch (err) {
      console.error(`[collaboration] Error persisting ${docName} during shutdown:`, err);
    }
  }

  // 2. Terminate all client connections
  for (const client of wss.clients) {
    try {
      client.close(1001, 'Server shutting down');
    } catch (err) {
      client.terminate();
    }
  }

  // 3. Close servers and database connection
  wss.close();
  server.close(async () => {
    try {
      await persistence.close();
      console.log('[collaboration] Server closed cleanly.');
      process.exit(0);
    } catch (err) {
      console.error('[collaboration] Error closing persistence:', err);
      process.exit(1);
    }
  });

  // Force exit after 10s if graceful shutdown hangs
  setTimeout(() => {
    console.error('[collaboration] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Start HTTP & WebSocket server
server.listen(PORT, () => {
  console.log(`[collaboration] CodeSync Yjs WebSocket server listening on port ${PORT}`);
});

module.exports = {
  server,
  wss,
  documents,
  persistence,
  flushDoc,
  getOrCreateDoc
};
