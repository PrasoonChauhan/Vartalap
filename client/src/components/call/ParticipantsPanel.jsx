import { Box, Typography, Avatar, IconButton, Chip, List, ListItem, ListItemAvatar, ListItemText } from '@mui/material';
import { Close, Mic, MicOff, Videocam, VideocamOff, Star } from '@mui/icons-material';
import { motion } from 'framer-motion';

const ParticipantsPanel = ({ localUser, peers, isMuted, isCameraOff, onClose }) => {
  const peerList = Object.entries(peers); // [socketId, peerData]
  const totalCount = 1 + peerList.length;

  const getInitials = (name) => name?.slice(0, 2).toUpperCase() || '??';

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
          <Typography variant="subtitle2" sx={{ fontWeight: 700, flex: 1 }}>
            Participants ({totalCount})
          </Typography>
          <IconButton size="small" onClick={onClose} sx={{ color: '#94A3B8' }}>
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        </Box>

        {/* Participants list */}
        <Box sx={{ flex: 1, overflow: 'auto', p: 1.5 }}>
          <List disablePadding>
            {/* Local User */}
            <ListItem
              sx={{
                borderRadius: 2, mb: 1,
                background: 'rgba(124,58,237,0.08)',
                border: '1px solid rgba(124,58,237,0.2)',
              }}
            >
              <ListItemAvatar sx={{ minWidth: 44 }}>
                <Avatar
                  src={localUser?.avatar}
                  sx={{
                    width: 36, height: 36,
                    background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
                    fontSize: '0.8rem', fontWeight: 700,
                  }}
                >
                  {!localUser?.avatar && getInitials(localUser?.username)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {localUser?.username}
                    </Typography>
                    <Chip label="You" size="small" sx={{ height: 18, fontSize: '0.65rem', background: '#7C3AED', color: 'white', fontWeight: 700 }} />
                  </Box>
                }
              />
              <Box sx={{ display: 'flex', gap: 1, color: '#94A3B8' }}>
                {isMuted ? <MicOff sx={{ fontSize: 16, color: '#EF4444' }} /> : <Mic sx={{ fontSize: 16, color: '#10B981' }} />}
                {isCameraOff ? <VideocamOff sx={{ fontSize: 16, color: '#EF4444' }} /> : <Videocam sx={{ fontSize: 16, color: '#10B981' }} />}
              </Box>
            </ListItem>

            {/* Remote Peers */}
            {peerList.map(([socketId, peerData]) => (
              <ListItem
                key={socketId}
                sx={{
                  borderRadius: 2, mb: 1,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <ListItemAvatar sx={{ minWidth: 44 }}>
                  <Avatar
                    src={peerData.avatar}
                    sx={{
                      width: 36, height: 36,
                      background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
                      fontSize: '0.8rem', fontWeight: 700,
                    }}
                  >
                    {!peerData.avatar && getInitials(peerData.username)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {peerData.username || 'Participant'}
                    </Typography>
                  }
                />
                <Box sx={{ display: 'flex', gap: 1, color: '#94A3B8' }}>
                  {peerData.isMuted ? <MicOff sx={{ fontSize: 16, color: '#EF4444' }} /> : <Mic sx={{ fontSize: 16, color: '#10B981' }} />}
                  {peerData.isCameraOff || !peerData.stream ? <VideocamOff sx={{ fontSize: 16, color: '#EF4444' }} /> : <Videocam sx={{ fontSize: 16, color: '#10B981' }} />}
                </Box>
              </ListItem>
            ))}
          </List>
        </Box>
      </Box>
    </motion.div>
  );
};

export default ParticipantsPanel;
