import { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, TextField, IconButton, Avatar,
  Chip, InputAdornment, Divider
} from '@mui/material';
import { Send, DeleteSweepRounded, Close } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { getChatHistory } from '../../services/api';

const MessageBubble = ({ message, isOwn }) => (
  <motion.div
    initial={{ opacity: 0, y: 10, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom: 8 }}
  >
    {!isOwn && (
      <Avatar
        src={message.sender?.avatar}
        sx={{
          width: 28, height: 28, mr: 1, mt: 0.5, flexShrink: 0,
          background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
          fontSize: '0.65rem', fontWeight: 700,
        }}
      >
        {!message.sender?.avatar && message.sender?.username?.slice(0, 2).toUpperCase()}
      </Avatar>
    )}
    <Box sx={{ maxWidth: '75%' }}>
      {!isOwn && (
        <Typography variant="caption" sx={{ color: '#94A3B8', ml: 0.5, mb: 0.25, display: 'block' }}>
          {message.sender?.username}
        </Typography>
      )}
      <Box sx={{
        px: 2, py: 1, borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
        background: isOwn
          ? 'linear-gradient(135deg, #7C3AED, #06B6D4)'
          : 'rgba(255,255,255,0.07)',
        border: isOwn ? 'none' : '1px solid rgba(255,255,255,0.08)',
      }}>
        <Typography variant="body2" sx={{ wordBreak: 'break-word', lineHeight: 1.5 }}>
          {message.content}
        </Typography>
      </Box>
      <Typography variant="caption" sx={{
        color: '#64748B', fontSize: '0.65rem',
        display: 'block', mt: 0.25,
        textAlign: isOwn ? 'right' : 'left', px: 0.5,
      }}>
        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Typography>
    </Box>
  </motion.div>
);


const ChatPanel = ({ socket, roomId, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typingUser, setTypingUser] = useState('');
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);

  // Load chat history on mount
  useEffect(() => {
    if (!roomId) return;
    getChatHistory(roomId)
      .then(({ data }) => {
        if (data && Array.isArray(data)) setMessages(data);
      })
      .catch((err) => console.error('Failed to load chat history:', err));
  }, [roomId]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };

    socket.on('chat:message', handleMessage);

    socket.on('chat:clear', () => {
      setMessages([]);
    });

    socket.on('user:typing', ({ username, isTyping }) => {
      if (username !== user?.username) {
        setTypingUser(isTyping ? username : '');
      }
    });

    return () => {
      socket.off('chat:message', handleMessage);
      socket.off('chat:clear');
      socket.off('user:typing');
    };
  }, [socket, user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !socket) return;
    socket.emit('chat:message', {
      roomId,
      content: input.trim(),
      sender: { _id: user._id, username: user.username, avatar: user.avatar },
    });
    setInput('');
    socket.emit('user:typing', { roomId, username: user.username, isTyping: false });
  };

  const handleTyping = (e) => {
    setInput(e.target.value);
    if (!socket) return;
    socket.emit('user:typing', { roomId, username: user.username, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('user:typing', { roomId, username: user.username, isTyping: false });
    }, 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <motion.div
      initial={{ x: 320, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 320, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
    >
      <Box sx={{
        height: '100%', display: 'flex', flexDirection: 'column',
        background: 'rgba(19,19,26,0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 3, overflow: 'hidden',
      }}>
        {/* Header */}
        <Box sx={{
          px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.03)',
        }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>Chat</Typography>
          <Chip
            icon={<DeleteSweepRounded sx={{ fontSize: '12px !important' }} />}
            label="Auto-delete"
            size="small"
            sx={{
              height: 22, fontSize: '0.65rem',
              background: 'rgba(124,58,237,0.15)',
              color: '#A78BFA',
              border: '1px solid',
              borderColor: 'rgba(124,58,237,0.3)',
            }}
          />
          <IconButton size="small" onClick={onClose} sx={{ color: '#94A3B8' }}>
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* Messages */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 2, display: 'flex', flexDirection: 'column' }}>
          {messages.length === 0 && (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>
              <Typography sx={{ fontSize: '2rem', mb: 1 }}>💬</Typography>
              <Typography variant="caption">No messages yet. Say hello!</Typography>
              <Typography variant="caption" sx={{ color: '#A78BFA', mt: 1, textAlign: 'center' }}>
                🗑️ Messages are deleted when the call ends
              </Typography>
            </Box>
          )}
          {messages.map((msg) => (
            <MessageBubble
              key={msg._id}
              message={msg}
              isOwn={msg.sender?._id === user?._id}
            />
          ))}
          {typingUser && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 1 }}>
                <Box sx={{ display: 'flex', gap: 0.4 }}>
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ y: [-3, 0, -3] }}
                      transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                      style={{ width: 6, height: 6, borderRadius: '50%', background: '#7C3AED' }}
                    />
                  ))}
                </Box>
                <Typography variant="caption" sx={{ color: '#94A3B8' }}>{typingUser} is typing...</Typography>
              </Box>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </Box>

        {/* Input */}
        <Box sx={{
          p: 1.5, borderTop: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)',
        }}>
          <TextField
            id="chat-input"
            placeholder="Type a message..."
            value={input}
            onChange={handleTyping}
            onKeyDown={handleKeyPress}
            fullWidth
            size="small"
            multiline
            maxRows={3}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    id="send-message-btn"
                    size="small"
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    sx={{
                      background: input.trim() ? 'linear-gradient(135deg, #7C3AED, #06B6D4)' : 'transparent',
                      color: input.trim() ? 'white' : '#64748B',
                      '&:hover': { opacity: 0.85 },
                      transition: 'all 0.2s',
                    }}
                  >
                    <Send sx={{ fontSize: 16 }} />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </Box>
    </motion.div>
  );
};

export default ChatPanel;
