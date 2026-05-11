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

async function exportWorkouts(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT
         w.id, w.title, w.tags, w.favorite, w.created_at AS "createdAt",
         COALESCE(
           json_agg(
             json_build_object('name', e.name, 'sets', e.sets, 'reps', e.reps, 'position', e.position)
             ORDER BY e.position
           ) FILTER (WHERE e.id IS NOT NULL),
           '[]'
         ) AS exercises
       FROM workouts w
       LEFT JOIN exercises e ON e.workout_id = w.id
       WHERE w.user_id = $1
       GROUP BY w.id
       ORDER BY w.created_at DESC`,
      [req.user.sub]
    );

    res.setHeader('Content-Disposition', 'attachment; filename="workouts-export.json"');
    res.setHeader('Content-Type', 'application/json');
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function getWorkout(req, res, next) {
  try {
    const isAdmin = req.user.role === 'ADMIN';

    const { rows: [workout] } = await pool.query(
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
       WHERE w.id = $1 ${isAdmin ? '' : 'AND w.user_id = $2'}
       GROUP BY w.id`,
      isAdmin ? [req.params.id] : [req.params.id, req.user.sub]
    );

    if (!workout) return res.status(404).json({ error: 'workout not found' });
    res.json(workout);
  } catch (err) {
    next(err);
  }
}

async function updateWorkout(req, res, next) {
  try {
    const isAdmin = req.user.role === 'ADMIN';
    const { title, tags, favorite } = req.body;
    const fields = [];
    const params = [];

    if (title !== undefined) { params.push(title); fields.push(`title = $${params.length}`); }
    if (tags !== undefined)  { params.push(tags);  fields.push(`tags = $${params.length}`); }
    if (favorite !== undefined) { params.push(favorite); fields.push(`favorite = $${params.length}`); }

    if (fields.length === 0) return res.status(400).json({ error: 'nothing to update' });

    params.push(req.params.id);
    const idParam = `$${params.length}`;
    const ownerClause = isAdmin ? '' : ` AND user_id = $${params.length + 1}`;
    if (!isAdmin) params.push(req.user.sub);

    const { rows: [workout] } = await pool.query(
      `UPDATE workouts SET ${fields.join(', ')}
       WHERE id = ${idParam}${ownerClause}
       RETURNING id, title, tags, favorite, created_at AS "createdAt"`,
      params
    );

    if (!workout) return res.status(404).json({ error: 'workout not found' });
    res.json(workout);
  } catch (err) {
    next(err);
  }
}

async function deleteWorkout(req, res, next) {
  try {
    const isAdmin = req.user.role === 'ADMIN';

    const { rowCount } = await pool.query(
      `DELETE FROM workouts WHERE id = $1 ${isAdmin ? '' : 'AND user_id = $2'}`,
      isAdmin ? [req.params.id] : [req.params.id, req.user.sub]
    );

    if (rowCount === 0) return res.status(404).json({ error: 'workout not found' });
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
}

async function ownsWorkout(userId, workoutId, isAdmin) {
  if (isAdmin) return true;
  const { rowCount } = await pool.query(
    'SELECT 1 FROM workouts WHERE id = $1 AND user_id = $2',
    [workoutId, userId]
  );
  return rowCount > 0;
}

async function addExercise(req, res, next) {
  try {
    const isAdmin = req.user.role === 'ADMIN';
    if (!(await ownsWorkout(req.user.sub, req.params.id, isAdmin))) {
      return res.status(404).json({ error: 'workout not found' });
    }

    const { name, sets = 3, reps = 16 } = req.body;
    if (!name) return res.status(400).json({ error: 'name is required' });

    const { rows: [ex] } = await pool.query(
      `INSERT INTO exercises (workout_id, name, sets, reps, position)
       VALUES ($1, $2, $3, $4, (SELECT COALESCE(MAX(position) + 1, 0) FROM exercises WHERE workout_id = $1))
       RETURNING id, name, sets, reps, position`,
      [req.params.id, name, sets, reps]
    );

    res.status(201).json(ex);
  } catch (err) {
    next(err);
  }
}

async function updateExercise(req, res, next) {
  try {
    const isAdmin = req.user.role === 'ADMIN';
    if (!(await ownsWorkout(req.user.sub, req.params.id, isAdmin))) {
      return res.status(404).json({ error: 'workout not found' });
    }

    const { name, sets, reps } = req.body;
    const fields = [];
    const params = [];

    if (name !== undefined) { params.push(name); fields.push(`name = $${params.length}`); }
    if (sets !== undefined) { params.push(sets); fields.push(`sets = $${params.length}`); }
    if (reps !== undefined) { params.push(reps); fields.push(`reps = $${params.length}`); }

    if (fields.length === 0) return res.status(400).json({ error: 'nothing to update' });

    params.push(req.params.exId, req.params.id);
    const { rows: [ex] } = await pool.query(
      `UPDATE exercises SET ${fields.join(', ')}
       WHERE id = $${params.length - 1} AND workout_id = $${params.length}
       RETURNING id, name, sets, reps, position`,
      params
    );

    if (!ex) return res.status(404).json({ error: 'exercise not found' });
    res.json(ex);
  } catch (err) {
    next(err);
  }
}

async function deleteExercise(req, res, next) {
  try {
    const isAdmin = req.user.role === 'ADMIN';
    if (!(await ownsWorkout(req.user.sub, req.params.id, isAdmin))) {
      return res.status(404).json({ error: 'workout not found' });
    }

    const { rowCount } = await pool.query(
      'DELETE FROM exercises WHERE id = $1 AND workout_id = $2',
      [req.params.exId, req.params.id]
    );

    if (rowCount === 0) return res.status(404).json({ error: 'exercise not found' });
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listWorkouts, createWorkout, exportWorkouts, getWorkout, updateWorkout, deleteWorkout,
  addExercise, updateExercise, deleteExercise,
};
