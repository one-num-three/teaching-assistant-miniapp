/**
 * 平台环境 API 隔离封装
 * 统一管理微信专用 API，禁止在页面内直接散落 wx.*
 */

// 调用云函数
export const callCloudFunction = async <T = any>(name: string, data: any = {}): Promise<T> => {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    wx.cloud.callFunction({
      name,
      data,
      success: (res: any) => {
        const result = res.result
        if (result && result.code === 0) {
          resolve(result.data as T)
        } else {
          // 统一错误处理
          reject(result || new Error('云函数调用失败'))
        }
      },
      fail: (err: any) => {
        reject(err)
      }
    })
    // #endif
    // #ifndef MP-WEIXIN
    console.warn('非微信环境，暂不支持云函数调用:', name)
    reject(new Error('非微信环境'))
    // #endif
  })
}

// 选择文件（微信环境专属，从聊天记录选择文件）
export const chooseFile = async (count = 1): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    wx.chooseMessageFile({
      count,
      type: 'file', // 可选 'file', 'image', 'all'
      extension: ['.pdf', '.doc', '.docx', '.ppt', '.pptx'],
      success: (res: any) => {
        resolve(res.tempFiles)
      },
      fail: (err: any) => {
        reject(err)
      }
    })
    // #endif
    // #ifndef MP-WEIXIN
    reject(new Error('非微信环境暂不支持从聊天记录选择文件'))
    // #endif
  })
}

// 上传文件到云存储
export const uploadFile = async (cloudPath: string, filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    wx.cloud.uploadFile({
      cloudPath,
      filePath, // 文件路径
      success: (res: any) => {
        // 返回文件 ID
        resolve(res.fileID)
      },
      fail: (err: any) => {
        reject(err)
      }
    })
    // #endif
    // #ifndef MP-WEIXIN
    reject(new Error('非微信环境暂不支持云存储'))
    // #endif
  })
}
// 获取临时防盗链下载地址
export const getTempFileURL = async (fileList: string[]): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    wx.cloud.getTempFileURL({
      fileList,
      success: (res: any) => {
        resolve(res.fileList)
      },
      fail: (err: any) => {
        reject(err)
      }
    })
    // #endif
    // #ifndef MP-WEIXIN
    reject(new Error('非微信环境暂不支持获取临时链接'))
    // #endif
  })
}

// 预览文件
export const openDocument = (filePath: string, fileType?: string) => {
  // #ifdef MP-WEIXIN
  wx.openDocument({
    filePath,
    fileType: fileType as any,
    showMenu: true,
    fail: (err: any) => {
      uni.showToast({ title: '打开文件失败', icon: 'none' })
      console.error('openDocument err', err)
    }
  })
  // #endif
}
