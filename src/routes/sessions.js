const express = require('express');
const { authenticateJWT } = require('../middleware/authenticate');
const { listSessions, createSession } = require('../controllers/sessionsController');

const router = express.Router();

router.use(authenticateJWT);

router.get('/', listSessions);
router.post('/', createSession);

module.exports = router;
