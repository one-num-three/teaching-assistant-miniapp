import { localDb } from '@/mock/localDb';

export const getProjects = async (): Promise<any[]> => {
  return localDb.listProjects();
};

export const getProjectDetail = async (projectId: string): Promise<any> => {
  const project = localDb.getProjectDetail(projectId);
  if (!project) throw new Error('项目不存在');
  return project;
};

export const publishProject = async (payload: any): Promise<any> => {
  return localDb.publishProject(payload);
};

export const claimProjectLeader = async (projectId: string): Promise<any> => {
  return localDb.claimProjectLeader(projectId);
};

export const claimPosition = async (projectId: string, positionKey: string): Promise<any> => {
  return localDb.claimPosition(projectId, positionKey as any);
};

export const uploadLesson = async (projectId: string, payload: any): Promise<any> => {
  return localDb.submitLesson(projectId, payload);
};

export const getReviewProjects = async (): Promise<any[]> => {
  return localDb.listReviewProjects();
};

export const reviewLesson = async (projectId: string, action: 'approve' | 'reject', comment?: string): Promise<any> => {
  return localDb.reviewLesson(projectId, action, comment);
};
