const assert = require('assert');
const { resetDb, readDb, writeDb } = require('../src/services/store');
const projectService = require('../src/services/projectService');
const userService = require('../src/services/userService');

async function testUserProfileUpdate() {
  await resetDb();

  const user = await userService.updateUserProfile('volunteer-1', {
    name: '测试志愿者',
    college: '教育学院',
    grade: '2025级'
  });

  assert.strictEqual(user.name, '测试志愿者');
  assert.strictEqual(user.college, '教育学院');
  assert.strictEqual(user.grade, '2025级');

  const db = readDb();
  const storedUser = db.users.find((item) => item.id === 'volunteer-1');
  assert.strictEqual(storedUser.name, '测试志愿者');
}

async function assertRejectsWithCode(fn, code) {
  let caught = null;
  try {
    await fn();
  } catch (error) {
    caught = error;
  }
  assert(caught, `Expected ${code} error`);
  assert.strictEqual(caught.code, code);
}

async function testPublishPermissionAndProjectVisible() {
  await resetDb();

  await assertRejectsWithCode(
    () =>
      projectService.publishProject('volunteer-1', {
        title: 'member publish should fail',
        date: '2026-07-18',
        start_time: '14:00',
        end_time: '15:30',
        location: 'local test community',
        target_audience: 'primary students',
        positions: { assistant: 1 }
      }),
    'NO_PERMISSION'
  );

  const createdProject = await projectService.publishProject('admin-1', {
    title: 'admin publish smoke test',
    date: '2026-07-18',
    start_time: '14:00',
    end_time: '15:30',
    location: 'local test community',
    target_audience: 'primary students',
    positions: { assistant: 2, ppt: 1, photographer: 0, logistics: 0 },
    outline: ['intro', 'activity', 'wrap up']
  });

  assert.strictEqual(createdProject.project_status, 'pending_claim');
  assert.strictEqual(createdProject.positions.assistant.total, 2);
  assert.strictEqual(createdProject.positions.ppt.total, 1);

  const projects = await projectService.listProjects();
  assert(projects.some((item) => item._id === createdProject._id));
}

async function testProjectApprovalCreatesMaterialOnce() {
  await resetDb();

  let project = await projectService.claimLeader('volunteer-1', 'project-2');
  assert.strictEqual(project.project_status, 'pending_review');

  project = await projectService.submitLesson('volunteer-1', 'project-2', {
    title: '折纸课：千纸鹤与五角星',
    fileName: 'lesson.pdf'
  });
  assert.strictEqual(project.lesson_status, 'pending_review');

  project = await projectService.reviewLesson('admin-1', 'project-2', { action: 'approve' });
  assert.strictEqual(project.project_status, 'recruiting');

  const afterFirstReview = readDb();
  assert.strictEqual(
    afterFirstReview.materials.filter((item) => item.source_project_id === 'project-2').length,
    1
  );
  assert.strictEqual(afterFirstReview.project_claims.some((item) => item.project_id === 'project-2'), true);
  assert.strictEqual(afterFirstReview.lesson_reviews.some((item) => item.project_id === 'project-2'), true);
  assert.strictEqual(afterFirstReview.notifications.some((item) => item.user_id === 'volunteer-1'), true);
}

async function testSupportPositionCapacity() {
  await resetDb();
  const createdProject = await projectService.publishProject('admin-1', {
    title: '容量测试课',
    date: '2026-07-18',
    start_time: '14:00',
    end_time: '15:30',
    location: '本地测试社区',
    target_audience: '小学 3-5 年级',
    positions: { assistant: 1 }
  });

  await projectService.claimLeader('volunteer-1', createdProject._id);
  await projectService.submitLesson('volunteer-1', createdProject._id, { title: '容量测试课教案' });
  await projectService.reviewLesson('admin-1', createdProject._id, { action: 'approve' });

  const project = await projectService.claimPosition('volunteer-2', createdProject._id, {
    positionKey: 'assistant'
  });

  assert.strictEqual(project.positions.assistant.members.length, 1);
  assert.strictEqual(project.project_status, 'locked');
}

async function testSupportPositionCanBeCancelledWithinTenMinutes() {
  await resetDb();
  const createdProject = await projectService.publishProject('admin-1', {
    title: 'cancel position smoke test',
    date: '2026-07-18',
    start_time: '14:00',
    end_time: '15:30',
    location: 'local test community',
    target_audience: 'primary students',
    positions: { assistant: 1 }
  });

  await projectService.claimLeader('volunteer-1', createdProject._id);
  await projectService.submitLesson('volunteer-1', createdProject._id, { title: 'cancel position lesson' });
  await projectService.reviewLesson('admin-1', createdProject._id, { action: 'approve' });
  await projectService.claimPosition('volunteer-2', createdProject._id, { positionKey: 'assistant' });

  const project = await projectService.cancelPosition('volunteer-2', createdProject._id, {
    positionKey: 'assistant'
  });

  assert.strictEqual(project.positions.assistant.members.length, 0);
  assert.strictEqual(project.project_status, 'recruiting');

  const db = readDb();
  assert(
    db.project_claims.some(
      (item) =>
        item.project_id === createdProject._id &&
        item.user_id === 'volunteer-2' &&
        item.position_key === 'assistant' &&
        item.action === 'cancel'
    )
  );
}

async function testSupportPositionCancelExpiresAfterTenMinutes() {
  await resetDb();
  const createdProject = await projectService.publishProject('admin-1', {
    title: 'cancel expiry smoke test',
    date: '2026-07-18',
    start_time: '14:00',
    end_time: '15:30',
    location: 'local test community',
    target_audience: 'primary students',
    positions: { assistant: 1 }
  });

  await projectService.claimLeader('volunteer-1', createdProject._id);
  await projectService.submitLesson('volunteer-1', createdProject._id, { title: 'cancel expiry lesson' });
  await projectService.reviewLesson('admin-1', createdProject._id, { action: 'approve' });
  await projectService.claimPosition('volunteer-2', createdProject._id, { positionKey: 'assistant' });

  const db = readDb();
  const project = db.projects.find((item) => item._id === createdProject._id);
  project.positions.assistant.members[0].claimed_at = Date.now() - 11 * 60 * 1000;
  await writeDb(db);

  await assertRejectsWithCode(
    () => projectService.cancelPosition('volunteer-2', createdProject._id, { positionKey: 'assistant' }),
    'CLAIM_CANCEL_EXPIRED'
  );
}

async function testLeaderCannotCancelWithPositionCancelEndpoint() {
  await resetDb();
  await projectService.claimLeader('volunteer-1', 'project-2');

  await assertRejectsWithCode(
    () => projectService.cancelPosition('volunteer-1', 'project-2', { positionKey: 'lecturer' }),
    'INVALID_POSITION'
  );
}

async function main() {
  await testUserProfileUpdate();
  await testPublishPermissionAndProjectVisible();
  await testProjectApprovalCreatesMaterialOnce();
  await testSupportPositionCapacity();
  await testSupportPositionCanBeCancelledWithinTenMinutes();
  await testSupportPositionCancelExpiresAfterTenMinutes();
  await testLeaderCannotCancelWithPositionCancelEndpoint();
  await resetDb();
  console.log('mock api tests passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
