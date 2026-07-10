import { request } from '@/utils/request';

export const getMaterials = async (): Promise<any[]> => {
  return request<any[]>('/materials');
};

export const getMaterialDetail = async (materialId: string): Promise<any> => {
  return request<any>(`/materials/${materialId}`);
};

export const getFavoriteMaterials = async (): Promise<any[]> => {
  return request<any[]>('/me/favorites');
};

export const toggleMaterialFavorite = async (materialId: string): Promise<{ favorite: boolean }> => {
  return request<{ favorite: boolean }>(`/materials/${materialId}/favorite`, { method: 'POST' });
};
