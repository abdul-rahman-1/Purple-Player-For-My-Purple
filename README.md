# 💜 Purple Player - Music Sharing App

> A beautiful, ad-free music-sharing platform for couples. Share your favorite songs with personal messages and connect emotionally through music.

![Purple Player](https://img.shields.io/badge/Purple-Player-blueviolet?style=flat-square&logo=spotify)
![React](https://img.shields.io/badge/Frontend-React%2018-61dafb?style=flat-square)
![Node.js](https://img.shields.io/badge/Backend-Express.js-green?style=flat-square)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-13aa52?style=flat-square)

---

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Usage](#usage)
- [Security](#security)

---

## 🎯 Overview

Purple Player is a **group-based music sharing application** where users can:
- Create or join groups with their partner/friends
- Share YouTube songs with personal dedications
- View real-time online status of group members
- Manage their profile, password, and account settings
- Experience complete data isolation between groups

### 💡 Why Purple Player?
✨ **Ad-Free** | 🔐 **Secure** | 💑 **Intimate** | 🎵 **Music-Focused**

---

## ✨ Key Features

### 🎵 Music Sharing
```
Alice (Group A)          Bob (Group A)
    ↓                        ↓
  Add Song          ← Share Playlist →        Player
  "Love Me"         ← 3 Songs Total →        🎧
                    ← Messages →
```

- Share YouTube songs with group members
- Add personal dedications/messages
- View group's shared playlist
- Solo player with playback controls

### 👥 Group Management
- **Create Group:** Generate unique 16-char code
- **Join Group:** Use partner's group code
- **Admin Features:** Manage group members
- **Leave Group:** Easy group exit option
- **Member Roles:** Admin & Member roles

### 🔐 Security & Privacy
- **Group Isolation:** Users only see their group's songs
- **Password Hashing:** Bcryptjs encryption
- **API Key Auth:** x-api-key header validation
- **Session Tracking:** Real-time online status
- **3-Step Verification:** Account deletion protection

### 👤 Profile Management
```
┌─────────────────────┐
│  Profile Dashboard  │
├─────────────────────┤
│ 📝 Personal Info    │
│ 🔐 Security        │
│ 👥 Group Mgmt      │
│ ⚠️  Danger Zone    │
└─────────────────────┘
```

---

## 🏗️ System Architecture

### Frontend Stack
```
React 18 + Vite
├── Pages
│   ├── Home (Dashboard)
│   ├── Player (Playlist)
│   ├── AddSong
│   ├── Profile (New)
│   └── Auth (Register/Login)
├── Components
│   ├── RegistrationFlow
│   ├── TrackList
│   └── UserContext
└── Styles (CSS3 + Animations)
```

### Backend Stack
```
Express.js + MongoDB
├── Routes
│   ├── /api/users (Auth, Profile)
│   ├── /api/tracks (Music)
│   ├── /api/users/online (Status)
│   └── /api/groups (Group Mgmt)
├── Models
│   ├── User (groupId, groupRole)
│   ├── Track (groupId isolation)
│   └── Group (members array)
└── Middleware
    └── API Key Validation
```

### Data Flow Diagram
```
User Registration
  ↓
Create/Join Group (generates code)
  ↓
Add Song → Auto-assigned to groupId
  ↓
Database: Track { groupId: "XXX" }
  ↓
Query: Find tracks where groupId = user's group
  ↓
Player: Shows only group's songs ✅
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** 16+ & npm
- **MongoDB** (Local or Atlas)
- **YouTube links** for songs

### Installation

1. **Clone Repository**
```bash
git clone https://github.com/abdul-rahman-1/Purple-Player-For-My-Purple-.git
cd Purple-Player-For-My-Purple-
```

2. **Backend Setup**
```bash
cd backend
npm install
# Set MONGO_URI in .env
node server.js  # Runs on port 4000
```

3. **Frontend Setup**
```bash
cd frontend
npm install
npm run dev  # Runs on port 5174
```

### Environment Variables

**Backend (.env)**
```
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/purple-player
PORT=4000
```

**Frontend (.env)**
```
VITE_API_URL=http://localhost:4000
VITE_API_KEY=purple-secret-key-samra-2025
```

---

## 🎮 Usage

### 1. Register
- Sign up with email & password (8+ chars, uppercase, number, special char)
- Upload profile photo (1:1 square)
- Choose group mode (always group-based)

### 2. Group Connection
```
Option A: Create Group
  ↓
Generate 16-char code
  ↓
Share with partner

Option B: Join Group
  ↓
Enter partner's code
  ↓
Auto-join their group
```

### 3. Add Songs
- Paste YouTube link
- Title & artist auto-detected
- Add personal message
- Save to group playlist

### 4. Listen Together
- Real-time online status
- View group members
- Play songs with dedications
- See who added each song

---

## 🔒 Security Features

### Data Isolation ✅
```
Group A                    Group B
├─ User 1, 2             ├─ User 3, 4
├─ 5 Songs               ├─ 3 Songs
└─ NO ACCESS to Group B   └─ NO ACCESS to Group A
```

**Backend Filtering:**
- `GET /api/tracks?userId=XXX` → Only group tracks
- `GET /api/tracks/top-song?userId=XXX` → Group's top song
- `POST /api/tracks` → Auto-assigns groupId
- `DELETE /api/tracks/:id` → Verifies group ownership

### Authentication
- **Password:** Bcryptjs hashing (10 salt rounds)
- **API Key:** Required on all endpoints
- **Session:** Heartbeat every 30 seconds
- **Verification:** Email reset available

---

## 📊 Database Schema

### User Model
```javascript
{
  _id: ObjectId,
  name: String,
  email: String,
  password: String (hashed),
  avatar: String (base64),
  groupId: ObjectId (ref: Group),
  groupRole: enum['admin', 'member'],
  isOnline: Boolean,
  joinedGroupAt: Date
}
```

### Track Model
```javascript
{
  _id: ObjectId,
  title: String,
  artist: String,
  url: String,
  source: enum['youtube', 'direct'],
  message: String,
  addedBy: ObjectId (ref: User),
  groupId: ObjectId (ref: Group) ✅ KEY
}
```

### Group Model
```javascript
{
  _id: ObjectId,
  groupCode: String (16 chars),
  members: [{
    userId: ObjectId,
    role: enum['admin', 'member'],
    joinedAt: Date
  }]
}
```

---

## 🎨 UI/UX Highlights

- **Purple Theme:** Linear gradient (B77BFF → 8A4FFF)
- **Glassmorphism:** Backdrop blur, semi-transparent cards
- **Smooth Animations:** Fade-in, slide-in, hover effects
- **Responsive Design:** Mobile, tablet, desktop optimized
- **Dark Mode:** Eye-friendly dark background

---

## 📱 Responsive Breakpoints

| Device | Width | Features |
|--------|-------|----------|
| Mobile | <768px | Stacked layout, touch-friendly |
| Tablet | 768-1024px | 2-column, adjusted spacing |
| Desktop | >1024px | Full experience, side panels |

---

## 🔄 Real-Time Features

- **Online Status:** Updates every 5 seconds
- **Heartbeat:** Keeps session alive (30s interval)
- **Offline Detection:** Auto-logout on tab close
- **Live Listening:** Shows current song playing

---

## 🚨 Error Handling

All endpoints return structured errors:
```json
{
  "error": "error_code",
  "message": "Human-readable message"
}
```

**Common Errors:**
- `400`: Missing userId, invalid input
- `403`: Cross-group access, unauthorized
- `404`: User/track not found
- `500`: Server error

---

## 📈 Performance

- **Database Indexing:** groupId for fast queries
- **Lazy Loading:** Songs load on demand
- **Caching:** Browser cache for assets
- **Compression:** Gzip enabled
- **Load Time:** <2s average

---

## 👨‍💻 Tech Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React + Vite | 18.x |
| Styling | CSS3 + Animations | Latest |
| Backend | Express.js | 4.x |
| Database | MongoDB | 5.x |
| Auth | Bcryptjs | 2.x |
| Deployment | Render | Cloud |

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m '✨ Add feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## 📄 License

MIT License - Feel free to use for personal/commercial projects

---

## 💬 Support

- **Issues:** GitHub Issues
- **Email:** abdulrahmanstd955@gmail.com
- **Status:** Active Development

---

## 🎉 Credits

**Made with 💜 by:**
- **Abdul Rahman** - Backend & Full Stack
- **Samra Khan** - Inspiration & Testing

> "A space where every song tells our story"

---

**Last Updated:** November 15, 2025 | **Status:** Production Ready ✅
