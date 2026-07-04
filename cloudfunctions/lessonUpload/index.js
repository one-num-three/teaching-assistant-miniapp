// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { projectId, fileId, fileName } = event

  if (!openid || !projectId || !fileId) {
    return { code: 400, msg: '参数缺失' }
  }

  try {
    const userRes = await db.collection('users').where({ openid }).get()
    if (userRes.data.length === 0) return { code: 403, msg: '用户未注册' }
    
    // 获取项目信息
    const projectRes = await db.collection('projects').doc(projectId).get()
    const project = projectRes.data
    
    // 权限校验：只有主讲人可以上传教案
    if (!project.leader || project.leader.user_id !== openid) {
      return { code: 403, msg: '只有该档期的主讲人可以上传教案' }
    }

    const transaction = await db.startTransaction()
    try {
      // 写入 lessons 集合
      const lessonRes = await transaction.collection('lessons').add({
        data: {
          project_id: projectId,
          uploader_id: openid,
          file_id: fileId,
          file_name: fileName || '教案文件',
          status: 'pending_review',
          created_at: db.serverDate(),
          updated_at: db.serverDate()
        }
      })

      // 更新项目状态为 待审核
      await transaction.collection('projects').doc(projectId).update({
        data: {
          lesson_status: 'pending_review',
          lesson_id: lessonRes._id, // 关联最新的教案 ID
          updated_at: db.serverDate(),
          updated_by: openid
        }
      })

      await transaction.commit()
      
      // 事务外：通知管理员审核 (仅作记录)
      await db.collection('notifications').add({
        data: {
          user_id: 'ADMIN_GROUP', // 广播给管理员
          type: 'lesson_pending_review',
          title: '有新教案待审核',
          content: `${project.leader.name} 上传了教案，请及时审核。`,
          related_project_id: projectId,
          read_at: null,
          created_at: db.serverDate()
        }
      }).catch(e => console.error(e))

      return { code: 0, msg: '提交成功，等待审核' }

    } catch (e) {
      await transaction.rollback()
      console.error('Transaction error', e)
      return { code: 500, msg: '提交失败，事务冲突', error: e }
    }

  } catch (err) {
    console.error(err)
    return { code: 500, msg: '服务器内部错误', error: err }
  }
}
