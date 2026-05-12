# Workout Journal API

REST API for managing workout templates and logged session history. Built with Node.js, Express, PostgreSQL, and JWT authentication via HttpOnly cookies.

---

## Stack

- **Runtime**: Node.js + Express (CommonJS)
- **Database**: PostgreSQL 16 (via `pg` pool)
- **Auth**: JWT (HS256), stored as HttpOnly `SameSite=Strict` cookie
- **Docs**: Swagger UI at `GET /api-docs`
- **Containerisation**: Docker Compose

---

## Quick Start

```bash
# start db + api
docker compose up --build -d

# api is available at http://localhost:3000
# swagger ui at  http://localhost:3000/api-docs
```

### Environment variables

| Variable | Description |
|---|---|
| `PORT` | Server port (default `3000`) |
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign tokens |
| `CLIENT_ORIGIN` | Allowed CORS origin (default `http://localhost:5173`) |

---

## Auth

All protected routes require a valid JWT either as an HttpOnly cookie (`token`) or a `Bearer` token in the `Authorization` header.

New users are created with role `WRITER`. The first admin must be promoted directly in the database:

```bash
docker compose exec db psql -U wjuser -d workout_journal
```
```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'your@email.com';
```

Then log out and back in so the new role is reflected in the token.

### Roles

| Role | Access |
|---|---|
| `ADMIN` | All endpoints + admin panel (can read/write any user's data) |
| `WRITER` | Full CRUD on own workouts and sessions |
| `VISITOR` | Read-only — GETs and exports only, all writes return 403 |

---

## Database Schema

| Table | Key columns |
|---|---|
| `users` | `id`, `username`, `email`, `password_hash`, `role`, `created_at` |
| `workouts` | `id`, `user_id`, `title`, `tags[]`, `favorite`, `created_at` |
| `exercises` | `id`, `workout_id`, `name`, `sets`, `reps`, `position` |
| `sessions` | `id`, `user_id`, `workout_id`, `workout_title`, `tags[]`, `started_at`, `finished_at`, `exercises` (JSONB) |

Sessions store a JSONB snapshot of exercises at the time of logging, independent of the workout template. An index on `sessions(started_at DESC)` supports efficient date-range queries.

---

## Endpoints

### Auth — `/auth`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/signup` | — | Register a new user; sets JWT cookie |
| POST | `/auth/login` | — | Log in; sets JWT cookie |
| POST | `/auth/logout` | — | Clears JWT cookie |
| GET | `/auth/me` | required | Returns current user |
| POST | `/auth/token` | — | Issue a demo token for a given role (dev/testing only) |

### Workouts — `/workouts`

All routes require authentication. Write routes (`POST`, `PATCH`, `DELETE`) return 403 for `VISITOR`.

| Method | Path | Description |
|---|---|---|
| GET | `/workouts` | Paginated list; filter by `?tags=Chest,Back` and/or `?favorite=true` |
| POST | `/workouts` | Create a workout with optional exercises |
| GET | `/workouts/export` | Download full workout library as JSON |
| POST | `/workouts/import` | Bulk import; deduplicates by `title + createdAt` |
| GET | `/workouts/:id` | Get single workout with exercises |
| PATCH | `/workouts/:id` | Update title, tags, or favorite |
| DELETE | `/workouts/:id` | Delete workout and its exercises |

### Exercises — `/workouts/:id/exercises`

| Method | Path | Description |
|---|---|---|
| POST | `/workouts/:id/exercises` | Add exercise to a workout |
| PATCH | `/workouts/:id/exercises/:exId` | Update exercise name, sets, or reps |
| DELETE | `/workouts/:id/exercises/:exId` | Delete exercise |

### Sessions — `/sessions`

All routes require authentication. Write routes return 403 for `VISITOR`.

| Method | Path | Description |
|---|---|---|
| GET | `/sessions` | Paginated list; filter by `?tags=`, `?from=`, `?to=` (ISO 8601) |
| POST | `/sessions` | Log a completed session |
| GET | `/sessions/export` | Download full session history as JSON |
| POST | `/sessions/import` | Bulk import; deduplicates by `workoutTitle + startedAt` |
| GET | `/sessions/:id` | Get single session |
| PATCH | `/sessions/:id` | Update session fields |
| DELETE | `/sessions/:id` | Delete session |

### Admin — `/admin`

All routes require `ADMIN` role.

| Method | Path | Description |
|---|---|---|
| GET | `/admin/users` | Paginated list of all users |
| PATCH | `/admin/users/:id` | Update a user's role |
| DELETE | `/admin/users/:id` | Delete a user and all their data |
| GET | `/admin/users/:id/workouts` | Paginated workouts for any user |
| GET | `/admin/users/:id/sessions` | Paginated sessions for any user |

---

## Pagination

All list endpoints support:

| Param | Default | Max | Description |
|---|---|---|---|
| `page` | `0` | — | Zero-based page index |
| `size` | `20` | `100` | Items per page |

Response shape:

```json
{
  "data": [...],
  "total": 42,
  "page": 0,
  "size": 20,
  "totalPages": 3
}
```
