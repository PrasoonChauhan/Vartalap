import { useState, useCallback, useRef, useMemo } from 'react';
import { Box } from '@mui/material';
import { AnimatePresence } from 'framer-motion';
import VideoTile from './VideoTile';

const VideoGrid = ({ localStream, peers, localUser, isMuted, isCameraOff, isScreenSharing }) => {
  const peerList = Object.entries(peers); // [socketId, peerData]
  const totalParticipants = 1 + peerList.length; // local + remote

  // Build ordered participant array: [{ id, ...data }]
  // 'local' is a special id for the local user
  const allParticipants = useMemo(() => {
    const remote = peerList.map(([socketId, peerData]) => ({
      id: socketId,
      stream: peerData.stream,
      username: peerData.username,
      avatar: peerData.avatar,
      isMuted: peerData.isMuted ?? false,
      isCameraOff: peerData.isCameraOff ?? !peerData.stream,
      isBackgrounded: peerData.isBackgrounded ?? false,
      isLocal: false,
    }));
    const local = {
      id: 'local',
      stream: localStream,
      username: localUser?.username,
      avatar: localUser?.avatar,
      isMuted,
      isCameraOff,
      isLocal: true,
      isScreenSharing,
      isBackgrounded: false,
    };
    return [...remote, local]; // local defaults to last (bottom-right / last-row)
  }, [peerList, localStream, localUser, isMuted, isCameraOff, isScreenSharing]);

  // Slot assignment: array of participant IDs in grid order
  // Initialize with allParticipants IDs; update only on drag-and-drop
  const [slotOrder, setSlotOrder] = useState([]);
  const prevIdsRef = useRef('');

  // Sync slotOrder when participants join/leave
  const currentIds = allParticipants.map((p) => p.id).sort().join(',');
  if (currentIds !== prevIdsRef.current) {
    prevIdsRef.current = currentIds;
    // Preserve existing order for participants still present, append new ones
    const existingOrder = slotOrder.filter((id) => allParticipants.some((p) => p.id === id));
    const newIds = allParticipants.filter((p) => !existingOrder.includes(p.id)).map((p) => p.id);
    const merged = [...existingOrder, ...newIds];
    // Ensure 'local' is last by default only on first build
    if (slotOrder.length === 0) {
      const withoutLocal = merged.filter((id) => id !== 'local');
      setSlotOrder([...withoutLocal, 'local']);
    } else {
      setSlotOrder(merged);
    }
  }

  // Resolve ordered participants
  const orderedParticipants = slotOrder
    .map((id) => allParticipants.find((p) => p.id === id))
    .filter(Boolean);

  // Drag-and-drop handlers
  const dragItemRef = useRef(null);

  const handleDragStart = useCallback((id) => {
    dragItemRef.current = id;
  }, []);

  const handleDrop = useCallback((targetId) => {
    const sourceId = dragItemRef.current;
    if (!sourceId || sourceId === targetId) return;
    setSlotOrder((prev) => {
      const newOrder = [...prev];
      const srcIdx = newOrder.indexOf(sourceId);
      const tgtIdx = newOrder.indexOf(targetId);
      if (srcIdx === -1 || tgtIdx === -1) return prev;
      // Swap
      [newOrder[srcIdx], newOrder[tgtIdx]] = [newOrder[tgtIdx], newOrder[srcIdx]];
      return newOrder;
    });
    dragItemRef.current = null;
  }, []);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
  }, []);

  // ─── 2-USER LAYOUT: PiP ─────────────────────────────────────
  if (totalParticipants === 2) {
    const mainParticipant = orderedParticipants[0]; // other user (large)
    const pipParticipant = orderedParticipants[1];  // me (small corner)

    return (
      <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
        {/* Main (large) video */}
        {mainParticipant && (
          <Box
            key={mainParticipant.id}
            draggable
            onDragStart={() => handleDragStart(mainParticipant.id)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(mainParticipant.id)}
            sx={{ width: '100%', height: '100%', borderRadius: 3, overflow: 'hidden' }}
          >
            <VideoTile
              stream={mainParticipant.stream}
              username={mainParticipant.username}
              avatar={mainParticipant.avatar}
              isMuted={mainParticipant.isMuted}
              isCameraOff={mainParticipant.isCameraOff}
              isLocal={mainParticipant.isLocal}
              isScreenSharing={mainParticipant.isLocal ? mainParticipant.isScreenSharing : false}
              isBackgrounded={mainParticipant.isBackgrounded}
            />
          </Box>
        )}

        {/* PiP (small floating corner) */}
        {pipParticipant && (
          <Box
            key={pipParticipant.id}
            draggable
            onDragStart={() => handleDragStart(pipParticipant.id)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(pipParticipant.id)}
            sx={{
              position: 'absolute',
              bottom: { xs: 90, sm: 24 },
              right: { xs: 12, sm: 24 },
              width: { xs: 120, sm: 180, md: 220 },
              height: { xs: 160, sm: 135, md: 165 },
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              border: '2px solid rgba(124,58,237,0.4)',
              zIndex: 30,
              cursor: 'grab',
              transition: 'box-shadow 0.2s',
              '&:hover': {
                boxShadow: '0 12px 48px rgba(124,58,237,0.4)',
              },
            }}
          >
            <VideoTile
              stream={pipParticipant.stream}
              username={pipParticipant.username}
              avatar={pipParticipant.avatar}
              isMuted={pipParticipant.isMuted}
              isCameraOff={pipParticipant.isCameraOff}
              isLocal={pipParticipant.isLocal}
              isScreenSharing={pipParticipant.isLocal ? pipParticipant.isScreenSharing : false}
              isBackgrounded={pipParticipant.isBackgrounded}
            />
          </Box>
        )}
      </Box>
    );
  }

  // ─── 3–6 USER LAYOUT: Responsive Grid (max 3 rows × 2 cols) ──
  // Grid config: always 2 columns; rows = ceil(total / 2)
  const cols = 2;
  const rows = Math.ceil(totalParticipants / cols);
  const isOdd = totalParticipants % 2 !== 0;

  return (
    <Box sx={{
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gridTemplateRows: `repeat(${rows}, 1fr)`,
      gap: 1.5,
      width: '100%',
      height: '100%',
      p: 1.5,
    }}>
      <AnimatePresence>
        {orderedParticipants.map((participant, idx) => {
          // If odd count and this is the last item, span full width
          const isLastOddItem = isOdd && idx === orderedParticipants.length - 1;

          return (
            <Box
              key={participant.id}
              draggable
              onDragStart={() => handleDragStart(participant.id)}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(participant.id)}
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                minHeight: 200,
                cursor: 'grab',
                transition: 'outline 0.2s',
                outline: '2px solid transparent',
                '&:active': { cursor: 'grabbing' },
                ...(isLastOddItem && {
                  gridColumn: '1 / -1', // span all columns
                }),
              }}
            >
              <VideoTile
                stream={participant.stream}
                username={participant.username}
                avatar={participant.avatar}
                isMuted={participant.isMuted}
                isCameraOff={participant.isCameraOff}
                isLocal={participant.isLocal}
                isScreenSharing={participant.isLocal ? participant.isScreenSharing : false}
                isBackgrounded={participant.isBackgrounded}
              />
            </Box>
          );
        })}
      </AnimatePresence>
    </Box>
  );
};

export default VideoGrid;
