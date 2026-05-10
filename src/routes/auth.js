const express = require('express');
const { signup, login, logout, me, token } = require('../controllers/authController');

const router = express.Router();

router.get('/token', token);
router.post('/token', token);
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/me', me);

module.exports = router;
