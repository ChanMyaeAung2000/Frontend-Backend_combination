const jwt = require('jsonwebtoken');
const { JWT_SECRET, JWT_ISSUER } = require('../utils/jwt');

/**
 * `Authorization: Bearer <token>` header ကို စစ်ဆေးပြီး အတည်ပြုပြီသော request များကို
 * `req.user` နှင့် `req.token` ဖြင့် ရောက်ရှိစေသည်။
 */
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (!token || scheme?.toLowerCase() !== 'bearer') {
    return res.status(401).json({
      success: false,
      message: 'Authorization header missing. Expected format: Bearer <token>',
      code: 'NO_TOKEN',
    });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET, { issuer: JWT_ISSUER });

    req.user = payload;
    req.token = token;

    return next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired. Please login again.',
        code: 'TOKEN_EXPIRED',
        expiredAt: error.expiredAt,
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid token. Signature could not be verified.',
      code: 'INVALID_TOKEN',
    });
  }
}

/**
 * ခေါ်ဆိုရန်ခဲ့သော role များ ဖြင့် ဝင်ခွင့်ရှိသူများကိုသာ ခွင့်ပြုသည်။
 * (ဥထား: requireRole('admin'))
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}.`,
        code: 'FORBIDDEN',
        yourRole: req.user?.role ?? null,
      });
    }

    return next();
  };
}

module.exports = { authenticate, requireRole };
