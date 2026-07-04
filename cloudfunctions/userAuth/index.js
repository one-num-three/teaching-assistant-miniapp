const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

function normalizeRoles(user) {
  const roles = Array.isArray(user.roles) ? user.roles : [];
  if (roles.length > 0) return roles;
  return user.name && user.phone ? ['member'] : ['guest'];
}

exports.main = async () => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (!openid) {
    return { code: 'NO_OPENID', msg: '获取 openid 失败' };
  }

  try {
    const now = db.serverDate();
    const users = db.collection('users');
    const userRes = await users.where({ openid }).limit(1).get();

    if (userRes.data.length === 0) {
      const userInfo = {
        openid,
        roles: ['guest'],
        stats: {
          joined_projects: 0,
          completed_lessons: 0,
          volunteer_hours: 0,
          leader_count: 0
        },
        created_at: now,
        updated_at: now
      };

      const addRes = await users.add({ data: userInfo });
      return {
        code: 0,
        msg: 'success',
        data: {
          _id: addRes._id,
          ...userInfo
        }
      };
    }

    const userInfo = userRes.data[0];
    const roles = normalizeRoles(userInfo);

    if (JSON.stringify(roles) !== JSON.stringify(userInfo.roles || [])) {
      await users.doc(userInfo._id).update({
        data: {
          roles,
          updated_at: now
        }
      });
    }

    return {
      code: 0,
      msg: 'success',
      data: {
        ...userInfo,
        roles
      }
    };
  } catch (err) {
    console.error('userAuth failed', err);
    return {
      code: 'SERVER_ERROR',
      msg: '服务器内部错误',
      error: err
    };
  }
};
