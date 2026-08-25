import { useEffect, useState } from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';
import { PeopleRounded, SearchRounded } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import { useCall } from '../context/CallContext';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import IncomingCallModal from '../components/common/IncomingCallModal';
import UserSearch from '../components/contacts/UserSearch';
import RecentContacts from '../components/contacts/RecentContacts';

const HomePage = () => {
  const navigate = useNavigate();
  const { socket } = useSocket();
  const { user } = useAuth();
  const {
    incomingCall, setIncomingCall,
    initiateCall, acceptCall, rejectCall,
    setCallState,
  } = useCall();

  // Listen for call responses (incoming is handled globally by CallContext)
  useEffect(() => {
    if (!socket) return;

    socket.on('call:accepted', ({ roomId }) => {
      navigate(`/call/${roomId}`);
    });

    socket.on('call:rejected', ({ username }) => {
      setCallState('idle');
    });

    return () => {
      socket.off('call:accepted');
      socket.off('call:rejected');
    };
  }, [socket, navigate, setCallState]);

  // Request notification permission
  useEffect(() => {
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleCall = (targetUsers) => {
    const roomId = initiateCall(targetUsers);
    if (roomId) {
      navigate(`/call/${roomId}`);
    }
  };

  const handleAcceptCall = () => {
    if (incomingCall) {
      acceptCall(incomingCall.roomId);
      navigate(`/call/${incomingCall.roomId}`);
    }
  };

  const handleRejectCall = () => {
    if (incomingCall) {
      rejectCall(incomingCall.roomId, incomingCall.callerId);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', background: '#0A0A0F' }}>
      <Navbar />

      {/* Incoming call overlay */}
      {incomingCall && (
        <IncomingCallModal
          call={incomingCall}
          onAccept={handleAcceptCall}
          onReject={handleRejectCall}
        />
      )}

      <Box sx={{ pt: 10, px: { xs: 2, sm: 3, md: 4 }, maxWidth: 1100, mx: 'auto' }}>
        {/* Welcome header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
              Good day, {user?.username} 👋
            </Typography>
            <Typography variant="body1" sx={{ color: '#94A3B8' }}>
              Ready to connect? Search for friends or pick up where you left off.
            </Typography>
          </Box>
        </motion.div>

        <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', md: 'row' } }}>
          {/* Left: Search */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            style={{ flex: 1 }}
          >
            <Paper sx={{
              p: 3, borderRadius: 4, height: '100%',
              background: 'rgba(19,19,26,0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <Box sx={{
                  width: 36, height: 36, borderRadius: '10px',
                  background: 'linear-gradient(135deg, #7C3AED20, #06B6D420)',
                  border: '1px solid rgba(124,58,237,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <SearchRounded sx={{ color: '#A78BFA', fontSize: 20 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Find People</Typography>
              </Box>
              <UserSearch onCall={handleCall} />
            </Paper>
          </motion.div>

          {/* Right: Recent contacts */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{ flex: 1.2 }}
          >
            <Paper sx={{
              p: 3, borderRadius: 4,
              background: 'rgba(19,19,26,0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.06)',
              minHeight: 400,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5 }}>
                <Box sx={{
                  width: 36, height: 36, borderRadius: '10px',
                  background: 'linear-gradient(135deg, #7C3AED20, #06B6D420)',
                  border: '1px solid rgba(124,58,237,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <PeopleRounded sx={{ color: '#A78BFA', fontSize: 20 }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Recent Calls</Typography>
              </Box>
              <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 2 }} />
              <RecentContacts onCall={handleCall} />
            </Paper>
          </motion.div>
        </Box>

        {/* Stats bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Box sx={{
            mt: 3, p: 2.5, borderRadius: 3,
            background: 'rgba(124,58,237,0.06)',
            border: '1px solid rgba(124,58,237,0.15)',
            display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
          }}>
            <Box sx={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#7C3AED',
              boxShadow: '0 0 8px #7C3AED',
            }} />
            <Typography variant="body2" sx={{ color: '#94A3B8' }}>
              💬 Chat messages are automatically deleted when the call ends
            </Typography>
          </Box>
        </motion.div>
      </Box>
    </Box>
  );
};

export default HomePage;
