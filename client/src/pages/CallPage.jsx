import { useEffect, useState, useCallback, useRef } from 'react';
import { Box, Typography, Chip, Snackbar, Alert } from '@mui/material';
import { DeleteSweepRounded } from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useCall } from '../context/CallContext';
import useWebRTC from '../hooks/useWebRTC';
import VideoGrid from '../components/call/VideoGrid';
import CallControls from '../components/call/CallControls';
import ChatPanel from '../components/call/ChatPanel';
import ParticipantsPanel from '../components/call/ParticipantsPanel';

const CallPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const { endCall, leaveCall } = useCall();

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [callEnded, setCallEnded] = useState(false);

  const {
    localStream, peers,
    isMuted, isCameraOff, isScreenSharing,
    initializeWebRTC,
    toggleMute, toggleCamera, toggleScreenShare,
    cleanup,
  } = useWebRTC(socket, user, roomId);

  const mountedRef = useRef(false);

  // Initialize WebRTC on mount
  useEffect(() => {
    if (socket && user && roomId && !mountedRef.current) {
      mountedRef.current = true;
      initializeWebRTC().catch((err) => {
        console.error('Failed to access media:', err);
        setSnackbar({ open: true, message: 'Could not access camera/microphone', severity: 'error' });
      });
    }

    return () => {
      cleanup();
    };
  }, [socket, user, roomId]);

  // Listen for call end from remote
  useEffect(() => {
    if (!socket) return;

    socket.on('call:ended', ({ roomId: endedRoom, duration }) => {
      if (endedRoom === roomId) {
        cleanup();
        setCallEnded(true);
        const msg = `✅ Call ended — Chat messages deleted (${Math.floor(duration / 60)}m ${duration % 60}s)`;
        setSnackbar({ open: true, message: msg, severity: 'info' });
        setTimeout(() => navigate('/'), 3000);
      }
    });

    socket.on('call:user-left', ({ username }) => {
      setSnackbar({ open: true, message: `${username || 'User'} left the call`, severity: 'info' });
    });

    socket.on('call:rejected', ({ username }) => {
      setSnackbar({ open: true, message: `🚫 Call declined by ${username || 'user'}`, severity: 'warning' });
      setTimeout(() => navigate('/'), 2500);
    });

    return () => {
      socket.off('call:ended');
      socket.off('call:user-left');
      socket.off('call:rejected');
    };
  }, [socket, roomId, navigate, cleanup]);

  const handleEndCall = useCallback(() => {
    cleanup();
    endCall(roomId);
    setSnackbar({ open: true, message: '✅ Call ended — Chat messages deleted', severity: 'info' });
    setTimeout(() => navigate('/'), 2500);
  }, [cleanup, endCall, roomId, navigate]);

  const participantCount = 1 + Object.keys(peers).length;

  return (
    <Box sx={{
      width: '100vw', height: '100vh',
      background: '#070710',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden', position: 'relative',
    }}>
      {/* Top bar */}
      <Box sx={{
        position: 'absolute', top: 0, left: 0, right: 0,
        px: 3, py: 2, zIndex: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(to bottom, rgba(7,7,16,0.9) 0%, transparent 100%)',
        pointerEvents: 'none',
      }}>
        <Typography variant="h6" sx={{ fontWeight: 700, fontFamily: '"Outfit", sans-serif', pointerEvents: 'auto' }}>
          💬 Vartalap
        </Typography>
        <Chip
          icon={<DeleteSweepRounded sx={{ fontSize: '14px !important' }} />}
          label="Auto-delete Chat"
          size="small"
          sx={{
            background: 'rgba(124,58,237,0.15)',
            color: '#A78BFA',
            border: '1px solid',
            borderColor: 'rgba(124,58,237,0.4)',
            fontWeight: 600,
            pointerEvents: 'auto',
          }}
        />
      </Box>

      {/* Main content: video grid + optional side panels */}
      <Box sx={{ flex: 1, display: 'flex', pt: 0, overflow: 'hidden', zIndex: 1 }}>
        {/* Video area */}
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <VideoGrid
            localStream={localStream}
            peers={peers}
            localUser={user}
            isMuted={isMuted}
            isCameraOff={isCameraOff}
            isScreenSharing={isScreenSharing}
          />
        </Box>

        {/* Side panels (Chat or Participants) */}
        <AnimatePresence>
          {isChatOpen && (
            <Box sx={{ width: 320, p: 1.5, flexShrink: 0, height: '100%', zIndex: 20 }}>
              <ChatPanel
                socket={socket}
                roomId={roomId}
                onClose={() => setIsChatOpen(false)}
              />
            </Box>
          )}

          {isParticipantsOpen && (
            <Box sx={{ width: 300, p: 1.5, flexShrink: 0, height: '100%', zIndex: 20 }}>
              <ParticipantsPanel
                localUser={user}
                peers={peers}
                isMuted={isMuted}
                isCameraOff={isCameraOff}
                onClose={() => setIsParticipantsOpen(false)}
              />
            </Box>
          )}
        </AnimatePresence>
      </Box>

      {/* Controls bar */}
      <Box sx={{
        position: 'absolute', bottom: 24, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', zIndex: 50,
        pointerEvents: 'none',
      }}>
        <Box sx={{ pointerEvents: 'auto' }}>
          <CallControls
            isMuted={isMuted}
            isCameraOff={isCameraOff}
            isScreenSharing={isScreenSharing}
            isChatOpen={isChatOpen}
            isParticipantsOpen={isParticipantsOpen}
            participantCount={participantCount}
            onMute={toggleMute}
            onCamera={toggleCamera}
            onScreenShare={toggleScreenShare}
            onChat={() => {
              setIsChatOpen((prev) => !prev);
              setIsParticipantsOpen(false);
            }}
            onParticipants={() => {
              setIsParticipantsOpen((prev) => !prev);
              setIsChatOpen(false);
            }}
            onEnd={handleEndCall}
          />
        </Box>
      </Box>

      {/* Snackbar notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
          sx={{ borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CallPage;
