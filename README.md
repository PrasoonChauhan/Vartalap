# Vartalap 💬

> **Real-time video calling and chat** — built with MERN stack, WebRTC & Socket.IO

---

## ✨ Features

- 🎥 **Group Video Calls** — Up to 6 participants via mesh WebRTC (P2P, free)
- 🎙️ **Real-time Chat** — In-call messaging with typing indicators
- 🗑️ **Auto-delete Chat** — Messages automatically deleted when call ends
- 🔐 **Google OAuth** — Sign in with Google (profile photo used as avatar)
- 👥 **Recent Contacts** — Quick reconnect with past call participants
- 🟢 **Live Online Status** — Real-time presence indicators
- 🔔 **Call Notifications** — Browser push + in-app incoming call modal
- 🖥️ **Screen Sharing** — Share your screen during calls
- 🖼️ **Cloudinary Avatars** — Profile photos uploaded directly to Cloudinary CDN
- 🌙 **Dark UI** — Premium glassmorphism design with MUI v5

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js (Vite), Material UI v5, Framer Motion |
| Backend | Node.js, Express.js, Socket.IO |
| Database | MongoDB Atlas |
| Real-time Video | WebRTC (simple-peer, mesh topology) |
| Real-time Chat | Socket.IO |
| Auth | JWT + bcryptjs + Google OAuth |
| File Storage | Cloudinary (via multer-storage-cloudinary) |
| STUN | Google free STUN servers |

---

## 📁 Project Structure

```
Vartalap/
├── client/               # React (Vite) frontend
│   └── src/
│       ├── components/   # UI components
│       │   ├── auth/
│       │   ├── call/     # VideoTile, VideoGrid, CallControls, ChatPanel
│       │   ├── contacts/ # RecentContacts, UserSearch
│       │   └── common/   # Navbar, IncomingCallModal
│       ├── context/      # AuthContext, SocketContext, CallContext
│       ├── hooks/        # useWebRTC, useAuthActions
│       ├── pages/        # LoginPage, RegisterPage, HomePage, CallPage
│       ├── services/     # Axios API service
│       └── theme/        # MUI dark theme
│
└── server/               # Node.js + Express backend
    ├── config/           # db.js, cloudinary.js
    ├── controllers/      # auth, user, chat
    ├── middleware/       # authMiddleware, uploadMiddleware (Multer+Cloudinary)
    ├── models/           # User, Message (TTL), CallRecord
    ├── routes/           # auth, user, chat routes
    └── socket/           # socketHandler.js (all Socket.IO events)
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free M0 cluster)
- Cloudinary account (free tier)

### 1. Clone & Install

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install --legacy-peer-deps
```

### 2. Configure Environment Variables

**`server/.env`**
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/vartalap
JWT_SECRET=your_super_secret_key
CLIENT_URL=http://localhost:5173
GOOGLE_CLIENT_ID=your_google_client_id
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**`client/.env`**
```env
VITE_API_URL=http://localhost:5000
VITE_SOCKET_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

### 3. Run the App

```bash
# Terminal 1 — Backend
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev
```

Open http://localhost:5173 🎉

---

## 🔌 WebRTC Architecture (Mesh)

```
User A ←→ User B
User A ←→ User C
User B ←→ User C
```
Every peer connects directly to every other peer. No media server required.
Uses **Google STUN** servers (free) for NAT traversal.

---

## 💬 Chat Behavior

All in-call chat messages are **automatically deleted** when the call ends. Messages are temporarily stored during the call so participants can scroll back through the conversation, but once the call is over, all messages are permanently removed.

---

## 📡 Socket.IO Events

| Event | Purpose |
|---|---|
| `user:register` | Mark user online |
| `call:initiate` | Start call, invite participants |
| `call:incoming` | Notify callee |
| `call:accept` | Join room, begin WebRTC |
| `call:end` | End call, cleanup, Privacy delete |
| `webrtc:offer/answer/ice-candidate` | WebRTC signaling |
| `chat:message` | Send/receive messages |
| `user:typing` | Typing indicators |

---

## 🌐 API Endpoints

| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/register` | Register + avatar upload |
| POST | `/api/auth/login` | Login → JWT |
| POST | `/api/auth/google` | Google OAuth login/register |
| GET | `/api/auth/me` | Current user |
| GET | `/api/users/search?q=` | Search users |
| GET | `/api/users/recent-contacts` | Recent call contacts |
| GET | `/api/chat/:roomId` | Chat history (Normal Mode) |
| DELETE | `/api/chat/:roomId` | Delete room chat |

---

## 🤝 Contributing

Pull requests welcome! Please open an issue first to discuss changes.

---

*Made with ❤️ using MERN + WebRTC*
