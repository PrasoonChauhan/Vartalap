const crypto = require('crypto');
const Message = require('../models/Message');
const CallRecord = require('../models/CallRecord');
const User = require('../models/User');

// Map: userId -> socketId
const onlineUsers = new Map();
// Map: roomId -> { participants, mode, startTime }
const activeRooms = new Map();

const socketHandler = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ─── USER ONLINE ──────────────────────────────────────────────
    socket.on('user:register', async (userId) => {
      if (!userId) return;
      const uid = userId.toString();
      onlineUsers.set(uid, socket.id);
      socket.userId = uid;

      // Mark online in DB
      await User.findByIdAndUpdate(uid, { isOnline: true });

      // Broadcast updated online list
      io.emit('online:users', Array.from(onlineUsers.keys()));
      console.log(`✅ User online: ${uid} (Socket: ${socket.id})`);
    });

    // ─── CALL: INITIATE ──────────────────────────────────────────
    socket.on('call:initiate', ({ callerId, callerName, callerAvatar, targetIds, roomId }) => {
      console.log(`📞 call:initiate by ${callerName} (${callerId}) for room ${roomId}`);
      activeRooms.set(roomId, {
        participants: [],
        startTime: new Date(),
        hostId: callerId?.toString(),
      });

      // Notify each target
      targetIds.forEach((targetId) => {
        const targetSocket = onlineUsers.get(targetId?.toString());
        if (targetSocket) {
          console.log(`🔔 Sending call:incoming to target ${targetId} at socket ${targetSocket}`);
          io.to(targetSocket).emit('call:incoming', {
            callerId,
            callerName,
            callerAvatar,
            roomId,
            isGroup: targetIds.length > 1,
          });
        } else {
          console.log(`⚠️ Target user ${targetId} not found in onlineUsers`);
        }
      });
    });

    // ─── CALL: REJECT ─────────────────────────────────────────────
    socket.on('call:reject', ({ roomId, callerId, userId, username }) => {
      const callerSocket = onlineUsers.get(callerId?.toString());
      if (callerSocket) {
        io.to(callerSocket).emit('call:rejected', { userId, username });
      }
    });

    // ─── CALL: JOIN ROOM (Emitted by CallPage when user is ready) ─
    socket.on('call:join-room', ({ roomId, userId, username, avatar }) => {
      if (!roomId || !userId) return;
      const uid = userId.toString();

      let room = activeRooms.get(roomId);
      if (!room) {
        room = {
          participants: [],
          startTime: new Date(),
          hostId: uid,
        };
        activeRooms.set(roomId, room);
      }

      socket.join(roomId);
      socket.roomId = roomId;
      socket.userId = uid;

      // Always ensure onlineUsers mapping is up to date for this user
      onlineUsers.set(uid, socket.id);

      console.log(`👤 user:join-room - Room: ${roomId}, User: ${username} (${uid}), Socket: ${socket.id}`);

      // Collect existing participants in this room
      const existingParticipants = [];
      room.participants.forEach((p) => {
        const sid = onlineUsers.get(p.userId.toString());
        if (sid && sid !== socket.id) {
          existingParticipants.push({
            userId: p.userId,
            username: p.username,
            avatar: p.avatar,
            socketId: sid,
          });
        }
      });

      console.log(`📋 Existing participants for ${username} (${socket.id}):`, existingParticipants);

      // Send list of existing participants to the joiner
      socket.emit('call:existing-participants', existingParticipants);

      // Broadcast new joiner to everyone else in the room
      console.log(`📢 Broadcasting call:user-joined for ${username} (${socket.id}) to room ${roomId}`);
      socket.to(roomId).emit('call:user-joined', {
        userId: uid,
        username,
        avatar,
        socketId: socket.id,
      });

      // Add/update participant in room.participants
      const existingIdx = room.participants.findIndex((p) => p.userId.toString() === uid);
      if (existingIdx !== -1) {
        room.participants[existingIdx] = { userId: uid, username, avatar, socketId: socket.id };
      } else {
        room.participants.push({ userId: uid, username, avatar, socketId: socket.id });
      }
    });

    // ─── CALL: END ────────────────────────────────────────────────
    socket.on('call:end', async ({ roomId, userId }) => {
      const room = activeRooms.get(roomId);
      if (!room) return;

      // Calculate duration
      const duration = Math.floor((new Date() - room.startTime) / 1000);

      // Save call record
      try {
        const uniqueParticipantIds = [...new Set(room.participants.map((p) => p.userId || p))];
        const participantDocs = await User.find({ _id: { $in: uniqueParticipantIds } }).select('username avatar');
        await CallRecord.create({
          roomId,
          participants: participantDocs.map((u) => ({
            userId: u._id,
            username: u.username,
            avatar: u.avatar,
          })),
          startTime: room.startTime,
          endTime: new Date(),
          duration,
        });

        // Update recent contacts for all participants
        for (const pid of uniqueParticipantIds) {
          const otherIds = uniqueParticipantIds.filter((id) => id !== pid);
          if (otherIds.length > 0) {
            const others = await User.find({ _id: { $in: otherIds } }).select('username avatar');
            const user = await User.findById(pid);
            if (user) {
              for (const other of others) {
                const existing = user.recentContacts.find(
                  (c) => c.userId && c.userId.toString() === other._id.toString()
                );
                if (existing) {
                  existing.lastCallAt = new Date();
                  existing.avatar = other.avatar;
                } else {
                  user.recentContacts.push({
                    userId: other._id,
                    username: other.username,
                    avatar: other.avatar,
                    lastCallAt: new Date(),
                  });
                }
              }
              user.recentContacts = user.recentContacts
                .sort((a, b) => new Date(b.lastCallAt) - new Date(a.lastCallAt))
                .slice(0, 20);
              await user.save();
            }
          }
        }
      } catch (err) {
        console.error('Error saving call record:', err);
      }

      // Delete all chat messages for this room
      try {
        await Message.deleteMany({ roomId });
      } catch (err) {
        console.error('Error deleting chat messages:', err);
      }
      io.to(roomId).emit('chat:clear', { roomId });

      // Notify everyone in room that call ended
      io.to(roomId).emit('call:ended', { roomId, duration });

      // Cleanup
      activeRooms.delete(roomId);
    });

    // ─── CALL: USER LEFT (without ending) ─────────────────────────
    socket.on('call:leave', ({ roomId, userId, username }) => {
      socket.leave(roomId);
      socket.to(roomId).emit('call:user-left', { userId, username, socketId: socket.id });

      const room = activeRooms.get(roomId);
      if (room) {
        room.participants = room.participants.filter(
          (p) => p.userId?.toString() !== userId?.toString()
        );
      }
    });

    // ─── WEBRTC SIGNALING ─────────────────────────────────────────
    socket.on('call:media-toggle', ({ roomId, isMuted, isCameraOff }) => {
      socket.to(roomId).emit('call:media-toggle', {
        socketId: socket.id,
        isMuted,
        isCameraOff,
      });
    });

    socket.on('webrtc:offer', ({ offer, targetSocketId, callerId }) => {
      io.to(targetSocketId).emit('webrtc:offer', { offer, callerId, callerSocketId: socket.id });
    });

    socket.on('webrtc:answer', ({ answer, targetSocketId }) => {
      io.to(targetSocketId).emit('webrtc:answer', { answer, answererSocketId: socket.id });
    });

    socket.on('webrtc:ice-candidate', ({ candidate, targetSocketId }) => {
      io.to(targetSocketId).emit('webrtc:ice-candidate', { candidate, from: socket.id });
    });

    // ─── CHAT MESSAGES ────────────────────────────────────────────
    socket.on('chat:message', async ({ roomId, content, sender }) => {
      // Validate message content
      if (!content || typeof content !== 'string' || content.trim().length === 0) return;
      const sanitizedContent = content.slice(0, 2000).trim(); // max 2000 chars

      const message = {
        _id: crypto.randomUUID(),
        roomId,
        sender,
        content: sanitizedContent,
        createdAt: new Date().toISOString(),
      };

      // Broadcast to room (including sender for confirmation)
      io.to(roomId).emit('chat:message', message);

      // Save to DB (messages are deleted when call ends)
      try {
        await Message.create({
          roomId,
          sender,
          content: sanitizedContent,
        });
      } catch (err) {
        console.error('Error saving message:', err);
      }
    });

    // ─── TYPING INDICATOR ─────────────────────────────────────────
    socket.on('user:typing', ({ roomId, username, isTyping }) => {
      socket.to(roomId).emit('user:typing', { username, isTyping });
    });

    // ─── DISCONNECT ───────────────────────────────────────────────
    socket.on('disconnect', async () => {
      const userId = socket.userId;
      if (userId) {
        onlineUsers.delete(userId);

        // Mark offline in DB
        await User.findByIdAndUpdate(userId, {
          isOnline: false,
          lastSeen: new Date(),
        });

        // Broadcast updated online list
        io.emit('online:users', Array.from(onlineUsers.keys()));

        // Handle disconnection during active call
        activeRooms.forEach((room, roomId) => {
          const wasInRoom = room.participants.some(
            (p) => p.userId?.toString() === userId
          );
          if (wasInRoom) {
            room.participants = room.participants.filter(
              (p) => p.userId?.toString() !== userId
            );
            socket.to(roomId).emit('call:user-left', { userId, socketId: socket.id });
          }
        });

        console.log(`❌ User offline: ${userId}`);
      }
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
};

module.exports = socketHandler;
