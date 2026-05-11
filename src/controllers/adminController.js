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

async function updateUser(req, res, next) {
  try {
    const { role } = req.body;
    const VALID_ROLES = ['ADMIN', 'WRITER', 'VISITOR'];

    if (!role) return res.status(400).json({ error: 'role is required' });
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `role must be one of: ${VALID_ROLES.join(', ')}` });
    }

    const { rows: [user] } = await pool.query(
      `UPDATE users SET role = $1
       WHERE id = $2
       RETURNING id, username, email, role, created_at AS "createdAt"`,
      [role, req.params.id]
    );

    if (!user) return res.status(404).json({ error: 'user not found' });
    res.json(user);
  } catch (err) {
    next(err);
  }
}

async function deleteUser(req, res, next) {
  try {
    const { rowCount } = await pool.query(
      'DELETE FROM users WHERE id = $1',
      [req.params.id]
    );

    if (rowCount === 0) return res.status(404).json({ error: 'user not found' });
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
}

async function listUserWorkouts(req, res, next) {
  try {
    const page = Math.max(0, parseInt(req.query.page) || 0);
    const size = Math.min(100, Math.max(1, parseInt(req.query.size) || 20));

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM workouts WHERE user_id = $1',
      [req.params.id]
    );
    const total = parseInt(countResult.rows[0].count);

    const { rows } = await pool.query(
      `SELECT
         w.id, w.title, w.tags, w.favorite, w.created_at AS "createdAt",
         COALESCE(
           json_agg(
             json_build_object('id', e.id, 'name', e.name, 'sets', e.sets, 'reps', e.reps, 'position', e.position)
             ORDER BY e.position
           ) FILTER (WHERE e.id IS NOT NULL),
           '[]'
         ) AS exercises
       FROM workouts w
       LEFT JOIN exercises e ON e.workout_id = w.id
       WHERE w.user_id = $1
       GROUP BY w.id
       ORDER BY w.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.params.id, size, page * size]
    );

    res.json({ data: rows, total, page, size, totalPages: Math.ceil(total / size) });
  } catch (err) {
    next(err);
  }
}

async function listUserSessions(req, res, next) {
  try {
    const page = Math.max(0, parseInt(req.query.page) || 0);
    const size = Math.min(100, Math.max(1, parseInt(req.query.size) || 20));

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM sessions WHERE user_id = $1',
      [req.params.id]
    );
    const total = parseInt(countResult.rows[0].count);

    const { rows } = await pool.query(
      `SELECT id, workout_id AS "workoutId", workout_title AS "workoutTitle",
              tags, started_at AS "startedAt", finished_at AS "finishedAt", exercises
       FROM sessions
       WHERE user_id = $1
       ORDER BY started_at DESC
       LIMIT $2 OFFSET $3`,
      [req.params.id, size, page * size]
    );

    res.json({ data: rows, total, page, size, totalPages: Math.ceil(total / size) });
  } catch (err) {
    next(err);
  }
}

module.exports = { listUsers, updateUser, deleteUser, listUserWorkouts, listUserSessions };
