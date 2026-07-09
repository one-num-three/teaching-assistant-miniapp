const now = Date.now();

function member(userId, name) {
  return { user_id: userId, name, avatar: '/static/logo.png', claimed_at: now - 3600000 };
}

function createSeedDb() {
  return {
    currentUserId: 'admin-1',
    users: [
      {
        id: 'admin-1',
        openid: 'admin-1',
        name: '陈思',
        college: '支教协会',
        grade: '管理员',
        phone: '13800000000',
        avatar: '/static/logo.png',
        roles: ['admin', 'member'],
        stats: { joined_projects: 12, volunteer_hours: 48, leader_count: 3 }
      },
      {
        id: 'volunteer-1',
        openid: 'volunteer-1',
        name: '王明',
        college: '计算机学院',
        grade: '大二',
        phone: '13800000001',
        avatar: '/static/logo.png',
        roles: ['member'],
        stats: { joined_projects: 5, volunteer_hours: 20, leader_count: 1 }
      },
      {
        id: 'volunteer-2',
        openid: 'volunteer-2',
        name: '李华',
        college: '文学院',
        grade: '大三',
        phone: '13800000002',
        avatar: '/static/logo.png',
        roles: ['member'],
        stats: { joined_projects: 3, volunteer_hours: 12, leader_count: 0 }
      }
    ],
    projects: [
      {
        _id: 'project-1',
        title: '趣味科普：地球的呼吸',
        date: '2025-07-05',
        start_time: '14:00',
        end_time: '16:00',
        datetime: '2025-07-05 14:00',
        location: '江宁区东山社区',
        target_audience: '小学生 3-6 年级，约 25 人',
        outline: ['地球为什么在发烧', '树叶的秘密', '低碳生活小行动', '互动问答'],
        project_status: 'recruiting',
        lesson_status: 'approved',
        leader: member('volunteer-1', '王明'),
        positions: {
          lecturer: { total: 1, members: [member('volunteer-1', '王明')] },
          assistant: { total: 2, members: [] },
          ppt: { total: 1, members: [member('volunteer-2', '李华')] },
          photographer: { total: 0, members: [] },
          logistics: { total: 0, members: [] }
        },
        lesson_plan: {
          title: '趣味科普：地球的呼吸教案',
          file_id: 'local-file-project-1',
          file_name: '趣味科普地球的呼吸.pdf',
          size: '2.1 MB',
          submitted_at: now - 72000000,
          submitter_id: 'volunteer-1',
          submitter_name: '王明'
        },
        created_at: now - 100000000,
        updated_at: now - 72000000
      },
      {
        _id: 'project-2',
        title: '红色手工折纸课',
        date: '2025-07-12',
        start_time: '14:00',
        end_time: '15:30',
        datetime: '2025-07-12 14:00',
        location: '雨花台区景明社区',
        target_audience: '小学生 3-5 年级，约 18 人',
        outline: ['红色故事导入', '折纸步骤示范', '分组协作', '作品展示'],
        project_status: 'pending_claim',
        lesson_status: 'not_submitted',
        leader: null,
        positions: {
          lecturer: { total: 1, members: [] },
          assistant: { total: 2, members: [] },
          ppt: { total: 1, members: [] },
          photographer: { total: 1, members: [] },
          logistics: { total: 1, members: [] }
        },
        lesson_plan: null,
        created_at: now - 80000000,
        updated_at: now - 80000000
      }
    ],
    materials: [
      {
        _id: 'material-1',
        title: '光合作用趣味实验教案',
        file_name: '光合作用趣味实验教案.pdf',
        file_id: 'local-material-1',
        category: 'science',
        type: 'PDF',
        tone: 'blue',
        tag: '精选',
        count: '1428 字',
        date: '2025-06-01',
        source_project_id: '',
        source_project_title: '',
        created_at: now - 120000000
      }
    ],
    project_claims: [],
    lesson_reviews: [],
    notifications: []
  };
}

module.exports = { createSeedDb };
