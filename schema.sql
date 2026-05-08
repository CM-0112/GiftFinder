-- =============================================================
-- Wishlist MVP — Database Schema
-- PostgreSQL (Supabase)
-- Version: 1
-- =============================================================


-- =============================================================
-- EXTENSIONS
-- =============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- =============================================================
-- USERS
-- =============================================================

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email         TEXT NOT NULL UNIQUE,
  username      TEXT NOT NULL UNIQUE,
  display_name  TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- usernames are used as profile URL slugs (/[username])
-- must be lowercase, alphanumeric + hyphens, enforced at app layer
CREATE INDEX idx_users_username ON users (username);


-- =============================================================
-- CONNECTIONS (social graph)
-- =============================================================

CREATE TYPE connection_status AS ENUM ('pending', 'connected');

CREATE TABLE connections (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id  UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  recipient_id  UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  status        connection_status NOT NULL DEFAULT 'pending',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- prevent duplicate or self-referential connections
  CONSTRAINT no_self_connection CHECK (requester_id <> recipient_id),
  CONSTRAINT unique_connection UNIQUE (requester_id, recipient_id)
);

-- look up all connections for a given user (both directions)
CREATE INDEX idx_connections_requester ON connections (requester_id);
CREATE INDEX idx_connections_recipient ON connections (recipient_id);

-- =============================================================
-- NOTES ON CONNECTION LOGIC
--
-- A confirmed connection is symmetrical but stored as a single
-- row (requester → recipient). Application queries must check
-- both directions to determine if two users are connected:
--
--   SELECT * FROM connections
--   WHERE status = 'connected'
--     AND (
--       (requester_id = $user_a AND recipient_id = $user_b)
--       OR
--       (requester_id = $user_b AND recipient_id = $user_a)
--     );
--
-- Declined requests are deleted, not stored.
-- Removals delete the row entirely (ON DELETE CASCADE handles
-- orphaned rows if a user account is deleted).
-- =============================================================


-- =============================================================
-- WISHLIST ITEMS
-- =============================================================

CREATE TABLE wishlist_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  brand         TEXT,
  price_display TEXT,                -- stored as display string e.g. "$45" — not a numeric value at MVP
  image_url     TEXT,
  product_url   TEXT,
  note          TEXT,                -- owner note e.g. "size M, forest green" — max 200 chars enforced at app layer
  position      INTEGER NOT NULL DEFAULT 0,  -- used for manual reordering
  claimed       BOOLEAN NOT NULL DEFAULT FALSE,
  claimed_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- fetch all items for a user's wishlist ordered by position
CREATE INDEX idx_wishlist_items_user ON wishlist_items (user_id, position);


-- =============================================================
-- SCRAPE LOGS
-- (domain failure tracking — required per PRD)
-- =============================================================

CREATE TABLE scrape_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID REFERENCES users (id) ON DELETE SET NULL,
  url           TEXT NOT NULL,
  domain        TEXT NOT NULL,       -- extracted hostname e.g. "amazon.com"
  success       BOOLEAN NOT NULL,    -- true if at least name + price were returned
  fields_found  TEXT[],              -- e.g. ARRAY['name', 'price', 'image']
  error_message TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- query failure rates by domain
CREATE INDEX idx_scrape_logs_domain ON scrape_logs (domain, success);
CREATE INDEX idx_scrape_logs_created ON scrape_logs (created_at);


-- =============================================================
-- UPDATED_AT TRIGGER
-- Auto-update updated_at on row changes
-- =============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_connections_updated_at
  BEFORE UPDATE ON connections
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_wishlist_items_updated_at
  BEFORE UPDATE ON wishlist_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- =============================================================
-- ROW LEVEL SECURITY (Supabase)
-- =============================================================

ALTER TABLE users            ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections      ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_logs      ENABLE ROW LEVEL SECURITY;

-- ---- users ----
-- Anyone can read basic profile info (needed for search + gated profile page)
CREATE POLICY users_read_public ON users
  FOR SELECT USING (true);

-- Users can only update their own row
CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = id);

-- ---- connections ----
-- Users can read connections they are part of
CREATE POLICY connections_read_own ON connections
  FOR SELECT USING (
    auth.uid() = requester_id OR auth.uid() = recipient_id
  );

-- Users can insert a connection request as the requester
CREATE POLICY connections_insert_own ON connections
  FOR INSERT WITH CHECK (auth.uid() = requester_id);

-- Users can update (accept) a connection where they are the recipient
CREATE POLICY connections_update_recipient ON connections
  FOR UPDATE USING (auth.uid() = recipient_id);

-- Either party can delete (decline / remove) a connection
CREATE POLICY connections_delete_own ON connections
  FOR DELETE USING (
    auth.uid() = requester_id OR auth.uid() = recipient_id
  );

-- ---- wishlist_items ----
-- Owners can do anything with their own items
CREATE POLICY wishlist_owner_all ON wishlist_items
  FOR ALL USING (auth.uid() = user_id);

-- Connected users can read items (checks connection in both directions)
CREATE POLICY wishlist_connected_read ON wishlist_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM connections
      WHERE status = 'connected'
        AND (
          (requester_id = auth.uid() AND recipient_id = wishlist_items.user_id)
          OR
          (recipient_id = auth.uid() AND requester_id = wishlist_items.user_id)
        )
    )
  );

-- Connected users can claim (update claimed + claimed_at only)
CREATE POLICY wishlist_connected_claim ON wishlist_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM connections
      WHERE status = 'connected'
        AND (
          (requester_id = auth.uid() AND recipient_id = wishlist_items.user_id)
          OR
          (recipient_id = auth.uid() AND requester_id = wishlist_items.user_id)
        )
    )
  );

-- ---- scrape_logs ----
-- Only the owning user (or service role) can read their own logs
CREATE POLICY scrape_logs_own ON scrape_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Insert allowed for authenticated users
CREATE POLICY scrape_logs_insert ON scrape_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);
