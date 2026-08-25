import { Box, Typography, Avatar, Button, Paper } from '@mui/material';
import { CallRounded, CallEndRounded } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const IncomingCallModal = ({ call, onAccept, onReject }) => {
  if (!call) return null;

  const initials = call.callerName?.slice(0, 2).toUpperCase() || '??';

  return (
    <AnimatePresence>
      <Box sx={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(8px)',
      }}>
        <motion.div
          key="incoming-call-modal"
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.7, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <Paper sx={{
            p: 4, borderRadius: 4, textAlign: 'center',
            background: 'rgba(19,19,26,0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 40px 80px rgba(0,0,0,0.7)',
            maxWidth: 340, width: '90vw',
          }}>
            {/* Pulsing avatar */}
            <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
              <motion.div
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  position: 'absolute', inset: -12, borderRadius: '50%',
                  background: 'rgba(124,58,237,0.2)',
                }}
              />
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
                style={{
                  position: 'absolute', inset: -24, borderRadius: '50%',
                  background: 'rgba(124,58,237,0.1)',
                }}
              />
              <Avatar
                src={call.callerAvatar}
                sx={{
                  width: 88, height: 88, position: 'relative', zIndex: 1,
                  fontSize: '1.8rem', fontWeight: 700,
                  background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
                  border: '3px solid rgba(124,58,237,0.5)',
                  boxShadow: '0 12px 32px rgba(124,58,237,0.4)',
                }}
              >
                {!call.callerAvatar && initials}
              </Avatar>
            </Box>

            <Typography variant="h6" sx={{ fontWeight: 700, mt: 1 }}>
              {call.callerName}
            </Typography>
            <Typography variant="body2" sx={{ color: '#94A3B8', mb: 1 }}>
              {call.isGroup ? 'Inviting you to a group call' : 'Incoming video call'}
            </Typography>



            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
              {/* Reject */}
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Box
                  id="reject-call-btn"
                  onClick={onReject}
                  sx={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'rgba(239,68,68,0.15)',
                    border: '2px solid rgba(239,68,68,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { background: '#EF4444', boxShadow: '0 8px 24px rgba(239,68,68,0.4)' },
                  }}
                >
                  <CallEndRounded sx={{ color: '#EF4444', fontSize: 28, '.hover &': { color: 'white' } }} />
                </Box>
              </motion.div>

              {/* Accept */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                animate={{ boxShadow: ['0 0 0 rgba(16,185,129,0)', '0 0 20px rgba(16,185,129,0.4)', '0 0 0 rgba(16,185,129,0)'] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Box
                  id="accept-call-btn"
                  onClick={onAccept}
                  sx={{
                    width: 64, height: 64, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 8px 24px rgba(16,185,129,0.4)',
                    transition: 'all 0.2s',
                    '&:hover': { boxShadow: '0 12px 32px rgba(16,185,129,0.6)' },
                  }}
                >
                  <CallRounded sx={{ color: 'white', fontSize: 28 }} />
                </Box>
              </motion.div>
            </Box>
          </Paper>
        </motion.div>
      </Box>
    </AnimatePresence>
  );
};

export default IncomingCallModal;
