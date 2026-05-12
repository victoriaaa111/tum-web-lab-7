const express = require('express');
const { authenticateJWT } = require('../middleware/authenticate');
const { listSessions, createSession, exportSessions, getSession, updateSession, deleteSession } = require('../controllers/sessionsController');

const router = express.Router();

router.use(authenticateJWT);

/**
 * @openapi
 * /sessions:
 *   get:
 *     summary: Paginated list of sessions
 *     tags: [Sessions]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 0 }
 *       - in: query
 *         name: size
 *         schema: { type: integer, default: 20, maximum: 100 }
 *       - in: query
 *         name: tags
 *         schema: { type: string }
 *         description: Comma-separated tag filter
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date-time }
 *         description: Filter sessions started on or after this timestamp
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date-time }
 *         description: Filter sessions started on or before this timestamp
 *     responses:
 *       200:
 *         description: Paginated session list
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Pagination'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Session'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Record a completed workout session
 *     tags: [Sessions]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [workoutTitle, startedAt, finishedAt]
 *             properties:
 *               workoutId:    { type: string, format: uuid, nullable: true }
 *               workoutTitle: { type: string }
 *               tags:         { type: array, items: { type: string } }
 *               startedAt:    { type: string, format: date-time }
 *               finishedAt:   { type: string, format: date-time }
 *               exercises:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:        { type: string, format: uuid }
 *                     name:      { type: string }
 *                     sets:      { type: integer }
 *                     reps:      { type: integer }
 *                     completed: { type: boolean }
 *           example:
 *             workoutId: null
 *             workoutTitle: Push Day
 *             tags: [Chest]
 *             startedAt: '2025-05-10T10:00:00Z'
 *             finishedAt: '2025-05-10T11:00:00Z'
 *             exercises:
 *               - name: Bench Press
 *                 sets: 4
 *                 reps: 8
 *                 completed: true
 *     responses:
 *       201:
 *         description: Created session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', listSessions);
router.post('/', createSession);
router.get('/export', exportSessions);

/**
 * @openapi
 * /sessions/{id}:
 *   get:
 *     summary: Get a single session by ID
 *     tags: [Sessions]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Session object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   patch:
 *     summary: Partially update a session
 *     tags: [Sessions]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               workoutTitle: { type: string }
 *               tags:         { type: array, items: { type: string } }
 *               startedAt:    { type: string, format: date-time }
 *               finishedAt:   { type: string, format: date-time }
 *               exercises:    { type: array, items: { type: object } }
 *           example:
 *             tags: [Chest, Triceps]
 *     responses:
 *       200:
 *         description: Updated session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Session'
 *       400:
 *         description: Nothing to update
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete a session
 *     tags: [Sessions]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       204:
 *         description: Deleted
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Session not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getSession);
router.patch('/:id', updateSession);
router.delete('/:id', deleteSession);

module.exports = router;
