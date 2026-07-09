<template>
  <view class="page-shell">
    <view class="review-hero">
      <view class="ink-nav">
        <text class="nav-back" @click="goBack">‹</text>
        教案审核台
      </view>
    </view>

    <view class="content-layer safe-bottom">
      <view class="pending-card">
        <text class="pending-small">待审核 · {{ pendingProjects.length }} 份教案</text>
        <text class="pending-title">{{ currentProject?.title || '暂无待审核教案' }}</text>
        <text class="pending-meta">{{ pendingMeta }}</text>
      </view>

      <view v-if="loading" class="state-card">正在加载审核列表...</view>
      <view v-else-if="!currentProject" class="state-card">所有教案都已处理</view>

      <block v-else>
        <view class="review-card">
          <view class="review-head">
            <text class="card-title">教案详情</text>
            <text class="pill amber">待审核</text>
          </view>

          <view class="info-block">
            <text class="info-label">教案标题</text>
            <text class="info-value">{{ currentProject.lesson_plan?.title }}</text>
          </view>

          <view class="info-block">
            <text class="info-label">教案文件</text>
            <view class="file-line">
              <view class="pdf-icon">PDF</view>
              <view>
                <text class="file-name">{{ currentProject.lesson_plan?.file_name }}</text>
                <text class="file-size">{{ currentProject.lesson_plan?.size }}</text>
              </view>
            </view>
          </view>

          <view class="info-block">
            <text class="info-label">辅助岗位设置</text>
            <view class="chips">
              <text v-for="item in positionChips" :key="item" class="chip">{{ item }}</text>
            </view>
          </view>

          <view class="info-block">
            <text class="info-label">审核说明</text>
            <text class="info-value">通过后项目进入招募中，并自动沉淀到资料库；驳回后保留负责人，返回需修改，可重新提交。</text>
          </view>

          <view class="action-row">
            <button class="approve" :disabled="submitting" @click="approve">通过立项</button>
            <button class="reject" :disabled="submitting" @click="reject">驳回修改</button>
          </view>
        </view>
      </block>

      <view class="note-card">
        <text class="card-title">审核规则</text>
        <text class="note-line">通过：教案状态变为已通过，项目进入招募中或已锁定。</text>
        <text class="note-line">驳回：项目回到需修改，只允许负责人重新提交教案。</text>
      </view>

      <view class="note-card">
        <text class="card-title">快捷操作</text>
        <view class="quick-row">
          <button class="quick primary" @click="goPublish">发布新档期</button>
          <button class="quick ghost" @click="loadPending">刷新列表</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getErrorMessage } from '@/constants/errors';
import { getReviewProjects, reviewLesson } from '@/api/project';

const pendingProjects = ref<any[]>([]);
const loading = ref(false);
const submitting = ref(false);

const currentProject = computed(() => pendingProjects.value[0] || null);
const pendingMeta = computed(() => {
  if (!currentProject.value) return '所有教案都已处理';
  const submitter = currentProject.value.lesson_plan?.submitter_name || currentProject.value.leader?.name || '负责人';
  return `${currentProject.value.datetime} · 提交人：${submitter}`;
});

const positionChips = computed(() => {
  const positions = currentProject.value?.positions || {};
  const names: Record<string, string> = {
    assistant: '助教',
    ppt: 'PPT',
    photographer: '摄影',
    logistics: '场务'
  };
  return Object.entries(positions)
    .filter(([key]) => key !== 'lecturer')
    .map(([key, raw]: any) => `${names[key] || key} × ${raw.total || 0}`);
});

const goBack = () => uni.navigateBack();

const goPublish = () => {
  uni.navigateTo({ url: '/pages/admin/publish' });
};

const loadPending = async () => {
  loading.value = true;
  try {
    pendingProjects.value = await getReviewProjects();
  } catch (err: any) {
    uni.showToast({ title: getErrorMessage(err?.code, err?.msg || '加载失败'), icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const approve = async () => {
  if (!currentProject.value) return;
  submitting.value = true;
  try {
    await reviewLesson(currentProject.value._id, 'approve');
    uni.showToast({ title: '已通过', icon: 'success' });
    await loadPending();
  } catch (err: any) {
    uni.showToast({ title: getErrorMessage(err?.code, err?.msg || '审核失败'), icon: 'none' });
  } finally {
    submitting.value = false;
  }
};

const reject = async () => {
  if (!currentProject.value) return;
  submitting.value = true;
  try {
    await reviewLesson(currentProject.value._id, 'reject', '请补充课堂流程和材料清单');
    uni.showToast({ title: '已驳回', icon: 'none' });
    await loadPending();
  } catch (err: any) {
    uni.showToast({ title: getErrorMessage(err?.code, err?.msg || '审核失败'), icon: 'none' });
  } finally {
    submitting.value = false;
  }
};

onMounted(loadPending);
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.review-hero {
  @include ink-header(196rpx);
  padding: 64rpx 34rpx 40rpx;
  box-sizing: border-box;
}

.pending-card {
  position: relative;
  overflow: hidden;
  padding: 30rpx;
  margin-bottom: 24rpx;
  border-radius: $radius-md;
  background:
    radial-gradient(ellipse at 82% 86%, rgba(255, 250, 240, 0.24), transparent 32%),
    linear-gradient(135deg, $ink-blue, $ink-blue-deep);
  color: #fff;
  box-shadow: 0 14rpx 30rpx rgba(15, 47, 61, 0.18);
}

.pending-card::after {
  content: '';
  position: absolute;
  right: -42rpx;
  bottom: -42rpx;
  width: 280rpx;
  height: 160rpx;
  opacity: 0.18;
  background: url('/static/card-ink-corner.png') right bottom / contain no-repeat;
}

.pending-small,
.pending-title,
.pending-meta {
  display: block;
}

.pending-small {
  color: rgba(255, 255, 255, 0.72);
  font-size: 24rpx;
}

.pending-title {
  margin-top: 10rpx;
  font-size: 34rpx;
  font-weight: 800;
}

.pending-meta {
  margin-top: 10rpx;
  color: rgba(255, 255, 255, 0.76);
  font-size: 25rpx;
}

.review-card,
.note-card,
.state-card {
  @include soft-card;
  padding: 28rpx;
  margin-bottom: 24rpx;
}

.state-card {
  color: $text-secondary;
  text-align: center;
}

.review-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 26rpx;
}

.card-title {
  display: block;
  color: $text-primary;
  font-size: 30rpx;
  font-weight: 800;
}

.info-block {
  margin-bottom: 24rpx;
}

.info-label,
.info-value,
.file-name,
.file-size,
.note-line {
  display: block;
}

.info-label {
  margin-bottom: 10rpx;
  color: $text-primary;
  font-size: 25rpx;
  font-weight: 700;
}

.info-value {
  color: $text-secondary;
  font-size: 26rpx;
  line-height: 1.6;
}

.file-line {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.pdf-icon {
  width: 62rpx;
  height: 62rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  background: $red;
  color: #fff;
  font-weight: 800;
  font-size: 21rpx;
}

.file-name {
  color: $text-primary;
  font-size: 26rpx;
  font-weight: 700;
}

.file-size {
  margin-top: 6rpx;
  color: $text-muted;
  font-size: 23rpx;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
}

.chip {
  padding: 8rpx 14rpx;
  border-radius: 10rpx;
  background: rgba(31, 78, 95, 0.07);
  color: $text-secondary;
  font-size: 23rpx;
}

.action-row {
  display: flex;
  gap: 18rpx;
}

.approve,
.reject {
  flex: 1;
  height: 78rpx;
  border-radius: 18rpx;
  font-size: 28rpx;
  font-weight: 800;
}

.approve {
  background: $green;
  color: #fff;
}

.reject {
  background: $amber-bg;
  color: #94601d;
}

.note-line {
  margin-top: 16rpx;
  color: $text-secondary;
  font-size: 25rpx;
}

.quick-row {
  display: flex;
  gap: 18rpx;
  margin-top: 22rpx;
}

.quick {
  flex: 1;
  height: 76rpx;
  border-radius: 16rpx;
  font-size: 26rpx;
  font-weight: 700;
}

.quick.primary {
  background: $ink-blue;
  color: #fff;
}

.quick.ghost {
  background: rgba(31, 78, 95, 0.08);
  color: $text-secondary;
}
</style>
