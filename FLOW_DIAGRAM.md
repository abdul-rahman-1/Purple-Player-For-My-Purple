# 📊 Registration & Group Code Flow - Visual Guide

## Registration Flow Overview

```
START REGISTRATION
    ↓
┌─────────────────────────────────┐
│ STEP 1: Email & Name            │
│ [Your Name]        [Email]      │
│              → NEXT              │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ STEP 2: Password                │
│ [Password]  [Strength Bar: █ ]  │
│ [Confirm]   Requirements ✓✗✓✗  │
│              → NEXT              │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ STEP 3: Profile Photo           │
│ [Upload 1:1 Photo] (Optional)   │
│              → NEXT              │
└─────────────────────────────────┘
    ↓
┌─────────────────────────────────┐
│ STEP 4: Solo or Group?          │
│ [🎵 SOLO]      [💜👥 GROUP]     │
│          (Click one)             │
└─────────────────────────────────┘
    ↓
    ├─ SOLO MODE ──→ REGISTER & LOGIN ──→ HOME PAGE ✅
    │
    └─ GROUP MODE ──→ STEP 5 (Group Connection)
           ↓
    ┌──────────────────────────────────┐
    │ STEP 5: Group Connection         │
    │                                  │
    │ ┌─────────────────────────────┐  │
    │ │ ✨ CREATE GROUP             │  │
    │ │ [✨ Generate Code]          │  │
    │ └─────────────────────────────┘  │
    │           OR                      │
    │ ┌─────────────────────────────┐  │
    │ │ 🔓 JOIN GROUP               │  │
    │ │ [Enter Code Here]           │  │
    │ │ [🔓 Join Group]             │  │
    │ └─────────────────────────────┘  │
    │                                  │
    └──────────────────────────────────┘
           ↓
    (SEE NEXT SECTION)
```

---

## GROUP MODE - DETAILED FLOW

### Path A: Creating New Group

```
Step 5: Group Connection
        ↓
    BEFORE:
    ┌─────────────────────────────┐
    │ ✨ CREATE GROUP             │
    │ [✨ Generate Code]          │
    │          ↓                  │
    │ 🔓 JOIN GROUP               │
    │ [Enter Code] [Join]         │
    └─────────────────────────────┘
        ↓
    USER CLICKS: [✨ Generate Code]
        ↓
    BACKEND:
    1. Register user (no login)
    2. Create unique 16-char code
    3. Save to user.groupCode
        ↓
    AFTER:
    ┌─────────────────────────────┐
    │ Your Unique Code:           │
    │                             │
    │ ┌───────────────────────┐   │
    │ │ A7F3C9E2B1D4F6A8      │   │
    │ └───────────────────────┘   │
    │                             │
    │ [📋 Copy Code]              │
    │                             │
    │ Share with your partner     │
    │                             │
    │ [✅ Complete Registration]  │
    │ [← Back]                    │
    └─────────────────────────────┘
        ↓
    USER CLICKS: [✅ Complete Registration]
        ↓
    FRONTEND:
    1. Call login endpoint
    2. Get full user data
    3. Store in localStorage
    4. Redirect to home
        ↓
    HOME PAGE - LOGGED IN ✅
```

### Path B: Joining Existing Group

```
Step 5: Group Connection
        ↓
    BEFORE:
    ┌─────────────────────────────┐
    │ ✨ CREATE GROUP             │
    │ [✨ Generate Code]          │
    │          ↓                  │
    │ 🔓 JOIN GROUP               │
    │ [Enter Code] [Join]         │
    └─────────────────────────────┘
        ↓
    USER ENTERS CODE: "A7F3C9E2B1D4F6A8"
        ↓
    USER CLICKS: [🔓 Join Group]
        ↓
    BACKEND:
    1. Register user (no login)
    2. Find partner with that code
    3. Link both users together
    4. Clear partner's code
        ↓
    AFTER:
    ┌─────────────────────────────┐
    │ ✅ Registration Complete!   │
    │                             │
    │ You're now part of a group. │
    │ Click below to finish.      │
    │                             │
    │ [✅ Complete Registration]  │
    │ [← Back]                    │
    └─────────────────────────────┘
        ↓
    USER CLICKS: [✅ Complete Registration]
        ↓
    FRONTEND:
    1. Call login endpoint
    2. Get full user data
    3. Store in localStorage
    4. Redirect to home
        ↓
    HOME PAGE - LOGGED IN ✅
```

---

## 🔄 User Linking Process

### When Partner Creates Code

```
PARTNER (User A)
├─ Email: samra@gmail.com
├─ Password: MyPass123!@
├─ isGroupMode: true
├─ groupCode: "A7F3C9E2B1D4F6A8"  ← Generated
├─ groupMemberId: null
└─ Status: Registered, NOT logged in

[Shares code with friend]
         ↓
         ↓
NEW USER (User B)
├─ Email: friend@gmail.com
├─ Password: MyPass456!@
├─ isGroupMode: true
├─ groupCode: null
├─ groupMemberId: null
└─ Status: Registered, NOT logged in
         ↓
    ENTERS CODE: "A7F3C9E2B1D4F6A8"
         ↓
    BACKEND LINKS THEM:
    
PARTNER (User A) - UPDATED
├─ groupMemberId: User B's ID  ← Linked!
└─ groupCode: null  ← Cleared

NEW USER (User B) - UPDATED
├─ groupMemberId: User A's ID  ← Linked!
└─ groupCode: null
         ↓
    BOTH USERS CAN NOW:
    ├─ See each other's songs
    ├─ See each other's listening status
    └─ Share music in real-time
```

---

## 🗄️ Database Schema

### User Document Structure

```javascript
{
  _id: ObjectId("507f1f77bcf86cd799439011"),
  
  // Basic Info
  name: "Samra Khan",
  email: "samra@gmail.com",
  avatar: "data:image/png;base64,...",
  
  // Authentication
  passwordHash: "$2a$10$...", ← Bcrypt hashed
  sessionId: "uuid-1234-5678",
  
  // Group Info
  isGroupMode: true,
  groupCode: "A7F3C9E2B1D4F6A8",     ← Only if creating
  groupMemberId: ObjectId("..."),     ← If joined/invited
  
  // Status
  isOnline: true,
  lastSeen: ISODate("2025-11-15T14:30:00Z"),
  currentlyListening: "Song Name - Artist",
  lastListenedSong: "Previous Song",
  
  // Timestamps
  createdAt: ISODate("2025-11-15T14:00:00Z"),
  updatedAt: ISODate("2025-11-15T14:30:00Z")
}
```

---

## 🔐 Password Validation Requirements

```
PASSWORD INPUT: "MyPass123!@"

Requirements Checklist:
✅ Min 8 chars          (11 chars)
✅ Uppercase (A-Z)      (M, P)
✅ Lowercase (a-z)      (y, a, s, s)
✅ Number (0-9)         (123)
✅ Special (!@#$%)      (!@)

Status: ✅ STRONG (5/5 requirements met)
```

---

## 🚨 Error States

### Duplicate Email
```
Input: samra@gmail.com (already exists)
    ↓
Error: "Email already registered"
User stays on Step 1
```

### Invalid Code
```
Input: "INVALIDCODE123"
    ↓
Backend searches: User.findOne({ groupCode })
    ↓
Not found!
    ↓
Error: "Invalid group code"
User stays in join form
```

### Weak Password
```
Input: "pass" (too short, no numbers, etc)
    ↓
Requirements show:
❌ Min 8 chars    
❌ Uppercase
❌ Lowercase
✅ Already weak
❌ Special char
    ↓
Status: VERY WEAK
Button disabled until fixed
```

---

## 📱 Frontend State Management

### RegistrationFlow Component State

```javascript
formData: {
  // Basic Info
  name: "Samra",
  email: "samra@gmail.com",
  password: "MyPass123!@",
  confirmPassword: "MyPass123!@",
  
  // Photo
  avatar: "data:image/png;base64,...",
  avatarPreview: "same...",
  
  // Group Info
  isGroupMode: true,        // true = group, false = solo
  generatedCode: null,      // Set when code generated
  userId: null,             // Set when registered
  partnerCode: ""           // User input for joining
}

step: 5
error: ""
loading: false
passwordStrength: {
  isValid: true,
  score: 5,
  requirements: { ... }
}
```

---

## 🔄 API Calls Sequence

### Create Group Flow

```
1. POST /api/users/register
   Input: { name, email, password, avatar, isGroupMode }
   Output: { _id, sessionId, ... }
   
2. POST /api/users/generate-group-code/:userId
   Input: userId (from step 1)
   Output: { groupCode: "A7F3C9E2B1D4F6A8" }
   
3. POST /api/users/login
   Input: { email, password }
   Output: { _id, sessionId, isGroupMode, groupCode, ... }
   
4. localStorage.setItem('purpleUser', userData)
   
5. window.location.href = '/'
```

### Join Group Flow

```
1. POST /api/users/register
   Input: { name, email, password, avatar, isGroupMode }
   Output: { _id, sessionId, ... }
   
2. POST /api/users/join-group/:userId
   Input: { groupCode: "A7F3C9E2B1D4F6A8" }
   Output: { _id, groupMemberId, partnerName, ... }
   
3. POST /api/users/login
   Input: { email, password }
   Output: { _id, groupMemberId, ... }
   
4. localStorage.setItem('purpleUser', userData)
   
5. window.location.href = '/'
```

---

**Updated:** November 15, 2025  
**Status:** ✅ All Fixes Applied
