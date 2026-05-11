const express = require('express');
const { authenticateJWT, requireRole } = require('../middleware/authenticate');
const { listUsers } = require('../controllers/adminController');

const router = express.Router();

router.use(authenticateJWT, requireRole('ADMIN'));

router.get('/users', listUsers);

module.exports = router;
