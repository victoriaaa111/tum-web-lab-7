CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username      VARCHAR(100) UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'WRITER'
                  CHECK (role IN ('ADMIN', 'WRITER', 'VISITOR')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workouts (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      VARCHAR(255) NOT NULL,
  tags       TEXT[] NOT NULL DEFAULT '{}',
  favorite   BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS exercises (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workout_id UUID NOT NULL REFERENCES workouts(id) ON DELETE CASCADE,
  name       VARCHAR(255) NOT NULL,
  sets       INTEGER NOT NULL DEFAULT 3,
  reps       INTEGER NOT NULL DEFAULT 16,
  position   INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_id    UUID REFERENCES workouts(id) ON DELETE SET NULL,
  workout_title VARCHAR(255) NOT NULL,
  tags          TEXT[] NOT NULL DEFAULT '{}',
  started_at    TIMESTAMPTZ NOT NULL,
  finished_at   TIMESTAMPTZ NOT NULL,
  exercises     JSONB NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS sessions_started_at_idx ON sessions (started_at DESC);
