import { useRef, useEffect } from 'react';
import { Box, Avatar, Typography, Chip } from '@mui/material';
import { MicOff, VideocamOff, ScreenShare } from '@mui/icons-material';
import { motion } from 'framer-motion';

const VideoTile = ({ stream, username, avatar, isMuted, isCameraOff, isLocal, isScreenSharing }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      if (videoRef.current.srcObject !== stream) {
        videoRef.current.srcObject = stream;
      }
    }
  }, [stream, isCameraOff]);

  const initials = username?.slice(0, 2).toUpperCase() || '??';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      style={{ width: '100%', height: '100%' }}
    >
      <Box sx={{
        position: 'relative', width: '100%', height: '100%',
        borderRadius: 3, overflow: 'hidden',
        background: 'linear-gradient(135deg, #13131A 0%, #1E1E2E 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}>
        {/* Video element (always rendered, display controlled by camera status) */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          style={{
            width: '100%', height: '100%',
            objectFit: isScreenSharing ? 'contain' : 'cover',
            transform: isLocal && !isScreenSharing ? 'scaleX(-1)' : 'none',
            display: stream && !isCameraOff ? 'block' : 'none',
          }}
        />

        {/* Avatar fallback when camera off or no stream */}
        {(!stream || isCameraOff) && (
          <Box sx={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, rgba(124,58,237,0.1) 0%, rgba(6,182,212,0.05) 100%)',
          }}>
            <Avatar
              src={avatar}
              sx={{
                width: 80, height: 80,
                fontSize: '2rem', fontWeight: 700,
                background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
                boxShadow: '0 12px 32px rgba(124,58,237,0.4)',
              }}
            >
              {!avatar && initials}
            </Avatar>
          </Box>
        )}

        {/* Username label */}
        <Box sx={{
          position: 'absolute', bottom: 10, left: 12,
          display: 'flex', alignItems: 'center', gap: 1,
        }}>
          <Box sx={{
            px: 1.5, py: 0.5, borderRadius: 2,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
              {username}{isLocal ? ' (You)' : ''}
            </Typography>
          </Box>
        </Box>

        {/* Status indicators */}
        <Box sx={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 0.5 }}>
          {isMuted && (
            <Box sx={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(239,68,68,0.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <MicOff sx={{ fontSize: 14, color: 'white' }} />
            </Box>
          )}
          {isCameraOff && (
            <Box sx={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(239,68,68,0.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <VideocamOff sx={{ fontSize: 14, color: 'white' }} />
            </Box>
          )}
          {isScreenSharing && (
            <Box sx={{
              width: 28, height: 28, borderRadius: '50%',
              background: 'rgba(6,182,212,0.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <ScreenShare sx={{ fontSize: 14, color: 'white' }} />
            </Box>
          )}
        </Box>

        {/* Local indicator */}
        {isLocal && (
          <Box sx={{
            position: 'absolute', top: 10, left: 10,
            px: 1, py: 0.25, borderRadius: 1,
            background: 'rgba(124,58,237,0.8)',
            backdropFilter: 'blur(4px)',
          }}>
            <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 700 }}>YOU</Typography>
          </Box>
        )}
      </Box>
    </motion.div>
  );
};

export default VideoTile;
