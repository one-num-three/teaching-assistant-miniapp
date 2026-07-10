import { request } from '@/utils/request';

export const getProjects = async (): Promise<any[]> => {
  return request<any[]>('/projects');
};

export const getProjectDetail = async (projectId: string): Promise<any> => {
  return request<any>(`/projects/${projectId}`);
};

export const publishProject = async (payload: any): Promise<any> => {
  return request<any>('/projects', {
    method: 'POST',
    data: payload
  });
};

export const claimProjectLeader = async (projectId: string): Promise<any> => {
  return request<any>(`/projects/${projectId}/claim-leader`, {
    method: 'POST'
  });
};

export const claimPosition = async (projectId: string, positionKey: string): Promise<any> => {
  return request<any>(`/projects/${projectId}/claim-position`, {
    method: 'POST',
    data: { positionKey }
  });
};

export const cancelPosition = async (projectId: string, positionKey: string): Promise<any> => {
  return request<any>(`/projects/${projectId}/cancel-position`, {
    method: 'POST',
    data: { positionKey }
  });
};

export const uploadLesson = async (projectId: string, payload: any): Promise<any> => {
  return request<any>(`/projects/${projectId}/submit-lesson`, {
    method: 'POST',
    data: payload
  });
};

export const getReviewProjects = async (): Promise<any[]> => {
  const projects = await request<any[]>('/admin/projects');
  return projects.filter((project) => project.lesson_status === 'pending_review');
};

export const getAdminProjects = async (): Promise<any[]> => {
  return request<any[]>('/admin/projects');
};

export const reviewLesson = async (projectId: string, action: 'approve' | 'reject', comment?: string): Promise<any> => {
  return request<any>(`/projects/${projectId}/review`, {
    method: 'POST',
    data: { action, comment }
  });
};

export const getProjectReviews = async (projectId: string): Promise<any[]> => {
  return request<any[]>(`/projects/${projectId}/reviews`);
};

export const submitProjectCompletion = async (projectId: string, payload: any): Promise<any> => {
  return request<any>(`/projects/${projectId}/complete`, {
    method: 'POST',
    data: payload
  });
};

export const getCompletionProjects = async (): Promise<any[]> => {
  return request<any[]>('/admin/completions');
};

export const reviewProjectCompletion = async (projectId: string, action: 'approve' | 'reject', comment?: string): Promise<any> => {
  return request<any>(`/projects/${projectId}/review-completion`, {
    method: 'POST',
    data: { action, comment }
  });
};

export const cancelProject = async (projectId: string, reason: string): Promise<any> => {
  return request<any>(`/projects/${projectId}/cancel-project`, {
    method: 'POST',
    data: { reason }
  });
};

export const removeProjectMember = async (
  projectId: string,
  positionKey: string,
  targetUserId: string,
  reason: string
): Promise<any> => {
  return request<any>(`/projects/${projectId}/remove-member`, {
    method: 'POST',
    data: { positionKey, targetUserId, reason }
  });
};
