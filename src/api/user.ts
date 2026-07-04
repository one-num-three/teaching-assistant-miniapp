import { callCloudFunction } from '@/utils/platform';
import type { User } from '@/types/user';

export const login = async (): Promise<User> => {
  return callCloudFunction<User>('userAuth');
};

export const updateUserProfile = async (profileData: any): Promise<User> => {
  return callCloudFunction<User>('userUpdate', profileData);
};
