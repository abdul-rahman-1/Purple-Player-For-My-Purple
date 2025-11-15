# 🔐 Purple Player - Secure Registration & Login System

## Overview
A complete secure authentication system with multi-step registration, password validation, and group mode functionality.

---

## 🎯 Features Implemented

### **1. Secure Registration Flow (5 Steps)**

#### Step 1: Email & Name
- Email validation
- Name input
- Simple and clean UI

#### Step 2: Password Creation
- **Password Requirements:**
  - Minimum 8 characters
  - At least one uppercase letter (A-Z)
  - At least one lowercase letter (a-z)
  - At least one number (0-9)
  - At least one special character (!@#$%^&*)
- **Real-time Strength Indicator:**
  - Visual strength bar
  - Color-coded feedback (Red → Yellow → Green)
  - Strength label (Very Weak → Strong)
  - List of requirements with checkmarks
- Password confirmation with match validation

#### Step 3: Profile Photo (Optional)
- 1:1 aspect ratio validation
- Image preview
- Max 5MB file size
- Supports JPG, PNG formats
- Photo is converted to base64 and stored in MongoDB

#### Step 4: Usage Mode Selection
- **Solo Mode:** For individual users
- **Group Mode:** For users who want to share with a partner
- Clear choice with icons and descriptions

#### Step 5a: Create Group Code (If Group Mode Selected)
- Generate unique 16-character alphanumeric code
- Easy copy-to-clipboard functionality
- Code is uniquely generated and checked against database
- Share with partner to connect

#### Step 5b: Join Group (If Group Mode Selected)
- Input partner's 16-character code
- Automatic linking of both users
- Real-time validation

### **2. Secure Login**
- Email and password authentication
- "Show/Hide" password toggle
- Real-time error messages
- Switch to register option if new user
- Secure password verification with bcrypt

### **3. Backend Security**

**User Model Updates:**
```javascript
- name: String
- email: String (unique)
- passwordHash: String (bcrypt hashed)
- avatar: String (base64 image)
- isGroupMode: Boolean
- groupCode: String (unique 16-char code)
- groupMemberId: ObjectId (reference to partner)
- sessionId: String (unique session identifier)
- isOnline: Boolean
- lastSeen: Date
```

**API Endpoints:**

1. **Registration:**
   - `POST /api/users/register`
   - Body: `{ name, email, password, avatar }`
   - Creates user with hashed password

2. **Login:**
   - `POST /api/users/login`
   - Body: `{ email, password }`
   - Verifies password and returns user data

3. **Group Code Generation:**
   - `POST /api/users/generate-group-code/:userId`
   - Generates unique 16-character code

4. **Join Group:**
   - `POST /api/users/join-group/:userId`
   - Body: `{ groupCode }`
   - Links two users together

5. **Leave Group:**
   - `POST /api/users/leave-group/:userId`
   - Unlinks both users

6. **Get Group Partner:**
   - `GET /api/users/group-partner/:userId`
   - Returns partner information

### **4. Frontend Components**

**RegistrationFlow.jsx:**
- 5-step multi-step form
- State management for all fields
- Error handling and validation
- Password strength indicator
- Photo upload with preview
- Group mode selection
- Code generation and joining

**LoginForm.jsx:**
- Clean login interface
- Email/password inputs
- Show/hide password toggle
- Error messages
- Switch to register link

**passwordValidator.js (Utility):**
- `validatePassword(password)` - Checks all requirements
- `getPasswordStrengthLabel(score)` - Returns strength text
- `getPasswordStrengthColor(score)` - Returns color based on strength

### **5. Security Features**

✅ **Password Security:**
- Minimum 8 characters
- Must contain uppercase, lowercase, number, special char
- Bcrypt hashing (10 rounds)
- Password confirmation
- Real-time validation feedback

✅ **Session Management:**
- Unique session IDs per login
- Heartbeat mechanism (every 30 seconds)
- Auto-logout on tab close
- Secure token storage in localStorage

✅ **Data Protection:**
- Base64 image encoding (no direct file upload)
- MongoDB field validation
- Unique email addresses
- Unique group codes

✅ **API Security:**
- API key authentication
- Rate limiting middleware ready
- Error messages don't expose sensitive info

---

## 🚀 User Flow

### Registration
```
1. Enter Email & Name
   ↓
2. Create Strong Password
   ↓
3. Upload Profile Photo (Optional)
   ↓
4. Choose Solo or Group Mode
   ↓
5a. If Solo: Done! ✅
5b. If Group: Generate Code or Join Partner
```

### Group Connection
```
User A:
- Chooses Group Mode
- Generates unique code (16 chars)
- Shares code with User B

User B:
- Chooses Group Mode  
- Enters User A's code
- Both users are now linked
- Songs shared between them
```

### Login
```
Enter Email
   ↓
Enter Password
   ↓
Verify Credentials
   ↓
Start Session
   ↓
Auto Heartbeat (30s interval)
```

---

## 📱 UI/UX Highlights

✨ **Visual Feedback:**
- Password strength bar with color coding
- Real-time requirement checkmarks
- Photo preview with remove option
- Code display with copy button
- Error messages with clear guidance
- Loading states during submission

✨ **Responsive Design:**
- Works on mobile, tablet, desktop
- Adaptive layouts
- Touch-friendly buttons
- Readable fonts and spacing

✨ **Accessibility:**
- Clear labels and placeholders
- Show/hide password toggle
- Helpful error messages
- Progress indication (Step X of 5)

---

## 🔒 Database Structure (MongoDB)

### Users Collection
```javascript
{
  _id: ObjectId,
  name: "Samra",
  email: "samra@gmail.com",
  passwordHash: "$2a$10...", // Bcrypt hash
  avatar: "data:image/png;base64,...", // Base64 image
  isGroupMode: true,
  groupCode: "A7F3C9E2B1D4F6A8", // Unique 16-char
  groupMemberId: ObjectId("..."), // Partner's ID
  isOnline: true,
  lastSeen: ISODate("2025-11-15..."),
  currentlyListening: "Song Name - Artist",
  lastListenedSong: "Song Name",
  createdAt: ISODate("2025-11-15..."),
  updatedAt: ISODate("2025-11-15...")
}
```

---

## 📊 Password Strength Scoring

| Score | Label | Requirements Met |
|-------|-------|------------------|
| 5 | Strong 💪 | All 5 requirements |
| 4 | Good ✓ | 4 requirements |
| 3 | Fair ⚠️ | 3 requirements |
| 2 | Weak ❌ | 2 requirements |
| 1 | Very Weak ❌ | 1 requirement |

---

## 🛠️ Technical Stack

**Backend:**
- Node.js + Express
- MongoDB + Mongoose
- Bcryptjs (password hashing)
- UUID (session generation)
- Crypto (group code generation)

**Frontend:**
- React 18
- React Context API
- Fetch API
- localStorage

---

## 🎵 Next Steps for Large Groups

For scaling to larger groups:

1. **Group Collections:**
   - Create a `Group` model
   - Store multiple members
   - Manage permissions

2. **Broadcast System:**
   - Use WebSockets instead of polling
   - Real-time song updates
   - Chat system

3. **Scalable Architecture:**
   - Message queue (RabbitMQ)
   - Redis for caching
   - Microservices separation

---

## 📝 Notes

- Songs are shared in group mode initially
- Each group can start with 2 users (scalable)
- Password hashing uses bcrypt (secure)
- Group codes are case-insensitive
- All timestamps use UTC/ISO format
- Session IDs are unique per login

---

**Version:** 1.0.0  
**Last Updated:** November 15, 2025  
**Status:** Production Ready ✅
