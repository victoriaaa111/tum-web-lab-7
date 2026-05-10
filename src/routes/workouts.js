const express = require('express');
const { authenticateJWT } = require('../middleware/authenticate');
const { listWorkouts } = require('../controllers/workoutsController');

const router = express.Router();

router.use(authenticateJWT);

router.get('/', listWorkouts);

module.exports = router;
