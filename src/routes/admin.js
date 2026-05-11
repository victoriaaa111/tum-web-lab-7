const express = require('express');
const { authenticateJWT, requireRole } = require('../middleware/authenticate');
const { listUsers, updateUser, deleteUser, listUserWorkouts, listUserSessions } = require('../controllers/adminController');

const router = express.Router();

router.use(authenticateJWT, requireRole('ADMIN'));

router.get('/users', listUsers);
router.patch('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);
router.get('/users/:id/workouts', listUserWorkouts);
router.get('/users/:id/sessions', listUserSessions);

module.exports = router;
