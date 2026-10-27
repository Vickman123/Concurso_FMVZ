-- FMVZ HALLOWEEN: Segundo Concurso de Disfraces UNAM 2026
-- Database Schema: PostgreSQL

CREATE TABLE IF NOT EXISTS contest_settings (
  id INT PRIMARY KEY DEFAULT 1,
  contest_name VARCHAR(255) NOT NULL DEFAULT 'Segundo Concurso de Disfraces FMVZ',
  contest_date VARCHAR(50) NOT NULL DEFAULT '2026-11-03',
  registration_limit INT NOT NULL DEFAULT 100,
  voting_status VARCHAR(50) NOT NULL DEFAULT 'open' CHECK (voting_status IN ('upcoming', 'open', 'paused', 'closed')),
  voting_start TIMESTAMP WITH TIME ZONE,
  voting_end TIMESTAMP WITH TIME ZONE,
  results_publication_status VARCHAR(50) NOT NULL DEFAULT 'hidden' CHECK (results_publication_status IN ('hidden', 'published')),
  additional_prizes_method TEXT DEFAULT 'Modalidad por definir en las bases oficiales',
  is_live_active BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prize_categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  amount_mxn NUMERIC(10, 2) NOT NULL,
  allocation_method TEXT NOT NULL,
  rank_position INT,
  quantity INT DEFAULT 1,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS admins (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'operator' CHECK (role IN ('admin', 'operator')),
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS participants (
  id SERIAL PRIMARY KEY,
  contest_number INT UNIQUE NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  public_display_name VARCHAR(255) NOT NULL,
  costume_title VARCHAR(255) NOT NULL,
  description TEXT,
  participant_type VARCHAR(50) NOT NULL CHECK (participant_type IN ('student', 'worker')),
  institutional_identifier VARCHAR(50) NOT NULL,
  photo_original_key TEXT NOT NULL,
  photo_thumbnail_key TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'needs_correction', 'rejected', 'inactive')),
  registration_folio VARCHAR(64) UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS voters (
  id SERIAL PRIMARY KEY,
  full_name VARCHAR(255) NOT NULL,
  voter_type VARCHAR(50) NOT NULL CHECK (voter_type IN ('student', 'worker')),
  normalized_identifier VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_voter_identity UNIQUE (voter_type, normalized_identifier)
);

CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  voter_id INT UNIQUE NOT NULL REFERENCES voters(id) ON DELETE CASCADE,
  participant_id INT NOT NULL REFERENCES participants(id) ON DELETE RESTRICT,
  confirmation_folio VARCHAR(64) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'annulled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  admin_id INT REFERENCES admins(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  reason TEXT,
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS live_stage_session (
  id INT PRIMARY KEY DEFAULT 1,
  stage_status VARCHAR(50) NOT NULL DEFAULT 'waiting' CHECK (stage_status IN ('waiting', 'presenting', 'voting_open', 'voting_closed', 'podium')),
  current_participant_id INT REFERENCES participants(id) ON DELETE SET NULL,
  voting_seconds_left INT DEFAULT 30,
  total_cheers INT DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS live_votes (
  id SERIAL PRIMARY KEY,
  voter_id INT REFERENCES voters(id) ON DELETE CASCADE,
  participant_id INT REFERENCES participants(id) ON DELETE CASCADE,
  vote_value VARCHAR(10) NOT NULL DEFAULT 'yes',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT unique_live_voter_participant UNIQUE (voter_id, participant_id)
);

CREATE TABLE IF NOT EXISTS live_reactions (
  id SERIAL PRIMARY KEY,
  emoji VARCHAR(20) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance and concurrency
CREATE INDEX IF NOT EXISTS idx_participants_contest_number ON participants(contest_number);
CREATE INDEX IF NOT EXISTS idx_participants_status ON participants(status);
CREATE INDEX IF NOT EXISTS idx_participants_type ON participants(participant_type);
CREATE INDEX IF NOT EXISTS idx_voters_normalized ON voters(voter_type, normalized_identifier);
CREATE INDEX IF NOT EXISTS idx_votes_participant ON votes(participant_id);
CREATE INDEX IF NOT EXISTS idx_votes_confirmation_folio ON votes(confirmation_folio);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_live_votes_participant ON live_votes(participant_id);
CREATE INDEX IF NOT EXISTS idx_live_reactions_created ON live_reactions(created_at DESC);

-- Automatic migrations for columns if table previously created
ALTER TABLE contest_settings ADD COLUMN IF NOT EXISTS is_live_active BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE live_stage_session ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT FALSE;

