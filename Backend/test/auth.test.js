const test = require('node:test');
const assert = require('node:assert/strict');
const app = require('../server');

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

test.after(() => {
  server.close();
});

async function api(path, { method = 'GET', body, token } = {}) {
  const headers = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json();

  return { status: res.status, data };
}

test('POST /api/auth/login returns a token for valid credentials', async () => {
  const { status, data } = await api('/api/auth/login', {
    method: 'POST',
    body: { username: 'john', password: 'john123' },
  });

  assert.equal(status, 200);
  assert.equal(data.success, true);
  assert.equal(typeof data.token, 'string');
  assert.equal(data.tokenType, 'Bearer');
  assert.equal(data.user.username, 'john');
  assert.equal(data.user.password, undefined);
});

test('POST /api/auth/login rejects wrong password', async () => {
  const { status, data } = await api('/api/auth/login', {
    method: 'POST',
    body: { username: 'john', password: 'wrong' },
  });

  assert.equal(status, 401);
  assert.equal(data.success, false);
  assert.equal(data.code, 'INVALID_CREDENTIALS');
});

test('POST /api/auth/login rejects missing credentials', async () => {
  const { status, data } = await api('/api/auth/login', {
    method: 'POST',
    body: {},
  });

  assert.equal(status, 400);
  assert.equal(data.code, 'MISSING_CREDENTIALS');
});

test('GET /api/auth/me requires a token', async () => {
  const { status, data } = await api('/api/auth/me');

  assert.equal(status, 401);
  assert.equal(data.code, 'NO_TOKEN');
});

test('GET /api/auth/me returns the profile for a valid token', async () => {
  const login = await api('/api/auth/login', {
    method: 'POST',
    body: { username: 'john', password: 'john123' },
  });

  const { status, data } = await api('/api/auth/me', { token: login.data.token });

  assert.equal(status, 200);
  assert.equal(data.user.username, 'john');
  assert.equal(data.claims.role, 'user');
});

test('GET /api/auth/me rejects a tampered token', async () => {
  const login = await api('/api/auth/login', {
    method: 'POST',
    body: { username: 'john', password: 'john123' },
  });

  const tampered = login.data.token.slice(0, -4) + 'abcd';

  const { status, data } = await api('/api/auth/me', { token: tampered });

  assert.equal(status, 401);
  assert.equal(data.code, 'INVALID_TOKEN');
});

test('GET /api/auth/verify reports a valid token', async () => {
  const login = await api('/api/auth/login', {
    method: 'POST',
    body: { username: 'john', password: 'john123' },
  });

  const { status, data } = await api('/api/auth/verify', { token: login.data.token });

  assert.equal(status, 200);
  assert.equal(data.valid, true);
  assert.ok(data.expiresInSeconds > 0);
});

test('POST /api/auth/refresh issues a new token', async () => {
  const login = await api('/api/auth/login', {
    method: 'POST',
    body: { username: 'john', password: 'john123' },
  });

  const { status, data } = await api('/api/auth/refresh', {
    method: 'POST',
    token: login.data.token,
  });

  assert.equal(status, 200);
  assert.equal(typeof data.token, 'string');
  assert.notEqual(data.token, login.data.token);
});

test('GET /api/auth/admin is blocked for non-admin roles', async () => {
  const login = await api('/api/auth/login', {
    method: 'POST',
    body: { username: 'john', password: 'john123' },
  });

  const { status, data } = await api('/api/auth/admin', { token: login.data.token });

  assert.equal(status, 403);
  assert.equal(data.code, 'FORBIDDEN');
});

test('GET /api/auth/admin is allowed for the admin role', async () => {
  const login = await api('/api/auth/login', {
    method: 'POST',
    body: { username: 'admin', password: 'admin123' },
  });

  const { status, data } = await api('/api/auth/admin', { token: login.data.token });

  assert.equal(status, 200);
  assert.equal(data.requestedBy, 'admin');
});

test('GET /api/auth/demo-users lists the demo accounts', async () => {
  const { status, data } = await api('/api/auth/demo-users');

  assert.equal(status, 200);
  assert.ok(data.users.length >= 3);
});

test('unknown routes return 404 JSON', async () => {
  const { status, data } = await api('/api/auth/nope');

  assert.equal(status, 404);
  assert.equal(data.code, 'NOT_FOUND');
});
