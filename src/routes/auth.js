const express = require('express');
const { signup, token } = require('../controllers/authController');

const router = express.Router();

router.get('/token', token);
router.post('/token', token);
router.post('/signup', signup);

module.exports = router;
