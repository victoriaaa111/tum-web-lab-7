const express = require('express');
const { authenticateJWT } = require('../middleware/authenticate');
const { listSessions } = require('../controllers/sessionsController');

const router = express.Router();

router.use(authenticateJWT);

router.get('/', listSessions);

module.exports = router;
