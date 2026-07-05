import { localDb } from '@/mock/localDb';

export const getMaterials = async (): Promise<any[]> => {
  return localDb.listMaterials();
};
