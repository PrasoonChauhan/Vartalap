import { useEffect, useState, useCallback, useRef } from 'react';
import { Box, Typography, Chip, Snackbar, Alert, useMediaQuery } from '@mui/material';
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
  const { endCall, callState, currentRoom, backgroundCall, foregroundCall } = useCall();
  const isMobile = useMediaQuery('(max-width:768px)');

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [callEnded, setCallEnded] = useState(false);

  const {
    localStream, peers,
    isMuted, isCameraOff, isScreenSharing,
    initializeWebRTC,
    toggleMute, toggleCamera, toggleScreenShare,
    pauseVideo, resumeVideo,
    cleanup,
  } = useWebRTC(socket, user, roomId);

  const mountedRef = useRef(false);
  const explicitEndRef = useRef(false); // tracks whether End Call was clicked
  const autoEndTimerRef = useRef(null); // local backup timer for auto-end

  // Initialize WebRTC on mount / re-entry from backgrounded state
  useEffect(() => {
    if (!socket || !user || !roomId) return;

    if (callState === 'backgrounded') {
      // Returning from background — resume video
      foregroundCall();
      resumeVideo();
      return;
    }

    if (!mountedRef.current) {
      mountedRef.current = true;
      initializeWebRTC().catch((err) => {
        console.error('Failed to access media:', err);
        setSnackbar({ open: true, message: 'Could not access camera/microphone', severity: 'error' });
      });
    }

    // Cleanup on unmount: only pause video (Back button), NOT full cleanup
    // Full cleanup only happens on explicit End Call
    return () => {
      if (!explicitEndRef.current) {
        // Back button pressed — background the call, don't end it
        pauseVideo();
        backgroundCall();
        mountedRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, user, roomId]);

  // Listen for call end from remote, time warnings, and startTime sync
  useEffect(() => {
    if (!socket) return;

    const handleCallEnded = ({ roomId: endedRoom, duration, autoEnded }) => {
      if (endedRoom === roomId) {
        if (autoEndTimerRef.current) clearTimeout(autoEndTimerRef.current);
        cleanup();
        setCallEnded(true);
        mountedRef.current = false;
        const timeStr = `${Math.floor(duration / 60)}m ${duration % 60}s`;
        const msg = autoEnded
          ? `⏰ Call auto-ended — 60-minute limit reached (${timeStr})`
          : `✅ Call ended — Chat messages deleted (${timeStr})`;
        setSnackbar({ open: true, message: msg, severity: 'info' });
        setTimeout(() => navigate('/'), 3000);
      }
    };

    const handleTimeWarning = ({ roomId: warnRoom, message }) => {
      if (warnRoom === roomId) {
        setSnackbar({ open: true, message: `⏰ ${message}`, severity: 'warning' });
      }
    };

    const handleUserLeft = ({ username }) => {
      setSnackbar({ open: true, message: `${username || 'User'} left the call`, severity: 'info' });
    };

    const handleRejected = ({ username }) => {
      setSnackbar({ open: true, message: `🚫 Call declined by ${username || 'user'}`, severity: 'warning' });
      setTimeout(() => navigate('/'), 2500);
    };

    socket.on('call:ended', handleCallEnded);
    socket.on('call:time-warning', handleTimeWarning);
    socket.on('call:user-left', handleUserLeft);
    socket.on('call:rejected', handleRejected);

    return () => {
      socket.off('call:ended', handleCallEnded);
      socket.off('call:time-warning', handleTimeWarning);
      socket.off('call:user-left', handleUserLeft);
      socket.off('call:rejected', handleRejected);
    };
  }, [socket, roomId, navigate, cleanup]);

  // Explicit End Call (user clicks the button)
  const handleEndCall = useCallback(() => {
    if (autoEndTimerRef.current) clearTimeout(autoEndTimerRef.current);
    explicitEndRef.current = true;
    cleanup();
    endCall(roomId);
    mountedRef.current = false;
    setSnackbar({ open: true, message: '✅ Call ended — Chat messages deleted', severity: 'info' });
    setTimeout(() => navigate('/'), 2500);
  }, [cleanup, endCall, roomId, navigate]);

  const participantCount = 1 + Object.keys(peers).length;

  // On mobile, hide call controls when chat is open
  const showCallControls = !(isMobile && isChatOpen);

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

        {/* Side panels (Chat or Participants) — desktop only */}
        <AnimatePresence>
          {isChatOpen && !isMobile && (
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

      {/* Mobile chat overlay — full width bottom sheet */}
      <AnimatePresence>
        {isChatOpen && isMobile && (
          <Box sx={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: '60vh',
            zIndex: 60,
          }}>
            <ChatPanel
              socket={socket}
              roomId={roomId}
              onClose={() => setIsChatOpen(false)}
              isMobile={true}
            />
          </Box>
        )}
      </AnimatePresence>

      {/* Controls bar — hidden on mobile when chat is open */}
      {showCallControls && (
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
      )}

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
