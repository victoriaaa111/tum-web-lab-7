const express = require('express');
const { authenticateJWT } = require('../middleware/authenticate');
const { listSessions, createSession, getSession, updateSession, deleteSession } = require('../controllers/sessionsController');

const router = express.Router();

router.use(authenticateJWT);

router.get('/', listSessions);
router.post('/', createSession);
router.get('/:id', getSession);
router.patch('/:id', updateSession);
router.delete('/:id', deleteSession);

module.exports = router;
