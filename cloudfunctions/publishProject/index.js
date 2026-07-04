const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

const ADMIN_ROLES = ['admin', 'reviewer', 'super_admin'];

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toPositiveNumber(value, fallback = 0) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue) || numberValue < 0) return fallback;
  return Math.floor(numberValue);
}

async function assertAdmin(openid) {
  const userRes = await db.collection('users').where({ openid }).limit(1).get();
  const user = userRes.data[0];
  const roles = Array.isArray(user && user.roles) ? user.roles : [];
  const ok = roles.some((role) => ADMIN_ROLES.includes(role));

  if (!ok) {
    const error = new Error('NO_PERMISSION');
    error.code = 'NO_PERMISSION';
    throw error;
  }

  return user;
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;

  if (!openid) {
    return { code: 'NO_PERMISSION', msg: '无权限' };
  }

  try {
    const admin = await assertAdmin(openid);
    const title = normalizeText(event.title);
    const date = normalizeText(event.date);
    const startTime = normalizeText(event.start_time);
    const endTime = normalizeText(event.end_time);
    const location = normalizeText(event.location);
    const targetAudience = normalizeText(event.target_audience);
    const outline = Array.isArray(event.outline)
      ? event.outline.map(normalizeText).filter(Boolean)
      : [];

    if (!title || !date || !startTime || !endTime || !location || !targetAudience) {
      return { code: 'INVALID_PARAMS', msg: '档期信息不完整' };
    }

    const positionsInput = event.positions || {};
    const now = db.serverDate();
    const project = {
      title,
      date,
      start_time: startTime,
      end_time: endTime,
      datetime: `${date} ${startTime}`,
      location,
      target_audience: targetAudience,
      outline,
      project_status: 'pending_claim',
      lesson_status: 'not_submitted',
      leader: null,
      positions: {
        lecturer: { total: 1, members: [] },
        assistant: { total: toPositiveNumber(positionsInput.assistant, 2), members: [] },
        ppt: { total: toPositiveNumber(positionsInput.ppt, 1), members: [] },
        photographer: { total: toPositiveNumber(positionsInput.photographer, 1), members: [] },
        logistics: { total: toPositiveNumber(positionsInput.logistics, 1), members: [] }
      },
      lesson_plan: null,
      created_at: now,
      updated_at: now,
      created_by: openid,
      updated_by: openid,
      created_by_snapshot: {
        user_id: openid,
        name: admin.name || '',
        avatar: admin.avatar || ''
      },
      deleted_at: null
    };

    const addRes = await db.collection('projects').add({ data: project });

    return {
      code: 0,
      msg: 'success',
      data: {
        _id: addRes._id,
        ...project
      }
    };
  } catch (err) {
    console.error('publishProject failed', err);
    return {
      code: err.code || err.message || 'SERVER_ERROR',
      msg: err.code === 'NO_PERMISSION' ? '无权限' : '服务器内部错误',
      error: err
    };
  }
};
