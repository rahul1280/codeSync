# CodeSync — REST API Documentation

## Base URL

```
http://localhost:5000/api
```

## Authentication

All protected endpoints require a valid JWT in an HttpOnly cookie named `token`. The cookie is set automatically on login and sent with every request when using `credentials: 'include'` (fetch) or `withCredentials: true` (axios).

## Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Human-readable error description",
    "code": "ERROR_CODE",
    "details": []
  }
}
```

---

## Authentication Endpoints

### POST /api/auth/register

Register a new user account.

**Auth Required:** No

**Request Body:**
```json
{
  "name": "Alice Developer",
  "email": "alice@example.com",
  "password": "SecurePass123"
}
```

**Validation:**
- `name`: 2-50 characters, required
- `email`: Valid email format, required, must be unique
- `password`: Min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6a7b8c9d0e1",
      "name": "Alice Developer",
      "email": "alice@example.com",
      "avatarColor": "#58a6ff",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```
*Sets `token` HttpOnly cookie*

**Error Responses:**
- `400` — Validation errors (invalid email, weak password)
- `409` — Email already registered
- `429` — Rate limit exceeded

---

### POST /api/auth/login

Login with existing credentials.

**Auth Required:** No

**Request Body:**
```json
{
  "email": "alice@example.com",
  "password": "SecurePass123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6a7b8c9d0e1",
      "name": "Alice Developer",
      "email": "alice@example.com",
      "avatarColor": "#58a6ff"
    }
  }
}
```
*Sets `token` HttpOnly cookie*

**Error Responses:**
- `400` — Missing email or password
- `401` — Invalid credentials
- `429` — Rate limit exceeded

---

### POST /api/auth/logout

Clear authentication cookie.

**Auth Required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

---

### GET /api/auth/me

Get current authenticated user.

**Auth Required:** Yes

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "64a1b2c3d4e5f6a7b8c9d0e1",
      "name": "Alice Developer",
      "email": "alice@example.com",
      "avatarColor": "#58a6ff",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Error Responses:**
- `401` — Not authenticated

---

## Room Endpoints

### POST /api/rooms

Create a new coding room.

**Auth Required:** Yes

**Request Body:**
```json
{
  "name": "Algorithm Practice",
  "language": "javascript"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "room": {
      "_id": "64a1b2c3d4e5f6a7b8c9d0e2",
      "name": "Algorithm Practice",
      "ownerId": "64a1b2c3d4e5f6a7b8c9d0e1",
      "members": [
        {
          "userId": "64a1b2c3d4e5f6a7b8c9d0e1",
          "role": "owner",
          "joinedAt": "2024-01-15T10:30:00.000Z"
        }
      ],
      "language": "javascript",
      "createdAt": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

---

### GET /api/rooms

List rooms the current user belongs to.

**Auth Required:** Yes

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 20, max: 50)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "rooms": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 5,
      "pages": 1
    }
  }
}
```

---

### GET /api/rooms/:roomId

Get room details.

**Auth Required:** Yes (must be room member)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "room": {
      "_id": "64a1b2c3d4e5f6a7b8c9d0e2",
      "name": "Algorithm Practice",
      "ownerId": {
        "_id": "64a1b2c3d4e5f6a7b8c9d0e1",
        "name": "Alice Developer",
        "email": "alice@example.com"
      },
      "members": [
        {
          "userId": {
            "_id": "64a1b2c3d4e5f6a7b8c9d0e1",
            "name": "Alice Developer",
            "avatarColor": "#58a6ff"
          },
          "role": "owner",
          "joinedAt": "2024-01-15T10:30:00.000Z"
        }
      ],
      "language": "javascript"
    }
  }
}
```

**Error Responses:**
- `401` — Not authenticated
- `403` — Not a room member
- `404` — Room not found

---

### PATCH /api/rooms/:roomId

Update room settings.

**Auth Required:** Yes (owner only)

**Request Body:**
```json
{
  "name": "Updated Room Name"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "room": { ... }
  }
}
```

---

### DELETE /api/rooms/:roomId

Delete a room and all associated data.

**Auth Required:** Yes (owner only)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Room deleted successfully"
  }
}
```

---

### POST /api/rooms/:roomId/invitations

Create an invitation link.

**Auth Required:** Yes (owner only)

**Request Body:**
```json
{
  "expiresInHours": 24
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "invitation": {
      "token": "abc123def456...",
      "expiresAt": "2024-01-16T10:30:00.000Z",
      "link": "http://localhost:5173/join/abc123def456..."
    }
  }
}
```

> **Note:** The plaintext token is returned only once. Store the link.

---

### DELETE /api/rooms/:roomId/invitations/:invitationId

Revoke an invitation.

**Auth Required:** Yes (owner only)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Invitation revoked"
  }
}
```

---

### POST /api/rooms/:roomId/join

Join a room with an invitation token.

**Auth Required:** Yes

**Request Body:**
```json
{
  "token": "abc123def456..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "room": { ... },
    "role": "editor"
  }
}
```

**Error Responses:**
- `400` — Invalid or expired invitation
- `409` — Already a member

---

### POST /api/rooms/:roomId/leave

Leave a room.

**Auth Required:** Yes (must be member, cannot be owner)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Left room successfully"
  }
}
```

---

### PATCH /api/rooms/:roomId/members/:userId

Change a member's role.

**Auth Required:** Yes (owner only)

**Request Body:**
```json
{
  "role": "viewer"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "member": {
      "userId": "...",
      "role": "viewer"
    }
  }
}
```

---

### DELETE /api/rooms/:roomId/members/:userId

Remove a member from the room.

**Auth Required:** Yes (owner only)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Member removed"
  }
}
```

---

## File Endpoints

### POST /api/rooms/:roomId/files

Create a new file in a room.

**Auth Required:** Yes (owner or editor)

**Request Body:**
```json
{
  "filename": "index.js",
  "language": "javascript",
  "content": "// Start coding here\n"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "file": {
      "_id": "64a1b2c3d4e5f6a7b8c9d0e3",
      "roomId": "64a1b2c3d4e5f6a7b8c9d0e2",
      "filename": "index.js",
      "language": "javascript",
      "creatorId": "64a1b2c3d4e5f6a7b8c9d0e1",
      "content": "// Start coding here\n"
    }
  }
}
```

---

### GET /api/rooms/:roomId/files

List all files in a room.

**Auth Required:** Yes (must be room member)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "_id": "64a1b2c3d4e5f6a7b8c9d0e3",
        "filename": "index.js",
        "language": "javascript",
        "updatedAt": "2024-01-15T11:00:00.000Z"
      }
    ]
  }
}
```

---

### GET /api/files/:fileId

Get a specific file with content.

**Auth Required:** Yes (must be member of file's room)

---

### PATCH /api/files/:fileId

Update file metadata (filename, language).

**Auth Required:** Yes (owner or editor)

---

### DELETE /api/files/:fileId

Delete a file.

**Auth Required:** Yes (owner only)

---

### POST /api/files/:fileId/save

Save current file content as a version snapshot.

**Auth Required:** Yes (owner or editor)

**Request Body:**
```json
{
  "content": "const x = 42;\nconsole.log(x);",
  "message": "Added variable declaration"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "data": {
    "version": {
      "_id": "64a1b2c3d4e5f6a7b8c9d0e4",
      "fileId": "64a1b2c3d4e5f6a7b8c9d0e3",
      "versionNumber": 1,
      "savedBy": "64a1b2c3d4e5f6a7b8c9d0e1",
      "message": "Added variable declaration",
      "createdAt": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

---

### GET /api/files/:fileId/versions

Get version history for a file.

**Auth Required:** Yes (must be member of file's room)

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)

---

### POST /api/files/:fileId/restore/:versionId

Restore a file to a previous version.

**Auth Required:** Yes (owner only)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "file": { ... },
    "restoredVersion": { ... }
  }
}
```

---

## Chat

### GET /api/rooms/:roomId/messages

Get message history for a room.

**Auth Required:** Yes (must be room member)

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 50, max: 100)
- `before` (optional, ISO date — get messages before this timestamp)

### Socket.IO Events (Chat)

**Connection:** Connect to `http://localhost:5000` with `withCredentials: true`

**Client → Server:**
- `join-room` — `{ roomId }` — Join a room's chat channel
- `leave-room` — `{ roomId }` — Leave a room's chat channel
- `send-message` — `{ roomId, content }` — Send a message

**Server → Client:**
- `new-message` — `{ _id, roomId, senderId, senderName, content, createdAt }` — New message received
- `user-joined` — `{ userId, name }` — User joined the room
- `user-left` — `{ userId, name }` — User left the room
- `error` — `{ message }` — Error notification

---

## Code Execution Endpoints

### POST /api/execute

Execute code in a sandboxed container.

**Auth Required:** Yes

**Request Body:**
```json
{
  "language": "javascript",
  "code": "console.log('Hello, World!');",
  "roomId": "64a1b2c3d4e5f6a7b8c9d0e2",
  "fileId": "64a1b2c3d4e5f6a7b8c9d0e3"
}
```

**Validation:**
- `language`: Required, one of: `javascript`, `python`
- `code`: Required, max 50KB
- `roomId`, `fileId`: Optional (for tracking)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "execution": {
      "_id": "64a1b2c3d4e5f6a7b8c9d0e5",
      "status": "completed",
      "output": "Hello, World!\n",
      "error": "",
      "executionTime": 245,
      "language": "javascript"
    }
  }
}
```

**Error Responses:**
- `400` — Invalid language or code too large
- `503` — Docker/execution service unavailable

---

### GET /api/execute/:executionId

Get execution result.

**Auth Required:** Yes

---

## AI Endpoints (Optional)

### POST /api/ai/explain

Explain selected code using local Ollama model.

**Auth Required:** Yes

**Request Body:**
```json
{
  "code": "function fibonacci(n) { ... }",
  "language": "javascript"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "explanation": "This function calculates...",
    "model": "codellama",
    "disclaimer": "AI-generated suggestion. May be inaccurate."
  }
}
```

**Error Responses:**
- `503` — Ollama service unavailable

---

### POST /api/ai/suggest-tests

Suggest unit tests for code.

**Auth Required:** Yes

---

### GET /api/ai/status

Check AI service availability.

**Auth Required:** No

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "available": true,
    "model": "codellama",
    "url": "http://localhost:11434"
  }
}
```

---

## Health Endpoints

### GET /api/health

**Auth Required:** No

```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "uptime": 12345,
    "mongodb": "connected",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

### GET /api/version

**Auth Required:** No

```json
{
  "success": true,
  "data": {
    "name": "codesync-server",
    "version": "1.0.0",
    "node": "v20.10.0"
  }
}
```

---

## HTTP Status Codes

| Code | Usage |
|------|-------|
| 200 | Success |
| 201 | Resource created |
| 400 | Validation error / Bad request |
| 401 | Not authenticated |
| 403 | Not authorized (insufficient permissions) |
| 404 | Resource not found |
| 409 | Conflict (e.g., duplicate email) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
| 503 | Service unavailable (Docker, Ollama) |
