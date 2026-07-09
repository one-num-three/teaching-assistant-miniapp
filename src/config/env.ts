const DEFAULT_LOCAL_API = 'http://127.0.0.1:3100/api';

export const API_BASE_URL = DEFAULT_LOCAL_API;

export const DEV_USER_STORAGE_KEY = 'teaching_assistant_dev_user_id';

export function getDevUserId() {
  return uni.getStorageSync(DEV_USER_STORAGE_KEY) || 'admin-1';
}

export function setDevUserId(userId: string) {
  uni.setStorageSync(DEV_USER_STORAGE_KEY, userId);
}
