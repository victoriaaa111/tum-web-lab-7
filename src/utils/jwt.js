const jwt = require('jsonwebtoken');

const VALID_ROLES = ['ADMIN', 'WRITER', 'VISITOR'];
const EXPIRY_SECONDS = 60;

function signToken(sub, role) {
  return jwt.sign(
    { sub, role },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: EXPIRY_SECONDS }
  );
}

function setTokenCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'Strict',
    maxAge: EXPIRY_SECONDS * 1000,
  });
}

module.exports = { signToken, setTokenCookie, VALID_ROLES };
