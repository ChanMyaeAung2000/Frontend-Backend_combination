const express = require('express');
const {
  DEMO_USERS,
  findUserByUsername,
  signToken,
  toPublicUser,
  verifyToken,
} = require('../utils/jwt');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/auth/demo-users
 * Frontend UI အတွက် demo account များ စာရင်းပေးသည် (စမ်းသပ်ခြင်းအတွက်သာ)။
 */
router.get('/demo-users', (req, res) => {
  res.json({
    success: true,
    count: DEMO_USERS.length,
    users: DEMO_USERS.map((user) => ({
      username: user.username,
      password: user.password,
      role: user.role,
    })),
  });
});

/**
 * POST /api/auth/login
 * Body: { username, password }
 * အောင်မြင်ပါက JWT token ပေးသည်။
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'username and password are required.',
      code: 'MISSING_CREDENTIALS',
    });
  }

  const user = findUserByUsername(username);

  if (!user || user.password !== password) {
    return res.status(401).json({
      success: false,
      message: 'Invalid username or password.',
      code: 'INVALID_CREDENTIALS',
    });
  }

  const { token, expiresAt, expiresIn } = signToken(user);

  return res.json({
    success: true,
    message: `Welcome back, ${user.name}!`,
    token,
    tokenType: 'Bearer',
    expiresIn,
    expiresAt,
    user: toPublicUser(user),
  });
});

/**
 * GET /api/auth/me
 * Protected route — `Authorization: Bearer <token>` လိုအပ်သည်။
 */
router.get('/me', authenticate, (req, res) => {
  const user = DEMO_USERS.find((u) => u.id === req.user.userId);

  res.json({
    success: true,
    message: 'Authenticated request succeeded.',
    user: user ? toPublicUser(user) : null,
    claims: req.user,
    issuedAt: req.user.iat * 1000,
    expiresAt: req.user.exp * 1000,
  });
});

/**
 * GET /api/auth/verify
 * Token ကို အတည်ပြုကာ claim များ ပြန်ပေးသည်။
 */
router.get('/verify', authenticate, (req, res) => {
  const now = Date.now();

  res.json({
    success: true,
    valid: true,
    message: 'Token is valid.',
    claims: req.user,
    issuedAt: req.user.iat * 1000,
    expiresAt: req.user.exp * 1000,
    expiresInSeconds: Math.max(0, Math.floor((req.user.exp * 1000 - now) / 1000)),
  });
});

/**
 * POST /api/auth/refresh
 * လက်ရှိသော token ဖြင့် အသစ်သော token တစ်ခု ရယူသည်။
 */
router.post('/refresh', authenticate, (req, res) => {
  const user = DEMO_USERS.find((u) => u.id === req.user.userId);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User no longer exists.',
      code: 'USER_NOT_FOUND',
    });
  }

  const { token, expiresAt, expiresIn } = signToken(user);

  return res.json({
    success: true,
    message: 'New token issued.',
    token,
    tokenType: 'Bearer',
    expiresIn,
    expiresAt,
    user: toPublicUser(user),
  });
});

/**
 * POST /api/auth/logout
 * Token ကို အမှန်တကယ် ပစ်ပယ်မည် (stateless ဖြစ်လာသဖြင့် client က token ကို ဖျက်ရမည်)။
 */
router.post('/logout', authenticate, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out. Clear the token on the client side.',
  });
});

/**
 * GET /api/auth/admin
 * Admin role သာ ဝင်ခွင့်ရှိသူများ အတွက်သာ။
 */
router.get('/admin', authenticate, requireRole('admin'), (req, res) => {
  res.json({
    success: true,
    message: 'Welcome, admin. Secret area unlocked.',
    secret: 'Only admins can read this value.',
    requestedBy: req.user.username,
  });
});

/**
 * POST /api/auth/decode
 * Protected route မဟုတ်ဘဲ token ကို decode လုပ်ပေးသည် (signature ကို မစစ်ဆေးပါ)။
 */
router.post('/decode', (req, res) => {
  const { token } = req.body ?? {};

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'token is required.',
      code: 'MISSING_TOKEN',
    });
  }

  try {
    const claims = verifyToken(token);

    return res.json({
      success: true,
      valid: true,
      message: 'Token decoded and verified.',
      claims,
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      valid: false,
      message:
        error.name === 'TokenExpiredError'
          ? 'Token has expired.'
          : 'Invalid token.',
      code: error.name === 'TokenExpiredError' ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
    });
  }
});

module.exports = router;
