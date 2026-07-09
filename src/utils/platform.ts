export const callCloudFunction = async <T = any>(name: string, data: any = {}): Promise<T> => {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    wx.cloud.callFunction({
      name,
      data,
      success: (res: any) => {
        const result = res.result;
        if (result && result.code === 0) {
          resolve(result.data as T);
        } else {
          reject(result || new Error('云函数调用失败'));
        }
      },
      fail: reject
    });
    // #endif

    // #ifndef MP-WEIXIN
    reject(new Error('H5 本地调试不调用云函数'));
    // #endif
  });
};

export const chooseFile = async (count = 1): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    wx.chooseMessageFile({
      count,
      type: 'file',
      extension: ['.pdf', '.doc', '.docx', '.ppt', '.pptx'],
      success: (res: any) => resolve(res.tempFiles),
      fail: reject
    });
    // #endif

    // #ifndef MP-WEIXIN
    resolve([
      {
        name: '本地测试教案.pdf',
        size: 2.4 * 1024 * 1024,
        path: 'local://lesson-plan.pdf'
      }
    ]);
    // #endif
  });
};

export const uploadFile = async (cloudPath: string, filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: (res: any) => resolve(res.fileID),
      fail: reject
    });
    // #endif

    // #ifndef MP-WEIXIN
    resolve(`local-file://${cloudPath}`);
    // #endif
  });
};

export const getTempFileURL = async (fileList: string[]): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    wx.cloud.getTempFileURL({
      fileList,
      success: (res: any) => resolve(res.fileList),
      fail: reject
    });
    // #endif

    // #ifndef MP-WEIXIN
    resolve(fileList.map((fileID) => ({ fileID, tempFileURL: fileID })));
    // #endif
  });
};

export const openDocument = (filePath: string, fileType?: string) => {
  // #ifdef MP-WEIXIN
  wx.openDocument({
    filePath,
    fileType: fileType as any,
    showMenu: true,
    fail: (err: any) => {
      uni.showToast({ title: '打开文件失败', icon: 'none' });
      console.error('openDocument err', err);
    }
  });
  // #endif

  // #ifndef MP-WEIXIN
  uni.showToast({ title: 'H5 本地调试使用模拟文件', icon: 'none' });
  // #endif
};
