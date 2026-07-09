import { request } from '@/utils/request';

export interface DevStateCount {
  users: number;
  projects: number;
  materials: number;
  claims: number;
  reviews: number;
  notifications: number;
}

export interface DevStateLog {
  _id: string;
  title: string;
  subtitle: string;
  created_at: number;
}

export interface DevState {
  currentUserId: string;
  counts: DevStateCount;
  recentClaims: DevStateLog[];
  recentReviews: DevStateLog[];
  recentNotifications: DevStateLog[];
}

export const getDevState = async (): Promise<DevState> => {
  return request<DevState>('/dev/state');
};
