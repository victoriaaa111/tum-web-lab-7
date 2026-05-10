const express = require('express');
const { authenticateJWT } = require('../middleware/authenticate');
const { listWorkouts, createWorkout } = require('../controllers/workoutsController');

const router = express.Router();

router.use(authenticateJWT);

router.get('/', listWorkouts);
router.post('/', createWorkout);

module.exports = router;
