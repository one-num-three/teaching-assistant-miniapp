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

async function testLessonFileTypeFlowsToMaterialLibrary() {
  await resetDb();
  await projectService.claimLeader('volunteer-1', 'project-2');
  await projectService.submitLesson('volunteer-1', 'project-2', {
    title: '折纸课互动课件', fileName: '折纸课互动课件.pptx', content: '课堂导入\n折纸示范\n互动展示'
  });
  await projectService.reviewLesson('admin-1', 'project-2', { action: 'approve' });
  const material = readDb().materials.find((item) => item.source_project_id === 'project-2');
  assert.strictEqual(material.type, 'PPT');
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

async function createApprovedProject(title = 'completed project test') {
  const project = await projectService.publishProject('admin-1', {
    title,
    date: '2026-07-18',
    start_time: '14:00',
    end_time: '16:00',
    location: 'local test community',
    target_audience: 'primary students',
    positions: { assistant: 1 }
  });
  await projectService.claimLeader('volunteer-1', project._id);
  await projectService.submitLesson('volunteer-1', project._id, {
    title: `${title} lesson`,
    content: 'lesson objective and activity flow'
  });
  await projectService.reviewLesson('admin-1', project._id, { action: 'approve', comment: 'ready to recruit' });
  return project;
}

async function testReviewHistoryAndRevisionVersion() {
  await resetDb();
  await projectService.claimLeader('volunteer-1', 'project-2');
  await projectService.submitLesson('volunteer-1', 'project-2', { title: 'v1', content: 'first content' });
  await projectService.reviewLesson('admin-1', 'project-2', { action: 'reject', comment: 'please add safety notes' });
  let project = await projectService.submitLesson('volunteer-1', 'project-2', { title: 'v2', content: 'updated content' });
  assert.strictEqual(project.lesson_plan.version, 2);
  const history = await projectService.getProjectReviews('volunteer-1', 'project-2');
  assert.strictEqual(history.length, 1);
  assert.strictEqual(history[0].comment, 'please add safety notes');
  await assertRejectsWithCode(() => projectService.getProjectReviews('volunteer-2', 'project-2'), 'NO_PERMISSION');
  const versions = await projectService.getLessonVersions('volunteer-1', 'project-2');
  assert.strictEqual(versions.length, 2);
  assert.strictEqual(versions[0].title, 'v2');
  assert.strictEqual(versions[1].title, 'v1');
  assert.strictEqual(versions[1].review_status, 'rejected');
}

async function testCompletionConfirmationCreatesHoursOnce() {
  await resetDb();
  const createdProject = await createApprovedProject();
  await projectService.claimPosition('volunteer-2', createdProject._id, { positionKey: 'assistant' });

  let project = await projectService.submitProjectCompletion('volunteer-1', createdProject._id, {
    summary: 'activity completed successfully',
    participantHours: { 'volunteer-1': 2, 'volunteer-2': 1.5 }
  });
  assert.strictEqual(project.project_status, 'completion_pending');
  assert.strictEqual(project.completion.participants.length, 2);

  project = await projectService.reviewProjectCompletion('admin-1', createdProject._id, { action: 'approve', comment: 'confirmed' });
  assert.strictEqual(project.project_status, 'completed');
  const db = readDb();
  const records = db.volunteer_hours.filter((item) => item.project_id === createdProject._id);
  assert.strictEqual(records.length, 2);
  assert.strictEqual(records.find((item) => item.user_id === 'volunteer-2').hours, 1.5);
  assert.strictEqual(db.users.find((item) => item.openid === 'volunteer-1').stats.volunteer_hours, 22);
  await assertRejectsWithCode(
    () => projectService.reviewProjectCompletion('admin-1', createdProject._id, { action: 'approve' }),
    'INVALID_STATUS'
  );
}

async function testAdminProjectChangeControls() {
  await resetDb();
  const createdProject = await createApprovedProject('admin change test');
  await projectService.claimPosition('volunteer-2', createdProject._id, { positionKey: 'assistant' });
  let project = await projectService.removeProjectMember(
    'admin-1',
    createdProject._id,
    {
      positionKey: 'assistant',
      targetUserId: 'volunteer-2',
      reason: 'participant unavailable'
    }
  );
  assert.strictEqual(project.positions.assistant.members.length, 0);
  assert.strictEqual(project.project_status, 'recruiting');

  project = await projectService.cancelProject('admin-1', createdProject._id, { reason: 'weather warning' });
  assert.strictEqual(project.project_status, 'cancelled');
  assert.strictEqual(project.cancel_reason, 'weather warning');
}

async function testPersonalCenterCollectionsAndNotifications() {
  await resetDb();
  const notifications = await userService.listNotifications('volunteer-1');
  assert.strictEqual(notifications.length, 1);
  assert.strictEqual(notifications[0].read, false);
  await userService.markNotificationRead('volunteer-1', notifications[0]._id);
  assert.strictEqual((await userService.listNotifications('volunteer-1'))[0].read, true);

  let favorites = await userService.listFavorites('volunteer-1');
  assert.strictEqual(favorites.length, 1);
  await userService.toggleFavorite('volunteer-1', 'material-1');
  favorites = await userService.listFavorites('volunteer-1');
  assert.strictEqual(favorites.length, 0);

  const reimbursement = await userService.submitReimbursement('volunteer-1', {
    title: '交通补贴', amount: 12.5, project_name: '本地测试项目', note: '地铁往返'
  });
  assert.strictEqual(reimbursement.status, 'pending');
  assert.strictEqual((await userService.listReimbursements('volunteer-1')).length, 2);
}

async function testAdminCanEditProjectPositions() {
  await resetDb();
  let project = await projectService.updateProject('admin-1', 'project-1', {
    title: '趣味科普：地球的呼吸（调整）', positions: { assistant: 3, ppt: 1 }
  });
  assert.strictEqual(project.title, '趣味科普：地球的呼吸（调整）');
  assert.strictEqual(project.positions.assistant.total, 3);
  await assertRejectsWithCode(
    () => projectService.updateProject('admin-1', 'project-1', { positions: { ppt: 0 } }),
    'POSITION_BELOW_CLAIMED'
  );
}

async function testReimbursementAdminWorkflow() {
  await resetDb();
  let item = await userService.submitReimbursement('volunteer-1', {
    title: '打印材料', amount: 20, project_name: '折纸课'
  });
  await assertRejectsWithCode(
    () => userService.reviewReimbursement('volunteer-2', item._id, { action: 'approve' }),
    'NO_PERMISSION'
  );
  item = await userService.reviewReimbursement('admin-1', item._id, { action: 'approve', comment: '凭证完整' });
  assert.strictEqual(item.status, 'approved');
  item = await userService.reviewReimbursement('admin-1', item._id, { action: 'paid', comment: '已转账' });
  assert.strictEqual(item.status, 'paid');
  const db = readDb();
  assert(db.notifications.some((entry) => entry.reimbursement_id === item._id && entry.user_id === 'volunteer-1'));
}

async function testVolunteerCertificateUsesConfirmedRecords() {
  await resetDb();
  const certificate = await userService.getVolunteerCertificate('volunteer-1');
  assert.strictEqual(certificate.total_hours, 2);
  assert.strictEqual(certificate.project_count, 1);
  assert.strictEqual(certificate.records.length, 1);
}

async function main() {
  await testUserProfileUpdate();
  await testPublishPermissionAndProjectVisible();
  await testProjectApprovalCreatesMaterialOnce();
  await testLessonFileTypeFlowsToMaterialLibrary();
  await testSupportPositionCapacity();
  await testSupportPositionCanBeCancelledWithinTenMinutes();
  await testSupportPositionCancelExpiresAfterTenMinutes();
  await testLeaderCannotCancelWithPositionCancelEndpoint();
  await testReviewHistoryAndRevisionVersion();
  await testCompletionConfirmationCreatesHoursOnce();
  await testAdminProjectChangeControls();
  await testPersonalCenterCollectionsAndNotifications();
  await testAdminCanEditProjectPositions();
  await testReimbursementAdminWorkflow();
  await testVolunteerCertificateUsesConfirmedRecords();
  await resetDb();
  console.log('mock api tests passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
