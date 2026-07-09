<template>
  <view class="page-shell">
    <view class="detail-hero">
      <view class="ink-nav">
        <text class="nav-back" @click="goBack">‹</text>
        项目详情
      </view>
      <view v-if="project" class="hero-detail">
        <text class="pill" :class="statusClass">{{ statusText }}</text>
        <text class="detail-title">{{ project.title }}</text>
        <view class="meta-list">
          <text>时间：{{ project.datetime }}</text>
          <text>地点：{{ project.location }}</text>
          <text>受众：{{ project.target_audience }}</text>
        </view>
      </view>
    </view>

    <view v-if="loading" class="content-layer">
      <view class="state-card">正在加载项目...</view>
    </view>

    <view v-else-if="!project" class="content-layer">
      <view class="state-card">未找到项目信息</view>
    </view>

    <view v-else class="content-layer detail-content safe-bottom">
      <view class="section-block">
        <view class="block-title">教案大纲</view>
        <view class="outline-list">
          <view class="outline-item" v-for="(item, index) in outline" :key="item">
            <text class="outline-index">{{ index + 1 }}</text>
            <text>{{ item }}</text>
          </view>
        </view>
      </view>

      <view class="section-block">
        <view class="block-title">项目负责人</view>
        <view class="leader-card">
          <image class="member-avatar" :src="project.leader?.avatar || defaultAvatar" />
          <view>
            <text class="member-name">{{ project.leader?.name || '待认领' }}</text>
            <text class="member-role">{{ project.leader?.name ? '支协成员 · 已认领' : '抢占档期后提交教案' }}</text>
          </view>
          <button v-if="canClaimLeader" class="claim-main" :disabled="claiming" @click="handleClaimLeader">
            抢占
          </button>
        </view>
      </view>

      <view class="section-block">
        <view class="block-title">岗位认领 · {{ filledCount }}/{{ totalCount }} 已满</view>
        <view v-if="slots.length === 0" class="state-card compact">暂无辅助岗位</view>
        <view class="slot-card" v-for="slot in slots" :key="slot.uid">
          <image class="member-avatar" :src="slot.avatar || defaultAvatar" />
          <view class="slot-copy">
            <text class="member-name">{{ slot.name }}</text>
            <text class="member-role">{{ slot.role }}</text>
          </view>
          <button
            class="slot-action"
            :class="{ disabled: slot.claimed || !canClaimSupport }"
            :disabled="slot.claimed || !canClaimSupport || claiming"
            @click="handleClaimPosition(slot.key)"
          >
            {{ slot.claimed ? '已认领' : '认领' }}
          </button>
        </view>
      </view>

      <view v-if="project.lesson_plan" class="section-block">
        <view class="block-title">已提交教案</view>
        <view class="lesson-card">
          <text class="lesson-title">{{ project.lesson_plan.title }}</text>
          <text class="lesson-meta">{{ project.lesson_plan.file_name }} · {{ project.lesson_plan.size }}</text>
        </view>
      </view>

      <button v-if="isLeader" class="bottom-action" @click="goSubmit">{{ submitActionText }}</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { claimPosition, claimProjectLeader, getProjectDetail } from '@/api/project';
import { getErrorMessage } from '@/constants/errors';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const project = ref<any>(null);
const loading = ref(true);
const claiming = ref(false);
const projectId = ref('');
const defaultAvatar = '/static/logo.png';

const statusMap: Record<string, { text: string; klass: string }> = {
  pending_claim: { text: '待认领', klass: 'amber' },
  pending_review: { text: '待审核', klass: 'amber' },
  recruiting: { text: '招募中', klass: 'green' },
  revision_required: { text: '需修改', klass: 'red' },
  locked: { text: '已锁定', klass: 'blue' },
  completed: { text: '已完成', klass: 'blue' },
  cancelled: { text: '已取消', klass: 'blue' }
};

const positionNames: Record<string, string> = {
  assistant: '助教',
  ppt: 'PPT',
  photographer: '摄影',
  logistics: '场务'
};

const statusText = computed(() => statusMap[project.value?.project_status]?.text || '待认领');
const statusClass = computed(() => statusMap[project.value?.project_status]?.klass || 'amber');
const outline = computed(() => project.value?.outline?.length ? project.value.outline : ['课程导入', '主题讲解', '互动练习', '总结反馈']);
const canClaimLeader = computed(() => project.value?.project_status === 'pending_claim' && !project.value?.leader);
const canClaimSupport = computed(() => project.value?.project_status === 'recruiting');

const isLeader = computed(() => {
  const openid = userStore.userInfo?.openid;
  return Boolean(openid && project.value?.leader?.user_id === openid);
});

const submitActionText = computed(() => {
  if (project.value?.project_status === 'revision_required') return '修改并重新提交教案';
  if (project.value?.lesson_status === 'pending_review') return '查看/修改教案';
  return '提交教案';
});

const slots = computed(() => {
  const result: any[] = [];
  Object.entries(project.value?.positions || {})
    .filter(([key]) => key !== 'lecturer')
    .forEach(([key, raw]: any) => {
      const total = raw.total || 0;
      const members = raw.members || [];
      for (let i = 0; i < total; i += 1) {
        const member = members[i];
        result.push({
          uid: `${key}-${i}`,
          key,
          role: positionNames[key] || key,
          name: member?.name || '等待认领',
          avatar: member?.avatar || '',
          claimed: Boolean(member)
        });
      }
    });
  return result;
});

const totalCount = computed(() => slots.value.length);
const filledCount = computed(() => slots.value.filter((item) => item.claimed).length);

const goBack = () => uni.navigateBack();

const goSubmit = () => {
  uni.navigateTo({ url: `/pages/lesson-plan/submit?id=${project.value?._id || projectId.value}` });
};

const fetchProjectDetail = async () => {
  if (!projectId.value) return;
  loading.value = true;
  try {
    project.value = await getProjectDetail(projectId.value);
  } catch (err) {
    console.error(err);
    project.value = null;
  } finally {
    loading.value = false;
  }
};

const handleClaimLeader = async () => {
  claiming.value = true;
  try {
    const updated = await claimProjectLeader(project.value._id);
    project.value = updated;
    uni.showToast({ title: '认领成功', icon: 'success' });
  } catch (err: any) {
    uni.showToast({ title: getErrorMessage(err?.code, err?.msg || '认领失败'), icon: 'none' });
  } finally {
    claiming.value = false;
  }
};

const handleClaimPosition = async (key: string) => {
  claiming.value = true;
  try {
    const updated = await claimPosition(project.value._id, key);
    project.value = updated;
    uni.showToast({ title: '认领成功', icon: 'success' });
  } catch (err: any) {
    uni.showToast({ title: getErrorMessage(err?.code, err?.msg || '认领失败'), icon: 'none' });
  } finally {
    claiming.value = false;
  }
};

onLoad((options: any) => {
  projectId.value = options?.id || 'project-1';
  fetchProjectDetail();
});

onShow(() => {
  if (projectId.value) fetchProjectDetail();
});
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.detail-hero {
  @include ink-header(396rpx);
  padding: 64rpx 34rpx 46rpx;
  box-sizing: border-box;
}

.detail-content {
  padding-bottom: 140rpx;
}

.hero-detail {
  position: relative;
  z-index: 1;
  margin-top: 34rpx;
}

.detail-title {
  display: block;
  margin-top: 20rpx;
  color: #fff;
  font-size: 38rpx;
  font-weight: 800;
  line-height: 1.36;
}

.meta-list {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  margin-top: 24rpx;
  color: rgba(255, 255, 255, 0.78);
  font-size: 25rpx;
}

.section-block {
  margin-top: 42rpx;
}

.block-title {
  color: $text-secondary;
  font-size: 28rpx;
  font-weight: 700;
  margin-bottom: 18rpx;
}

.outline-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  color: $text-primary;
  font-size: 28rpx;
}

.outline-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.outline-index {
  width: 34rpx;
  height: 34rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid rgba(31, 78, 95, 0.32);
  border-radius: 50%;
  color: $ink-blue;
  font-size: 22rpx;
}

.leader-card,
.slot-card,
.lesson-card {
  @include soft-card;
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 22rpx 24rpx;
  margin-bottom: 18rpx;
}

.lesson-card {
  display: block;
}

.lesson-title,
.lesson-meta {
  display: block;
}

.lesson-title {
  color: $text-primary;
  font-size: 28rpx;
  font-weight: 800;
}

.lesson-meta {
  margin-top: 8rpx;
  color: $text-secondary;
  font-size: 24rpx;
}

.member-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: rgba(31, 78, 95, 0.08);
}

.member-name,
.member-role {
  display: block;
}

.member-name {
  color: $text-primary;
  font-size: 29rpx;
  font-weight: 700;
}

.member-role {
  margin-top: 6rpx;
  color: $text-secondary;
  font-size: 24rpx;
}

.claim-main,
.slot-action {
  margin-left: auto;
  min-width: 108rpx;
  height: 54rpx;
  padding: 0 20rpx;
  border-radius: 999rpx;
  background: $ink-blue;
  color: #fff;
  font-size: 24rpx;
}

.slot-action.disabled {
  background: rgba(31, 78, 95, 0.08);
  color: $text-muted;
}

.slot-copy {
  flex: 1;
}

.bottom-action {
  position: fixed;
  left: 28rpx;
  right: 28rpx;
  bottom: calc(24rpx + env(safe-area-inset-bottom));
  height: 88rpx;
  border-radius: 22rpx;
  background: linear-gradient(135deg, $ink-blue, $ink-blue-deep);
  color: #fff;
  font-size: 30rpx;
  font-weight: 700;
  box-shadow: 0 16rpx 30rpx rgba(15, 47, 61, 0.22);
}

.state-card {
  @include soft-card;
  padding: 48rpx;
  color: $text-secondary;
  text-align: center;
}

.state-card.compact {
  padding: 28rpx;
}
</style>
