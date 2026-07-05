import { localDb } from '@/mock/localDb';
import type { User } from '@/types/user';

export const login = async (): Promise<User> => {
  return localDb.login();
};

export const updateUserProfile = async (profileData: Partial<User>): Promise<User> => {
  return localDb.updateUserProfile(profileData);
};
