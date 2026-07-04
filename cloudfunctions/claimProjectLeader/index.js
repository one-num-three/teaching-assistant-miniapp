// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { projectId } = event

  if (!openid || !projectId) {
    return { code: 400, msg: '参数缺失或无权限' }
  }

  try {
    // 1. 鉴权：获取用户信息，检查角色
    const userRes = await db.collection('users').where({ openid }).get()
    if (userRes.data.length === 0) {
      return { code: 403, msg: '用户未注册' }
    }
    const user = userRes.data[0]
    const roles = user.roles || []
    
    // 需要 member 及以上权限
    if (!roles.includes('member') && !roles.includes('admin') && !roles.includes('super_admin')) {
      return { code: 403, msg: '无权限，请先完成身份认证' }
    }

    // 2. 事务处理
    const transaction = await db.startTransaction()
    try {
      // 悲观锁读取项目信息（通过在事务中先读再写，CloudBase 事务在冲突时会自动重试或报错）
      const projectDoc = await transaction.collection('projects').doc(projectId).get()
      const project = projectDoc.data

      // 检查项目状态是否为 pending_claim
      if (project.project_status !== 'pending_claim') {
        await transaction.rollback(-100)
        return { code: 409, msg: '该档期已不在待认领状态' }
      }

      // 准备写 projects 集合
      const updateData = {
        project_status: 'recruiting', // 认领主讲后进入招募助教阶段
        leader: {
          user_id: openid,
          name: user.name || '未知',
          avatar: user.avatar || ''
        },
        updated_at: db.serverDate(),
        updated_by: openid
      }

      // 将主讲人也加入到 positions.lecturer.members
      const lecturerMembers = project.positions && project.positions.lecturer && project.positions.lecturer.members ? project.positions.lecturer.members : []
      lecturerMembers.push({
        user_id: openid,
        name: user.name || '未知',
        avatar: user.avatar || '',
        claimed_at: db.serverDate()
      })

      if (!updateData.positions) updateData.positions = project.positions || {}
      if (!updateData.positions.lecturer) updateData.positions.lecturer = { total: 1, members: [] }
      updateData.positions.lecturer.members = lecturerMembers

      await transaction.collection('projects').doc(projectId).update({
        data: updateData
      })

      // 写 project_claims 审计日志
      await transaction.collection('project_claims').add({
        data: {
          project_id: projectId,
          user_id: openid,
          role: 'leader',
          action: 'claim',
          created_at: db.serverDate(),
          operator_id: openid
        }
      })

      await transaction.commit()
      
      // 事务外：可以写站内通知（不影响认领成功结果）
      await db.collection('notifications').add({
        data: {
          user_id: openid,
          type: 'position_claimed',
          title: '认领成功',
          content: '您已成功认领项目主讲负责人！',
          related_project_id: projectId,
          read_at: null,
          created_at: db.serverDate()
        }
      }).catch(err => console.error('通知发送失败，但不影响主干:', err))

      return { code: 0, msg: '认领成功' }
    } catch (e) {
      console.error('事务冲突或失败', e)
      await transaction.rollback()
      // 云开发抛出的事务冲突异常可以捕获
      if (e === -100) {
        return { code: 409, msg: '状态不对或档期已被抢占' }
      }
      return { code: 500, msg: '手慢了，档期可能已被抢占', error: e }
    }
  } catch (err) {
    console.error(err)
    return { code: 500, msg: '服务器内部错误', error: err }
  }
}
