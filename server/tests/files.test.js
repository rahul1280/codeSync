const request = require('supertest');
const app = require('../app');

describe('File Endpoints', () => {
  let ownerCookie;
  let outsiderCookie;
  let roomId;

  beforeEach(async () => {
    // Register owner
    const res1 = await request(app).post('/api/auth/register').send({
      name: 'File Owner',
      email: 'fileowner@example.com',
      password: 'Password123'
    });
    ownerCookie = res1.headers['set-cookie'];

    // Register outsider
    const res2 = await request(app).post('/api/auth/register').send({
      name: 'Outsider',
      email: 'outsider@example.com',
      password: 'Password123'
    });
    outsiderCookie = res2.headers['set-cookie'];

    // Create room
    const roomRes = await request(app)
      .post('/api/rooms')
      .set('Cookie', ownerCookie)
      .send({ name: 'Code Lab', language: 'javascript' });
    roomId = roomRes.body.data.room._id;
  });

  test('1. POST /api/files/room/:roomId should create a file and create initial version 1', async () => {
    const res = await request(app)
      .post(`/api/files/room/${roomId}`)
      .set('Cookie', ownerCookie)
      .send({
        filename: 'index.js',
        language: 'javascript',
        content: 'console.log("Hello World");'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.file.filename).toBe('index.js');
    expect(res.body.data.file.content).toBe('console.log("Hello World");');

    // Verify initial version 1 was created
    const fileId = res.body.data.file._id;
    const versionRes = await request(app)
      .get(`/api/files/${fileId}/versions`)
      .set('Cookie', ownerCookie);

    expect(versionRes.status).toBe(200);
    expect(versionRes.body.data.versions).toHaveLength(1);
    expect(versionRes.body.data.versions[0].versionNumber).toBe(1);
  });

  test('2. GET /api/files/room/:roomId should return all files in the room', async () => {
    await request(app)
      .post(`/api/files/room/${roomId}`)
      .set('Cookie', ownerCookie)
      .send({ filename: 'main.js', language: 'javascript' });

    await request(app)
      .post(`/api/files/room/${roomId}`)
      .set('Cookie', ownerCookie)
      .send({ filename: 'utils.js', language: 'javascript' });

    const res = await request(app)
      .get(`/api/files/room/${roomId}`)
      .set('Cookie', ownerCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.files).toHaveLength(2);
  });

  test('3. GET /api/files/:fileId should retrieve a file by its ID', async () => {
    const fileRes = await request(app)
      .post(`/api/files/room/${roomId}`)
      .set('Cookie', ownerCookie)
      .send({ filename: 'test.js', content: 'let x = 10;' });
    const fileId = fileRes.body.data.file._id;

    const res = await request(app)
      .get(`/api/files/${fileId}`)
      .set('Cookie', ownerCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.file.filename).toBe('test.js');
    expect(res.body.data.file.content).toBe('let x = 10;');
  });

  test('4. POST /api/files/:fileId/save should update file content and create new version', async () => {
    const fileRes = await request(app)
      .post(`/api/files/room/${roomId}`)
      .set('Cookie', ownerCookie)
      .send({ filename: 'script.js', content: 'const a = 1;' });
    const fileId = fileRes.body.data.file._id;

    const saveRes = await request(app)
      .post(`/api/files/${fileId}/save`)
      .set('Cookie', ownerCookie)
      .send({
        content: 'const a = 1;\nconst b = 2;',
        message: 'Added variable b'
      });

    expect(saveRes.status).toBe(200);
    expect(saveRes.body.data.file.content).toBe('const a = 1;\nconst b = 2;');
    expect(saveRes.body.data.version.versionNumber).toBe(2);
    expect(saveRes.body.data.version.message).toBe('Added variable b');
  });

  test('5. POST /api/files/:fileId/restore/:versionNumber should restore content from previous version', async () => {
    const fileRes = await request(app)
      .post(`/api/files/room/${roomId}`)
      .set('Cookie', ownerCookie)
      .send({ filename: 'app.js', content: 'initial v1' });
    const fileId = fileRes.body.data.file._id;

    // Update to v2
    await request(app)
      .post(`/api/files/${fileId}/save`)
      .set('Cookie', ownerCookie)
      .send({ content: 'updated v2', message: 'Second change' });

    // Restore to v1
    const restoreRes = await request(app)
      .post(`/api/files/${fileId}/restore/1`)
      .set('Cookie', ownerCookie);

    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.data.file.content).toBe('initial v1');
    expect(restoreRes.body.data.newVersion.versionNumber).toBe(3);
  });

  test('6. POST & GET /api/files should deny access to unauthorized users', async () => {
    // Outsider tries to create a file in the room
    const createRes = await request(app)
      .post(`/api/files/room/${roomId}`)
      .set('Cookie', outsiderCookie)
      .send({ filename: 'hacker.js' });

    expect(createRes.status).toBe(403);
    expect(createRes.body.error.code).toBe('FORBIDDEN_NOT_MEMBER');

    // Create file as owner
    const fileRes = await request(app)
      .post(`/api/files/room/${roomId}`)
      .set('Cookie', ownerCookie)
      .send({ filename: 'private.js' });
    const fileId = fileRes.body.data.file._id;

    // Outsider tries to access the file
    const getRes = await request(app)
      .get(`/api/files/${fileId}`)
      .set('Cookie', outsiderCookie);

    expect(getRes.status).toBe(403);
  });

  test('7. POST /api/files/room/:roomId should fail when filename already exists in room', async () => {
    await request(app)
      .post(`/api/files/room/${roomId}`)
      .set('Cookie', ownerCookie)
      .send({ filename: 'duplicate.js' });

    const duplicateRes = await request(app)
      .post(`/api/files/room/${roomId}`)
      .set('Cookie', ownerCookie)
      .send({ filename: 'duplicate.js' });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.error.code).toBe('FILE_ALREADY_EXISTS');
  });
});
