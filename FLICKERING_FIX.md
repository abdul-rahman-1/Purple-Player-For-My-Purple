# Online-Section Flickering Fix

## Problem
The online-section (showing group members) was flickering or rendering out and in rapidly due to the 5-second polling interval for member updates.

**Root Cause**: Every 5 seconds, the polling would fetch group members and update state, even if the members array hadn't changed. This caused unnecessary re-renders with every poll interval.

## Solution
Implemented three complementary techniques to prevent unnecessary re-renders:

### 1. **Data Comparison with useRef** (frontend/src/pages/Home.jsx)
- Added `previousMembersRef` using `useRef([])` to track the previous members array
- Before updating state, compare current members with previous using `JSON.stringify()`
- Only call `setGroupMembers()` if the members array has actually changed

```jsx
const previousMembersRef = useRef([]);

async function loadGroupMembers() {
  // ... fetch data ...
  
  // Only update if members actually changed (prevent flickering)
  const membersStr = JSON.stringify(data.members || []);
  const prevStr = JSON.stringify(previousMembersRef.current);
  
  if (membersStr !== prevStr) {
    setGroupMembers(data.members || []);
    previousMembersRef.current = data.members || [];
  }
}
```

**Benefit**: React won't re-render if state hasn't changed. Polling continues silently without triggering updates.

### 2. **CSS Animation for Smooth Appearance** (frontend/src/styles.css)
- Added `fade-in` class to `.online-section`
- Animation: 0.3s ease-in-out opacity transition from 0 to 1

```css
.online-section {
  margin-bottom: 60px;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

**Benefit**: When initial render happens (first member fetch), section smoothly fades in instead of popping in abruptly.

### 3. **Loading State Management** (frontend/src/pages/Home.jsx)
- Added `isInitialLoad` state to track first load completion
- Show "Loading group members..." message while fetching
- Users know something is happening during first load

```jsx
const [isInitialLoad, setIsInitialLoad] = useState(true);
const [loading, setLoading] = useState(false);

// In JSX:
{loading ? (
  <p>Loading group members...</p>
) : groupMembers.length === 0 ? (
  // No members yet
) : (
  // Show members
)}
```

**Benefit**: UX clarity - users see loading state instead of sudden empty/filled transitions.

## Result
✅ **Flickering eliminated**: Data comparison prevents unnecessary state updates
✅ **Smooth appearance**: CSS fade-in provides gentle animation on first render
✅ **Continuous polling**: 5-second interval persists but silently (only updates if changed)
✅ **Clear UX**: Loading state during first fetch explains any delay

## Technical Flow
1. **First Load** (page mount):
   - `loadGroupMembers()` fetches data from API
   - `previousMembersRef` is empty, so update state (trigger render)
   - Section appears with fade-in animation (0.3s)
   
2. **Subsequent Polls** (every 5 seconds):
   - `loadGroupMembers()` fetches data again
   - Compare with `previousMembersRef` using JSON.stringify
   - If same: No state update → No re-render → No flicker
   - If different: Update state → Re-render (but users see fade-in, not jerky pop)

## Files Modified
- `frontend/src/pages/Home.jsx`: Added data comparison logic and isInitialLoad state
- `frontend/src/styles.css`: Added fade-in animation to .online-section

## Testing
- Clear browser cache (DevTools → Application → Clear storage)
- Log back in as a group user
- Verify online-section appears smoothly on first load
- Monitor that members list updates every 5 seconds without jerky re-renders
- Check that "offline" members remain visible throughout polling cycles
