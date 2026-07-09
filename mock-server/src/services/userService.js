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

async function updateUserProfile(userId, payload) {
  const db = readDb();
  const user = assertUser(findUser(db, userId));
  const editableFields = ['name', 'college', 'grade', 'phone', 'avatar'];

  editableFields.forEach((field) => {
    if (payload[field] !== undefined) {
      user[field] = payload[field];
    }
  });

  user.updated_at = Date.now();
  await writeDb(db);
  return clone(user);
}

module.exports = {
  updateUserProfile
};
