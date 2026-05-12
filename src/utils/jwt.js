const jwt = require('jsonwebtoken');

const VALID_ROLES = ['ADMIN', 'WRITER', 'VISITOR'];
const EXPIRY_SECONDS = 60 * 60 * 24 * 7; // 24 hours

function signToken(sub, role) {
  return jwt.sign(
    { sub, role },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: EXPIRY_SECONDS }
  );
}

function setTokenCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: isProd ? 'None' : 'Strict',
    secure: isProd,
    maxAge: EXPIRY_SECONDS * 1000,
  });
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function clearTokenCookie(res) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', '', { httpOnly: true, sameSite: isProd ? 'None' : 'Strict', secure: isProd, maxAge: 0 });
}

module.exports = { signToken, setTokenCookie, clearTokenCookie, verifyToken, VALID_ROLES };
