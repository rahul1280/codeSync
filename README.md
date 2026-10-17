# CodeSync — Real-Time Collaborative Coding Platform

<div align="center">

**CodeSync** is a full-stack web application where multiple authenticated users can join the same coding room, write code simultaneously, see one another's changes in real time, communicate through chat, save their work, and optionally execute code — all in a collaborative workspace inspired by Google Docs meets VS Code.

[Features](#features) · [Architecture](#architecture) · [Getting Started](#getting-started) · [API Docs](docs/API.md) · [Security](docs/SECURITY.md)

</div>

---

## Features

### Core
- **Real-Time Collaborative Editing** — Multiple users edit the same file simultaneously using CRDTs (Yjs). No last-write-wins; concurrent edits merge correctly.
- **Multi-Cursor Awareness** — See other participants' cursor positions and selections in real time.
- **Monaco Editor** — VS Code's editor engine with syntax highlighting, IntelliSense, and keyboard shortcuts.
- **Coding Rooms** — Create private rooms, invite collaborators via secure links, manage member roles.
- **Role-Based Access Control** — Owner, Editor, and Viewer roles with server-enforced permissions.
- **Real-Time Chat** — Chat panel within each room with persistent message history.
- **File Management** — Multiple files per room with tabs, file explorer, and language selection.
- **Version History** — Save snapshots, view history, and restore previous versions.
- **Persistent State** — Documents survive page refreshes, reconnections, and server restarts.

### Optional
- **Sandboxed Code Execution** — Run JavaScript and Python in isolated Docker containers with strict resource limits.
- **AI Code Assistant** — Explain code and suggest tests using a locally-hosted Ollama model (no paid APIs).

### Technical
- **JWT Authentication** — Secure HttpOnly cookie-based sessions.
- **WebSocket Authentication** — Both Socket.IO and collaboration WebSocket connections are authenticated.
- **Server-Side Authorization** — All permissions enforced on the backend, not just the frontend.
- **Security Headers** — Helmet, CORS, rate limiting, input validation.
- **Automated Tests** — Jest + Supertest for backend API testing.

## Architecture

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  React Client    │────▶│  Express Backend  │────▶│     MongoDB      │
│  (Vite, :5173)   │     │  (:5000)          │     │                  │
│                  │     │  • REST API       │     │  • Users         │
│  • Monaco Editor │     │  • Socket.IO Chat │     │  • Rooms         │
│  • Yjs Client    │     │  • Auth           │     │  • Files         │
│  • Socket.IO     │     │  • Execution      │     │  • Versions      │
└────────┬─────────┘     └──────────────────┘     │  • Messages      │
         │                                         │  • Yjs Docs      │
         │ WebSocket                               └──────────────────┘
         ▼                                                  ▲
┌──────────────────┐                                        │
│  Collab Server   │────────────────────────────────────────┘
│  (:4444)         │
│  • Yjs Sync      │     ┌──────────────────┐
│  • Auth          │     │  Docker Sandbox   │
│  • Persistence   │     │  (Code Execution) │
└──────────────────┘     └──────────────────┘
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed system design.

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Monaco Editor, Yjs, Socket.IO Client |
| Backend | Node.js, Express, Mongoose, JWT, Socket.IO |
| Collaboration | Yjs, y-protocols, WebSocket (ws) |
| Database | MongoDB |
| Code Execution | Docker (isolated containers) |
| AI (optional) | Ollama (local LLM) |
| Testing | Jest, Supertest, mongodb-memory-server |

## Project Structure

```
codesync/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── api/            # API client functions
│   │   ├── components/     # React components
│   │   │   ├── common/     # Reusable UI components
│   │   │   ├── editor/     # Monaco editor, tabs, panels
│   │   │   ├── layout/     # Navbar, footer, protected route
│   │   │   ├── rooms/      # Room cards, settings, invitations
│   │   │   └── chat/       # Chat panel and messages
│   │   ├── context/        # Auth, Toast providers
│   │   ├── hooks/          # Custom hooks (socket, collab, etc.)
│   │   ├── pages/          # Page components
│   │   ├── routes/         # App routing
│   │   ├── styles/         # CSS files with custom properties
│   │   └── utils/          # Constants, formatters, validation
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                 # Express backend
│   ├── config/             # DB connection, env validation
│   ├── controllers/        # Route handlers
│   ├── middlewares/        # Auth, authorization, error handling
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Express routers
│   ├── services/           # Business logic
│   ├── socket/             # Socket.IO chat handler
│   ├── validators/         # Request validation rules
│   ├── utils/              # Helpers (AppError, constants, etc.)
│   ├── tests/              # Jest test suites
│   ├── app.js              # Express app setup
│   ├── server.js           # Server entry point
│   └── package.json
│
├── collaboration/          # Yjs WebSocket server
│   ├── persistence/        # MongoDB persistence adapter
│   ├── utils/              # Auth, awareness helpers
│   ├── server.js           # WebSocket server entry point
│   └── package.json
│
├── execution/              # Code execution sandbox
│   ├── Dockerfile          # Sandbox container image
│   └── README.md
│
├── docs/                   # Documentation
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DATABASE.md
│   ├── SECURITY.md
│   └── TESTING.md
│
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- **Node.js** 18+ (tested with v24)
- **npm** 9+
- **MongoDB** — Local instance or [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier works)
- **Docker** (optional) — For sandboxed code execution
- **Ollama** (optional) — For AI code assistant

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/codesync.git
cd codesync
```

### 2. MongoDB Setup

**Option A: MongoDB Atlas (recommended for quick start)**
1. Create a free account at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free M0 cluster
3. Create a database user
4. Get the connection string: `mongodb+srv://username:password@cluster.xxxxx.mongodb.net/codesync`
5. Whitelist your IP address (or use 0.0.0.0/0 for development)

**Option B: Local MongoDB**
1. Install [MongoDB Community Edition](https://www.mongodb.com/docs/manual/installation/)
2. Start the service: `mongod`
3. Connection string: `mongodb://localhost:27017/codesync`

### 3. Install Dependencies

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Install collaboration server dependencies
cd ../collaboration
npm install
```

### 4. Environment Configuration

**Backend (server/.env)**
```bash
cd server
cp .env.example .env
# Edit .env with your values
```

Required variables:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/codesync
JWT_SECRET=your-strong-random-secret-at-least-32-chars
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

**Collaboration Server (collaboration/.env)**
```bash
cd collaboration
cp .env.example .env
# Edit .env with your values
```

Required variables:
```
PORT=4444
MONGODB_URI=mongodb://localhost:27017/codesync
JWT_SECRET=same-secret-as-backend
```

> ⚠️ The `JWT_SECRET` must be identical across the backend and collaboration server.

### 5. Start the Application

Open three terminal windows:

**Terminal 1 — Backend Server**
```bash
cd server
npm run dev
# Server running on http://localhost:5000
```

**Terminal 2 — Collaboration Server**
```bash
cd collaboration
npm run dev
# Collaboration server running on ws://localhost:4444
```

**Terminal 3 — Frontend**
```bash
cd client
npm run dev
# Frontend running on http://localhost:5173
```

### 6. Open in Browser

Navigate to `http://localhost:5173`

### Testing with Two Browsers

To test real-time collaboration:

1. Open `http://localhost:5173` in **Chrome**
2. Open `http://localhost:5173` in **Chrome Incognito** (or Firefox)
3. Register two different accounts
4. In one browser: Create a room → Copy the invitation link
5. In the other browser: Navigate to the invitation link to join
6. Both users open the room → Start typing in the editor
7. Watch changes appear in real time in the other browser!

See [docs/TESTING.md](docs/TESTING.md) for the complete manual test checklist.

## Code Execution Setup (Optional)

```bash
# Build the sandbox Docker image
cd execution
docker build -t codesync-sandbox .

# Verify it works
docker run --rm --network none codesync-sandbox node -e "console.log('Hello!')"
```

Then in `server/.env`:
```
DOCKER_ENABLED=true
```

See [execution/README.md](execution/README.md) for security details.

## Ollama AI Setup (Optional)

1. Install [Ollama](https://ollama.ai)
2. Pull a model: `ollama pull codellama`
3. Start Ollama: `ollama serve`
4. In `server/.env`:
```
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=codellama
```

The application works fully without Ollama — AI features are disabled when unavailable.

## Running Tests

```bash
cd server
npm test
```

Tests use an in-memory MongoDB (mongodb-memory-server) — no external database needed.

## Building for Production

```bash
# Build the frontend
cd client
npm run build
# Output in client/dist/

# Start the backend in production mode
cd server
NODE_ENV=production node server.js
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| MongoDB connection fails | Check connection string in .env, ensure MongoDB is running |
| WebSocket connection fails | Ensure collaboration server is running on port 4444 |
| CORS errors | Check CLIENT_URL in server/.env matches frontend URL |
| Cookie not set | Ensure frontend uses `withCredentials: true` for requests |
| Docker execution fails | Run `docker build -t codesync-sandbox execution/` |
| Editor not loading | Check browser console for Monaco Editor errors |
| Changes not syncing | Check collaboration server logs, ensure same JWT_SECRET |

## Known Limitations

1. **No email verification** — Registration accepts any valid email format
2. **No password reset** — Must be added for production
3. **Single-server collaboration** — Horizontal scaling would need shared state (Redis)
4. **Limited language execution** — Only JavaScript and Python sandboxes configured
5. **No file upload** — Files are created in-app only
6. **No mobile editing** — Responsive layout for viewing, but full editing requires desktop

## Future Improvements

- [ ] Email verification and password reset
- [ ] OAuth (GitHub, Google) login
- [ ] Horizontal scaling with Redis adapter
- [ ] More execution languages (Java, C++, Go)
- [ ] File upload/download
- [ ] Room templates
- [ ] Code commenting/annotations
- [ ] Activity audit log
- [ ] Admin dashboard
- [ ] WebRTC voice/video chat

## Documentation

- [Architecture](docs/ARCHITECTURE.md) — System components and data flows
- [API Reference](docs/API.md) — REST endpoint documentation
- [Database Design](docs/DATABASE.md) — Schemas, indexes, and persistence
- [Security](docs/SECURITY.md) — Auth, authorization, and execution isolation
- [Testing](docs/TESTING.md) — Automated tests and manual test procedures

## License

MIT

---

Built as a B.Tech CSE final-year project demonstrating full-stack development, real-time collaboration, WebSocket communication, CRDT-based concurrent editing, and secure code execution.
