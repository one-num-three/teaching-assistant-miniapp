const { clone, readDb, writeDb } = require('./store');

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
  return clone(user);
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

module.exports = {
  listFavorites,
  listNotifications,
  listReimbursements,
  markAllNotificationsRead,
  markNotificationRead,
  submitReimbursement,
  toggleFavorite,
  updateUserProfile
};
