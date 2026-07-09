import { API_BASE_URL, getDevUserId } from '@/config/env';

type Method = 'GET' | 'POST';

interface RequestOptions {
  method?: Method;
  data?: any;
  headers?: Record<string, string>;
}

export function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;

  return new Promise((resolve, reject) => {
    uni.request({
      url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'content-type': 'application/json',
        'x-dev-user-id': getDevUserId(),
        ...(options.headers || {})
      },
      success: (res: any) => {
        const body = res.data || {};
        if (res.statusCode >= 200 && res.statusCode < 300 && body.code === 0) {
          resolve(body.data as T);
          return;
        }

        const error = new Error(body.msg || `请求失败：${res.statusCode}`);
        (error as any).code = body.code;
        (error as any).statusCode = res.statusCode;
        reject(error);
      },
      fail: (err) => {
        const error = new Error(err.errMsg || '网络请求失败');
        (error as any).code = 'NETWORK_ERROR';
        reject(error);
      }
    });
  });
}
