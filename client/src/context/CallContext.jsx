import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';

const CallContext = createContext(null);

export const CallProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuth();

  const [callState, setCallState] = useState('idle'); // idle | calling | incoming | in-call | backgrounded
  const [incomingCall, setIncomingCall] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [participants, setParticipants] = useState([]);

  // Track rooms that have been explicitly ended to prevent stale notifications
  const endedRoomsRef = useRef(new Set());
  // Guard against double endCall
  const endingRef = useRef(false);

  // Listen for incoming calls globally across the application
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (callData) => {
      console.log('🔔 Global incoming call received:', callData);

      // Guard: ignore if we're already in a call or calling
      if (callState === 'in-call' || callState === 'calling' || callState === 'backgrounded') {
        console.log('⚠️ Ignoring incoming call — already in a call/calling');
        return;
      }

      // Guard: ignore calls for rooms that have been ended
      if (endedRoomsRef.current.has(callData.roomId)) {
        console.log('⚠️ Ignoring incoming call — room already ended:', callData.roomId);
        return;
      }

      setIncomingCall(callData);
      setCallState('incoming');
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(`📞 Incoming call from ${callData.callerName}`, {
          body: callData.isGroup ? 'Group video call' : 'Video call',
        });
      }
    };

    // Listen for call:ended globally to track ended rooms and clean up state
    const handleCallEnded = ({ roomId }) => {
      endedRoomsRef.current.add(roomId);
      // Clean up stale entries after 30 seconds
      setTimeout(() => {
        endedRoomsRef.current.delete(roomId);
      }, 30000);

      // If this was our current call, reset state
      if (currentRoom === roomId) {
        setCallState('idle');
        setCurrentRoom(null);
        setParticipants([]);
        endingRef.current = false;
      }
    };

    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:ended', handleCallEnded);

    return () => {
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:ended', handleCallEnded);
    };
  }, [socket, callState, currentRoom]);

  const initiateCall = useCallback((targetUsers) => {
    if (!socket || !user) return;
    const roomId = uuidv4();
    const targetIds = targetUsers.map((u) => u._id);

    socket.emit('call:initiate', {
      callerId: user._id,
      callerName: user.username,
      callerAvatar: user.avatar,
      targetIds,
      roomId,
    });

    setCurrentRoom(roomId);
    setCallState('calling');

    return roomId;
  }, [socket, user]);

  const acceptCall = useCallback((roomId) => {
    if (!socket || !user) return;
    setCurrentRoom(roomId);
    setCallState('in-call');
    setIncomingCall(null);
  }, [socket, user]);

  const rejectCall = useCallback((roomId, callerId) => {
    if (!socket || !user) return;
    socket.emit('call:reject', {
      roomId,
      callerId,
      userId: user._id,
      username: user.username,
    });
    setIncomingCall(null);
    setCallState('idle');
  }, [socket, user]);

  const endCall = useCallback((roomId) => {
    if (!socket || !user) return;

    // Idempotency guard: don't end if already ending or no current room
    if (endingRef.current || !currentRoom) {
      console.log('⚠️ endCall skipped — already ending or no active room');
      return;
    }
    endingRef.current = true;

    // Mark this room as ended to prevent stale incoming-call notifications
    endedRoomsRef.current.add(roomId);
    setTimeout(() => {
      endedRoomsRef.current.delete(roomId);
    }, 30000);

    socket.emit('call:end', { roomId, userId: user._id });
    setCallState('idle');
    setCurrentRoom(null);
    setParticipants([]);

    // Reset ending guard after a short delay
    setTimeout(() => {
      endingRef.current = false;
    }, 1000);
  }, [socket, user, currentRoom]);

  const leaveCall = useCallback((roomId) => {
    if (!socket || !user) return;
    socket.emit('call:leave', { roomId, userId: user._id, username: user.username });
    setCallState('idle');
    setCurrentRoom(null);
    setParticipants([]);
  }, [socket, user]);

  // Background the call (Back button — don't end, just mark backgrounded)
  const backgroundCall = useCallback(() => {
    if (callState === 'in-call' || callState === 'calling') {
      setCallState('backgrounded');
    }
  }, [callState]);

  // Return to the call from backgrounded state
  const foregroundCall = useCallback(() => {
    if (callState === 'backgrounded') {
      setCallState('in-call');
    }
  }, [callState]);

  return (
    <CallContext.Provider value={{
      callState, setCallState,
      incomingCall, setIncomingCall,
      currentRoom, setCurrentRoom,
      participants, setParticipants,
      initiateCall, acceptCall, rejectCall, endCall, leaveCall,
      backgroundCall, foregroundCall,
    }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
