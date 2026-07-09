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
