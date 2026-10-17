# CodeSync — System Architecture

## Overview

CodeSync is a real-time collaborative coding platform composed of four independent services that communicate through REST APIs, WebSockets, and a shared MongoDB database.

## System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Browser                          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐│
│  │  React App   │  │  Socket.IO   │  │  Yjs WebSocket Client ││
│  │  (REST API)  │  │  (Chat)      │  │  (Collaboration)      ││
│  └──────┬───────┘  └──────┬───────┘  └──────────┬─────────────┘│
└─────────┼─────────────────┼─────────────────────┼──────────────┘
          │ HTTP             │ WS                   │ WS
          ▼                  ▼                      ▼
┌─────────────────────┐ ┌───────────────────────────────────────┐
│  Backend Server     │ │  Collaboration Server                 │
│  (Express, :5000)   │ │  (WebSocket, :4444)                   │
│                     │ │                                       │
│  • REST API         │ │  • Yjs document sync                  │
│  • JWT Auth         │ │  • JWT auth on upgrade                │
│  • Room management  │ │  • Room membership check              │
│  • File CRUD        │ │  • Read-only enforcement              │
│  • Code execution   │ │  • Awareness (cursors)                │
│  • AI (optional)    │ │  • Document persistence               │
│  • Chat (Socket.IO) │ │  • Connection management              │
│                     │ │                                       │
│  Socket.IO Server ──┘ │                                       │
└─────────┬───────────┘  └───────────┬─────────────────────────┘
          │                          │
          ▼                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MongoDB                                  │
│                                                                 │
│  Collections:                                                   │
│  • users          • rooms         • files                       │
│  • fileversions   • messages      • executions                  │
│  • yjsdocuments                                                 │
└─────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────┐
│  Execution Service  │
│  (Docker)           │
│                     │
│  • Sandboxed        │
│  • Non-root user    │
│  • No network       │
│  • Resource limits  │
│  • Timeout control  │
└─────────────────────┘
```

## Data Flow

### Authentication Flow
1. User submits credentials to `POST /api/auth/login`
2. Backend validates credentials against MongoDB
3. Backend generates JWT and sets it as HttpOnly cookie
4. All subsequent requests include the cookie automatically
5. Backend middleware extracts and verifies JWT on protected routes
6. Collaboration server extracts JWT from cookie during WebSocket upgrade

### Real-Time Collaboration Flow
1. User opens a room → Frontend creates a Yjs `Y.Doc`
2. Frontend establishes WebSocket connection to Collaboration Server at `ws://host:4444/room:{roomId}:file:{fileId}`
3. Collaboration Server:
   a. Parses JWT from cookie header during HTTP upgrade
   b. Verifies JWT signature
   c. Queries MongoDB to confirm room membership
   d. Accepts or rejects the connection
4. On acceptance:
   a. Server loads persisted document state from MongoDB
   b. Sends sync step 1 (full state) to new client
   c. Client applies state and sends sync step 2 (its state)
5. As users type:
   a. Yjs generates incremental updates (not full document)
   b. Updates are sent to the Collaboration Server via WebSocket
   c. Server broadcasts updates to all other connected clients
   d. Server persists updates to MongoDB (debounced)
   e. Viewers' update messages are rejected (read-only enforcement)
6. Awareness protocol handles cursor positions and user presence

### Chat Flow
1. Client connects to Socket.IO on the Backend Server
2. Client emits `join-room` with room ID
3. Server verifies JWT and room membership
4. Messages are sent via `send-message` event
5. Server persists message to MongoDB
6. Server broadcasts to all room members via `room:{roomId}` Socket.IO room

### Code Execution Flow
1. User clicks "Run" → `POST /api/execute` with code and language
2. Backend validates request and checks Docker availability
3. Backend writes code to a temporary file
4. Backend spawns a Docker container with the sandbox image
5. Container runs with: no network, read-only fs, memory/CPU limits, timeout
6. stdout/stderr captured and stored in Execution collection
7. Response returned to client
8. Temporary files and container cleaned up

### File Save/Version Flow
1. User clicks "Save" → `POST /api/files/:fileId/save`
2. Backend reads current content (from Yjs document state or request body)
3. Backend creates a FileVersion record with the content snapshot
4. Auto-increments version number
5. User can view versions via `GET /api/files/:fileId/versions`
6. User can restore via `POST /api/files/:fileId/restore/:versionId`
7. Restore updates the file content and creates a new version record

## Key Design Decisions

### Why Separate Collaboration Server?
- Yjs WebSocket protocol is distinct from REST/Socket.IO
- Allows independent scaling of collaboration workload
- Cleaner separation of concerns
- Can be deployed on separate infrastructure

### Why Yjs Instead of OT?
- CRDTs (Conflict-free Replicated Data Types) guarantee eventual consistency
- No central authority needed for conflict resolution
- Works well with temporary disconnections
- Yjs is the most mature JavaScript CRDT library
- y-monaco provides seamless Monaco Editor integration

### Why HttpOnly Cookies Instead of localStorage?
- HttpOnly cookies are not accessible to JavaScript (XSS protection)
- Automatically sent with every request (including WebSocket upgrades)
- Works seamlessly across REST, Socket.IO, and WebSocket connections
- SameSite attribute provides CSRF protection

### Why MongoDB for Yjs Persistence?
- Uses the same database as the rest of the application
- Binary Yjs updates stored efficiently as Buffer arrays
- Compaction strategy prevents unbounded growth
- Simpler infrastructure than adding Redis or LevelDB

## Port Assignments

| Service              | Port  | Protocol    |
|---------------------|-------|-------------|
| Frontend (Vite dev) | 5173  | HTTP        |
| Backend API         | 5000  | HTTP + WS   |
| Collaboration       | 4444  | HTTP + WS   |
| MongoDB             | 27017 | TCP         |
