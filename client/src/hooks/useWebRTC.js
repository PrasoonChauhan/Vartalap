import { useEffect, useRef, useState, useCallback } from 'react';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

const useWebRTC = (socket, user, roomId) => {
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState({}); // socketId -> { pc, stream, userId, username, avatar }
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  const peersRef = useRef({}); // socketId -> { pc, userId, username, avatar }
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const initializedRef = useRef(false);

  // Get local media
  const getLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.warn('Full media access failed, trying audio-only fallback:', err);
      try {
        const audioStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
        localStreamRef.current = audioStream;
        setLocalStream(audioStream);
        setIsCameraOff(true);
        return audioStream;
      } catch (audioErr) {
        console.error('Audio media access also failed:', audioErr);
        throw audioErr;
      }
    }
  }, []);

  // Create native RTCPeerConnection to a remote participant
  const createPeer = useCallback((targetSocketId, targetUserId, targetUsername, targetAvatar, stream) => {
    if (peersRef.current[targetSocketId]) {
      return peersRef.current[targetSocketId].pc;
    }

    console.log(`🛠️ Creating RTCPeerConnection for targetSocketId: ${targetSocketId} (${targetUsername})`);
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks to peer connection
    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });
    }

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('webrtc:ice-candidate', { candidate: event.candidate, targetSocketId });
      }
    };

    // Remote Track handler
    pc.ontrack = (event) => {
      console.log(`🎉 Remote stream track received from ${targetSocketId} (${targetUsername})`);
      const remoteStream = event.streams[0] || new MediaStream([event.track]);

      event.track.onmute = () => {
        setPeers((prev) => {
          if (!prev[targetSocketId]) return prev;
          const isVideo = event.track.kind === 'video';
          return {
            ...prev,
            [targetSocketId]: {
              ...prev[targetSocketId],
              isCameraOff: isVideo ? true : prev[targetSocketId].isCameraOff,
              isMuted: !isVideo ? true : prev[targetSocketId].isMuted,
            },
          };
        });
      };

      event.track.onunmute = () => {
        setPeers((prev) => {
          if (!prev[targetSocketId]) return prev;
          const isVideo = event.track.kind === 'video';
          return {
            ...prev,
            [targetSocketId]: {
              ...prev[targetSocketId],
              isCameraOff: isVideo ? false : prev[targetSocketId].isCameraOff,
              isMuted: !isVideo ? false : prev[targetSocketId].isMuted,
            },
          };
        });
      };

      setPeers((prev) => ({
        ...prev,
        [targetSocketId]: {
          ...prev[targetSocketId],
          stream: remoteStream,
        },
      }));
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`📡 ICE state for ${targetSocketId}:`, pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        try { pc.restartIce(); } catch (e) {}
      }
    };

    peersRef.current[targetSocketId] = {
      pc,
      userId: targetUserId,
      username: targetUsername,
      avatar: targetAvatar,
    };

    setPeers((prev) => ({
      ...prev,
      [targetSocketId]: {
        pc,
        stream: null,
        userId: targetUserId,
        username: targetUsername,
        avatar: targetAvatar,
        isMuted: false,
        isCameraOff: false,
      },
    }));

    return pc;
  }, [socket]);

  // Initialize WebRTC for the room
  const initializeWebRTC = useCallback(async () => {
    if (!socket || !user || !roomId) return;
    if (initializedRef.current) return;
    initializedRef.current = true;

    console.log('🚀 Initializing WebRTC for room:', roomId, 'User:', user.username, 'Socket:', socket.id);
    const stream = await getLocalStream();

    // Clean old listeners
    socket.off('call:existing-participants');
    socket.off('call:user-joined');
    socket.off('webrtc:offer');
    socket.off('webrtc:answer');
    socket.off('webrtc:ice-candidate');
    socket.off('call:user-left');
    socket.off('call:media-toggle');

    // Handle remote media status toggling
    socket.on('call:media-toggle', ({ socketId, isMuted: remoteMuted, isCameraOff: remoteCameraOff }) => {
      setPeers((prev) => {
        if (!prev[socketId]) return prev;
        return {
          ...prev,
          [socketId]: {
            ...prev[socketId],
            isMuted: remoteMuted !== undefined ? remoteMuted : prev[socketId].isMuted,
            isCameraOff: remoteCameraOff !== undefined ? remoteCameraOff : prev[socketId].isCameraOff,
          },
        };
      });
    });

    // 1. When joiner gets existing participants from room
    socket.on('call:existing-participants', async (existingParticipants) => {
      console.log('📥 call:existing-participants:', existingParticipants);
      for (const { userId: targetUserId, username: targetUsername, avatar: targetAvatar, socketId: targetSocketId } of existingParticipants) {
        const pc = createPeer(targetSocketId, targetUserId, targetUsername, targetAvatar, stream);
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          console.log(`📤 Sending webrtc:offer to existing participant ${targetSocketId}`);
          socket.emit('webrtc:offer', { offer, targetSocketId, callerId: user._id });
        } catch (err) {
          console.error('Error creating offer:', err);
        }
      }
    });

    // 2. When existing participant receives a new joiner
    socket.on('call:user-joined', ({ userId, username, avatar, socketId }) => {
      console.log('📥 call:user-joined:', socketId, username);
      createPeer(socketId, userId, username, avatar, stream);
    });

    // 3. WebRTC Offer received
    socket.on('webrtc:offer', async ({ offer, callerId, callerSocketId }) => {
      console.log('📥 webrtc:offer received from:', callerSocketId);
      const pc = createPeer(callerSocketId, callerId, '', '', stream);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log(`📤 Sending webrtc:answer to ${callerSocketId}`);
        socket.emit('webrtc:answer', { answer, targetSocketId: callerSocketId });
      } catch (err) {
        console.error('Error handling offer:', err);
      }
    });

    // 4. WebRTC Answer received
    socket.on('webrtc:answer', async ({ answer, answererSocketId }) => {
      console.log('📥 webrtc:answer received from:', answererSocketId);
      const peerObj = peersRef.current[answererSocketId];
      if (peerObj?.pc) {
        try {
          await peerObj.pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('Error handling answer:', err);
        }
      }
    });

    // 5. ICE candidate received
    socket.on('webrtc:ice-candidate', async ({ candidate, from }) => {
      const peerObj = peersRef.current[from];
      if (peerObj?.pc && candidate) {
        try {
          await peerObj.pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    });

    // 6. User left
    socket.on('call:user-left', ({ socketId }) => {
      console.log('📥 call:user-left for:', socketId);
      if (peersRef.current[socketId]) {
        peersRef.current[socketId].pc.close();
        delete peersRef.current[socketId];
        setPeers((prev) => {
          const updated = { ...prev };
          delete updated[socketId];
          return updated;
        });
      }
    });

    // Emit call:join-room to server
    console.log('📤 Emitting call:join-room for user:', user.username, 'room:', roomId);
    socket.emit('call:join-room', {
      roomId,
      userId: user._id,
      username: user.username,
      avatar: user.avatar,
    });
  }, [socket, user, roomId, getLocalStream, createPeer]);

  // Mute / unmute
  const toggleMute = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted((prev) => {
        const next = !prev;
        if (socket && roomId) {
          socket.emit('call:media-toggle', { roomId, isMuted: next, isCameraOff });
        }
        return next;
      });
    }
  }, [socket, roomId, isCameraOff]);

  // Camera on/off
  const toggleCamera = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff((prev) => {
        const next = !prev;
        if (socket && roomId) {
          socket.emit('call:media-toggle', { roomId, isMuted, isCameraOff: next });
        }
        return next;
      });
    }
  }, [socket, roomId, isMuted]);

  // Screen share
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      screenStreamRef.current?.getTracks().forEach((t) => t.stop());
      const videoTrack = localStreamRef.current?.getVideoTracks()[0];
      if (videoTrack) {
        Object.values(peersRef.current).forEach(({ pc }) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(videoTrack);
        });
      }
      setIsScreenSharing(false);
    } else {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = screenStream;
        const screenTrack = screenStream.getVideoTracks()[0];

        Object.values(peersRef.current).forEach(({ pc }) => {
          const sender = pc.getSenders().find((s) => s.track?.kind === 'video');
          if (sender) sender.replaceTrack(screenTrack);
        });

        screenTrack.onended = () => toggleScreenShare();
        setIsScreenSharing(true);
      } catch (err) {
        console.error('Screen share error:', err);
      }
    }
  }, [isScreenSharing]);

  // Cleanup
  const cleanup = useCallback(() => {
    initializedRef.current = false;
    Object.values(peersRef.current).forEach(({ pc }) => pc.close());
    peersRef.current = {};
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current = null;
    setPeers({});
    setLocalStream(null);
    setIsScreenSharing(false);

    socket?.off('call:existing-participants');
    socket?.off('call:user-joined');
    socket?.off('call:user-left');
    socket?.off('webrtc:offer');
    socket?.off('webrtc:answer');
    socket?.off('webrtc:ice-candidate');
    socket?.off('call:media-toggle');
  }, [socket]);

  return {
    localStream,
    peers,
    isMuted,
    isCameraOff,
    isScreenSharing,
    initializeWebRTC,
    toggleMute,
    toggleCamera,
    toggleScreenShare,
    cleanup,
  };
};

export default useWebRTC;
