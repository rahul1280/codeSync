const mongoose = require('mongoose');
const Message = require('../models/Message');
const Room = require('../models/Room');

// In-memory sliding rate limiter for socket chat messages: 30 msgs / 60 seconds per user
const userMessageBuckets = new Map();

function checkRateLimit(userId) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxMessages = 30;

  let timestamps = userMessageBuckets.get(userId) || [];
  timestamps = timestamps.filter((t) => now - t < windowMs);

  if (timestamps.length >= maxMessages) {
    userMessageBuckets.set(userId, timestamps);
    return false;
  }

  timestamps.push(now);
  userMessageBuckets.set(userId, timestamps);
  return true;
}

function registerChatHandlers(io, socket) {
  const user = socket.user;

  // Handler for joining room
  const handleJoin = async (data, callback) => {
    try {
      const roomId = data && data.roomId;
      if (!roomId) {
        if (callback) callback({ success: false, error: 'roomId is required' });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(roomId)) {
        if (callback) callback({ success: false, error: 'Invalid room ID' });
        return;
      }

      const room = await Room.findById(roomId);
      if (!room) {
        if (callback) callback({ success: false, error: 'Room not found' });
        return;
      }

      const isOwner = room.ownerId && room.ownerId.toString() === user._id.toString();
      const isMember =
        room.members &&
        room.members.some(
          (m) => (m.userId?._id || m.userId).toString() === user._id.toString()
        );

      if (!isOwner && !isMember) {
        if (callback) callback({ success: false, error: 'Not a member of this room' });
        return;
      }

      socket.join(roomId);

      // Notify others in the room
      socket.to(roomId).emit('user-joined', {
        roomId,
        user: {
          id: user._id.toString(),
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          avatarColor: user.avatarColor
        }
      });

      // Fetch recent message history (last 50 messages)
      try {
        const recentMessages = await Message.find({ roomId })
          .sort({ createdAt: -1 })
          .limit(50)
          .populate('senderId', '_id name email avatarColor')
          .lean();

        const history = recentMessages.reverse().map((m) => {
          const senderObj = m.senderId || {};
          const senderIdStr = (senderObj._id || senderObj.id || m.senderId || '').toString();
          const senderNameStr = senderObj.name || senderObj.email || 'Anonymous';
          return {
            id: m._id.toString(),
            _id: m._id.toString(),
            roomId: m.roomId.toString(),
            content: m.content,
            createdAt: m.createdAt,
            timestamp: m.createdAt,
            senderId: senderIdStr,
            senderName: senderNameStr,
            sender: {
              id: senderIdStr,
              _id: senderIdStr,
              name: senderNameStr,
              email: senderObj.email || '',
              avatarColor: senderObj.avatarColor
            }
          };
        });

        // Send history to joining socket
        socket.emit('chat:history', history);
        socket.emit('chat-history', history);
      } catch (historyErr) {
        console.error('[Socket Chat] Failed to load history:', historyErr.message);
      }

      if (callback) {
        callback({
          success: true,
          message: `Joined room ${roomId}`
        });
      }
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  };

  // Handler for leaving room
  const handleLeave = async (data, callback) => {
    try {
      const roomId = data && data.roomId;
      if (!roomId) {
        if (callback) callback({ success: false, error: 'roomId is required' });
        return;
      }

      socket.leave(roomId);
      socket.to(roomId).emit('user-left', {
        roomId,
        user: {
          id: user._id.toString(),
          name: user.name
        }
      });

      if (callback) callback({ success: true, message: `Left room ${roomId}` });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  };

  // Handler for sending messages
  const handleSendMessage = async (data, callback) => {
    try {
      const { roomId } = data || {};
      const content = (data && (data.content || data.message || '')).toString();

      if (!roomId || !content) {
        if (callback) callback({ success: false, error: 'roomId and content are required' });
        return;
      }

      const trimmedContent = content.trim();
      if (trimmedContent.length === 0 || trimmedContent.length > 2000) {
        if (callback) {
          callback({
            success: false,
            error: 'Message content must be between 1 and 2000 characters'
          });
        }
        return;
      }

      // Check Rate Limit (30 req / min)
      if (!checkRateLimit(user._id.toString())) {
        if (callback) {
          callback({
            success: false,
            error: 'Rate limit exceeded: max 30 messages per minute.'
          });
        }
        socket.emit('chat-error', { message: 'Rate limit exceeded' });
        return;
      }

      if (!mongoose.Types.ObjectId.isValid(roomId)) {
        if (callback) callback({ success: false, error: 'Invalid room ID' });
        return;
      }

      // Verify room membership
      const room = await Room.findById(roomId);
      if (!room) {
        if (callback) callback({ success: false, error: 'Room not found' });
        return;
      }

      const isOwner = room.ownerId && room.ownerId.toString() === user._id.toString();
      const isMember =
        room.members &&
        room.members.some(
          (m) => (m.userId?._id || m.userId).toString() === user._id.toString()
        );

      if (!isOwner && !isMember) {
        if (callback) {
          callback({ success: false, error: 'Not authorized to send messages in this room' });
        }
        return;
      }

      // Persist message
      const message = await Message.create({
        roomId,
        senderId: user._id,
        content: trimmedContent
      });

      const messagePayload = {
        id: message._id.toString(),
        _id: message._id.toString(),
        roomId: message.roomId.toString(),
        content: message.content,
        createdAt: message.createdAt,
        timestamp: message.createdAt,
        senderId: user._id.toString(),
        senderName: user.name || user.email,
        sender: {
          id: user._id.toString(),
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          avatarColor: user.avatarColor
        }
      };

      // Broadcast to room (including sender)
      io.to(roomId).emit('new-message', messagePayload);

      if (callback) callback({ success: true, message: messagePayload });
    } catch (err) {
      if (callback) callback({ success: false, error: err.message });
    }
  };

  // Register events for both naming conventions
  socket.on('join-room', handleJoin);
  socket.on('chat:join', handleJoin);

  socket.on('leave-room', handleLeave);
  socket.on('chat:leave', handleLeave);

  socket.on('send-message', handleSendMessage);
  socket.on('chat:send', handleSendMessage);

  socket.on('disconnect', () => {
    // Client disconnected
  });
}

module.exports = {
  registerChatHandlers,
  checkRateLimit
};
