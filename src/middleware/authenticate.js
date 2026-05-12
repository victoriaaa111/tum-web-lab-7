const { verifyToken } = require('../utils/jwt');

function authenticateJWT(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'not authenticated' });

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'not authenticated' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'forbidden' });
    }
    next();
  };
}

function requireWriter(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'not authenticated' });
  if (req.user.role === 'VISITOR') {
    return res.status(403).json({ error: 'read-only access' });
  }
  next();
}

module.exports = { authenticateJWT, requireRole, requireWriter };
