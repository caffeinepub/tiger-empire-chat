# Tiger Empire Chat

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Public chat application named "Tiger Empire" supporting large numbers of users (lakhs/hundreds of thousands)
- User registration and login with username/display name
- Public chat rooms where anyone can join and send messages
- Message history visible to all members
- User count display showing how many people are online/registered
- Group chat support -- multiple chat rooms
- Real-time message polling for near-instant updates
- User profiles with display name

### Modify
- N/A (new project)

### Remove
- N/A (new project)

## Implementation Plan
1. Backend (Motoko):
   - User registration: store username, display name, join timestamp
   - Chat rooms: create, list, join rooms
   - Messages: send message to a room, fetch messages with pagination
   - Online/member count per room
   - Efficient storage for large number of users and messages

2. Frontend (React):
   - Landing/login page with username registration
   - Chat room list page
   - Chat room view with message history and real-time polling
   - Message input box
   - User count and online indicator
   - Tiger Empire branding
