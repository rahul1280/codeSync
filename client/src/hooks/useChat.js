import { useState, useEffect, useCallback } from 'react';

export function useChat(socket, roomId, currentUser) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!socket || !roomId) return;

    const join = () => {
      socket.emit('join-room', { roomId });
    };

    // Join room immediately
    join();

    // Rejoin if connection drops and reconnects
    socket.on('connect', join);

    const handleMessage = (message) => {
      if (!message) return;
      setMessages((prev) => {
        const msgId = message.id || message._id;
        if (msgId && prev.some((m) => (m.id || m._id) === msgId)) {
          return prev;
        }
        return [...prev, message];
      });
    };

    const handleHistory = (history) => {
      if (Array.isArray(history)) {
        setMessages(history);
      }
    };

    socket.on('new-message', handleMessage);
    socket.on('chat-history', handleHistory);

    return () => {
      socket.off('connect', join);
      socket.emit('leave-room', { roomId });
      socket.off('new-message', handleMessage);
      socket.off('chat-history', handleHistory);
    };
  }, [socket, roomId]);

  const sendMessage = useCallback(
    (content) => {
      if (!socket || !content || !content.trim() || !roomId) return;

      const trimmed = content.trim();
      const messageData = {
        roomId,
        content: trimmed,
        senderName: currentUser?.name || currentUser?.email || 'Anonymous',
        senderId: currentUser?.id || currentUser?._id,
        timestamp: new Date().toISOString(),
      };

      // Emit single send-message event
      socket.emit('send-message', messageData);
    },
    [socket, roomId, currentUser]
  );

  return {
    messages,
    sendMessage,
    setMessages,
  };
}
