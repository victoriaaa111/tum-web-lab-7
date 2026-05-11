const pool = require('../db/pool');

async function listUsers(req, res, next) {
  try {
    const page = Math.max(0, parseInt(req.query.page) || 0);
    const size = Math.min(100, Math.max(1, parseInt(req.query.size) || 20));

    const countResult = await pool.query('SELECT COUNT(*) FROM users');
    const total = parseInt(countResult.rows[0].count);

    const { rows } = await pool.query(
      `SELECT id, username, email, role, created_at AS "createdAt"
       FROM users
       ORDER BY created_at DESC
       LIMIT $1 OFFSET $2`,
      [size, page * size]
    );

    res.json({ data: rows, total, page, size, totalPages: Math.ceil(total / size) });
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers };
