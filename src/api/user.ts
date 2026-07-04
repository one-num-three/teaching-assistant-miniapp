import { callCloudFunction } from '@/utils/platform';
import type { UserRole } from '@/constants/status';
import type { User } from '@/types/user';

export const login = async (): Promise<User> => {
  return callCloudFunction<User>('userAuth');
};

export const updateUserProfile = async (profileData: any): Promise<{ roles: UserRole[] }> => {
  return callCloudFunction<{ roles: UserRole[] }>('userUpdate', profileData);
};
