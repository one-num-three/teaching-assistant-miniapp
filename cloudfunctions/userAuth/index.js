// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return { code: 401, msg: '获取 openid 失败' }
  }

  try {
    // 检查用户是否已存在
    const userRes = await db.collection('users').where({
      openid: openid
    }).get()

    let userInfo = null;

    if (userRes.data.length === 0) {
      // 新用户，默认 guest
      userInfo = {
        openid: openid,
        roles: ['guest'],
        created_at: db.serverDate(),
        updated_at: db.serverDate()
      }
      await db.collection('users').add({
        data: userInfo
      })
    } else {
      userInfo = userRes.data[0]
    }

    return {
      code: 0,
      msg: 'success',
      data: userInfo
    }
  } catch (err) {
    console.error(err)
    return {
      code: 500,
      msg: '服务器内部错误',
      error: err
    }
  }
}
