const express = require('express');
const { authenticateJWT } = require('../middleware/authenticate');
const { listWorkouts, createWorkout, getWorkout, updateWorkout, deleteWorkout } = require('../controllers/workoutsController');

const router = express.Router();

router.use(authenticateJWT);

router.get('/', listWorkouts);
router.post('/', createWorkout);
router.get('/:id', getWorkout);
router.patch('/:id', updateWorkout);
router.delete('/:id', deleteWorkout);

module.exports = router;
