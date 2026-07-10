const http = require('http');
const { URL } = require('url');
const { readDb, resetDb, writeDb } = require('./services/store');
const projectService = require('./services/projectService');
const userService = require('./services/userService');

const PORT = Number(process.env.PORT || 3100);

function send(res, status, body) {
  res.writeHead(status, {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, x-dev-user-id',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Content-Type': 'application/json; charset=utf-8'
  });
  res.end(JSON.stringify(body));
}

function ok(res, data) {
  send(res, 200, { code: 0, data });
}

function fail(res, error) {
  const status = error.status || 500;
  send(res, status, { code: error.code || 'ERROR', msg: error.message || '服务器错误' });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(Object.assign(new Error('请求体不是合法 JSON'), { status: 400, code: 'INVALID_JSON' }));
      }
    });
    req.on('error', reject);
  });
}

function getDevUserId(req) {
  const db = readDb();
  return req.headers['x-dev-user-id'] || db.currentUserId || 'admin-1';
}

function getUser(db, userId) {
  return db.users.find((user) => user.id === userId || user.openid === userId) || db.users[0];
}

function compactLog(item, titleFallback, subtitleFallback) {
  return {
    _id: item._id,
    title: item.title || item.project_title || titleFallback,
    subtitle: item.content || item.comment || item.user_name || subtitleFallback,
    created_at: item.created_at || 0
  };
}

function buildDevState(db) {
  const currentUserId = db.currentUserId || 'admin-1';
  return {
    currentUserId,
    counts: {
      users: db.users.length,
      projects: db.projects.length,
      materials: db.materials.length,
      claims: db.project_claims.length,
      reviews: db.lesson_reviews.length,
      notifications: db.notifications.length
    },
    recentClaims: db.project_claims.slice(0, 5).map((item) => compactLog(item, '认领记录', item.position_key || '')),
    recentReviews: db.lesson_reviews.slice(0, 5).map((item) => compactLog(item, '审核记录', item.action || '')),
    recentNotifications: db.notifications
      .filter((item) => item.user_id === currentUserId)
      .slice(0, 5)
      .map((item) => compactLog(item, '通知记录', item.user_id || ''))
  };
}

async function route(req, res) {
  if (req.method === 'OPTIONS') return send(res, 204, {});

  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;
  const method = req.method;
  const userId = getDevUserId(req);

  if (!pathname.startsWith('/api')) {
    return fail(res, Object.assign(new Error('接口不存在'), { status: 404, code: 'NOT_FOUND' }));
  }

  if (method === 'GET' && pathname === '/api/me') {
    const db = readDb();
    return ok(res, getUser(db, userId));
  }

  if (method === 'POST' && pathname === '/api/me') {
    return ok(res, await userService.updateUserProfile(userId, await readBody(req)));
  }

  if (method === 'GET' && pathname === '/api/dev/state') {
    return ok(res, buildDevState(readDb()));
  }

  if (method === 'POST' && pathname === '/api/dev/reset') {
    await resetDb();
    return ok(res, buildDevState(readDb()));
  }

  if (method === 'POST' && pathname === '/api/dev/switch-user') {
    const body = await readBody(req);
    const db = readDb();
    const user = getUser(db, body.userId);
    db.currentUserId = user.id;
    await writeDb(db);
    return ok(res, user);
  }

  if (method === 'GET' && pathname === '/api/projects') {
    return ok(res, await projectService.listProjects());
  }

  if (method === 'GET' && pathname === '/api/admin/projects') {
    return ok(res, await projectService.listAdminProjects(userId));
  }

  if (method === 'GET' && pathname === '/api/admin/completions') {
    return ok(res, await projectService.listCompletionProjects(userId));
  }

  if (method === 'GET' && pathname === '/api/me/volunteer-hours') {
    return ok(res, await projectService.listVolunteerHours(userId));
  }

  if (method === 'GET' && pathname === '/api/me/volunteer-certificate') {
    return ok(res, await userService.getVolunteerCertificate(userId));
  }

  if (method === 'GET' && pathname === '/api/admin/reimbursements') {
    return ok(res, await userService.listAdminReimbursements(userId));
  }

  if (method === 'POST' && pathname === '/api/projects') {
    return ok(res, await projectService.publishProject(userId, await readBody(req)));
  }

  if (method === 'GET' && pathname === '/api/materials') {
    const db = readDb();
    return ok(res, db.materials.sort((a, b) => b.created_at - a.created_at));
  }

  const materialDetailMatch = pathname.match(/^\/api\/materials\/([^/]+)$/);
  if (method === 'GET' && materialDetailMatch) {
    const material = readDb().materials.find((item) => item._id === decodeURIComponent(materialDetailMatch[1]));
    if (!material) return fail(res, Object.assign(new Error('资料不存在'), { status: 404, code: 'NOT_FOUND' }));
    return ok(res, material);
  }

  if (method === 'GET' && pathname === '/api/notifications') {
    return ok(res, await userService.listNotifications(userId));
  }

  if (method === 'POST' && pathname === '/api/notifications/read-all') {
    return ok(res, await userService.markAllNotificationsRead(userId));
  }

  const notificationMatch = pathname.match(/^\/api\/notifications\/([^/]+)\/read$/);
  if (method === 'POST' && notificationMatch) {
    return ok(res, await userService.markNotificationRead(userId, decodeURIComponent(notificationMatch[1])));
  }

  if (method === 'GET' && pathname === '/api/me/favorites') {
    return ok(res, await userService.listFavorites(userId));
  }

  if (method === 'GET' && pathname === '/api/me/reimbursements') {
    return ok(res, await userService.listReimbursements(userId));
  }

  if (method === 'POST' && pathname === '/api/me/reimbursements') {
    return ok(res, await userService.submitReimbursement(userId, await readBody(req)));
  }

  const reimbursementMatch = pathname.match(/^\/api\/reimbursements\/([^/]+)\/review$/);
  if (method === 'POST' && reimbursementMatch) {
    return ok(res, await userService.reviewReimbursement(userId, decodeURIComponent(reimbursementMatch[1]), await readBody(req)));
  }

  const materialMatch = pathname.match(/^\/api\/materials\/([^/]+)\/favorite$/);
  if (method === 'POST' && materialMatch) {
    return ok(res, await userService.toggleFavorite(userId, decodeURIComponent(materialMatch[1])));
  }

  const projectMatch = pathname.match(/^\/api\/projects\/([^/]+)(?:\/([^/]+))?$/);
  if (projectMatch) {
    const projectId = decodeURIComponent(projectMatch[1]);
    const action = projectMatch[2];
    if (method === 'GET' && !action) return ok(res, await projectService.getProject(projectId));
    if (method === 'GET' && action === 'reviews') return ok(res, await projectService.getProjectReviews(userId, projectId));
    if (method === 'GET' && action === 'lesson-versions') return ok(res, await projectService.getLessonVersions(userId, projectId));
    if (method === 'POST' && action === 'claim-leader') return ok(res, await projectService.claimLeader(userId, projectId));
    if (method === 'POST' && action === 'submit-lesson') {
      return ok(res, await projectService.submitLesson(userId, projectId, await readBody(req)));
    }
    if (method === 'POST' && action === 'review') {
      return ok(res, await projectService.reviewLesson(userId, projectId, await readBody(req)));
    }
    if (method === 'POST' && action === 'claim-position') {
      return ok(res, await projectService.claimPosition(userId, projectId, await readBody(req)));
    }
    if (method === 'POST' && action === 'cancel-position') {
      return ok(res, await projectService.cancelPosition(userId, projectId, await readBody(req)));
    }
    if (method === 'POST' && action === 'complete') {
      return ok(res, await projectService.submitProjectCompletion(userId, projectId, await readBody(req)));
    }
    if (method === 'POST' && action === 'review-completion') {
      return ok(res, await projectService.reviewProjectCompletion(userId, projectId, await readBody(req)));
    }
    if (method === 'POST' && action === 'cancel-project') {
      return ok(res, await projectService.cancelProject(userId, projectId, await readBody(req)));
    }
    if (method === 'POST' && action === 'remove-member') {
      return ok(res, await projectService.removeProjectMember(userId, projectId, await readBody(req)));
    }
    if (method === 'POST' && action === 'update') {
      return ok(res, await projectService.updateProject(userId, projectId, await readBody(req)));
    }
  }

  return fail(res, Object.assign(new Error('接口不存在'), { status: 404, code: 'NOT_FOUND' }));
}

const server = http.createServer((req, res) => {
  route(req, res).catch((error) => fail(res, error));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`mock api server listening on http://127.0.0.1:${PORT}/api`);
});
