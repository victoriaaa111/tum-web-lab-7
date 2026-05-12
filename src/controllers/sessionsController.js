const pool = require('../db/pool');

async function listSessions(req, res, next) {
  try {
    const page = Math.max(0, parseInt(req.query.page) || 0);
    const size = Math.min(100, Math.max(1, parseInt(req.query.size) || 20));
    const rawTags = req.query.tags;
    const tags = rawTags
      ? (Array.isArray(rawTags) ? rawTags : rawTags.split(',')).map(t => t.trim()).filter(Boolean)
      : null;
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

async function createSession(req, res, next) {
  try {
    const { workoutId = null, workoutTitle, tags = [], startedAt, finishedAt, exercises = [] } = req.body;

    if (!workoutTitle || !startedAt || !finishedAt) {
      return res.status(400).json({ error: 'workoutTitle, startedAt and finishedAt are required' });
    }

    const { rows: [session] } = await pool.query(
      `INSERT INTO sessions (user_id, workout_id, workout_title, tags, started_at, finished_at, exercises)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, workout_id AS "workoutId", workout_title AS "workoutTitle",
                 tags, started_at AS "startedAt", finished_at AS "finishedAt", exercises`,
      [req.user.sub, workoutId, workoutTitle, tags, startedAt, finishedAt, JSON.stringify(exercises)]
    );

    res.status(201).json(session);
  } catch (err) {
    next(err);
  }
}

async function getSession(req, res, next) {
  try {
    const isAdmin = req.user.role === 'ADMIN';

    const { rows: [session] } = await pool.query(
      `SELECT id, workout_id AS "workoutId", workout_title AS "workoutTitle",
              tags, started_at AS "startedAt", finished_at AS "finishedAt", exercises
       FROM sessions
       WHERE id = $1 ${isAdmin ? '' : 'AND user_id = $2'}`,
      isAdmin ? [req.params.id] : [req.params.id, req.user.sub]
    );

    if (!session) return res.status(404).json({ error: 'session not found' });
    res.json(session);
  } catch (err) {
    next(err);
  }
}

async function updateSession(req, res, next) {
  try {
    const isAdmin = req.user.role === 'ADMIN';
    const { workoutTitle, tags, startedAt, finishedAt, exercises } = req.body;
    const fields = [];
    const params = [];

    if (workoutTitle !== undefined) { params.push(workoutTitle); fields.push(`workout_title = $${params.length}`); }
    if (tags !== undefined)         { params.push(tags);         fields.push(`tags = $${params.length}`); }
    if (startedAt !== undefined)    { params.push(startedAt);    fields.push(`started_at = $${params.length}`); }
    if (finishedAt !== undefined)   { params.push(finishedAt);   fields.push(`finished_at = $${params.length}`); }
    if (exercises !== undefined)    { params.push(JSON.stringify(exercises)); fields.push(`exercises = $${params.length}`); }

    if (fields.length === 0) return res.status(400).json({ error: 'nothing to update' });

    params.push(req.params.id);
    const idParam = `$${params.length}`;
    const ownerClause = isAdmin ? '' : ` AND user_id = $${params.length + 1}`;
    if (!isAdmin) params.push(req.user.sub);

    const { rows: [session] } = await pool.query(
      `UPDATE sessions SET ${fields.join(', ')}
       WHERE id = ${idParam}${ownerClause}
       RETURNING id, workout_id AS "workoutId", workout_title AS "workoutTitle",
                 tags, started_at AS "startedAt", finished_at AS "finishedAt", exercises`,
      params
    );

    if (!session) return res.status(404).json({ error: 'session not found' });
    res.json(session);
  } catch (err) {
    next(err);
  }
}

async function deleteSession(req, res, next) {
  try {
    const isAdmin = req.user.role === 'ADMIN';

    const { rowCount } = await pool.query(
      `DELETE FROM sessions WHERE id = $1 ${isAdmin ? '' : 'AND user_id = $2'}`,
      isAdmin ? [req.params.id] : [req.params.id, req.user.sub]
    );

    if (rowCount === 0) return res.status(404).json({ error: 'session not found' });
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
}

async function exportSessions(req, res, next) {
  try {
    const { rows } = await pool.query(
      `SELECT id, workout_id AS "workoutId", workout_title AS "workoutTitle",
              tags, started_at AS "startedAt", finished_at AS "finishedAt", exercises
       FROM sessions
       WHERE user_id = $1
       ORDER BY started_at DESC`,
      [req.user.sub]
    );

    res.setHeader('Content-Disposition', 'attachment; filename="sessions-export.json"');
    res.setHeader('Content-Type', 'application/json');
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { listSessions, createSession, exportSessions, getSession, updateSession, deleteSession };
