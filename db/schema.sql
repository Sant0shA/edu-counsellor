-- CareerShifu database schema
-- All statements use CREATE TABLE IF NOT EXISTS — safe to run against an existing DB.
-- Run with: psql $DATABASE_URL -f db/schema.sql

CREATE TABLE IF NOT EXISTS sessions (
  id         SERIAL PRIMARY KEY,
  grade      TEXT,
  answers    JSONB,
  result     JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id         SERIAL PRIMARY KEY,
  email      TEXT        NOT NULL UNIQUE,
  grade      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS otp_codes (
  id         SERIAL PRIMARY KEY,
  email      TEXT        NOT NULL,
  code       TEXT        NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN     NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS waitlist (
  id         SERIAL PRIMARY KEY,
  name       TEXT        NOT NULL,
  phone      TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  grade      TEXT,
  session_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coupons (
  id             SERIAL PRIMARY KEY,
  code           TEXT        NOT NULL UNIQUE,
  type           TEXT        NOT NULL,        -- 'free' | 'flat' | 'percent'
  discount_value NUMERIC,
  active         BOOLEAN     NOT NULL DEFAULT true,
  uses_count     INTEGER     NOT NULL DEFAULT 0,
  max_uses       INTEGER     NOT NULL DEFAULT 1,
  expires_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coupon_redemptions (
  id         SERIAL PRIMARY KEY,
  coupon_id  INTEGER     NOT NULL REFERENCES coupons(id),
  user_id    TEXT        NOT NULL,
  session_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS report_queue (
  id         SERIAL PRIMARY KEY,
  session_id INTEGER,
  user_id    TEXT        NOT NULL,
  email      TEXT        NOT NULL,
  status     TEXT        NOT NULL DEFAULT 'pending',  -- pending | generating | done | failed
  error      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_sessions_user_id          ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at       ON sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_report_queue_email_status ON report_queue(LOWER(email), status);
CREATE INDEX IF NOT EXISTS idx_otp_codes_email           ON otp_codes(email, used, expires_at);
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_user   ON coupon_redemptions(user_id);

-- ── School portal tables ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS schools (
  id            SERIAL PRIMARY KEY,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  contact_email TEXT,
  city          TEXT,
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS school_cohorts (
  id            SERIAL PRIMARY KEY,
  school_id     INTEGER NOT NULL REFERENCES schools(id),
  name          TEXT NOT NULL,
  access_token  TEXT NOT NULL UNIQUE,
  coupon_code   TEXT REFERENCES coupons(code),
  bypass_otp    BOOLEAN NOT NULL DEFAULT false,
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS school_staff (
  id            SERIAL PRIMARY KEY,
  school_id     INTEGER REFERENCES schools(id),
  email         TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL,    -- 'admin' | 'manager' | 'counselor'
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id         SERIAL PRIMARY KEY,
  staff_id   INTEGER NOT NULL REFERENCES school_staff(id),
  token      TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used       BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS counsellor_notes (
  id         SERIAL PRIMARY KEY,
  staff_id   INTEGER NOT NULL REFERENCES school_staff(id),
  user_id    TEXT NOT NULL,
  note       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Columns added to users and sessions for school cohort tagging:
-- ALTER TABLE users    ADD COLUMN IF NOT EXISTS cohort_id    INTEGER REFERENCES school_cohorts(id);
-- ALTER TABLE users    ADD COLUMN IF NOT EXISTS display_name TEXT;
-- ALTER TABLE sessions ADD COLUMN IF NOT EXISTS cohort_id    INTEGER REFERENCES school_cohorts(id);

CREATE INDEX IF NOT EXISTS idx_sessions_cohort_id    ON sessions(cohort_id);
CREATE INDEX IF NOT EXISTS idx_users_cohort_id       ON users(cohort_id);
CREATE INDEX IF NOT EXISTS idx_school_staff_email    ON school_staff(email);
CREATE INDEX IF NOT EXISTS idx_counsellor_notes_user ON counsellor_notes(user_id);
