export interface Participant {
  id?: number;
  contest_number: number;
  full_name?: string;
  public_display_name: string;
  costume_title: string;
  description: string;
  participant_type: 'student' | 'worker';
  institutional_identifier?: string;
  photo_original_key: string;
  photo_thumbnail_key?: string;
  status: 'pending' | 'approved' | 'needs_correction' | 'rejected' | 'inactive';
  registration_folio?: string;
  votes_count?: number;
  created_at: string;
  updated_at?: string;
}

export interface ContestSettings {
  contest_name: string;
  contest_date: string;
  registration_limit: number;
  voting_status: 'upcoming' | 'open' | 'paused' | 'closed';
  voting_start: string | null;
  voting_end: string | null;
  results_publication_status: 'hidden' | 'published';
  additional_prizes_method: string;
  is_live_active?: boolean;
  total_registered: number;
  approved_count: number;
}

export interface PrizeCategory {
  id: number;
  name: string;
  amount_mxn: number | string;
  allocation_method: string;
  rank_position: number;
  quantity: number;
  status?: string;
}

export interface VoterIdentity {
  full_name: string;
  voter_type: 'student' | 'worker';
  institutional_identifier: string;
  institutional_identifier_masked?: string;
}

export interface VoteReceipt {
  confirmation_folio: string;
  voted_at: string;
  participant: {
    contest_number: number;
    public_display_name: string;
    costume_title: string;
    photo: string;
  };
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'operator';
}

export interface AuditLogItem {
  id: number;
  action: string;
  entity_type: string;
  entity_id: string;
  timestamp: string;
  reason: string;
  metadata: any;
  admin_name?: string;
  admin_email?: string;
}
