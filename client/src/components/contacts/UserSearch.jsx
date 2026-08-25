import { useState, useEffect } from 'react';
import {
  Box, Typography, Avatar, TextField, InputAdornment,
  IconButton, List, ListItem, ListItemAvatar, ListItemText,
  Chip, CircularProgress, Divider
} from '@mui/material';
import { Search, VideoCall, FiberManualRecord } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { searchUsers } from '../../services/api';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';

const UserSearch = ({ onCall }) => {
  const { isUserOnline } = useSocket();
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await searchUsers(query);
        setResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <Box>
      <TextField
        id="user-search-input"
        placeholder="Search users by username..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        fullWidth
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {loading ? <CircularProgress size={16} sx={{ color: '#7C3AED' }} /> : <Search sx={{ color: '#94A3B8', fontSize: 20 }} />}
            </InputAdornment>
          ),
        }}
        sx={{ mb: 1 }}
      />

      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <Box sx={{
              borderRadius: 3, overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(19,19,26,0.95)',
            }}>
              <List disablePadding>
                {results.map((u, idx) => (
                  <motion.div
                    key={u._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <ListItem
                      secondaryAction={
                        <IconButton
                          id={`call-user-${u._id}`}
                          size="small"
                          onClick={() => onCall([u])}
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
                        '&:hover': { background: 'rgba(255,255,255,0.04)' },
                        transition: 'background 0.2s',
                      }}
                    >
                      <ListItemAvatar>
                        <Box sx={{ position: 'relative', display: 'inline-block' }}>
                          <Avatar
                            src={u.avatar}
                            sx={{
                              width: 40, height: 40,
                              background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
                              fontSize: '0.875rem', fontWeight: 700,
                            }}
                          >
                            {!u.avatar && u.username?.slice(0, 2).toUpperCase()}
                          </Avatar>
                          {isUserOnline(u._id) && (
                            <FiberManualRecord sx={{
                              position: 'absolute', bottom: -1, right: -1,
                              fontSize: 12, color: '#10B981',
                              filter: 'drop-shadow(0 0 4px #10B981)',
                            }} />
                          )}
                        </Box>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body2" sx={{ fontWeight: 600 }}>{u.username}</Typography>}
                        secondary={
                          <Chip
                            label={isUserOnline(u._id) ? 'Online' : 'Offline'}
                            size="small"
                            sx={{
                              height: 18, fontSize: '0.65rem',
                              background: isUserOnline(u._id) ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.1)',
                              color: isUserOnline(u._id) ? '#10B981' : '#94A3B8',
                            }}
                          />
                        }
                      />
                    </ListItem>
                    {idx < results.length - 1 && <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)' }} />}
                  </motion.div>
                ))}
              </List>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
};

export default UserSearch;
