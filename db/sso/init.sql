CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'USER',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );

-- Ako nema ekstenziju za UUID i pgcrypto u Alpine image-u:
CREATE EXTENSION IF NOT EXISTS pgcrypto;
