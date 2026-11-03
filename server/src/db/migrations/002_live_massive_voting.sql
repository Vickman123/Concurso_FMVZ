-- Migration 002: Live Massive Voting Table and Stage Session Extension

ALTER TABLE live_stage_session ADD COLUMN IF NOT EXISTS is_massive_active BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS live_massive_votes (
  id SERIAL PRIMARY KEY,
  voter_id INTEGER NOT NULL REFERENCES voters(id) ON DELETE CASCADE,
  participant_id INTEGER NOT NULL REFERENCES participants(id) ON DELETE CASCADE,
  vote_value VARCHAR(10) NOT NULL DEFAULT 'yes',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT live_massive_votes_voter_participant_key UNIQUE (voter_id, participant_id)
);

CREATE INDEX IF NOT EXISTS idx_live_massive_votes_participant ON live_massive_votes(participant_id);
CREATE INDEX IF NOT EXISTS idx_live_massive_votes_voter ON live_massive_votes(voter_id);
