<template>
  <view class="page-shell">
    <view class="mine-hero">
      <view class="ink-nav">
        我的
        <view class="bell-dot"></view>
      </view>
      <view class="profile-row">
        <image class="avatar" :src="userInfo?.avatar || defaultAvatar" />
        <view class="profile-copy">
          <text class="name">{{ userInfo?.name || '未登录用户' }}</text>
          <text class="role">{{ roleLine }}</text>
        </view>
      </view>
    </view>

    <view class="content-layer safe-bottom">
      <view class="stats-card">
        <view class="stat-item">
          <text class="num">{{ userInfo?.stats?.joined_projects || 0 }}</text>
          <text class="label">参与项目</text>
        </view>
        <view class="stat-item">
          <text class="num">{{ userInfo?.stats?.volunteer_hours || 0 }}</text>
          <text class="label">志愿时长/h</text>
        </view>
        <view class="stat-item">
          <text class="num">{{ userInfo?.stats?.leader_count || 0 }}</text>
          <text class="label">带队次数</text>
        </view>
      </view>

      <view class="dev-panel">
        <view class="section-row">
          <text class="section-title-small">本地调试</text>
          <text class="dev-current">{{ debugState?.currentUserId || activeUserId || '未选择' }}</text>
        </view>

        <view class="dev-actions">
          <view
            v-for="item in devUsers"
            :key="item.id"
            class="dev-btn"
            :class="{ active: activeUserId === item.id }"
            @click="switchUser(item.id)"
          >
            {{ item.label }}
          </view>
          <view class="dev-btn ghost" @click="refreshPage">刷新</view>
          <view class="dev-btn danger" @click="resetData">重置数据</view>
        </view>

        <view v-if="debugState" class="debug-grid">
          <view class="debug-cell">
            <text class="debug-num">{{ debugState.counts.projects }}</text>
            <text class="debug-label">项目</text>
          </view>
          <view class="debug-cell">
            <text class="debug-num">{{ debugState.counts.materials }}</text>
            <text class="debug-label">资料</text>
          </view>
          <view class="debug-cell">
            <text class="debug-num">{{ debugState.counts.claims }}</text>
            <text class="debug-label">认领</text>
          </view>
          <view class="debug-cell">
            <text class="debug-num">{{ debugState.counts.reviews }}</text>
            <text class="debug-label">审核</text>
          </view>
        </view>

        <view v-if="recentLogs.length" class="log-list">
          <view v-for="item in recentLogs" :key="item._id" class="log-item">
            <text class="log-title">{{ item.title }}</text>
            <text class="log-copy">{{ item.subtitle }}</text>
          </view>
        </view>
      </view>

      <view class="section-title-small with-space">我的项目</view>
      <view v-if="loadingProjects" class="empty-card">正在加载项目...</view>
      <view v-else-if="!myProjects.length" class="empty-card">当前身份暂无参与项目</view>
      <view v-for="project in myProjects" :key="project._id" class="project-mini-card" @click="goProject(project._id)">
        <view>
          <text class="mini-title">{{ project.title }}</text>
          <text class="mini-meta">{{ getMyRole(project) }} · {{ project.date }} {{ project.start_time }}</text>
        </view>
        <text class="pill" :class="statusTone(project.project_status)">{{ statusText(project.project_status) }}</text>
      </view>

      <view class="menu-group">
        <view v-if="userStore.isGuest" class="menu-item" @click="goProfile">
          <view class="menu-icon doc"></view>
          <text>完善业务资料</text>
          <text class="pill amber menu-pill">待认证</text>
          <text class="arrow">›</text>
        </view>
        <view class="menu-item">
          <view class="menu-icon chart"></view>
          <text>志愿服务时长统计</text>
          <text class="arrow">›</text>
        </view>
        <view class="menu-item">
          <view class="menu-icon timer"></view>
          <text>报销进度</text>
          <text class="pill blue menu-pill">1 待审</text>
          <text class="arrow">›</text>
        </view>
        <view class="menu-item">
          <view class="menu-icon folder"></view>
          <text>我的资料收藏</text>
          <text class="arrow">›</text>
        </view>
      </view>

      <view v-if="showAdminEntry" class="menu-group">
        <view class="menu-item" @click="goAdmin">
          <view class="menu-icon calendar"></view>
          <text>档期发布工具</text>
          <text class="pill amber menu-pill">管理员</text>
          <text class="arrow">›</text>
        </view>
        <view class="menu-item" @click="goReview">
          <view class="menu-icon doc"></view>
          <text>教案审核台</text>
          <text class="pill amber menu-pill">管理员</text>
          <text class="arrow">›</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getDevState, type DevState } from '@/api/debug';
import { getProjects } from '@/api/project';
import { login, resetDevData, switchDevUser } from '@/api/user';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const userInfo = computed(() => userStore.userInfo);
const defaultAvatar = '/static/logo.png';
const showAdminEntry = computed(() => userStore.isAdmin);
const activeUserId = computed(() => userInfo.value?.openid || '');
const projects = ref<any[]>([]);
const debugState = ref<DevState | null>(null);
const loadingProjects = ref(false);

const devUsers = [
  { id: 'admin-1', label: '管理员' },
  { id: 'volunteer-1', label: '志愿者A' },
  { id: 'volunteer-2', label: '志愿者B' }
];

const recentLogs = computed(() => {
  if (!debugState.value) return [];
  return [
    ...debugState.value.recentClaims,
    ...debugState.value.recentReviews,
    ...debugState.value.recentNotifications
  ]
    .sort((a, b) => b.created_at - a.created_at)
    .slice(0, 3);
});

const roleLine = computed(() => {
  if (userInfo.value?.college) return `${userInfo.value.college} · ${userInfo.value.grade || '成员'}`;
  if (userStore.isGuest) return '待完善资料';
  return userStore.isAdmin ? '支协管理员' : '支协成员';
});

const myProjects = computed(() => {
  const openid = activeUserId.value;
  if (!openid) return [];
  return projects.value.filter((project) => {
    if (project.leader?.user_id === openid) return true;
    return Object.values(project.positions || {}).some((position: any) =>
      (position.members || []).some((member: any) => member.user_id === openid)
    );
  });
});

async function refreshPage() {
  loadingProjects.value = true;
  try {
    const [user, projectList, state] = await Promise.all([login(), getProjects(), getDevState()]);
    userStore.setUser(user);
    projects.value = projectList;
    debugState.value = state;
  } catch (error) {
    uni.showToast({ title: '本地数据加载失败', icon: 'none' });
  } finally {
    loadingProjects.value = false;
  }
}

const switchUser = async (userId: string) => {
  try {
    const user = await switchDevUser(userId);
    userStore.setUser(user);
    await refreshPage();
    uni.showToast({ title: `已切换为${user.name}`, icon: 'none' });
  } catch (error) {
    uni.showToast({ title: '切换身份失败', icon: 'none' });
  }
};

const resetData = async () => {
  try {
    await resetDevData();
    await refreshPage();
    uni.showToast({ title: '测试数据已重置', icon: 'none' });
  } catch (error) {
    uni.showToast({ title: '重置失败', icon: 'none' });
  }
};

const getMyRole = (project: any) => {
  const openid = activeUserId.value;
  if (project.leader?.user_id === openid) return '项目负责人';
  const names: Record<string, string> = {
    lecturer: '主讲',
    assistant: '助教',
    ppt: 'PPT',
    photographer: '摄影',
    logistics: '场务'
  };
  for (const [key, position] of Object.entries(project.positions || {})) {
    if ((position as any).members?.some((member: any) => member.user_id === openid)) return names[key] || key;
  }
  return '成员';
};

const statusText = (status: string) => {
  const map: Record<string, string> = {
    pending_claim: '待认领',
    pending_review: '待审核',
    revision_required: '需修改',
    recruiting: '招募中',
    locked: '已锁定',
    completed: '已完成'
  };
  return map[status] || status;
};

const statusTone = (status: string) => {
  if (status === 'recruiting' || status === 'completed' || status === 'locked') return 'green';
  if (status === 'pending_claim' || status === 'pending_review' || status === 'revision_required') return 'amber';
  return 'blue';
};

const goProject = (projectId: string) => {
  uni.navigateTo({ url: `/pages/project/detail?id=${projectId}` });
};

const goProfile = () => {
  uni.navigateTo({ url: '/pages/mine/profile' });
};

const goReview = () => {
  uni.navigateTo({ url: '/pages/admin/review' });
};

const goAdmin = () => {
  uni.navigateTo({ url: '/pages/admin/publish' });
};

onShow(refreshPage);
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.mine-hero {
  @include ink-header(360rpx);
  padding: 64rpx 34rpx 74rpx;
  box-sizing: border-box;
}

.bell-dot {
  position: absolute;
  right: 2rpx;
  width: 34rpx;
  height: 34rpx;
  border: 3rpx solid rgba(255, 255, 255, 0.76);
  border-radius: 50% 50% 45% 45%;
}

.bell-dot::after {
  content: '';
  position: absolute;
  right: 0;
  top: -2rpx;
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: $amber;
}

.profile-row {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  gap: 28rpx;
  margin-top: 50rpx;
}

.avatar {
  width: 116rpx;
  height: 116rpx;
  border-radius: 50%;
  background: $paper-light;
  border: 4rpx solid rgba(255, 255, 255, 0.58);
}

.profile-copy {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.name {
  color: #fff;
  font-size: 36rpx;
  font-weight: 700;
}

.role {
  color: rgba(255, 255, 255, 0.78);
  font-size: 25rpx;
}

.stats-card {
  @include soft-card;
  display: flex;
  padding: 28rpx 0;
  margin-bottom: 28rpx;
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  border-right: 1rpx solid rgba(31, 78, 95, 0.08);
}

.stat-item:last-child {
  border-right: none;
}

.num {
  color: $ink-blue;
  font-size: 40rpx;
  font-weight: 800;
}

.label {
  color: $text-secondary;
  font-size: 23rpx;
}

.dev-panel {
  @include soft-card;
  padding: 24rpx;
  margin-bottom: 30rpx;
}

.section-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18rpx;
}

.section-title-small {
  color: $text-primary;
  font-size: 30rpx;
  font-weight: 700;
}

.with-space {
  margin: 10rpx 8rpx 18rpx;
}

.dev-current {
  color: $text-muted;
  font-size: 22rpx;
}

.dev-actions {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12rpx;
}

.dev-btn {
  min-height: 58rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
  border-radius: 14rpx;
  border: 1rpx solid rgba(9, 86, 140, 0.16);
  background: $paper-light;
  color: $text-secondary;
  font-size: 22rpx;
  text-align: center;
}

.dev-btn.active {
  color: #fff;
  background: $ink-blue;
}

.dev-btn.ghost {
  color: $ink-blue;
}

.dev-btn.danger {
  color: $red;
  background: $red-bg;
  border-color: rgba(192, 57, 43, 0.16);
}

.debug-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12rpx;
  margin-top: 18rpx;
}

.debug-cell {
  padding: 16rpx 8rpx;
  border-radius: 14rpx;
  background: rgba(31, 78, 95, 0.06);
  text-align: center;
}

.debug-num,
.debug-label,
.log-title,
.log-copy {
  display: block;
}

.debug-num {
  color: $ink-blue;
  font-size: 28rpx;
  font-weight: 800;
}

.debug-label {
  margin-top: 4rpx;
  color: $text-muted;
  font-size: 21rpx;
}

.log-list {
  margin-top: 18rpx;
}

.log-item {
  padding: 14rpx 0;
  border-top: 1rpx solid rgba(31, 78, 95, 0.07);
}

.log-title {
  color: $text-primary;
  font-size: 24rpx;
  font-weight: 700;
}

.log-copy {
  margin-top: 4rpx;
  color: $text-secondary;
  font-size: 22rpx;
  line-height: 1.4;
}

.empty-card,
.project-mini-card {
  @include soft-card;
  min-height: 88rpx;
  padding: 24rpx 28rpx;
  margin-bottom: 18rpx;
}

.empty-card {
  color: $text-secondary;
  font-size: 26rpx;
  text-align: center;
}

.project-mini-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  position: relative;
  overflow: hidden;
}

.project-mini-card::after {
  content: '';
  position: absolute;
  right: -48rpx;
  bottom: -42rpx;
  width: 260rpx;
  height: 150rpx;
  opacity: 0.13;
  background: url('/static/card-ink-corner.png') right bottom / contain no-repeat;
}

.mini-title,
.mini-meta {
  display: block;
}

.mini-title {
  color: $text-primary;
  font-size: 29rpx;
  font-weight: 700;
}

.mini-meta {
  margin-top: 8rpx;
  color: $text-secondary;
  font-size: 24rpx;
}

.menu-group {
  @include soft-card;
  margin-top: 24rpx;
  overflow: hidden;
}

.menu-item {
  min-height: 90rpx;
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 0 26rpx;
  border-bottom: 1rpx solid rgba(31, 78, 95, 0.07);
  color: $text-primary;
  font-size: 28rpx;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-icon {
  width: 34rpx;
  height: 34rpx;
  border-radius: 8rpx;
  background: rgba(31, 78, 95, 0.12);
  position: relative;
  flex: 0 0 auto;
}

.menu-icon.chart::after,
.menu-icon.folder::after,
.menu-icon.calendar::after,
.menu-icon.doc::after,
.menu-icon.timer::after {
  content: '';
  position: absolute;
  inset: 8rpx;
  border: 3rpx solid $green;
  border-radius: 4rpx;
}

.menu-pill {
  margin-left: auto;
}

.arrow {
  color: $text-muted;
  font-size: 36rpx;
}

@media (max-width: 360px) {
  .dev-actions {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .debug-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
