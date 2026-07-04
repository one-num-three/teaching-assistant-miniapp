// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { projectId, positionKey } = event // positionKey e.g. 'assistant'

  if (!openid || !projectId || !positionKey) {
    return { code: 400, msg: '参数缺失' }
  }

  try {
    const userRes = await db.collection('users').where({ openid }).get()
    if (userRes.data.length === 0) {
      return { code: 403, msg: '用户未注册' }
    }
    const user = userRes.data[0]
    const roles = user.roles || []
    
    if (!roles.includes('member') && !roles.includes('admin') && !roles.includes('super_admin')) {
      return { code: 403, msg: '无权限，请先完成身份认证' }
    }

    const transaction = await db.startTransaction()
    try {
      const projectDoc = await transaction.collection('projects').doc(projectId).get()
      const project = projectDoc.data

      if (project.project_status !== 'recruiting') {
        await transaction.rollback(-100)
        return { code: 409, msg: '项目当前不在招募阶段' }
      }

      const positions = project.positions || {}
      const targetPosition = positions[positionKey]
      
      if (!targetPosition) {
        await transaction.rollback(-101)
        return { code: 404, msg: '该岗位不存在' }
      }

      const currentMembers = targetPosition.members || []
      
      // 检查是否已经满员
      if (currentMembers.length >= targetPosition.total) {
        await transaction.rollback(-102)
        return { code: 'PROJECT_FULL', msg: '该岗位已被认领满了' }
      }

      // 检查是否重复认领
      const isAlreadyClaimed = currentMembers.some(m => m.user_id === openid)
      if (isAlreadyClaimed) {
        await transaction.rollback(-103)
        return { code: 'ALREADY_CLAIMED', msg: '您已经认领了该岗位，不可重复认领' }
      }

      // 新增成员
      currentMembers.push({
        user_id: openid,
        name: user.name || '未知',
        avatar: user.avatar || '',
        claimed_at: db.serverDate()
      })
      
      targetPosition.members = currentMembers
      positions[positionKey] = targetPosition

      // 检查整个项目的所有辅助岗位是否都满了，满员则自动 locked
      let allFull = true
      for (const key in positions) {
        const p = positions[key]
        const count = p.members ? p.members.length : 0
        if (count < p.total) {
          allFull = false
          break
        }
      }

      const updateData = {
        positions,
        updated_at: db.serverDate(),
        updated_by: openid
      }

      if (allFull) {
        updateData.project_status = 'locked'
      }

      await transaction.collection('projects').doc(projectId).update({
        data: updateData
      })

      // 审计日志
      await transaction.collection('project_claims').add({
        data: {
          project_id: projectId,
          user_id: openid,
          role: positionKey,
          action: 'claim',
          created_at: db.serverDate(),
          operator_id: openid
        }
      })

      await transaction.commit()
      
      // 事务外副作用：发送站内信
      await db.collection('notifications').add({
        data: {
          user_id: openid,
          type: 'position_claimed',
          title: '岗位认领成功',
          content: `您已成功认领 ${positionKey} 岗位。${allFull ? '当前项目招募已满，进入执行阶段。' : ''}`,
          related_project_id: projectId,
          read_at: null,
          created_at: db.serverDate()
        }
      }).catch(e => console.error('Notification failed', e))

      return { code: 0, msg: '认领成功', data: { isLocked: allFull } }

    } catch (e) {
      await transaction.rollback()
      console.error('Transaction fail:', e)
      if (e === -100) return { code: 409, msg: '项目状态异常' }
      if (e === -101) return { code: 404, msg: '该岗位不存在' }
      if (e === -102) return { code: 'PROJECT_FULL', msg: '手慢了，该岗位已被认领满了' }
      if (e === -103) return { code: 'ALREADY_CLAIMED', msg: '您已经认领过了' }
      
      return { code: 500, msg: '并发冲突，请重试', error: e }
    }

  } catch (err) {
    console.error(err)
    return { code: 500, msg: '服务器错误', error: err }
  }
}
