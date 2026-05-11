const express = require('express');
const { signup, login, logout, me, token } = require('../controllers/authController');
const { authenticateJWT } = require('../middleware/authenticate');

const router = express.Router();

/**
 * @openapi
 * /auth/token:
 *   post:
 *     summary: Issue a signed JWT for a given role (demo/testing only)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [ADMIN, WRITER, VISITOR]
 *           example:
 *             role: WRITER
 *     responses:
 *       200:
 *         description: JWT issued and set as HttpOnly cookie
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *             example:
 *               token: eyJhbGciOiJIUzI1NiJ9...
 *       400:
 *         description: Missing or invalid role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/token', token);

/**
 * @openapi
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password]
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *           example:
 *             username: alice
 *             email: alice@example.com
 *             password: secret
 *     responses:
 *       201:
 *         description: User created; JWT cookie set
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:       { type: string, format: uuid }
 *                 username: { type: string }
 *                 role:     { type: string }
 *             example:
 *               id: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *               username: alice
 *               role: WRITER
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Username or email already taken
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/signup', signup);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     summary: Log in and receive a JWT cookie
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *           example:
 *             email: alice@example.com
 *             password: secret
 *     responses:
 *       200:
 *         description: Authenticated; JWT cookie set
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:       { type: string, format: uuid }
 *                 username: { type: string }
 *                 role:     { type: string }
 *             example:
 *               id: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *               username: alice
 *               role: WRITER
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/login', login);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Clear the JWT cookie
 *     tags: [Auth]
 *     responses:
 *       204:
 *         description: Cookie cleared
 */
router.post('/logout', logout);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Return the currently authenticated user
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *             example:
 *               id: 3fa85f64-5717-4562-b3fc-2c963f66afa6
 *               username: alice
 *               email: alice@example.com
 *               role: WRITER
 *               createdAt: '2025-05-10T10:00:00Z'
 *       401:
 *         description: Missing or invalid token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', authenticateJWT, me);

module.exports = router;
