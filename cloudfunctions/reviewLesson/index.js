// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV }) // 使用当前云环境
const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { lessonId, action, comment } = event // action: 'approve' | 'reject'

  if (!openid || !lessonId || !action) {
    return { code: 400, msg: '参数缺失' }
  }

  try {
    const userRes = await db.collection('users').where({ openid }).get()
    if (userRes.data.length === 0) return { code: 403, msg: '用户未注册' }
    
    const roles = userRes.data[0].roles || []
    if (!roles.includes('admin') && !roles.includes('super_admin')) {
      return { code: 403, msg: '只有管理员可以审核教案' }
    }

    const transaction = await db.startTransaction()
    try {
      const lessonDoc = await transaction.collection('lessons').doc(lessonId).get()
      const lesson = lessonDoc.data
      const projectId = lesson.project_id

      if (lesson.status !== 'pending_review') {
        await transaction.rollback(-100)
        return { code: 409, msg: '该教案不在待审核状态' }
      }

      const newLessonStatus = action === 'approve' ? 'approved' : 'rejected'
      const newProjectLessonStatus = action === 'approve' ? 'approved' : 'revision_required'

      // 更新教案本身状态
      await transaction.collection('lessons').doc(lessonId).update({
        data: {
          status: newLessonStatus,
          review_comment: comment || '',
          reviewer_id: openid,
          reviewed_at: db.serverDate(),
          updated_at: db.serverDate()
        }
      })

      // 更新项目身上的聚合状态
      await transaction.collection('projects').doc(projectId).update({
        data: {
          lesson_status: newProjectLessonStatus,
          updated_at: db.serverDate(),
          updated_by: openid
        }
      })

      await transaction.commit()

      // 发送通知给主讲人
      const title = action === 'approve' ? '教案已通过' : '教案被驳回'
      const content = action === 'approve' 
        ? '您的教案已通过审核，请做好上课准备。' 
        : `您的教案被驳回，请修改后重新提交。审批意见：${comment || '无'}`
        
      await db.collection('notifications').add({
        data: {
          user_id: lesson.uploader_id,
          type: 'lesson_reviewed',
          title,
          content,
          related_project_id: projectId,
          read_at: null,
          created_at: db.serverDate()
        }
      }).catch(e => console.error('Notify fail:', e))

      return { code: 0, msg: '审核操作成功' }

    } catch (e) {
      await transaction.rollback()
      console.error('Transaction fail:', e)
      if (e === -100) return { code: 409, msg: '状态异常，可能已被他人审核' }
      return { code: 500, msg: '并发冲突，请重试', error: e }
    }

  } catch (err) {
    console.error(err)
    return { code: 500, msg: '服务器错误', error: err }
  }
}
