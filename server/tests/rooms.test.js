const request = require('supertest');
const app = require('../app');
const Room = require('../models/Room');

describe('Room Endpoints', () => {
  let user1Cookie;
  let user2Cookie;
  let user3Cookie;
  let user1Id;
  let user2Id;

  beforeEach(async () => {
    // Register User 1 (Owner)
    const res1 = await request(app).post('/api/auth/register').send({
      name: 'Owner User',
      email: 'owner@example.com',
      password: 'Password123'
    });
    user1Cookie = res1.headers['set-cookie'];
    user1Id = res1.body.data.user.id;

    // Register User 2 (Member)
    const res2 = await request(app).post('/api/auth/register').send({
      name: 'Member User',
      email: 'member@example.com',
      password: 'Password123'
    });
    user2Cookie = res2.headers['set-cookie'];
    user2Id = res2.body.data.user.id;

    // Register User 3 (Outsider)
    const res3 = await request(app).post('/api/auth/register').send({
      name: 'Outsider User',
      email: 'outsider@example.com',
      password: 'Password123'
    });
    user3Cookie = res3.headers['set-cookie'];
  });

  test('1. POST /api/rooms should create a room successfully', async () => {
    const res = await request(app)
      .post('/api/rooms')
      .set('Cookie', user1Cookie)
      .send({ name: 'Project Alpha', language: 'javascript' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.room.name).toBe('Project Alpha');
    expect(res.body.data.room.ownerId).toBe(user1Id);
    expect(res.body.data.room.members).toHaveLength(1);
    expect(res.body.data.room.members[0].role).toBe('owner');
  });

  test('2. GET /api/rooms should list rooms where user is member or owner', async () => {
    await request(app)
      .post('/api/rooms')
      .set('Cookie', user1Cookie)
      .send({ name: 'Project Alpha' });

    const res = await request(app)
      .get('/api/rooms')
      .set('Cookie', user1Cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.rooms).toHaveLength(1);
    expect(res.body.data.rooms[0].name).toBe('Project Alpha');
  });

  test('3. GET /api/rooms/:roomId should return room details if user is a member', async () => {
    const createRes = await request(app)
      .post('/api/rooms')
      .set('Cookie', user1Cookie)
      .send({ name: 'Project Alpha' });
    const roomId = createRes.body.data.room._id;

    const res = await request(app)
      .get(`/api/rooms/${roomId}`)
      .set('Cookie', user1Cookie);

    expect(res.status).toBe(200);
    expect(res.body.data.room._id).toBe(roomId);
  });

  test('4. GET /api/rooms/:roomId should deny access if user is not a member', async () => {
    const createRes = await request(app)
      .post('/api/rooms')
      .set('Cookie', user1Cookie)
      .send({ name: 'Secret Room' });
    const roomId = createRes.body.data.room._id;

    const res = await request(app)
      .get(`/api/rooms/${roomId}`)
      .set('Cookie', user3Cookie);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN_NOT_MEMBER');
  });

  test('5. POST /api/rooms/:roomId/invitations should create invitation token (hashed in DB)', async () => {
    const createRes = await request(app)
      .post('/api/rooms')
      .set('Cookie', user1Cookie)
      .send({ name: 'Team Room' });
    const roomId = createRes.body.data.room._id;

    const invRes = await request(app)
      .post(`/api/rooms/${roomId}/invitations`)
      .set('Cookie', user1Cookie)
      .send({ role: 'editor', expiresInHours: 48 });

    expect(invRes.status).toBe(201);
    expect(invRes.body.success).toBe(true);
    expect(invRes.body.data.invitation.rawToken).toBeDefined();

    // Verify token stored in DB is hashed and does not match raw token
    const dbRoom = await Room.findById(roomId);
    expect(dbRoom.invitations[0].token).not.toBe(invRes.body.data.invitation.rawToken);
  });

  test('6. POST /api/rooms/join should allow joining room with valid invitation token', async () => {
    const createRes = await request(app)
      .post('/api/rooms')
      .set('Cookie', user1Cookie)
      .send({ name: 'Team Room' });
    const roomId = createRes.body.data.room._id;

    const invRes = await request(app)
      .post(`/api/rooms/${roomId}/invitations`)
      .set('Cookie', user1Cookie)
      .send({ role: 'editor' });

    const rawToken = invRes.body.data.invitation.rawToken;

    const joinRes = await request(app)
      .post('/api/rooms/join')
      .set('Cookie', user2Cookie)
      .send({ token: rawToken });

    expect(joinRes.status).toBe(200);
    expect(joinRes.body.success).toBe(true);

    // Verify user2 is now member
    const roomCheck = await request(app)
      .get(`/api/rooms/${roomId}`)
      .set('Cookie', user2Cookie);

    expect(roomCheck.status).toBe(200);
  });

  test('7. POST /api/rooms/join should fail with invalid invitation token', async () => {
    const res = await request(app)
      .post('/api/rooms/join')
      .set('Cookie', user2Cookie)
      .send({ token: 'invalid_random_token_12345' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_INVITATION');
  });

  test('8. PATCH /api/rooms/:roomId should allow owner to update room details', async () => {
    const createRes = await request(app)
      .post('/api/rooms')
      .set('Cookie', user1Cookie)
      .send({ name: 'Old Room Name' });
    const roomId = createRes.body.data.room._id;

    const updateRes = await request(app)
      .patch(`/api/rooms/${roomId}`)
      .set('Cookie', user1Cookie)
      .send({ name: 'New Room Name', language: 'python' });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.room.name).toBe('New Room Name');
    expect(updateRes.body.data.room.language).toBe('python');
  });

  test('9. PATCH /api/rooms/:roomId should forbid non-owner from updating room', async () => {
    const createRes = await request(app)
      .post('/api/rooms')
      .set('Cookie', user1Cookie)
      .send({ name: 'Owner Room' });
    const roomId = createRes.body.data.room._id;

    // Join user2
    const invRes = await request(app)
      .post(`/api/rooms/${roomId}/invitations`)
      .set('Cookie', user1Cookie)
      .send({ role: 'editor' });
    await request(app)
      .post('/api/rooms/join')
      .set('Cookie', user2Cookie)
      .send({ token: invRes.body.data.invitation.rawToken });

    // user2 tries to patch
    const res = await request(app)
      .patch(`/api/rooms/${roomId}`)
      .set('Cookie', user2Cookie)
      .send({ name: 'Hacked Name' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN_INSUFFICIENT_PERMISSIONS');
  });

  test('10. POST /api/rooms/:roomId/leave should allow member to leave room', async () => {
    const createRes = await request(app)
      .post('/api/rooms')
      .set('Cookie', user1Cookie)
      .send({ name: 'Leave Room Test' });
    const roomId = createRes.body.data.room._id;

    const invRes = await request(app)
      .post(`/api/rooms/${roomId}/invitations`)
      .set('Cookie', user1Cookie)
      .send({ role: 'editor' });
    await request(app)
      .post('/api/rooms/join')
      .set('Cookie', user2Cookie)
      .send({ token: invRes.body.data.invitation.rawToken });

    const leaveRes = await request(app)
      .post(`/api/rooms/${roomId}/leave`)
      .set('Cookie', user2Cookie);

    expect(leaveRes.status).toBe(200);
    expect(leaveRes.body.success).toBe(true);

    // Verify user2 can no longer access room
    const checkRes = await request(app)
      .get(`/api/rooms/${roomId}`)
      .set('Cookie', user2Cookie);

    expect(checkRes.status).toBe(403);
  });
});
