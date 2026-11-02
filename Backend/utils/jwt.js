const jwt = require('jsonwebtoken');
const crypto = require('node:crypto');

/**
 * JWT configuration.
 * Production မှာ အမှန်တကယ်သော secret ကို environment variable အနေဖြင့် ထည့်ရပါမည်။
 */
const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
const JWT_ISSUER = 'front-backend-test';

/**
 * Demo users (in-memory) — စမ်းသပ်ခြင်းအတွက် အသုံးပြုသည်။
 * အမှန်တကယ် app တွင် database မှာသာ သိမ်းဆည်းသင့်သည်။
 */
const DEMO_USERS = [
  {
    id: 1,
    username: 'admin',
    password: 'admin123',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
  },
  {
    id: 2,
    username: 'john',
    password: 'john123',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'user',
  },
  {
    id: 3,
    username: 'guest',
    password: 'guest123',
    name: 'Guest User',
    email: 'guest@example.com',
    role: 'guest',
  },
];

/** Password မကြောင်းဖြေရန် user အချက်အလက် ပြန်ပေးသည်။ */
function toPublicUser(user) {
  const { password, ...rest } = user;
  return rest;
}

/** Username ဖြင့် demo user ရှာဖွေသည်။ */
function findUserByUsername(username) {
  return DEMO_USERS.find(
    (user) => user.username.toLowerCase() === String(username).trim().toLowerCase()
  );
}

/** User အချက်အလက်ထုတ်ပေးပြီး JWT တစ်ခု ပေးဖို့ သို့ ပြောင်းလဲပါ။ */
function signToken(user) {
  const payload = {
    sub: String(user.id),
    userId: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    jti: crypto.randomUUID(), // ချက်ချင်းစီ token တစ်ခုချင်း မတူကြောင်း သေချာအောင်
  };

  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: JWT_ISSUER,
  });

  const decoded = jwt.decode(token);

  return {
    token,
    expiresAt: decoded.exp * 1000,
    expiresIn: JWT_EXPIRES_IN,
  };
}

/** Token ကို verify လုပ်ပြီး claim များ ပြန်ပေးသည်။ */
function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET, { issuer: JWT_ISSUER });
}

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
  JWT_ISSUER,
  DEMO_USERS,
  toPublicUser,
  findUserByUsername,
  signToken,
  verifyToken,
};
