import { PROJECT_STATUS, LESSON_STATUS, USER_ROLE } from '@/constants/status';
import type { User } from '@/types/user';

const STORAGE_KEY = 'teaching_assistant_local_db_v1';

type PositionKey = 'lecturer' | 'assistant' | 'ppt' | 'photographer' | 'logistics';

export interface LocalPosition {
  total: number;
  members: Array<{ user_id: string; name: string; avatar?: string; claimed_at?: number }>;
}

export interface LocalProject {
  _id: string;
  title: string;
  date: string;
  start_time: string;
  end_time: string;
  datetime: string;
  location: string;
  target_audience: string;
  outline: string[];
  project_status: string;
  lesson_status: string;
  leader: null | { user_id: string; name: string; avatar?: string; claimed_at?: number };
  positions: Record<PositionKey, LocalPosition>;
  lesson_plan?: null | {
    title: string;
    file_id: string;
    file_name: string;
    size: string;
    submitted_at: number;
    submitter_id: string;
    submitter_name: string;
  };
  created_at: number;
  updated_at: number;
}

export interface LocalMaterial {
  _id: string;
  title: string;
  file_name: string;
  file_id: string;
  category: string;
  type: string;
  tone: string;
  tag: string;
  count: string;
  date: string;
  source_project_id?: string;
  created_at: number;
}

interface LocalDb {
  currentUser: User;
  projects: LocalProject[];
  materials: LocalMaterial[];
  notifications: any[];
}

const now = Date.now();

const defaultUser: User = {
  openid: 'local-admin-user',
  name: '陈恩',
  college: '支教协会',
  grade: '项目负责人',
  phone: '13800000000',
  avatar: '/static/logo.png',
  roles: [USER_ROLE.ADMIN, USER_ROLE.MEMBER],
  stats: {
    joined_projects: 12,
    completed_lessons: 3,
    volunteer_hours: 48,
    leader_count: 3
  },
  created_at: now,
  updated_at: now
};

function createSeedDb(): LocalDb {
  return {
    currentUser: defaultUser,
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
        outline: ['地球为什么在发烧', '树叶的秘密', '低碳生活小行动', '互动问答 + 小奖品'],
        project_status: PROJECT_STATUS.RECRUITING,
        lesson_status: LESSON_STATUS.APPROVED,
        leader: { user_id: 'u1', name: '王明', avatar: '', claimed_at: now - 86400000 },
        positions: {
          lecturer: { total: 1, members: [{ user_id: 'u1', name: '王明' }] },
          assistant: { total: 2, members: [] },
          ppt: { total: 1, members: [{ user_id: 'u2', name: '李华' }] },
          photographer: { total: 0, members: [] },
          logistics: { total: 0, members: [] }
        },
        lesson_plan: {
          title: '趣味科普：地球的呼吸教案',
          file_id: 'local-file-project-1',
          file_name: '趣味科普地球的呼吸.pdf',
          size: '2.1 MB',
          submitted_at: now - 72000000,
          submitter_id: 'u1',
          submitter_name: '王明'
        },
        created_at: now - 100000000,
        updated_at: now - 72000000
      },
      {
        _id: 'project-2',
        title: '古诗诵读与飞花令',
        date: '2025-07-07',
        start_time: '10:00',
        end_time: '11:30',
        datetime: '2025-07-07 10:00',
        location: '建邺区燕然社区',
        target_audience: '小学生 4-6 年级，约 20 人',
        outline: ['诗词热身', '意象讲解', '飞花令互动', '小组展示'],
        project_status: PROJECT_STATUS.RECRUITING,
        lesson_status: LESSON_STATUS.APPROVED,
        leader: { user_id: 'u3', name: '陈恩', avatar: '', claimed_at: now - 64000000 },
        positions: {
          lecturer: { total: 1, members: [{ user_id: 'u3', name: '陈恩' }] },
          assistant: { total: 1, members: [] },
          ppt: { total: 1, members: [] },
          photographer: { total: 0, members: [] },
          logistics: { total: 0, members: [] }
        },
        created_at: now - 90000000,
        updated_at: now - 64000000
      },
      {
        _id: 'project-3',
        title: '红色手工折纸课',
        date: '2025-07-12',
        start_time: '14:00',
        end_time: '15:30',
        datetime: '2025-07-12 14:00',
        location: '雨花台区景明社区',
        target_audience: '小学生 3-5 年级，约 18 人',
        outline: ['红色故事导入', '折纸步骤示范', '分组协作', '作品展示'],
        project_status: PROJECT_STATUS.PENDING_CLAIM,
        lesson_status: LESSON_STATUS.NOT_SUBMITTED,
        leader: null,
        positions: {
          lecturer: { total: 1, members: [] },
          assistant: { total: 2, members: [] },
          ppt: { total: 1, members: [] },
          photographer: { total: 1, members: [] },
          logistics: { total: 1, members: [] }
        },
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
        type: '文',
        tone: 'blue',
        tag: '精选',
        count: '1428 字',
        date: '2025-06-01',
        created_at: now - 120000000
      },
      {
        _id: 'material-2',
        title: '古诗飞花令互动课 PPT',
        file_name: '古诗飞花令互动课.pptx',
        file_id: 'local-material-2',
        category: 'humanity',
        type: 'P',
        tone: 'green',
        tag: '精选',
        count: '24 页',
        date: '2025-05-20',
        created_at: now - 130000000
      },
      {
        _id: 'material-3',
        title: '非遗剪纸手工课方案',
        file_name: '非遗剪纸手工课方案.docx',
        file_id: 'local-material-3',
        category: 'art',
        type: '艺',
        tone: 'amber',
        tag: '未中标遗珠',
        count: '980 字',
        date: '2025-06-05',
        created_at: now - 110000000
      }
    ],
    notifications: []
  };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function readDb(): LocalDb {
  const raw = uni.getStorageSync(STORAGE_KEY);
  if (raw) return raw as LocalDb;
  const seed = createSeedDb();
  uni.setStorageSync(STORAGE_KEY, seed);
  return seed;
}

function writeDb(db: LocalDb) {
  uni.setStorageSync(STORAGE_KEY, db);
}

function currentUserSnapshot(user: User) {
  return {
    user_id: user.openid,
    name: user.name || '本地用户',
    avatar: user.avatar || '',
    claimed_at: Date.now()
  };
}

function isFull(project: LocalProject) {
  return Object.values(project.positions).every((position) => position.members.length >= position.total);
}

export const localDb = {
  login(): User {
    return clone(readDb().currentUser);
  },

  updateUserProfile(profile: Partial<User>): User {
    const db = readDb();
    db.currentUser = {
      ...db.currentUser,
      ...profile,
      roles: db.currentUser.roles.includes(USER_ROLE.ADMIN)
        ? [USER_ROLE.ADMIN, USER_ROLE.MEMBER]
        : [USER_ROLE.MEMBER],
      updated_at: Date.now()
    };
    writeDb(db);
    return clone(db.currentUser);
  },

  listProjects(): LocalProject[] {
    return clone(readDb().projects.sort((a, b) => a.datetime.localeCompare(b.datetime)));
  },

  getProjectDetail(projectId: string): LocalProject | null {
    const project = readDb().projects.find((item) => item._id === projectId);
    return project ? clone(project) : null;
  },

  publishProject(payload: any): LocalProject {
    const db = readDb();
    const id = `project-${Date.now()}`;
    const project: LocalProject = {
      _id: id,
      title: payload.title,
      date: payload.date,
      start_time: payload.start_time,
      end_time: payload.end_time,
      datetime: `${payload.date} ${payload.start_time}`,
      location: payload.location,
      target_audience: payload.target_audience,
      outline: payload.outline?.length ? payload.outline : ['课程导入', '主题讲解', '互动练习', '总结反馈'],
      project_status: PROJECT_STATUS.PENDING_CLAIM,
      lesson_status: LESSON_STATUS.NOT_SUBMITTED,
      leader: null,
      positions: {
        lecturer: { total: 1, members: [] },
        assistant: { total: Number(payload.positions?.assistant || 0), members: [] },
        ppt: { total: Number(payload.positions?.ppt || 0), members: [] },
        photographer: { total: Number(payload.positions?.photographer || 0), members: [] },
        logistics: { total: Number(payload.positions?.logistics || 0), members: [] }
      },
      lesson_plan: null,
      created_at: Date.now(),
      updated_at: Date.now()
    };
    db.projects.unshift(project);
    writeDb(db);
    return clone(project);
  },

  claimProjectLeader(projectId: string): LocalProject {
    const db = readDb();
    const project = db.projects.find((item) => item._id === projectId);
    if (!project) throw new Error('项目不存在');
    if (project.leader) throw new Error('该档期已被认领');
    const user = currentUserSnapshot(db.currentUser);
    project.leader = user;
    project.positions.lecturer.members = [user];
    project.project_status = PROJECT_STATUS.PENDING_REVIEW;
    project.lesson_status = LESSON_STATUS.NOT_SUBMITTED;
    project.updated_at = Date.now();
    db.notifications.unshift({ _id: `notice-${Date.now()}`, title: '档期认领成功', content: project.title, created_at: Date.now() });
    writeDb(db);
    return clone(project);
  },

  claimPosition(projectId: string, positionKey: PositionKey): LocalProject {
    const db = readDb();
    const project = db.projects.find((item) => item._id === projectId);
    if (!project) throw new Error('项目不存在');
    if (project.project_status !== PROJECT_STATUS.RECRUITING) throw new Error('当前状态暂不可认领');
    const position = project.positions[positionKey];
    if (!position) throw new Error('岗位不存在');
    if (position.members.length >= position.total) throw new Error('该岗位已满');
    const user = currentUserSnapshot(db.currentUser);
    const already = Object.values(project.positions).some((item) => item.members.some((member) => member.user_id === user.user_id));
    if (already) throw new Error('你已经认领过该项目');
    position.members.push(user);
    project.project_status = isFull(project) ? PROJECT_STATUS.LOCKED : PROJECT_STATUS.RECRUITING;
    project.updated_at = Date.now();
    writeDb(db);
    return clone(project);
  },

  submitLesson(projectId: string, payload: { title: string; fileName: string; size: string }): LocalProject {
    const db = readDb();
    const project = db.projects.find((item) => item._id === projectId);
    if (!project) throw new Error('项目不存在');
    project.lesson_plan = {
      title: payload.title,
      file_id: `local-lesson-${projectId}-${Date.now()}`,
      file_name: payload.fileName,
      size: payload.size,
      submitted_at: Date.now(),
      submitter_id: db.currentUser.openid,
      submitter_name: db.currentUser.name || '本地用户'
    };
    project.lesson_status = LESSON_STATUS.PENDING_REVIEW;
    project.project_status = PROJECT_STATUS.PENDING_REVIEW;
    project.updated_at = Date.now();
    writeDb(db);
    return clone(project);
  },

  listReviewProjects(): LocalProject[] {
    return clone(readDb().projects.filter((item) => item.lesson_status === LESSON_STATUS.PENDING_REVIEW));
  },

  reviewLesson(projectId: string, action: 'approve' | 'reject', comment = ''): LocalProject {
    const db = readDb();
    const project = db.projects.find((item) => item._id === projectId);
    if (!project) throw new Error('项目不存在');
    if (action === 'approve') {
      project.lesson_status = LESSON_STATUS.APPROVED;
      project.project_status = PROJECT_STATUS.RECRUITING;
      if (project.lesson_plan) {
        db.materials.unshift({
          _id: `material-${Date.now()}`,
          title: project.lesson_plan.title,
          file_name: project.lesson_plan.file_name,
          file_id: project.lesson_plan.file_id,
          category: 'science',
          type: '文',
          tone: 'blue',
          tag: '精选',
          count: '本地教案',
          date: new Date().toISOString().slice(0, 10),
          source_project_id: project._id,
          created_at: Date.now()
        });
      }
    } else {
      project.lesson_status = LESSON_STATUS.REJECTED;
      project.project_status = PROJECT_STATUS.REVISION_REQUIRED;
      db.notifications.unshift({ _id: `notice-${Date.now()}`, title: '教案被驳回', content: comment || project.title, created_at: Date.now() });
    }
    project.updated_at = Date.now();
    writeDb(db);
    return clone(project);
  },

  listMaterials(): LocalMaterial[] {
    return clone(readDb().materials.sort((a, b) => b.created_at - a.created_at));
  },

  reset() {
    const seed = createSeedDb();
    writeDb(seed);
    return clone(seed);
  }
};
