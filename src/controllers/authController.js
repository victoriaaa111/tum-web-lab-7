const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { signToken, setTokenCookie, clearTokenCookie, VALID_ROLES } = require('../utils/jwt');

async function signup(req, res, next) {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'username, email and password are required' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const { rows } = await pool.query(
      `INSERT INTO users (username, email, password_hash)
      VALUES ($1, $2, $3)
      RETURNING id, username, role`,
      [username, email, passwordHash]
    );

    const jwt = signToken(rows[0].id, rows[0].role);
    setTokenCookie(res, jwt);
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'username or email already taken' });
    }
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const { rows } = await pool.query(
      'SELECT id, username, role, password_hash FROM users WHERE email = $1',
      [email]
    );

    const user = rows[0];
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ error: 'invalid credentials' });
    }

    const jwt = signToken(user.id, user.role);
    setTokenCookie(res, jwt);
    res.json({ id: user.id, username: user.username, role: user.role });
  } catch (err) {
    next(err);
  }
}

function logout(_req, res) {
  clearTokenCookie(res);
  res.sendStatus(204);
}

async function me(req, res, next) {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, role, email FROM users WHERE id = $1',
      [req.user.sub]
    );

    if (!rows[0]) return res.status(401).json({ error: 'user not found' });

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

function token(req, res) {
  const role = req.body?.role;

  if (!role || !VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` });
  }

  const jwt = signToken('demo', role);
  setTokenCookie(res, jwt);
  res.json({ token: jwt });
}

module.exports = { signup, login, logout, me, token };
