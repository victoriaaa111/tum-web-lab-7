const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Workout Journal API',
      version: '1.0.0',
      description: `REST API for managing workout templates and logged session history.

**Authentication**: JWT stored as an HttpOnly cookie (\`token\`). All protected endpoints also accept a \`Bearer\` token in the \`Authorization\` header for convenience in this UI — use \`POST /auth/token\` to get one.

**Roles**:
- \`ADMIN\` — full access to all data and the \`/admin\` panel
- \`WRITER\` — full CRUD on own workouts and sessions
- \`VISITOR\` — read-only; all write endpoints return \`403\``,
    },
    servers: [{ url: 'http://localhost:3000' }],
    components: {
      securitySchemes: {
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token',
        },
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        Pagination: {
          type: 'object',
          properties: {
            data:       { type: 'array', items: {} },
            total:      { type: 'integer' },
            page:       { type: 'integer' },
            size:       { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        User: {
          type: 'object',
          properties: {
            id:        { type: 'string', format: 'uuid' },
            username:  { type: 'string' },
            email:     { type: 'string', format: 'email' },
            role:      { type: 'string', enum: ['ADMIN', 'WRITER', 'VISITOR'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Exercise: {
          type: 'object',
          properties: {
            id:       { type: 'string', format: 'uuid' },
            name:     { type: 'string' },
            sets:     { type: 'integer' },
            reps:     { type: 'integer' },
            position: { type: 'integer' },
          },
        },
        Workout: {
          type: 'object',
          properties: {
            id:        { type: 'string', format: 'uuid' },
            title:     { type: 'string' },
            tags:      { type: 'array', items: { type: 'string' } },
            favorite:  { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            exercises: { type: 'array', items: { $ref: '#/components/schemas/Exercise' } },
          },
        },
        Session: {
          type: 'object',
          properties: {
            id:           { type: 'string', format: 'uuid' },
            workoutId:    { type: 'string', format: 'uuid', nullable: true },
            workoutTitle: { type: 'string' },
            tags:         { type: 'array', items: { type: 'string' } },
            startedAt:    { type: 'string', format: 'date-time' },
            finishedAt:   { type: 'string', format: 'date-time' },
            exercises:    { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
    security: [{ cookieAuth: [] }, { bearerAuth: [] }],
  },
  apis: ['./src/routes/*.js'],
};

module.exports = swaggerJsdoc(options);
