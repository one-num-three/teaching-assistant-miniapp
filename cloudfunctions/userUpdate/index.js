// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID

  if (!openid) {
    return { code: 401, msg: '无权限' }
  }

  const { name, college, grade, student_id, phone } = event

  if (!name || !college || !grade || !student_id || !phone) {
    return { code: 400, msg: '资料不完整' }
  }

  try {
    const userRes = await db.collection('users').where({ openid }).get()

    if (userRes.data.length === 0) {
      return { code: 404, msg: '用户不存在' }
    }

    const user = userRes.data[0]
    
    // 更新资料，并将 roles 中的 guest 升级为 member（如果原来只有 guest）
    let roles = user.roles || ['guest']
    if (roles.includes('guest') && !roles.includes('member')) {
      roles = roles.filter(r => r !== 'guest')
      roles.push('member')
    }

    await db.collection('users').where({ openid }).update({
      data: {
        name,
        college,
        grade,
        student_id,
        phone,
        roles,
        updated_at: db.serverDate()
      }
    })

    return {
      code: 0,
      msg: 'success',
      data: {
        roles
      }
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
