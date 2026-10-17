const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

describe('Auth Endpoints', () => {
  const validUserData = {
    name: 'Alice Cooper',
    email: 'alice@example.com',
    password: 'Password123'
  };

  test('1. POST /api/auth/register should successfully register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(validUserData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe('alice@example.com');
    expect(res.body.data.user.passwordHash).toBeUndefined();
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toMatch(/token=/);
  });

  test('2. POST /api/auth/register should fail when email already exists', async () => {
    await request(app).post('/api/auth/register').send(validUserData);

    const res = await request(app)
      .post('/api/auth/register')
      .send(validUserData);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
  });

  test('3. POST /api/auth/register should fail when password lacks uppercase or number', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bob',
        email: 'bob@example.com',
        password: 'password'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('4. POST /api/auth/register should fail when name is too short', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'A',
        email: 'alice2@example.com',
        password: 'Password123'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('5. POST /api/auth/register should fail when email is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Alice',
        email: 'invalid-email',
        password: 'Password123'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('6. POST /api/auth/login should log in successfully with correct credentials', async () => {
    await request(app).post('/api/auth/register').send(validUserData);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: validUserData.email,
        password: validUserData.password
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(validUserData.email);
    expect(res.headers['set-cookie']).toBeDefined();
  });

  test('7. POST /api/auth/login should fail with incorrect password', async () => {
    await request(app).post('/api/auth/register').send(validUserData);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: validUserData.email,
        password: 'WrongPassword123'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  test('8. POST /api/auth/login should fail with non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nonexistent@example.com',
        password: 'Password123'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  test('9. GET /api/auth/me should return current user info when authenticated via cookie', async () => {
    const regRes = await request(app).post('/api/auth/register').send(validUserData);
    const cookie = regRes.headers['set-cookie'];

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(validUserData.email);
  });

  test('10. GET /api/auth/me should reject request without token', async () => {
    const res = await request(app).get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  test('11. POST /api/auth/logout should clear the auth cookie', async () => {
    const regRes = await request(app).post('/api/auth/register').send(validUserData);
    const cookie = regRes.headers['set-cookie'];

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.headers['set-cookie'][0]).toMatch(/token=;/);
  });
});
