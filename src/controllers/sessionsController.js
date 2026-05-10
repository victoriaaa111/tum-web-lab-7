const pool = require('../db/pool');

async function listSessions(req, res, next) {
  try {
    const page = Math.max(0, parseInt(req.query.page) || 0);
    const size = Math.min(100, Math.max(1, parseInt(req.query.size) || 20));
    const tags = req.query.tags ? req.query.tags.split(',').map(t => t.trim()) : null;
    const { from, to } = req.query;

    const isAdmin = req.user.role === 'ADMIN';
    const conditions = [];
    const params = [];

    if (!isAdmin) {
      params.push(req.user.sub);
      conditions.push(`user_id = $${params.length}`);
    }

    if (tags && tags.length > 0) {
      params.push(tags);
      conditions.push(`tags && $${params.length}`);
    }

    if (from) {
      params.push(from);
      conditions.push(`started_at >= $${params.length}`);
    }

    if (to) {
      params.push(to);
      conditions.push(`started_at <= $${params.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM sessions ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(size, page * size);
    const limitParam = `$${params.length - 1}`;
    const offsetParam = `$${params.length}`;

    const { rows } = await pool.query(
      `SELECT id, workout_id AS "workoutId", workout_title AS "workoutTitle",
              tags, started_at AS "startedAt", finished_at AS "finishedAt", exercises
       FROM sessions
       ${where}
       ORDER BY started_at DESC
       LIMIT ${limitParam} OFFSET ${offsetParam}`,
      params
    );

    res.json({ data: rows, total, page, size, totalPages: Math.ceil(total / size) });
  } catch (err) {
    next(err);
  }
}

module.exports = { listSessions };
