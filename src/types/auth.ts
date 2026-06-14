export type UserRole = 'admin' | 'manager' | 'user';

export interface AdminAccount {
  id: string;
  username: string;
  password_hash: string;
  role: UserRole;
  license_quota: number;
  licenses_created: number;
  created_at: string;
  updated_at: string;
}

export interface ActivationKey {
  id: string;
  key_value: string;
  username: string;
  password_hash: string;
  duration_days: number;
  hwid: string | null;
  created_at: string;
  expires_at: string;
  is_active: boolean;
  last_hwid_reset_at: string | null;
  hwid_reset_count_today: number;
  last_reset_date: string | null;
  created_by: string | null;
}

export interface HwidResetLog {
  id: string;
  activation_key_id: string;
  reset_by: string;
  reset_at: string;
  days_deducted: number;
}

export interface ActivityLog {
  id: string;
  admin_id: string;
  admin_username: string;
  action_type: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, any> | null;
  created_at: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: AdminAccount | ActivationKey | null;
  userType: 'admin' | 'manager' | 'user' | null;
}
