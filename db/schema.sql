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
