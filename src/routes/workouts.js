const express = require('express');
const { authenticateJWT } = require('../middleware/authenticate');
const { listWorkouts, createWorkout, exportWorkouts, getWorkout, updateWorkout, deleteWorkout, addExercise, updateExercise, deleteExercise } = require('../controllers/workoutsController');

const router = express.Router();

router.use(authenticateJWT);

router.get('/', listWorkouts);
router.post('/', createWorkout);
router.get('/export', exportWorkouts);
router.get('/:id', getWorkout);
router.patch('/:id', updateWorkout);
router.delete('/:id', deleteWorkout);

router.post('/:id/exercises', addExercise);
router.patch('/:id/exercises/:exId', updateExercise);
router.delete('/:id/exercises/:exId', deleteExercise);

module.exports = router;
