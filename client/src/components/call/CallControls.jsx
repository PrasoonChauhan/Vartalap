import { Box, IconButton, Tooltip, Chip } from '@mui/material';
import {
  Mic, MicOff, Videocam, VideocamOff,
  ScreenShare, StopScreenShare, CallEnd, Chat, People
} from '@mui/icons-material';
import { motion } from 'framer-motion';

const ControlButton = ({ icon, activeIcon, active, onClick, color = 'default', tooltip, id }) => (
  <Tooltip title={tooltip} placement="top">
    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
      <IconButton
        id={id}
        onClick={onClick}
        sx={{
          width: 52, height: 52, borderRadius: '50%',
          background: active
            ? color === 'danger' ? 'rgba(239,68,68,0.2)' : 'rgba(124,58,237,0.2)'
            : 'rgba(255,255,255,0.08)',
          border: active
            ? `2px solid ${color === 'danger' ? 'rgba(239,68,68,0.5)' : 'rgba(124,58,237,0.5)'}`
            : '2px solid rgba(255,255,255,0.1)',
          color: active
            ? color === 'danger' ? '#EF4444' : '#A78BFA'
            : '#94A3B8',
          '&:hover': {
            background: active
              ? color === 'danger' ? 'rgba(239,68,68,0.3)' : 'rgba(124,58,237,0.3)'
              : 'rgba(255,255,255,0.12)',
          },
          transition: 'all 0.2s',
        }}
      >
        {active && activeIcon ? activeIcon : icon}
      </IconButton>
    </motion.div>
  </Tooltip>
);

const CallControls = ({
  isMuted, isCameraOff, isScreenSharing,
  isChatOpen, isParticipantsOpen, participantCount,
  onMute, onCamera, onScreenShare, onChat, onParticipants, onEnd,
}) => {
  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
    >
      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5,
        px: 3, py: 2, borderRadius: '100px',
        background: 'rgba(19,19,26,0.9)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      }}>
        {/* Mute */}
        <ControlButton
          id="toggle-mute-btn"
          icon={<Mic />}
          activeIcon={<MicOff />}
          active={isMuted}
          onClick={onMute}
          color="danger"
          tooltip={isMuted ? 'Unmute' : 'Mute'}
        />

        {/* Camera */}
        <ControlButton
          id="toggle-camera-btn"
          icon={<Videocam />}
          activeIcon={<VideocamOff />}
          active={isCameraOff}
          onClick={onCamera}
          color="danger"
          tooltip={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
        />

        {/* Screen share */}
        <ControlButton
          id="toggle-screenshare-btn"
          icon={<ScreenShare />}
          activeIcon={<StopScreenShare />}
          active={isScreenSharing}
          onClick={onScreenShare}
          tooltip={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        />

        {/* Chat toggle */}
        <ControlButton
          id="toggle-chat-btn"
          icon={<Chat />}
          active={isChatOpen}
          onClick={onChat}
          tooltip={isChatOpen ? 'Close chat' : 'Open chat'}
        />

        {/* Participants count button */}
        <Tooltip title={isParticipantsOpen ? 'Hide participants' : 'Show participants'} placement="top">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Box
              id="toggle-participants-btn"
              onClick={onParticipants}
              sx={{
                px: 2, height: 52, display: 'flex', alignItems: 'center', gap: 1,
                background: isParticipantsOpen ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.06)',
                borderRadius: '26px',
                border: isParticipantsOpen ? '2px solid rgba(124,58,237,0.6)' : '2px solid rgba(255,255,255,0.08)',
                color: isParticipantsOpen ? '#A78BFA' : '#94A3B8',
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  background: isParticipantsOpen ? 'rgba(124,58,237,0.35)' : 'rgba(255,255,255,0.12)',
                },
              }}
            >
              <People sx={{ fontSize: 18, color: '#A78BFA' }} />
              <Box sx={{
                fontSize: '0.85rem', fontWeight: 700, color: '#A78BFA',
                minWidth: 16, textAlign: 'center',
              }}>
                {participantCount}
              </Box>
            </Box>
          </motion.div>
        </Tooltip>

        {/* End call */}
        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
          <IconButton
            id="end-call-btn"
            onClick={onEnd}
            sx={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'linear-gradient(135deg, #EF4444, #DC2626)',
              color: 'white',
              boxShadow: '0 8px 24px rgba(239,68,68,0.5)',
              '&:hover': {
                background: 'linear-gradient(135deg, #DC2626, #B91C1C)',
                boxShadow: '0 12px 32px rgba(239,68,68,0.7)',
              },
              transition: 'all 0.2s',
            }}
          >
            <CallEnd sx={{ fontSize: 26 }} />
          </IconButton>
        </motion.div>
      </Box>
    </motion.div>
  );
};

export default CallControls;
