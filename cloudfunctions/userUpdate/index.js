const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function upgradeRoles(existingRoles) {
  const roles = Array.isArray(existingRoles) ? existingRoles.filter(Boolean) : [];
  const nextRoles = roles.filter((role) => role !== 'guest');

  if (!nextRoles.includes('member')) {
    nextRoles.push('member');
  }

  return Array.from(new Set(nextRoles));
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (!openid) {
    return { code: 'NO_PERMISSION', msg: '无权限' };
  }

  const name = normalizeText(event.name);
  const college = normalizeText(event.college);
  const grade = normalizeText(event.grade);
  const phone = normalizeText(event.phone);
  const studentId = normalizeText(event.student_id);

  if (!name || !college || !grade || !phone) {
    return { code: 'PROFILE_INCOMPLETE', msg: '资料不完整' };
  }

  try {
    const users = db.collection('users');
    const userRes = await users.where({ openid }).limit(1).get();

    if (userRes.data.length === 0) {
      return { code: 'USER_NOT_FOUND', msg: '用户不存在' };
    }

    const user = userRes.data[0];
    const roles = upgradeRoles(user.roles);
    const updateData = {
      name,
      college,
      grade,
      phone,
      roles,
      updated_at: db.serverDate()
    };

    if (studentId) {
      updateData.student_id = studentId;
    }

    await users.doc(user._id).update({ data: updateData });

    return {
      code: 0,
      msg: 'success',
      data: {
        ...user,
        ...updateData,
        student_id: studentId || user.student_id || '',
        updated_at: Date.now()
      }
    };
  } catch (err) {
    console.error('userUpdate failed', err);
    return {
      code: 'SERVER_ERROR',
      msg: '服务器内部错误',
      error: err
    };
  }
};
