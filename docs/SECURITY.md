# CodeSync — Security Documentation

## Authentication

### JWT + HttpOnly Cookie Strategy

CodeSync uses JWTs stored in HttpOnly cookies for authentication across all services.

**Why HttpOnly cookies?**
- Not accessible to JavaScript → prevents XSS token theft
- Automatically sent with every request → seamless auth for REST, Socket.IO, and WebSocket
- `SameSite=Lax` attribute → CSRF protection for state-changing requests
- `Secure` flag → HTTPS-only in production

**Cookie Configuration:**
```javascript
{
  httpOnly: true,           // Not accessible via document.cookie
  secure: process.env.NODE_ENV === 'production',  // HTTPS only in prod
  sameSite: 'lax',          // Sent with same-site requests + top-level navigation
  maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 days
  path: '/'                 // Available to all paths
}
```

**Token Payload:**
```javascript
{
  id: 'user_mongodb_id',
  email: 'user@example.com',
  name: 'User Name'
}
```

**Token Expiry:** 7 days (configurable via `JWT_EXPIRES_IN`)

### Password Security
- Passwords hashed with bcryptjs (salt rounds: 12)
- Minimum requirements: 8 chars, 1 uppercase, 1 lowercase, 1 digit
- Plaintext passwords never stored or logged
- `passwordHash` field excluded from all Mongoose query results by default

## Authorization

### Room-Level Permissions

| Action | Owner | Editor | Viewer |
|--------|-------|--------|--------|
| View room & files | ✅ | ✅ | ✅ |
| Edit code | ✅ | ✅ | ❌ |
| Create files | ✅ | ✅ | ❌ |
| Delete files | ✅ | ❌ | ❌ |
| Save versions | ✅ | ✅ | ❌ |
| Restore versions | ✅ | ❌ | ❌ |
| Send chat messages | ✅ | ✅ | ✅ |
| Manage members | ✅ | ❌ | ❌ |
| Create invitations | ✅ | ❌ | ❌ |
| Rename room | ✅ | ❌ | ❌ |
| Delete room | ✅ | ❌ | ❌ |

### Server-Side Enforcement

**All permission checks happen on the server.** The frontend hides UI elements based on role, but the backend independently verifies every request:

1. **REST API**: `authorize()` middleware checks room membership and role before controllers execute
2. **Socket.IO (Chat)**: Connection handler verifies JWT and room membership
3. **Collaboration Server**: WebSocket upgrade handler verifies JWT and room membership; read-only enforcement for viewers at the protocol level

### Invitation Security

- Invitation tokens generated with `crypto.randomBytes(32)` (256-bit)
- Tokens are SHA-256 hashed before storage in MongoDB
- Only the hash is stored; plaintext returned once at creation time
- Tokens can have expiration dates
- Tokens can be revoked by the room owner
- Expired/revoked tokens are rejected during join

## WebSocket Security

### Collaboration Server Authentication

The collaboration server authenticates during the HTTP → WebSocket upgrade:

1. Parse `Cookie` header from the upgrade request
2. Extract the `token` cookie
3. Verify JWT signature using the shared `JWT_SECRET`
4. Query MongoDB to confirm user is a member of the requested room
5. Determine user's role (owner/editor/viewer)
6. **Reject** the upgrade with 401/403 if any check fails
7. Only then complete the WebSocket handshake

**Read-only enforcement:** Viewers can receive document state (sync step 1/2) but their update messages are silently dropped at the protocol level.

### Socket.IO (Chat) Authentication

1. Socket.IO middleware extracts JWT from cookie
2. JWT verified on connection
3. Room join requests verify membership in MongoDB
4. Unauthenticated connections are rejected

### Connection Limits

- Max connections per room: 50
- Max WebSocket message size: 1MB
- Ping/pong interval: 30 seconds (detect dead connections)
- Rate limiting on chat messages: 30/minute per user

## Input Validation

All user input is validated server-side using express-validator:

- **Email**: Valid format, lowercase normalization
- **Passwords**: Length and complexity requirements
- **Room names**: Length limits (1-100 chars)
- **File names**: Length limits (1-100 chars), restricted characters
- **Chat messages**: Length limits (1-2000 chars), non-empty
- **Code execution**: Language whitelist, code size limit (50KB)
- **ObjectId parameters**: Valid MongoDB ObjectId format

## Code Execution Security

Code execution runs in Docker containers with multiple isolation layers:

| Layer | Protection |
|-------|-----------|
| Container isolation | Separate process namespace |
| Non-root user | Cannot escalate privileges |
| Network disabled | No external communication |
| Read-only filesystem | Cannot modify system files |
| Memory limit (128MB) | Prevents memory exhaustion |
| CPU limit (0.5 cores) | Prevents CPU exhaustion |
| Process limit (64) | Prevents fork bombs |
| Timeout (10s) | Prevents infinite loops |
| Output limit (1MB) | Prevents log flooding |
| No host mounts | No access to host filesystem |
| No Docker socket | Cannot control Docker daemon |
| tmpfs for /tmp | Limited writable space (64MB) |

**Code is never executed inside the Express process.**

## HTTP Security Headers

Applied via Helmet middleware:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 0` (modern browsers use CSP instead)
- `Strict-Transport-Security` (in production)
- Content Security Policy (configured for the application)

## Rate Limiting

| Endpoint Group | Limit | Window |
|---------------|-------|--------|
| Auth (login/register) | 10 requests | 15 minutes |
| General API | 100 requests | 15 minutes |
| Code execution | 10 requests | 1 minute |
| Chat messages | 30 messages | 1 minute |

## CORS Configuration

```javascript
{
  origin: process.env.CLIENT_URL,  // Explicit allowed origin
  credentials: true,                // Allow cookies
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type']
}
```

## Environment Variables Security

- All secrets stored in `.env` files (never committed)
- `.env.example` provides templates with placeholder values
- `JWT_SECRET` is validated at startup (minimum length enforced)
- Database credentials are in the connection string
- No secrets exposed in frontend environment variables
- No secrets logged to console

## Known Security Limitations

1. **No CSRF tokens**: Mitigated by `SameSite=Lax` cookies and CORS restrictions. For maximum security in production, add CSRF token middleware.
2. **No account lockout**: Rate limiting on auth endpoints provides basic protection, but a dedicated account lockout mechanism is not implemented.
3. **No email verification**: Registered email addresses are not verified. In production, add email confirmation flow.
4. **Single JWT secret**: All services share one JWT secret. In a multi-tenant production setup, consider per-service secrets or asymmetric keys.
5. **Docker availability**: Code execution security depends on Docker being properly configured. Without Docker, code execution is disabled (not insecure).

## Deployment Recommendations

1. **Always use HTTPS** in production (set `Secure` cookie flag)
2. **Use a strong JWT secret** (32+ random characters)
3. **Restrict MongoDB access** to application servers only
4. **Keep Docker updated** and limit container capabilities
5. **Monitor rate limit violations** for attack detection
6. **Rotate JWT secrets** periodically (requires re-authentication)
7. **Set up log monitoring** for authentication failures
8. **Use a reverse proxy** (nginx) with additional security headers
