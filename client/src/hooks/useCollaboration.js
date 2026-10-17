import { useState, useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';
import { COLLAB_WS_URL } from '../utils/constants';

const CURSOR_COLORS = [
  '#f85149',
  '#58a6ff',
  '#3fb950',
  '#d29922',
  '#bc8cff',
  '#39c5bb',
  '#f0883e',
  '#db61a2',
];

function getRandomColor() {
  return CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)];
}

export function useCollaboration(
  roomId,
  fileId,
  currentUser,
  monacoEditor,
  initialContent = '',
  onContentChange = null
) {
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState([]);
  const docRef = useRef(null);
  const providerRef = useRef(null);
  const bindingRef = useRef(null);

  useEffect(() => {
    if (!roomId || !fileId) return;

    // Room identifier for Yjs websocket
    const roomName = `room:${roomId}:file:${fileId}`;

    const doc = new Y.Doc();
    docRef.current = doc;

    let provider;
    try {
      const token = localStorage.getItem('codesync_token') || '';
      const wsOptions = token ? { params: { token } } : {};
      provider = new WebsocketProvider(COLLAB_WS_URL, roomName, doc, wsOptions);
      providerRef.current = provider;

      // Status listener
      provider.on('status', (event) => {
        setIsConnected(event.status === 'connected');
      });

      // Awareness for cursor and participant info
      const awareness = provider.awareness;
      const userColor = getRandomColor();

      awareness.setLocalStateField('user', {
        name: currentUser?.name || currentUser?.email || 'Anonymous',
        color: userColor,
        id: currentUser?.id || currentUser?._id,
      });

      const handleAwarenessChange = () => {
        const states = awareness.getStates();
        const users = [];
        states.forEach((state, clientId) => {
          if (state.user) {
            users.push({
              clientId,
              ...state.user,
            });
          }
        });
        setParticipants(users);
      };

      awareness.on('change', handleAwarenessChange);
      handleAwarenessChange();
    } catch (err) {
      console.warn('Yjs websocket connection failed:', err);
      setIsConnected(false);
    }

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
      if (provider) {
        provider.destroy();
      }
      doc.destroy();
    };
  }, [roomId, fileId, currentUser]);

  // Handle Monaco binding when editor instance is ready
  useEffect(() => {
    if (!monacoEditor || !docRef.current || !providerRef.current) return;

    if (bindingRef.current) {
      bindingRef.current.destroy();
      bindingRef.current = null;
    }

    const type = docRef.current.getText('monaco');
    const model = monacoEditor.getModel();

    if (model) {
      // If shared doc is empty, seed with initial file content
      if (type.toString() === '' && initialContent) {
        type.insert(0, initialContent);
      }

      try {
        bindingRef.current = new MonacoBinding(
          type,
          model,
          new Set([monacoEditor]),
          providerRef.current.awareness
        );

        if (onContentChange) {
          type.observe(() => {
            onContentChange(type.toString());
          });
        }
      } catch (err) {
        console.warn('MonacoBinding initialization error:', err);
      }
    }

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy();
        bindingRef.current = null;
      }
    };
  }, [monacoEditor, fileId, roomId]);

  return {
    doc: docRef.current,
    provider: providerRef.current,
    isConnected,
    participants,
  };
}
