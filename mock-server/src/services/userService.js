const { clone, readDb, writeDb } = require('./store');
const ADMIN_ROLES = ['admin', 'super_admin', 'reviewer'];

function findUser(db, userId) {
  return db.users.find((user) => user.id === userId || user.openid === userId);
}

function assertUser(user) {
  if (!user) {
    const err = new Error('用户不存在');
    err.status = 404;
    throw err;
  }
  return user;
}

function createError(message, status = 500, code = 'ERROR') {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

function assertAdmin(user) {
  if (!user?.roles?.some((role) => ADMIN_ROLES.includes(role))) {
    throw createError('No admin permission', 403, 'NO_PERMISSION');
  }
}

function calculateDashboardStats(db, user) {
  const userId = user.openid;
  const confirmedHours = db.volunteer_hours.filter((item) => item.user_id === userId);
  const joinedProjectIds = new Set(confirmedHours.map((item) => item.project_id));
  const leaderProjectIds = new Set(
    confirmedHours
      .filter((item) => item.position_key === 'lecturer')
      .map((item) => item.project_id)
  );

  db.projects.forEach((project) => {
    if (['draft', 'cancelled'].includes(project.project_status)) return;
    const isLeader = project.leader?.user_id === userId;
    const isMember = Object.values(project.positions || {}).some((position) =>
      (position.members || []).some((member) => member.user_id === userId)
    );
    if (!isLeader && !isMember) return;

    joinedProjectIds.add(project._id);
    if (isLeader && project.project_status === 'completed') leaderProjectIds.add(project._id);
  });

  return {
    joined_projects: joinedProjectIds.size,
    volunteer_hours: Math.round(confirmedHours.reduce((sum, item) => sum + Number(item.hours || 0), 0) * 100) / 100,
    leader_count: leaderProjectIds.size
  };
}

function buildCurrentUser(db, userId) {
  const user = assertUser(findUser(db, userId));
  return clone({ ...user, stats: calculateDashboardStats(db, user) });
}

async function getCurrentUser(userId) {
  const db = readDb();
  return buildCurrentUser(db, userId);
}

async function updateUserProfile(userId, payload) {
  const db = readDb();
  const user = assertUser(findUser(db, userId));
  const editableFields = ['name', 'college', 'grade', 'phone', 'avatar', 'student_id'];

  editableFields.forEach((field) => {
    if (payload[field] !== undefined) {
      user[field] = payload[field];
    }
  });

  user.updated_at = Date.now();
  await writeDb(db);
  return buildCurrentUser(db, userId);
}

async function listNotifications(userId) {
  const db = readDb();
  assertUser(findUser(db, userId));
  return clone(
    db.notifications
      .filter((item) => item.user_id === userId)
      .sort((a, b) => b.created_at - a.created_at)
  );
}

async function markNotificationRead(userId, notificationId) {
  const db = readDb();
  const notification = db.notifications.find((item) => item._id === notificationId && item.user_id === userId);
  if (!notification) throw createError('Notification not found', 404, 'NOT_FOUND');
  notification.read = true;
  notification.read_at = Date.now();
  await writeDb(db);
  return clone(notification);
}

async function markAllNotificationsRead(userId) {
  const db = readDb();
  assertUser(findUser(db, userId));
  db.notifications.forEach((item) => {
    if (item.user_id === userId && !item.read) {
      item.read = true;
      item.read_at = Date.now();
    }
  });
  await writeDb(db);
  return { ok: true };
}

async function listFavorites(userId) {
  const db = readDb();
  assertUser(findUser(db, userId));
  const ids = new Set(
    db.material_favorites
      .filter((item) => item.user_id === userId)
      .sort((a, b) => b.created_at - a.created_at)
      .map((item) => item.material_id)
  );
  return clone(db.materials.filter((item) => ids.has(item._id)));
}

async function toggleFavorite(userId, materialId) {
  const db = readDb();
  assertUser(findUser(db, userId));
  if (!db.materials.some((item) => item._id === materialId)) throw createError('Material not found', 404, 'NOT_FOUND');
  const index = db.material_favorites.findIndex((item) => item.user_id === userId && item.material_id === materialId);
  if (index >= 0) {
    db.material_favorites.splice(index, 1);
    await writeDb(db);
    return { favorite: false };
  }
  db.material_favorites.unshift({
    _id: `favorite-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    user_id: userId,
    material_id: materialId,
    created_at: Date.now()
  });
  await writeDb(db);
  return { favorite: true };
}

async function listReimbursements(userId) {
  const db = readDb();
  assertUser(findUser(db, userId));
  return clone(
    db.reimbursements
      .filter((item) => item.user_id === userId)
      .sort((a, b) => b.created_at - a.created_at)
  );
}

async function listAdminReimbursements(userId) {
  const db = readDb();
  assertAdmin(assertUser(findUser(db, userId)));
  return clone(db.reimbursements.sort((a, b) => b.created_at - a.created_at));
}

async function submitReimbursement(userId, payload) {
  const db = readDb();
  const user = assertUser(findUser(db, userId));
  const title = String(payload.title || '').trim();
  const amount = Number(payload.amount);
  if (!title || !Number.isFinite(amount) || amount <= 0) {
    throw createError('Reimbursement payload is invalid', 400, 'INVALID_REIMBURSEMENT');
  }
  const item = {
    _id: `reimbursement-${Date.now()}`,
    user_id: user.openid,
    user_name: user.name,
    title,
    amount: Math.round(amount * 100) / 100,
    project_name: String(payload.project_name || '').trim(),
    note: String(payload.note || '').trim(),
    status: 'pending',
    created_at: Date.now(),
    updated_at: Date.now()
  };
  db.reimbursements.unshift(item);
  await writeDb(db);
  return clone(item);
}

async function reviewReimbursement(userId, reimbursementId, payload) {
  const db = readDb();
  const admin = assertUser(findUser(db, userId));
  assertAdmin(admin);
  const item = db.reimbursements.find((entry) => entry._id === reimbursementId);
  if (!item) throw createError('Reimbursement not found', 404, 'NOT_FOUND');
  const action = String(payload.action || '');
  const comment = String(payload.comment || '').trim();

  if (action === 'approve' && item.status === 'pending') item.status = 'approved';
  else if (action === 'reject' && item.status === 'pending') {
    if (!comment) throw createError('Rejection comment is required', 400, 'COMMENT_REQUIRED');
    item.status = 'rejected';
  } else if (action === 'paid' && item.status === 'approved') item.status = 'paid';
  else throw createError('Invalid reimbursement transition', 409, 'INVALID_STATUS');

  item.review_comment = comment;
  item.reviewed_by = admin.openid;
  item.reviewer_name = admin.name;
  item.updated_at = Date.now();
  db.notifications.unshift({
    _id: `notification-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    user_id: item.user_id,
    title: action === 'reject' ? '报销申请已驳回' : action === 'paid' ? '报销款项已打款' : '报销申请已通过',
    content: comment || `${item.title} · ¥${item.amount}`,
    reimbursement_id: item._id,
    read: false,
    created_at: Date.now()
  });
  await writeDb(db);
  return clone(item);
}

async function getVolunteerCertificate(userId) {
  const db = readDb();
  const user = assertUser(findUser(db, userId));
  const records = db.volunteer_hours
    .filter((item) => item.user_id === user.openid)
    .sort((a, b) => a.project_date.localeCompare(b.project_date));
  const totalHours = Math.round(records.reduce((sum, item) => sum + Number(item.hours || 0), 0) * 100) / 100;
  return clone({
    certificate_no: `VOL-${user.openid.toUpperCase()}-${String(records.length).padStart(3, '0')}`,
    user_name: user.name,
    college: user.college || '',
    total_hours: totalHours,
    project_count: new Set(records.map((item) => item.project_id)).size,
    issued_at: Date.now(),
    records
  });
}

module.exports = {
  getCurrentUser,
  listFavorites,
  listAdminReimbursements,
  listNotifications,
  listReimbursements,
  markAllNotificationsRead,
  markNotificationRead,
  getVolunteerCertificate,
  reviewReimbursement,
  submitReimbursement,
  toggleFavorite,
  updateUserProfile
};
