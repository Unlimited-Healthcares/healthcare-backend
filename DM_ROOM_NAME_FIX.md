# ✅ DM Room Name Fix

## Problem
When creating a Direct Message (DM), both users saw the same `room.name` value instead of seeing the other participant's name.

## Solution
Backend now dynamically sets `room.name` to the other participant's display name when creating or retrieving DM rooms.

## Implementation

### Helper Method Added
```typescript
private setDMDisplayName(room: ChatRoom, currentUserId: string): ChatRoom {
  if (room.type === 'direct' && room.participants?.length === 2) {
    const otherParticipant = room.participants.find(p => p.userId !== currentUserId);
    if (otherParticipant?.user?.profile) {
      const displayName = otherParticipant.user.profile.displayName || 
                         `${otherParticipant.user.profile.firstName || ''} ${otherParticipant.user.profile.lastName || ''}`.trim();
      if (displayName) {
        room.name = displayName;
      }
    }
  }
  return room;
}
```

### Applied in Three Locations

1. **Line 103**: Existing active room lookup
2. **Line 153**: Archived room reactivation  
3. **Line 207**: New room creation

## How It Works

### For User A (Samuel):
```json
{
  "room": {
    "name": "Jane",  // ← Other participant's name
    "type": "direct",
    "participants": [...]
  }
}
```

### For User B (Jane):
```json
{
  "room": {
    "name": "Samuel",  // ← Other participant's name
    "type": "direct",
    "participants": [...]
  }
}
```

## Display Name Priority
1. Use `profile.displayName` if available
2. Fallback to `firstName + lastName` if no displayName
3. Only set if name exists

## Benefits
- ✅ Each user sees personalized room name
- ✅ Frontend doesn't need to compute display name
- ✅ Name is set once at backend level
- ✅ Works for both new and existing rooms

## Files Modified
- `/var/www/healthcare-backend/src/chat/services/chat.service.ts`

## Testing
After deployment, create a DM and verify both users see different room names (each other's names).

