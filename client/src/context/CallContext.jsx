import { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { v4 as uuidv4 } from 'uuid';

const CallContext = createContext(null);

export const CallProvider = ({ children }) => {
  const { socket } = useSocket();
  const { user } = useAuth();

  const [callState, setCallState] = useState('idle'); // idle | calling | incoming | in-call
  const [incomingCall, setIncomingCall] = useState(null);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [participants, setParticipants] = useState([]);

  // Listen for incoming calls globally across the application
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (callData) => {
      console.log('🔔 Global incoming call received:', callData);
      setIncomingCall(callData);
      setCallState('incoming');
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(`📞 Incoming call from ${callData.callerName}`, {
          body: callData.isGroup ? 'Group video call' : 'Video call',
        });
      }
    };

    socket.on('call:incoming', handleIncomingCall);

    return () => {
      socket.off('call:incoming', handleIncomingCall);
    };
  }, [socket]);

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
    socket.emit('call:end', { roomId, userId: user._id });
    setCallState('idle');
    setCurrentRoom(null);
    setParticipants([]);
  }, [socket, user]);

  const leaveCall = useCallback((roomId) => {
    if (!socket || !user) return;
    socket.emit('call:leave', { roomId, userId: user._id, username: user.username });
    setCallState('idle');
    setCurrentRoom(null);
    setParticipants([]);
  }, [socket, user]);

  return (
    <CallContext.Provider value={{
      callState, setCallState,
      incomingCall, setIncomingCall,
      currentRoom, setCurrentRoom,
      participants, setParticipants,
      initiateCall, acceptCall, rejectCall, endCall, leaveCall,
    }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => useContext(CallContext);
