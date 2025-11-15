## New Group System - API Documentation

### Overview
The group system has been completely redesigned to support **unlimited members per group** instead of just pairs. Each group is now a proper entity with members, roles, and shared content tracking.

---

## Core Changes

### 1. Database Schema Changes

#### Before (Old System)
```javascript
User {
  groupMemberId: ObjectId,      // Only paired with ONE other user
  groupCode: String,             // User's personal code
  groupName: String              // Null, never used
}
```

#### After (New System)
```javascript
User {
  groupId: ObjectId,             // Reference to Group document
  groupRole: enum['admin', 'member'],
  joinedGroupAt: Date
}

Group {
  groupName: String,             // Actual group name
  groupCode: String,             // 16-char unique code
  members: [
    {
      userId: ObjectId,
      role: enum['admin', 'member'],
      joinedAt: Date
    }
  ],
  totalSongs: Number,
  totalMessages: Number,
  description: String
}
```

---

## API Endpoints

### 1. Create or Join Group

**POST** `/api/users/join-group/:userId`

#### Create New Group
```javascript
Request Body:
{
  "createNew": true,
  "groupName": "My Music Circle"
}

Response:
{
  "_id": "user_id",
  "name": "John",
  "groupId": "group_id",
  "groupCode": "ABCD1234EFGH5678",  // 16-char code
  "groupName": "My Music Circle",
  "groupRole": "admin",
  "message": "Group created successfully! Share code to invite others."
}
```

#### Join Existing Group
```javascript
Request Body:
{
  "createNew": false,
  "groupCode": "ABCD1234EFGH5678"
}

Response:
{
  "_id": "user_id",
  "name": "Jane",
  "groupId": "group_id",
  "groupCode": "ABCD1234EFGH5678",
  "groupName": "My Music Circle",
  "groupRole": "member",
  "membersCount": 3,
  "message": "Successfully joined group: My Music Circle"
}
```

---

### 2. Get All Group Members

**GET** `/api/users/group/members/:userId`

Returns all members of the user's group (ONLY group members, not other groups).

```javascript
Response:
{
  "groupId": "group_id",
  "groupName": "My Music Circle",
  "groupCode": "ABCD1234EFGH5678",
  "members": [
    {
      "userId": "user1_id",
      "name": "John",
      "email": "john@example.com",
      "avatar": "",
      "isOnline": true,
      "currentlyListening": "Song Title",
      "lastSeen": "2025-11-15T12:00:00Z",
      "role": "admin",
      "joinedAt": "2025-11-15T10:00:00Z"
    },
    {
      "userId": "user2_id",
      "name": "Jane",
      "email": "jane@example.com",
      "avatar": "",
      "isOnline": false,
      "currentlyListening": null,
      "lastSeen": "2025-11-15T11:30:00Z",
      "role": "member",
      "joinedAt": "2025-11-15T11:00:00Z"
    }
  ],
  "totalMembers": 2,
  "totalSongs": 15,
  "totalMessages": 42,
  "createdAt": "2025-11-15T10:00:00Z"
}
```

---

### 3. Get Group Information

**GET** `/api/users/group/info/:groupId`

Get detailed info about a specific group.

```javascript
Response: (Same structure as GET /api/users/group/members/:userId)
```

---

### 4. Leave Group

**POST** `/api/users/leave-group/:userId`

User leaves their group. If all members leave, group is deleted.

```javascript
Response:
{
  "message": "Successfully left group",
  "groupDeleted": false
}
```

---

### 5. Get Group Tracks

**GET** `/api/tracks/group/shared/:userId`

Get all tracks shared only within the user's group (NOT tracks from other groups).

```javascript
Response:
{
  "groupId": "group_id",
  "groupName": "My Music Circle",
  "membersCount": 2,
  "tracksCount": 15,
  "tracks": [
    {
      "_id": "track_id",
      "title": "Blank Space",
      "artist": "Taylor Swift",
      "url": "https://youtube.com/...",
      "source": "youtube",
      "addedBy": {
        "_id": "user_id",
        "name": "John",
        "email": "john@example.com",
        "avatar": ""
      },
      "message": "Love this song!",
      "createdAt": "2025-11-15T10:30:00Z"
    }
  ]
}
```

---

### 6. Get User's Track Count

**GET** `/api/tracks/user/:userId/count`

Get count of tracks added by a specific user.

```javascript
Response:
{
  "userId": "user_id",
  "tracksCount": 5
}
```

---

### 7. Get All Tracks by User

**GET** `/api/tracks/user/:userId`

Get all tracks added by a specific user (across all their uploads).

```javascript
Response:
{
  "userId": "user_id",
  "tracksCount": 5,
  "tracks": [...]
}
```

---

## Key Features

### ✅ Multiple Members Per Group
- Create groups with unlimited members
- Not limited to pairs anymore

### ✅ Data Isolation
- Each group member only sees:
  - Their own group members (not other groups)
  - Tracks shared within their group (not other groups)
  - Individual member track counts (not aggregate totals)

### ✅ Role-Based Access
- **Admin**: Can manage group, kick members, delete group
- **Member**: Can view group, add songs, see members

### ✅ Group Codes
- 16-character unique codes for easy sharing
- Share code to invite new members
- One code per group

### ✅ Online Status
- See which members are currently online
- See what they're listening to
- Last seen timestamp

### ✅ Track Attribution
- Know who added each track
- Individual song counters per user
- Message/dedication with each song

---

## Migration Notes

✅ **Old users imported successfully:**
- Abdul Rahman (abdulrahmanstd955@gmail.com) → Group with Samra Khan
- Samra Khan His Purple (khansamra9005@gmail.com) → Group with Abdul Rahman
- Abdul Rahman (abdalrahmankhankhan@gmail.com) → Solo (isGroupMode: false)
- Abhay (cyber.ops108@gmail.com) → Group with User0001
- User0001 (rahmanabl@student.iul.ac.in) → Group with Abhay

✅ **Session IDs preserved** - Your login sessions still work

---

## Frontend Integration Steps

### 1. Update Login Response Handler
```javascript
// OLD: groupMemberId, groupCode
// NEW: groupId, groupRole, joinedGroupAt

const handleLoginSuccess = (user) => {
  setCurrentUser({
    ...user,
    groupId: user.groupId,
    groupRole: user.groupRole,
    isGroupMode: user.isGroupMode
  });
};
```

### 2. Create Group Modal
Show form to:
- Create new group (enter name)
- Join existing group (enter 16-char code)

### 3. Get Members List
```javascript
// Only show members from user's own group
const fetchGroupMembers = async (userId) => {
  const response = await fetch(
    `/api/users/group/members/${userId}`,
    { headers: { 'x-api-key': API_KEY } }
  );
  const { members } = await response.json();
  return members; // Only group members
};
```

### 4. Get Group Tracks
```javascript
// Only show tracks from user's group members
const fetchGroupTracks = async (userId) => {
  const response = await fetch(
    `/api/tracks/group/shared/${userId}`,
    { headers: { 'x-api-key': API_KEY } }
  );
  const { tracks } = await response.json();
  return tracks; // Only from this group
};
```

### 5. Individual Track Counts
```javascript
// Show how many songs EACH member added
const getMemberTrackCount = async (memberId) => {
  const response = await fetch(
    `/api/tracks/user/${memberId}/count`,
    { headers: { 'x-api-key': API_KEY } }
  );
  const { tracksCount } = await response.json();
  return tracksCount;
};
```

---

## Testing

### Test User Credentials
```
1. Admin of Group 1:
   Email: abdulrahmanstd955@gmail.com
   Password: (use your original password)
   Group: Abdul Rahman & Samra Khan His Purple
   Session: 835c0072-c6d4-4925-8c84-4bb73e46c8ca

2. Member of Group 1:
   Email: khansamra9005@gmail.com
   Password: (use your original password)
   Group: Abdul Rahman & Samra Khan His Purple
   Session: 41bda378-3b48-4fa4-a782-b853bcab18a0

3. Solo User:
   Email: abdalrahmankhankhan@gmail.com
   Password: (use your original password)
   isGroupMode: false
   Session: d8b355b7-7455-46ec-b201-6ed7c9463d40

4. Group 2 Admin:
   Email: cyber.ops108@gmail.com
   Password: (use your original password)
   Group: Abhay & User0001
   Session: 77c71a72-fd8b-4ae0-a1a6-5ec5c77852f7

5. Group 2 Member:
   Email: rahmanabl@student.iul.ac.in
   Password: (use your original password)
   Group: Abhay & User0001
   Session: 7e76d5f0-0a3d-44fa-9c27-9f9e0258671d
```

---

## Summary

| Feature | Old System | New System |
|---------|-----------|-----------|
| Members per group | 2 (pair) | Unlimited |
| Group ID reference | groupMemberId | groupId |
| Data isolation | ❌ See all users | ✅ Only group members |
| Track visibility | ❌ All tracks | ✅ Only group tracks |
| Song counter | ❌ Total across all | ✅ Per member |
| Group name | null | Actual name |
| Group code | Personal | Shared |
| Roles | None | admin/member |
| Group creation | Auto pair | Explicit create |

---

## Next Steps

1. ✅ Backend: New group system implemented
2. ⏭️ **Frontend: Update components to use new endpoints**
   - TrackList.jsx: Use `/api/tracks/group/shared/:userId`
   - Player.jsx: Use `/api/users/group/members/:userId`
   - AddSong.jsx: Show member track counts
3. ⏭️ Test end-to-end flow
4. ⏭️ Deploy to production
