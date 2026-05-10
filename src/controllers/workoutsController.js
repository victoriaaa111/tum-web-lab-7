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

module.exports = { listWorkouts };
