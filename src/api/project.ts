import { callCloudFunction } from '@/utils/platform';

export const getProjects = async (params?: any): Promise<any[]> => {
  // 由于 CloudBase 可以在前端直接查库（符合权限下），为了安全和抽象，这里演示云端请求。
  // MVP 期间也可以直接在前端 db.collection('projects') 读。
  // 为了符合之前 "所有写操作只允许通过云函数" 的规则，读操作可以前台读取，也可以封装云函数。
  // 这里写一个简单的云函数模拟，或者前端直连。为了符合最小化权限，建议复杂查询走云函数，简单列表走前端。
  // 这里使用 callCloudFunction 以备扩展，实际开发中可以根据微信云开发规则决定。
  return callCloudFunction<any[]>('getProjects', params);
};

export const publishProject = async (payload: any): Promise<any> => {
  return callCloudFunction<any>('publishProject', payload);
};

export const claimProjectLeader = async (projectId: string): Promise<any> => {
  return callCloudFunction<any>('claimProjectLeader', { projectId });
};

export const claimPosition = async (projectId: string, positionKey: string): Promise<any> => {
  return callCloudFunction<any>('claimPosition', { projectId, positionKey });
};

export const uploadLesson = async (projectId: string, fileId: string, fileName: string): Promise<any> => {
  return callCloudFunction<any>('lessonUpload', { projectId, fileId, fileName });
};

export const reviewLesson = async (lessonId: string, action: 'approve' | 'reject', comment?: string): Promise<any> => {
  return callCloudFunction<any>('reviewLesson', { lessonId, action, comment });
};
