import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (user) {
      socketRef.current = io(import.meta.env.VITE_SOCKET_URL, {
        transports: ['websocket'],
        withCredentials: true,
      });

      socketRef.current.on('connect', () => {
        setIsConnected(true);
        socketRef.current.emit('user:register', user._id);
      });

      socketRef.current.on('online:users', (users) => {
        setOnlineUsers(users);
      });

      socketRef.current.on('disconnect', () => {
        setIsConnected(false);
      });

      return () => {
        socketRef.current?.disconnect();
      };
    }
  }, [user]);

  const isUserOnline = (userId) => onlineUsers.includes(userId);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, onlineUsers, isConnected, isUserOnline }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
