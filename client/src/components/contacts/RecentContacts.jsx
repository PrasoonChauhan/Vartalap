import { useEffect, useState } from 'react';
import {
  Box, Typography, Avatar, List, ListItem, ListItemAvatar,
  ListItemText, IconButton, Chip, Skeleton, Divider
} from '@mui/material';
import { VideoCall, FiberManualRecord, AccessTime } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { getRecentContacts } from '../../services/api';
import { useSocket } from '../../context/SocketContext';

const RecentContacts = ({ onCall }) => {
  const { isUserOnline } = useSocket();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecentContacts()
      .then(({ data }) => setContacts(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const formatTime = (date) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <Box>
        {[...Array(3)].map((_, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1.5, px: 1 }}>
            <Skeleton variant="circular" width={44} height={44} sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" width="60%" sx={{ bgcolor: 'rgba(255,255,255,0.06)' }} />
              <Skeleton variant="text" width="40%" sx={{ bgcolor: 'rgba(255,255,255,0.04)' }} />
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  if (contacts.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6, color: '#94A3B8' }}>
        <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>📞</Typography>
        <Typography variant="body2">No recent contacts yet</Typography>
        <Typography variant="caption">Search for users above to start a call</Typography>
      </Box>
    );
  }

  return (
    <List disablePadding>
      {contacts.map((contact, idx) => (
        <motion.div
          key={contact.userId}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.06 }}
        >
          <ListItem
            secondaryAction={
              <IconButton
                id={`recent-call-${contact.userId}`}
                size="small"
                onClick={() => onCall([{ _id: contact.userId, username: contact.username, avatar: contact.avatar }])}
                sx={{
                  background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                  color: 'white',
                  '&:hover': { opacity: 0.85, transform: 'scale(1.1)' },
                  transition: 'all 0.2s',
                }}
              >
                <VideoCall sx={{ fontSize: 18 }} />
              </IconButton>
            }
            sx={{
              borderRadius: 2, mb: 0.5,
              '&:hover': { background: 'rgba(124,58,237,0.06)' },
              transition: 'background 0.2s',
              cursor: 'default',
            }}
          >
            <ListItemAvatar>
              <Box sx={{ position: 'relative', display: 'inline-block' }}>
                <Avatar
                  src={contact.avatar}
                  sx={{
                    width: 44, height: 44,
                    background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
                    fontSize: '0.9rem', fontWeight: 700,
                    border: isUserOnline(contact.userId) ? '2px solid #10B981' : '2px solid transparent',
                    boxShadow: isUserOnline(contact.userId) ? '0 0 12px rgba(16,185,129,0.4)' : 'none',
                    transition: 'all 0.3s',
                  }}
                >
                  {!contact.avatar && contact.username?.slice(0, 2).toUpperCase()}
                </Avatar>
                {isUserOnline(contact.userId) && (
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    style={{
                      position: 'absolute', bottom: -1, right: -1,
                      width: 12, height: 12, borderRadius: '50%',
                      background: '#10B981',
                      border: '2px solid #0A0A0F',
                    }}
                  />
                )}
              </Box>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{contact.username}</Typography>
                  {isUserOnline(contact.userId) && (
                    <Chip label="Online" size="small" sx={{ height: 16, fontSize: '0.6rem', background: 'rgba(16,185,129,0.15)', color: '#10B981' }} />
                  )}
                </Box>
              }
              secondary={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                  <AccessTime sx={{ fontSize: 11, color: '#64748B' }} />
                  <Typography variant="caption" sx={{ color: '#64748B' }}>
                    {formatTime(contact.lastCallAt)}
                  </Typography>
                </Box>
              }
            />
          </ListItem>
          {idx < contacts.length - 1 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)', ml: 8 }} />}
        </motion.div>
      ))}
    </List>
  );
};

export default RecentContacts;
