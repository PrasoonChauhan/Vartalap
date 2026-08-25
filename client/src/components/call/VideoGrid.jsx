import { Box } from '@mui/material';
import { AnimatePresence } from 'framer-motion';
import VideoTile from './VideoTile';

const VideoGrid = ({ localStream, peers, localUser, isMuted, isCameraOff, isScreenSharing }) => {
  const peerList = Object.entries(peers); // [socketId, peerData]
  const totalParticipants = 1 + peerList.length; // local + remote

  // Responsive grid layout based on participant count
  const getGridTemplate = () => {
    if (totalParticipants === 1) return { cols: 1, rows: 1 };
    if (totalParticipants === 2) return { cols: 2, rows: 1 };
    if (totalParticipants <= 4) return { cols: 2, rows: 2 };
    if (totalParticipants <= 6) return { cols: 3, rows: 2 };
    return { cols: 3, rows: 3 };
  };

  const { cols } = getGridTemplate();

  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gap: 1.5,
      width: '100%',
      height: '100%',
      p: 1.5,
    }}>
      <AnimatePresence>
        {/* Local video tile */}
        <Box key="local" sx={{ borderRadius: 3, overflow: 'hidden', minHeight: totalParticipants === 1 ? '100%' : 200 }}>
          <VideoTile
            stream={localStream}
            username={localUser?.username}
            avatar={localUser?.avatar}
            isMuted={isMuted}
            isCameraOff={isCameraOff}
            isLocal={true}
            isScreenSharing={isScreenSharing}
          />
        </Box>

        {/* Remote video tiles */}
        {peerList.map(([socketId, peerData]) => (
          <Box key={socketId} sx={{ borderRadius: 3, overflow: 'hidden', minHeight: 200 }}>
            <VideoTile
              stream={peerData.stream}
              username={peerData.username}
              avatar={peerData.avatar}
              isMuted={peerData.isMuted ?? false}
              isCameraOff={peerData.isCameraOff ?? !peerData.stream}
              isLocal={false}
            />
          </Box>
        ))}
      </AnimatePresence>
    </Box>
  );
};

export default VideoGrid;
