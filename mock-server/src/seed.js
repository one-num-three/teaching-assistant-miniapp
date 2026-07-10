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
          file_type: 'PDF',
          content: '课程目标：帮助学生理解地球生态与低碳生活的关系。\n教学流程：通过图片导入、实验演示、小组讨论和互动问答完成课堂。\n材料准备：地球仪、树叶样本、卡片和彩色贴纸。',
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
    volunteer_hours: [
      {
        _id: 'hours-seed-1',
        user_id: 'volunteer-1',
        user_name: '王明',
        project_id: 'history-project-1',
        project_title: '古诗诵读与飞花令',
        project_date: '2025-07-07',
        position_key: 'lecturer',
        position_name: '项目负责人',
        hours: 2,
        confirmed_at: now - 86400000 * 3,
        confirmed_by: 'admin-1'
      },
      {
        _id: 'hours-seed-2',
        user_id: 'volunteer-2',
        user_name: '李华',
        project_id: 'history-project-2',
        project_title: '环保小卫士主题活动',
        project_date: '2025-06-21',
        position_key: 'assistant',
        position_name: '助教',
        hours: 3,
        confirmed_at: now - 86400000 * 8,
        confirmed_by: 'admin-1'
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
        preview_content: '课程目标：让学生通过观察叶片和小实验，理解光合作用的基本过程。\n教学流程：用问题导入，展示实验装置，组织小组记录观察结果，最后完成知识卡片。\n材料准备：新鲜绿叶、透明杯、彩色笔、记录卡和安全剪刀。',
        source_project_id: '',
        source_project_title: '',
        created_at: now - 120000000
      },
      {
        _id: 'material-2',
        title: '古诗飞花令互动课件',
        file_name: '古诗飞花令互动课件.pptx',
        file_id: 'local-material-2',
        category: 'humanity',
        type: 'PPT',
        tone: 'green',
        tag: '课堂互动',
        count: '12 页',
        date: '2025-05-20',
        preview_content: '用飞花令游戏带领学生感受古诗的韵律与意境。',
        slides: [
          { title: '课堂导入', points: ['诗词里的四季', '今天的飞花令主题'] },
          { title: '规则讲解', points: ['按小组轮流答题', '说出含“花”的诗句'] },
          { title: '互动挑战', points: ['小组计分赛', '创作自己的诗句'] }
        ],
        source_project_id: '',
        source_project_title: '',
        created_at: now - 130000000
      },
      {
        _id: 'material-3',
        title: '非遗剪纸手工课方案',
        file_name: '非遗剪纸手工课方案.docx',
        file_id: 'local-material-3',
        category: 'art',
        type: 'WORD',
        tone: 'amber',
        tag: '手工活动',
        count: '980 字',
        date: '2025-06-05',
        preview_content: '课程目标：认识剪纸的基本纹样与文化寓意。\n教学流程：教师展示作品，讲解折叠与剪刻方法，学生完成一张主题剪纸。\n安全提示：使用安全剪刀，助教巡视并协助低年级学生。',
        source_project_id: '',
        source_project_title: '',
        created_at: now - 125000000
      }
    ],
    material_favorites: [
      { _id: 'favorite-seed-1', user_id: 'volunteer-1', material_id: 'material-1', created_at: now - 3600000 }
    ],
    reimbursements: [
      {
        _id: 'reimbursement-seed-1', user_id: 'volunteer-1', user_name: '王明', title: '课堂材料采购', amount: 86.5,
        project_name: '趣味科普：地球的呼吸', note: '颜料与实验耗材', status: 'pending', created_at: now - 7200000, updated_at: now - 7200000
      }
    ],
    project_claims: [],
    lesson_reviews: [],
    notifications: [
      {
        _id: 'notification-seed-1', user_id: 'volunteer-1', title: '教案审核通过', content: '趣味科普：地球的呼吸已通过审核，正在招募辅助岗位。', project_id: 'project-1', read: false, created_at: now - 3600000
      },
      {
        _id: 'notification-seed-2', user_id: 'admin-1', title: '新的教案待审核', content: '本地演示：管理员可在审核台处理待审核教案。', project_id: 'project-2', read: false, created_at: now - 7200000
      }
    ]
  };
}

module.exports = { createSeedDb };
