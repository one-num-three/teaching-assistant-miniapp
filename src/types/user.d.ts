import type { UserRole } from '@/constants/status';

export interface User {
  openid: string;
  avatar?: string;
  name?: string;
  college?: string;
  grade?: string;
  phone?: string;
  student_id?: string;
  roles: UserRole[];
  stats?: {
    joined_projects?: number;
    completed_lessons?: number;
    volunteer_hours?: number;
    leader_count?: number;
  };
  created_at?: number;
  updated_at?: number;
}
