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
  return {
    currentUserId: db.currentUserId || 'admin-1',
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
    recentNotifications: db.notifications.slice(0, 5).map((item) => compactLog(item, '通知记录', item.user_id || ''))
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

  if (method === 'POST' && pathname === '/api/projects') {
    return ok(res, await projectService.publishProject(userId, await readBody(req)));
  }

  if (method === 'GET' && pathname === '/api/materials') {
    const db = readDb();
    return ok(res, db.materials.sort((a, b) => b.created_at - a.created_at));
  }

  if (method === 'GET' && pathname === '/api/notifications') {
    const db = readDb();
    return ok(res, db.notifications.filter((item) => item.user_id === userId));
  }

  const projectMatch = pathname.match(/^\/api\/projects\/([^/]+)(?:\/([^/]+))?$/);
  if (projectMatch) {
    const projectId = decodeURIComponent(projectMatch[1]);
    const action = projectMatch[2];
    if (method === 'GET' && !action) return ok(res, await projectService.getProject(projectId));
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
  }

  return fail(res, Object.assign(new Error('接口不存在'), { status: 404, code: 'NOT_FOUND' }));
}

const server = http.createServer((req, res) => {
  route(req, res).catch((error) => fail(res, error));
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`mock api server listening on http://127.0.0.1:${PORT}/api`);
});
