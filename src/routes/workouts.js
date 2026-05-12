const express = require('express');
const { authenticateJWT, requireWriter } = require('../middleware/authenticate');
const { listWorkouts, createWorkout, exportWorkouts, importWorkouts, getWorkout, updateWorkout, deleteWorkout, addExercise, updateExercise, deleteExercise } = require('../controllers/workoutsController');

const router = express.Router();

router.use(authenticateJWT);

/**
 * @openapi
 * /workouts:
 *   get:
 *     summary: Paginated list of workouts
 *     tags: [Workouts]
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
 *         name: favorite
 *         schema: { type: boolean }
 *     responses:
 *       200:
 *         description: Paginated workout list
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
 *                         $ref: '#/components/schemas/Workout'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a new workout with optional exercises
 *     tags: [Workouts]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:     { type: string }
 *               tags:      { type: array, items: { type: string } }
 *               favorite:  { type: boolean }
 *               exercises:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [name]
 *                   properties:
 *                     name: { type: string }
 *                     sets: { type: integer }
 *                     reps: { type: integer }
 *           example:
 *             title: Push Day
 *             tags: [Chest, Shoulders]
 *             favorite: false
 *             exercises:
 *               - name: Bench Press
 *                 sets: 4
 *                 reps: 8
 *     responses:
 *       201:
 *         description: Created workout
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Workout'
 *       400:
 *         description: Missing title
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
router.get('/', listWorkouts);
router.post('/', requireWriter, createWorkout);

/**
 * @openapi
 * /workouts/export:
 *   get:
 *     summary: Download the current user's full workout library as a JSON file
 *     tags: [Workouts]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: JSON file download
 *         headers:
 *           Content-Disposition:
 *             schema: { type: string }
 *             example: attachment; filename="workouts-export.json"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Workout'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/export', exportWorkouts);

/**
 * @openapi
 * /workouts/import:
 *   post:
 *     summary: Bulk-import workouts; skips duplicates matched by title + createdAt
 *     tags: [Workouts]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/Workout'
 *     responses:
 *       200:
 *         description: Import result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 imported: { type: integer }
 *                 skipped:  { type: integer }
 *             example:
 *               imported: 5
 *               skipped: 2
 *       400:
 *         description: Body is not an array
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
router.post('/import', requireWriter, importWorkouts);

/**
 * @openapi
 * /workouts/{id}:
 *   get:
 *     summary: Get a single workout by ID
 *     tags: [Workouts]
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
 *         description: Workout with exercises
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Workout'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Workout not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   patch:
 *     summary: Partially update a workout
 *     tags: [Workouts]
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
 *               title:    { type: string }
 *               tags:     { type: array, items: { type: string } }
 *               favorite: { type: boolean }
 *           example:
 *             favorite: true
 *     responses:
 *       200:
 *         description: Updated workout
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Workout'
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
 *         description: Workout not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete a workout
 *     tags: [Workouts]
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
 *         description: Workout not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id', getWorkout);
router.patch('/:id', requireWriter, updateWorkout);
router.delete('/:id', requireWriter, deleteWorkout);

/**
 * @openapi
 * /workouts/{id}/exercises:
 *   post:
 *     summary: Add an exercise to a workout
 *     tags: [Exercises]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name]
 *             properties:
 *               name: { type: string }
 *               sets: { type: integer, default: 3 }
 *               reps: { type: integer, default: 16 }
 *           example:
 *             name: Lateral Raise
 *             sets: 3
 *             reps: 15
 *     responses:
 *       201:
 *         description: Created exercise
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Exercise'
 *       400:
 *         description: Missing name
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
 *         description: Workout not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * /workouts/{id}/exercises/{exId}:
 *   patch:
 *     summary: Update an exercise
 *     tags: [Exercises]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: exId
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               sets: { type: integer }
 *               reps: { type: integer }
 *           example:
 *             sets: 5
 *     responses:
 *       200:
 *         description: Updated exercise
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Exercise'
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
 *         description: Exercise not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete an exercise
 *     tags: [Exercises]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *       - in: path
 *         name: exId
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
 *         description: Exercise not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/exercises', requireWriter, addExercise);
router.patch('/:id/exercises/:exId', requireWriter, updateExercise);
router.delete('/:id/exercises/:exId', requireWriter, deleteExercise);

module.exports = router;
