const assert = require('assert');
const { resetDb, readDb } = require('../src/services/store');
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

async function main() {
  await testUserProfileUpdate();
  await testProjectApprovalCreatesMaterialOnce();
  await testSupportPositionCapacity();
  console.log('mock api tests passed');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
