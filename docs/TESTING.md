# CodeSync — Testing Documentation

## Test Structure

```
server/tests/
├── setup.js            # Jest setup with mongodb-memory-server
├── auth.test.js        # Authentication tests
├── rooms.test.js       # Room CRUD and permissions tests
├── files.test.js       # File management tests
└── helpers.js          # Test utilities (create user, create room, etc.)
```

## Running Automated Tests

### Prerequisites
- Node.js 18+
- No external MongoDB needed (tests use mongodb-memory-server)

### Commands

```bash
# Run all backend tests
cd server
npm test

# Run with verbose output
npx jest --verbose --detectOpenHandles --forceExit

# Run specific test file
npx jest tests/auth.test.js --detectOpenHandles --forceExit

# Run with coverage
npx jest --coverage --detectOpenHandles --forceExit
```

## Automated Test Coverage

### Authentication Tests (auth.test.js)
| Test | Description |
|------|-------------|
| Register success | New user registers with valid data |
| Register duplicate email | Rejects registration with existing email |
| Register invalid email | Rejects malformed email |
| Register weak password | Rejects password without required complexity |
| Login success | Valid credentials return user and set cookie |
| Login wrong password | Returns 401 with incorrect password |
| Login nonexistent email | Returns 401 for unknown email |
| Get current user | Protected `/me` endpoint returns user with valid cookie |
| Unauthorized access | Protected routes return 401 without cookie |
| Logout | Clears authentication cookie |

### Room Tests (rooms.test.js)
| Test | Description |
|------|-------------|
| Create room | Authenticated user creates room with name |
| List rooms | User sees only rooms they belong to |
| Get room details | Room member can get room info |
| Reject unauthorized room access | Non-member cannot access room |
| Create invitation | Room owner can generate invitation |
| Join with valid invitation | User joins room with valid invitation token |
| Reject invalid invitation | Invalid token returns error |
| Reject expired invitation | Expired invitation returns error |
| Update member role | Owner can change member role |
| Remove member | Owner can remove member from room |
| Delete room | Owner can delete room |
| Non-owner cannot delete | Editor/viewer cannot delete room |

### File Tests (files.test.js)
| Test | Description |
|------|-------------|
| Create file | Editor creates file in room |
| List room files | Member lists files in room |
| Get file content | Member retrieves file content |
| Update file | Editor updates filename/language |
| Save version | Creating a version snapshot |
| List versions | Retrieve version history for file |
| Restore version | Restore file to previous version |
| Viewer cannot create | Viewer role rejected for file creation |
| Non-member cannot access | Non-member cannot access room files |

## Manual Integration Test: Real-Time Collaboration

This test verifies that two independent browser sessions can collaborate in real time.

### Prerequisites
- MongoDB running (local or Atlas)
- Backend server running on port 5000
- Collaboration server running on port 4444
- Frontend dev server running on port 5173

### Test Procedure

#### Setup
1. Open **Browser A** (e.g., Chrome) → Navigate to `http://localhost:5173`
2. Open **Browser B** (e.g., Chrome Incognito or Firefox) → Navigate to `http://localhost:5173`

#### Test 1: User Registration and Login
1. In Browser A: Register as `alice@test.com` / `Password123`
2. In Browser B: Register as `bob@test.com` / `Password123`
3. ✅ Both users should be redirected to the dashboard

#### Test 2: Room Creation and Invitation
1. In Browser A: Click "Create Room" → Enter "Test Room" → Create
2. In Browser A: Open room → Click "Invite" → Copy invitation link
3. In Browser B: Navigate to the invitation link (or paste the invite code)
4. ✅ Bob should join the room successfully

#### Test 3: Real-Time Code Editing
1. In Browser A: Open the room → You should see the code editor
2. In Browser B: Open the same room → You should see the code editor
3. In Browser A: Type `console.log("Hello from Alice!");`
4. ✅ Browser B should show Alice's text appearing in near real-time
5. In Browser B: Type `// Bob was here` on a new line
6. ✅ Browser A should show Bob's text appearing in near real-time

#### Test 4: Concurrent Editing
1. Both users place their cursors on different lines
2. Both users type simultaneously for 5 seconds
3. ✅ Both editors should show the same final content
4. ✅ No text should be lost or duplicated
5. ✅ Content should be identical in both browsers

#### Test 5: Cursor Awareness
1. In Browser A: Click to place cursor at line 3
2. ✅ Browser B should see a colored cursor indicator at Alice's position
3. ✅ Both browsers should show participant avatars/indicators

#### Test 6: Connection Resilience
1. In Browser B: Disconnect from network (or close the collaboration WebSocket)
2. In Browser A: Type some new content
3. In Browser B: Reconnect to network
4. ✅ Browser B should sync to show Alice's new content

#### Test 7: Chat
1. In Browser A: Open chat panel → Send "Hello Bob!"
2. ✅ Browser B should receive the message in real time
3. In Browser B: Send "Hi Alice!"
4. ✅ Browser A should receive the response

#### Test 8: Save and Restore
1. In Browser A: Click "Save" to save current file content
2. Both users: Make additional edits
3. In Browser A: Open Version History → See the saved version
4. In Browser A: Click "Restore" on the saved version
5. ✅ Both browsers should see the restored content

#### Test 9: Role Permissions
1. In Browser A: Change Bob's role to "Viewer"
2. ✅ Browser B should no longer be able to edit (read-only mode)
3. In Browser A: Change Bob's role back to "Editor"
4. ✅ Browser B should be able to edit again

#### Test 10: Persistence
1. Note the current editor content
2. Stop the collaboration server (Ctrl+C)
3. Restart the collaboration server
4. In Browser A: Refresh the page → Open the room
5. ✅ The editor should show the previously persisted content

### Expected Results
All 10 tests should pass. Document any failures with:
- Browser and version
- Console error messages (F12 → Console)
- Network errors (F12 → Network)
- Server logs

## Performance Testing (Manual)

### Load Test
1. Open the same room in 5+ browser tabs
2. Type in one tab
3. ✅ All tabs should update within 500ms
4. ✅ No significant lag or freezing

### Large Document Test
1. Paste 1000+ lines of code into the editor
2. ✅ Editor should remain responsive
3. ✅ Collaboration should continue working

## CI/CD Integration

The automated tests can be integrated into a CI pipeline:

```yaml
# Example GitHub Actions
steps:
  - uses: actions/checkout@v3
  - uses: actions/setup-node@v3
    with:
      node-version: 18
  - run: cd server && npm install
  - run: cd server && npm test
```

No external services needed — mongodb-memory-server provides an in-memory MongoDB for tests.
