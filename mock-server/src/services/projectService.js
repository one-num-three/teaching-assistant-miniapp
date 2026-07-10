const { clone, readDb, writeDb } = require('./store');

const ADMIN_ROLES = ['admin', 'super_admin', 'reviewer'];
const POSITION_KEYS = ['assistant', 'ppt', 'photographer', 'logistics'];
const CLAIM_CANCEL_WINDOW_MS = 10 * 60 * 1000;

function createError(message, status = 500, code = 'ERROR') {
  const err = new Error(message);
  err.status = status;
  err.code = code;
  return err;
}

function assertFound(value, message = 'Resource not found') {
  if (!value) throw createError(message, 404, 'NOT_FOUND');
  return value;
}

function getUser(db, userId) {
  return assertFound(
    db.users.find((user) => user.id === userId || user.openid === userId),
    'User not found'
  );
}

function assertAdmin(user) {
  const roles = Array.isArray(user.roles) ? user.roles : [];
  if (!roles.some((role) => ADMIN_ROLES.includes(role))) {
    throw createError('No admin permission', 403, 'NO_PERMISSION');
  }
}

function userSnapshot(user) {
  return {
    user_id: user.openid,
    name: user.name,
    avatar: user.avatar || '',
    claimed_at: Date.now()
  };
}

function getPositionTotal(input, key) {
  const value = input?.[key];
  if (typeof value === 'object' && value !== null) return Math.max(0, Number(value.total || 0));
  return Math.max(0, Number(value || 0));
}

function inferFileType(fileName = '', type = '') {
  const supplied = String(type || '').toUpperCase();
  if (['PDF', 'WORD', 'PPT'].includes(supplied)) return supplied;
  const extension = String(fileName).split('.').pop()?.toLowerCase();
  if (extension === 'pdf') return 'PDF';
  if (['doc', 'docx'].includes(extension)) return 'WORD';
  if (['ppt', 'pptx'].includes(extension)) return 'PPT';
  return 'PDF';
}

function normalizePositions(input = {}) {
  return {
    lecturer: { total: 1, members: [] },
    assistant: { total: getPositionTotal(input, 'assistant'), members: [] },
    ppt: { total: getPositionTotal(input, 'ppt'), members: [] },
    photographer: { total: getPositionTotal(input, 'photographer'), members: [] },
    logistics: { total: getPositionTotal(input, 'logistics'), members: [] }
  };
}

function configuredPositions(project) {
  return POSITION_KEYS
    .map((key) => [key, project.positions?.[key]])
    .filter(([, position]) => Number(position?.total || 0) > 0);
}

function isProjectFull(project) {
  const positions = configuredPositions(project);
  if (!positions.length) return true;
  return positions.every(([, position]) => position.members.length >= position.total);
}

function hasClaimedAnyRole(project, userId) {
  return Object.values(project.positions || {}).some((position) =>
    (position.members || []).some((member) => member.user_id === userId)
  );
}

function createMaterialFromProject(db, project) {
  if (!project.lesson_plan) return;
  const exists = db.materials.some((item) => item.source_project_id === project._id);
  if (exists) return;

  db.materials.unshift({
    _id: `material-${Date.now()}`,
    title: project.lesson_plan.title,
    file_name: project.lesson_plan.file_name,
    file_id: project.lesson_plan.file_id,
    category: 'science',
    tone: 'blue',
    tag: 'auto',
    type: project.lesson_plan.file_type || inferFileType(project.lesson_plan.file_name),
    count: 'approved lesson',
    date: new Date().toISOString().slice(0, 10),
    source_project_id: project._id,
    source_project_title: project.title,
    created_at: Date.now()
  });
}

function pushNotification(db, userId, title, content, projectId) {
  db.notifications.unshift({
    _id: `notification-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    user_id: userId,
    title,
    content,
    project_id: projectId,
    read: false,
    created_at: Date.now()
  });
}

function logClaim(db, project, user, positionKey, action = 'claim') {
  db.project_claims.unshift({
    _id: `claim-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    project_id: project._id,
    project_title: project.title,
    user_id: user.openid,
    user_name: user.name,
    position_key: positionKey,
    action,
    created_at: Date.now()
  });
}

function logReview(db, project, user, action, comment = '') {
  db.lesson_reviews.unshift({
    _id: `review-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    project_id: project._id,
    project_title: project.title,
    reviewer_id: user.openid,
    reviewer_name: user.name,
    action,
    comment,
    lesson_version: project.lesson_plan?.version || 0,
    created_at: Date.now()
  });
}

function projectMembers(project) {
  const names = {
    lecturer: '项目负责人',
    assistant: '助教',
    ppt: 'PPT',
    photographer: '摄影',
    logistics: '场务'
  };
  const result = [];
  Object.entries(project.positions || {}).forEach(([positionKey, position]) => {
    (position.members || []).forEach((member) => {
      result.push({ ...member, position_key: positionKey, position_name: names[positionKey] || positionKey });
    });
  });
  return result;
}

function parseHours(value) {
  const hours = Number(value);
  if (!Number.isFinite(hours) || hours < 0 || hours > 24) {
    throw createError('Service hours must be between 0 and 24', 400, 'INVALID_HOURS');
  }
  return Math.round(hours * 100) / 100;
}

async function listProjects() {
  const db = readDb();
  return clone(db.projects.sort((a, b) => a.datetime.localeCompare(b.datetime)));
}

async function listAdminProjects(userId) {
  const db = readDb();
  assertAdmin(getUser(db, userId));
  return clone(db.projects.sort((a, b) => b.updated_at - a.updated_at));
}

async function getProject(projectId) {
  const db = readDb();
  return clone(assertFound(db.projects.find((item) => item._id === projectId), 'Project not found'));
}

async function getProjectReviews(userId, projectId) {
  const db = readDb();
  const user = getUser(db, userId);
  const project = assertFound(db.projects.find((item) => item._id === projectId), 'Project not found');
  if (!ADMIN_ROLES.some((role) => user.roles?.includes(role)) && project.leader?.user_id !== user.openid) {
    throw createError('No permission to view review history', 403, 'NO_PERMISSION');
  }
  return clone(
    db.lesson_reviews
      .filter((item) => item.project_id === projectId)
      .sort((a, b) => b.created_at - a.created_at)
  );
}

async function listCompletionProjects(userId) {
  const db = readDb();
  assertAdmin(getUser(db, userId));
  return clone(
    db.projects
      .filter((project) => project.project_status === 'completion_pending')
      .sort((a, b) => Number(b.completion?.submitted_at || 0) - Number(a.completion?.submitted_at || 0))
  );
}

async function listVolunteerHours(userId) {
  const db = readDb();
  getUser(db, userId);
  return clone(
    db.volunteer_hours
      .filter((item) => item.user_id === userId)
      .sort((a, b) => b.confirmed_at - a.confirmed_at)
  );
}

async function publishProject(userId, payload) {
  const db = readDb();
  const user = getUser(db, userId);
  assertAdmin(user);

  const required = ['title', 'date', 'start_time', 'end_time', 'location', 'target_audience'];
  for (const key of required) {
    if (!String(payload[key] || '').trim()) {
      throw createError('Project payload is incomplete', 400, 'INVALID_PROJECT');
    }
  }

  const project = {
    _id: `project-${Date.now()}`,
    title: payload.title,
    date: payload.date,
    start_time: payload.start_time,
    end_time: payload.end_time,
    datetime: `${payload.date} ${payload.start_time}`,
    location: payload.location,
    target_audience: payload.target_audience,
    outline: Array.isArray(payload.outline) && payload.outline.length
      ? payload.outline
      : ['Course intro', 'Topic teaching', 'Interactive practice', 'Wrap up'],
    project_status: 'pending_claim',
    lesson_status: 'not_submitted',
    leader: null,
    positions: normalizePositions(payload.positions),
    lesson_plan: null,
    created_at: Date.now(),
    updated_at: Date.now()
  };

  db.projects.unshift(project);
  await writeDb(db);
  return clone(project);
}

async function updateProject(userId, projectId, payload) {
  const db = readDb();
  assertAdmin(getUser(db, userId));
  const project = assertFound(db.projects.find((item) => item._id === projectId), 'Project not found');
  if (['completed', 'cancelled', 'completion_pending'].includes(project.project_status)) {
    throw createError('Current project cannot be edited', 409, 'INVALID_STATUS');
  }

  const editableFields = ['title', 'date', 'start_time', 'end_time', 'location', 'target_audience'];
  editableFields.forEach((field) => {
    if (payload[field] !== undefined && String(payload[field]).trim()) project[field] = String(payload[field]).trim();
  });
  if (Array.isArray(payload.outline) && payload.outline.length) {
    project.outline = payload.outline.map((item) => String(item).trim()).filter(Boolean);
  }
  if (payload.positions && typeof payload.positions === 'object') {
    POSITION_KEYS.forEach((key) => {
      if (payload.positions[key] === undefined) return;
      const total = getPositionTotal(payload.positions, key);
      const current = project.positions[key]?.members?.length || 0;
      if (total < current) throw createError('Position total cannot be lower than current members', 400, 'POSITION_BELOW_CLAIMED');
      project.positions[key].total = total;
    });
  }
  project.datetime = `${project.date} ${project.start_time}`;
  if (['recruiting', 'locked'].includes(project.project_status)) {
    project.project_status = isProjectFull(project) ? 'locked' : 'recruiting';
  }
  project.updated_at = Date.now();
  await writeDb(db);
  return clone(project);
}

async function claimLeader(userId, projectId) {
  const db = readDb();
  const user = getUser(db, userId);
  const project = assertFound(db.projects.find((item) => item._id === projectId), 'Project not found');

  if (project.project_status !== 'pending_claim') {
    throw createError('Project cannot be claimed now', 409, 'PROJECT_NOT_CLAIMABLE');
  }
  if (project.leader) {
    throw createError('Project already claimed', 409, 'ALREADY_CLAIMED');
  }

  const snapshot = userSnapshot(user);
  project.leader = snapshot;
  project.positions.lecturer.members = [snapshot];
  project.project_status = 'pending_review';
  project.lesson_status = 'not_submitted';
  project.updated_at = Date.now();
  logClaim(db, project, user, 'lecturer');
  pushNotification(db, user.openid, 'Project claimed', `You are now the leader of ${project.title}.`, project._id);

  await writeDb(db);
  return clone(project);
}

async function submitLesson(userId, projectId, payload) {
  const db = readDb();
  const user = getUser(db, userId);
  const project = assertFound(db.projects.find((item) => item._id === projectId), 'Project not found');

  if (!project.leader || project.leader.user_id !== user.openid) {
    throw createError('Only the project leader can submit lesson plan', 403, 'NO_PERMISSION');
  }
  if (!['pending_review', 'revision_required'].includes(project.project_status)) {
    throw createError('Current status does not allow lesson submission', 409, 'INVALID_STATUS');
  }

  project.lesson_plan = {
    title: payload.title || `${project.title} lesson plan`,
    file_id: payload.fileId || `local-lesson-${projectId}-${Date.now()}`,
    file_name: payload.fileName || 'local-lesson.pdf',
    size: payload.size || '2.4 MB',
    submitted_at: Date.now(),
    submitter_id: user.openid,
    submitter_name: user.name,
    content: String(payload.content || '').trim(),
    file_type: inferFileType(payload.fileName, payload.fileType),
    version: Number(project.lesson_plan?.version || 0) + 1
  };
  project.lesson_status = 'pending_review';
  project.project_status = 'pending_review';
  project.updated_at = Date.now();
  pushNotification(db, user.openid, 'Lesson submitted', `${project.title} is waiting for admin review.`, project._id);

  await writeDb(db);
  return clone(project);
}

async function submitProjectCompletion(userId, projectId, payload) {
  const db = readDb();
  const user = getUser(db, userId);
  const project = assertFound(db.projects.find((item) => item._id === projectId), 'Project not found');

  if (project.leader?.user_id !== user.openid) {
    throw createError('Only the project leader can submit completion', 403, 'NO_PERMISSION');
  }
  if (!['recruiting', 'locked'].includes(project.project_status)) {
    throw createError('Current project status does not allow completion submission', 409, 'INVALID_STATUS');
  }

  const members = projectMembers(project);
  if (!members.length) throw createError('Project has no participants', 409, 'NO_PARTICIPANTS');
  const rawHours = payload.participantHours || {};
  const participants = members.map((member) => ({
    ...member,
    hours: parseHours(rawHours[member.user_id] ?? payload.defaultHours ?? 0)
  }));

  project.completion = {
    status: 'pending_confirmation',
    summary: String(payload.summary || '').trim(),
    participants,
    submitted_at: Date.now(),
    submitted_by: user.openid,
    submitted_by_name: user.name,
    previous_status: project.project_status,
    admin_comment: ''
  };
  project.project_status = 'completion_pending';
  project.updated_at = Date.now();
  await writeDb(db);
  return clone(project);
}

async function reviewProjectCompletion(userId, projectId, payload) {
  const db = readDb();
  const user = getUser(db, userId);
  assertAdmin(user);
  const project = assertFound(db.projects.find((item) => item._id === projectId), 'Project not found');
  if (project.project_status !== 'completion_pending' || !project.completion) {
    throw createError('No pending completion record', 409, 'INVALID_STATUS');
  }
  if (!['approve', 'reject'].includes(payload.action)) {
    throw createError('Invalid review action', 400, 'INVALID_ACTION');
  }

  const comment = String(payload.comment || '').trim();
  if (payload.action === 'reject') {
    if (!comment) throw createError('Rejection comment is required', 400, 'COMMENT_REQUIRED');
    project.completion.status = 'rejected';
    project.completion.admin_comment = comment;
    project.project_status = project.completion.previous_status || 'recruiting';
  } else {
    project.completion.status = 'approved';
    project.completion.admin_comment = comment;
    project.completion.confirmed_at = Date.now();
    project.completion.confirmed_by = user.openid;
    project.project_status = 'completed';

    project.completion.participants.forEach((participant) => {
      const exists = db.volunteer_hours.some((item) => item.project_id === project._id && item.user_id === participant.user_id);
      if (exists) return;
      db.volunteer_hours.unshift({
        _id: `hours-${Date.now()}-${participant.user_id}`,
        user_id: participant.user_id,
        user_name: participant.name,
        project_id: project._id,
        project_title: project.title,
        project_date: project.date,
        position_key: participant.position_key,
        position_name: participant.position_name,
        hours: participant.hours,
        confirmed_at: project.completion.confirmed_at,
        confirmed_by: user.openid
      });
      const participantUser = db.users.find((item) => item.openid === participant.user_id);
      if (participantUser) {
        participantUser.stats = participantUser.stats || {};
        participantUser.stats.volunteer_hours = Number(participantUser.stats.volunteer_hours || 0) + participant.hours;
      }
    });
  }

  project.updated_at = Date.now();
  await writeDb(db);
  return clone(project);
}

async function cancelProject(userId, projectId, payload) {
  const db = readDb();
  assertAdmin(getUser(db, userId));
  const project = assertFound(db.projects.find((item) => item._id === projectId), 'Project not found');
  if (['completed', 'cancelled'].includes(project.project_status)) {
    throw createError('Current project cannot be cancelled', 409, 'INVALID_STATUS');
  }
  const reason = String(payload.reason || '').trim();
  if (!reason) throw createError('Cancellation reason is required', 400, 'CANCEL_REASON_REQUIRED');
  project.project_status = 'cancelled';
  project.cancel_reason = reason;
  project.cancelled_at = Date.now();
  project.updated_at = Date.now();
  await writeDb(db);
  return clone(project);
}

async function removeProjectMember(userId, projectId, payload) {
  const db = readDb();
  const admin = getUser(db, userId);
  assertAdmin(admin);
  const project = assertFound(db.projects.find((item) => item._id === projectId), 'Project not found');
  const positionKey = payload.positionKey;
  const targetUserId = payload.targetUserId;
  const reason = String(payload.reason || '').trim();
  if (!reason) throw createError('Removal reason is required', 400, 'REMOVE_REASON_REQUIRED');
  if (['completed', 'cancelled', 'completion_pending'].includes(project.project_status)) {
    throw createError('Current project cannot be changed', 409, 'INVALID_STATUS');
  }

  if (positionKey === 'lecturer') {
    if (!['pending_review', 'revision_required'].includes(project.project_status) || project.leader?.user_id !== targetUserId) {
      throw createError('Leader can only be released before lesson approval', 409, 'INVALID_STATUS');
    }
    const leaderUser = getUser(db, targetUserId);
    project.leader = null;
    project.positions.lecturer.members = [];
    project.lesson_plan = null;
    project.lesson_status = 'not_submitted';
    project.project_status = 'pending_claim';
    logClaim(db, project, leaderUser, 'lecturer', 'removed');
  } else {
    if (!POSITION_KEYS.includes(positionKey)) throw createError('Invalid position', 400, 'INVALID_POSITION');
    const position = project.positions[positionKey];
    const index = position?.members?.findIndex((member) => member.user_id === targetUserId) ?? -1;
    if (index < 0) throw createError('Member not found in position', 404, 'NOT_FOUND');
    const [member] = position.members.splice(index, 1);
    project.project_status = 'recruiting';
    logClaim(db, project, { openid: member.user_id, name: member.name, avatar: member.avatar }, positionKey, 'removed');
  }
  project.updated_at = Date.now();
  project.member_change_reason = reason;
  await writeDb(db);
  return clone(project);
}

async function reviewLesson(userId, projectId, payload) {
  const db = readDb();
  const user = getUser(db, userId);
  assertAdmin(user);

  const project = assertFound(db.projects.find((item) => item._id === projectId), 'Project not found');
  if (project.lesson_status !== 'pending_review') {
    throw createError('No pending lesson plan', 409, 'INVALID_STATUS');
  }

  if (payload.action === 'approve') {
    project.lesson_status = 'approved';
    project.project_status = isProjectFull(project) ? 'locked' : 'recruiting';
    createMaterialFromProject(db, project);
    logReview(db, project, user, 'approve', payload.comment || '');
    if (project.leader?.user_id) {
      pushNotification(db, project.leader.user_id, 'Lesson approved', `${project.title} is now recruiting.`, project._id);
    }
  } else if (payload.action === 'reject') {
    project.lesson_status = 'rejected';
    project.project_status = 'revision_required';
    logReview(db, project, user, 'reject', payload.comment || '');
    if (project.leader?.user_id) {
      pushNotification(db, project.leader.user_id, 'Lesson needs revision', payload.comment || `${project.title} needs revision.`, project._id);
    }
  } else {
    throw createError('Invalid review action', 400, 'INVALID_ACTION');
  }

  project.updated_at = Date.now();
  await writeDb(db);
  return clone(project);
}

async function claimPosition(userId, projectId, payload) {
  const db = readDb();
  const user = getUser(db, userId);
  const project = assertFound(db.projects.find((item) => item._id === projectId), 'Project not found');
  const positionKey = payload.positionKey;

  if (project.project_status !== 'recruiting') {
    throw createError('Current status does not allow position claiming', 409, 'INVALID_STATUS');
  }

  const position = project.positions[positionKey];
  if (!position || Number(position.total) <= 0) {
    throw createError('Position not found or not open', 400, 'INVALID_POSITION');
  }
  if (hasClaimedAnyRole(project, user.openid)) {
    throw createError('You already claimed a role in this project', 409, 'ALREADY_CLAIMED');
  }
  if (position.members.length >= position.total) {
    throw createError('Position is full', 409, 'PROJECT_FULL');
  }

  position.members.push(userSnapshot(user));
  project.project_status = isProjectFull(project) ? 'locked' : 'recruiting';
  project.updated_at = Date.now();
  logClaim(db, project, user, positionKey);
  pushNotification(db, user.openid, 'Position claimed', `You claimed ${project.title} / ${positionKey}. You can cancel within 10 minutes.`, project._id);

  await writeDb(db);
  return clone(project);
}

async function cancelPosition(userId, projectId, payload) {
  const db = readDb();
  const user = getUser(db, userId);
  const project = assertFound(db.projects.find((item) => item._id === projectId), 'Project not found');
  const positionKey = payload.positionKey;

  if (!POSITION_KEYS.includes(positionKey)) {
    throw createError('Only support positions can be cancelled', 400, 'INVALID_POSITION');
  }
  if (!['recruiting', 'locked'].includes(project.project_status)) {
    throw createError('Current project status does not allow cancellation', 409, 'INVALID_STATUS');
  }

  const position = project.positions[positionKey];
  if (!position || Number(position.total) <= 0) {
    throw createError('Position not found or not open', 400, 'INVALID_POSITION');
  }

  const memberIndex = position.members.findIndex((member) => member.user_id === user.openid);
  if (memberIndex < 0) {
    throw createError('You have not claimed this position', 409, 'NOT_CLAIMED');
  }

  const member = position.members[memberIndex];
  if (Date.now() - Number(member.claimed_at || 0) > CLAIM_CANCEL_WINDOW_MS) {
    throw createError('Claim cancellation window has expired', 409, 'CLAIM_CANCEL_EXPIRED');
  }

  position.members.splice(memberIndex, 1);
  project.project_status = 'recruiting';
  project.updated_at = Date.now();
  logClaim(db, project, user, positionKey, 'cancel');
  pushNotification(db, user.openid, 'Position cancelled', `You cancelled ${project.title} / ${positionKey}.`, project._id);

  await writeDb(db);
  return clone(project);
}

module.exports = {
  cancelProject,
  cancelPosition,
  claimLeader,
  claimPosition,
  getProject,
  getProjectReviews,
  listAdminProjects,
  listCompletionProjects,
  listProjects,
  listVolunteerHours,
  publishProject,
  removeProjectMember,
  reviewProjectCompletion,
  reviewLesson,
  submitProjectCompletion,
  submitLesson,
  updateProject
};
