const pool = require('../db/pool');

async function listWorkouts(req, res, next) {
  try {
    const page = Math.max(0, parseInt(req.query.page) || 0);
    const size = Math.min(100, Math.max(1, parseInt(req.query.size) || 20));
    const tags = req.query.tags ? req.query.tags.split(',').map(t => t.trim()) : null;
    const favorite = req.query.favorite !== undefined ? req.query.favorite === 'true' : null;

    const isAdmin = req.user.role === 'ADMIN';
    const conditions = [];
    const params = [];

    if (!isAdmin) {
      params.push(req.user.sub);
      conditions.push(`w.user_id = $${params.length}`);
    }

    if (tags && tags.length > 0) {
      params.push(tags);
      conditions.push(`w.tags && $${params.length}`);
    }

    if (favorite !== null) {
      params.push(favorite);
      conditions.push(`w.favorite = $${params.length}`);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM workouts w ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(size, page * size);
    const limitParam = `$${params.length - 1}`;
    const offsetParam = `$${params.length}`;

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
       ${where}
       GROUP BY w.id
       ORDER BY w.created_at DESC
       LIMIT ${limitParam} OFFSET ${offsetParam}`,
      params
    );

    res.json({ data: rows, total, page, size, totalPages: Math.ceil(total / size) });
  } catch (err) {
    next(err);
  }
}

async function createWorkout(req, res, next) {
  const client = await pool.connect();
  try {
    const { title, tags = [], favorite = false, exercises = [] } = req.body;

    if (!title) return res.status(400).json({ error: 'title is required' });

    await client.query('BEGIN');

    const { rows: [workout] } = await client.query(
      `INSERT INTO workouts (user_id, title, tags, favorite)
       VALUES ($1, $2, $3, $4)
       RETURNING id, title, tags, favorite, created_at AS "createdAt"`,
      [req.user.sub, title, tags, favorite]
    );

    const inserted = [];
    for (let i = 0; i < exercises.length; i++) {
      const { name, sets = 3, reps = 16 } = exercises[i];
      const { rows: [ex] } = await client.query(
        `INSERT INTO exercises (workout_id, name, sets, reps, position)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, name, sets, reps, position`,
        [workout.id, name, sets, reps, i]
      );
      inserted.push(ex);
    }

    await client.query('COMMIT');

    res.status(201).json({ ...workout, exercises: inserted });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

module.exports = { listWorkouts, createWorkout };
