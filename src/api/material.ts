import { request } from '@/utils/request';

export const getMaterials = async (): Promise<any[]> => {
  return request<any[]>('/materials');
};
