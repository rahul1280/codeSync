const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');
const { registerChatHandlers } = require('./chatHandler');
const { registerExecutionHandlers } = require('./executionHandler');

function parseCookie(cookieString, cookieName) {
  if (!cookieString) return null;
  const match = cookieString.match(new RegExp('(^|;\\s*)(' + cookieName + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
}

function initSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: [env.CLIENT_URL, 'http://localhost:3000', 'http://localhost:5173'],
      credentials: true
    }
  });

  // Authentication Middleware for Socket.IO
  io.use(async (socket, next) => {
    try {
      let token = null;

      // Extract from handshake auth
      if (socket.handshake.auth && socket.handshake.auth.token) {
        token = socket.handshake.auth.token;
      }

      // Extract from cookie header
      if (!token && socket.handshake.headers.cookie) {
        token = parseCookie(socket.handshake.headers.cookie, 'token');
      }

      // Extract from Authorization header
      if (!token && socket.handshake.headers.authorization) {
        const parts = socket.handshake.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
          token = parts[1];
        }
      }

      // Extract from query params
      if (!token && socket.handshake.query && socket.handshake.query.token) {
        token = socket.handshake.query.token;
      }

      if (!token) {
        return next(new Error('Authentication error: Token required'));
      }

      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id name email avatarColor');

      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error(`Authentication error: ${err.message}`));
    }
  });

  io.on('connection', (socket) => {
    registerChatHandlers(io, socket);
    registerExecutionHandlers(io, socket);
  });

  return io;
}

module.exports = initSocket;
