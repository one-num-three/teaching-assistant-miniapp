import { setDevUserId } from '@/config/env';
import { request } from '@/utils/request';
import type { User } from '@/types/user';

export const login = async (): Promise<User> => {
  return request<User>('/me');
};

export const updateUserProfile = async (profileData: Partial<User>): Promise<User> => {
  return request<User>('/me', {
    method: 'POST',
    data: profileData
  });
};

export const switchDevUser = async (userId: string): Promise<User> => {
  const user = await request<User>('/dev/switch-user', {
    method: 'POST',
    data: { userId }
  });
  setDevUserId(userId);
  return user;
};

export const resetDevData = async (): Promise<void> => {
  await request('/dev/reset', { method: 'POST' });
  setDevUserId('admin-1');
};

export const getVolunteerHours = async (): Promise<any[]> => {
  return request<any[]>('/me/volunteer-hours');
};

export const getNotifications = async (): Promise<any[]> => request<any[]>('/notifications');

export const markNotificationRead = async (notificationId: string): Promise<any> => {
  return request<any>(`/notifications/${notificationId}/read`, { method: 'POST' });
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await request('/notifications/read-all', { method: 'POST' });
};

export const getReimbursements = async (): Promise<any[]> => request<any[]>('/me/reimbursements');

export const submitReimbursement = async (payload: any): Promise<any> => {
  return request<any>('/me/reimbursements', { method: 'POST', data: payload });
};

export const getAdminReimbursements = async (): Promise<any[]> => request<any[]>('/admin/reimbursements');

export const reviewReimbursement = async (
  reimbursementId: string,
  action: 'approve' | 'reject' | 'paid',
  comment?: string
): Promise<any> => {
  return request<any>(`/reimbursements/${reimbursementId}/review`, {
    method: 'POST',
    data: { action, comment }
  });
};

export const getVolunteerCertificate = async (): Promise<any> => request<any>('/me/volunteer-certificate');
