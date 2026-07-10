<template>
  <view class="page-shell">
    <view class="page-hero">
      <view class="ink-nav"><text class="nav-back" @click="goBack">‹</text>提交项目完成记录</view>
    </view>

    <view v-if="loading" class="content-layer"><view class="state-card">正在加载项目...</view></view>
    <view v-else-if="!project" class="content-layer"><view class="state-card">未找到项目信息</view></view>

    <view v-else class="content-layer form-body safe-bottom">
      <view class="project-card">
        <text class="eyebrow">完成确认</text>
        <text class="project-title">{{ project.title }}</text>
        <text class="project-meta">{{ project.datetime }} · {{ project.location }}</text>
        <text class="project-hint">提交后会进入管理员确认；确认通过后，时长才会记入每位成员的个人明细。</text>
      </view>

      <view class="form-card">
        <text class="section-title">活动总结</text>
        <textarea v-model="summary" class="summary-input" maxlength="500" placeholder="记录实际活动情况、完成成果和需要复盘的问题。" />
        <text class="count">{{ summary.length }}/500</text>
      </view>

      <view class="form-card">
        <text class="section-title">成员服务时长</text>
        <text class="section-hint">请按实际参与情况填写。填 0 表示未实际参与，不会计入时长。</text>
        <view v-for="item in participants" :key="item.user_id" class="member-row">
          <image class="avatar" :src="item.avatar || defaultAvatar" />
          <view class="member-copy">
            <text class="member-name">{{ item.name }}</text>
            <text class="member-role">{{ item.position_name }}</text>
          </view>
          <input v-model="hoursByUser[item.user_id]" class="hours-input" type="digit" />
          <text class="hours-unit">小时</text>
        </view>
      </view>

      <button class="submit-button" :loading="submitting" :disabled="submitting" @click="submit">提交管理员确认</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { getProjectDetail, submitProjectCompletion } from '@/api/project';
import { getErrorMessage } from '@/constants/errors';

const projectId = ref('');
const project = ref<any>(null);
const loading = ref(true);
const submitting = ref(false);
const summary = ref('');
const hoursByUser = ref<Record<string, string>>({});
const defaultAvatar = '/static/logo.png';

const positionNames: Record<string, string> = {
  lecturer: '项目负责人', assistant: '助教', ppt: 'PPT', photographer: '摄影', logistics: '场务'
};

const participants = computed(() => {
  const result: any[] = [];
  Object.entries(project.value?.positions || {}).forEach(([positionKey, position]: any) => {
    (position.members || []).forEach((member: any) => {
      result.push({ ...member, position_name: positionNames[positionKey] || positionKey });
    });
  });
  return result;
});

const scheduledHours = () => {
  const [startH, startM] = String(project.value?.start_time || '0:0').split(':').map(Number);
  const [endH, endM] = String(project.value?.end_time || '0:0').split(':').map(Number);
  return Math.max(0, Math.round(((endH * 60 + endM - startH * 60 - startM) / 60) * 100) / 100);
};

const loadProject = async () => {
  loading.value = true;
  try {
    project.value = await getProjectDetail(projectId.value);
    const defaultHours = String(scheduledHours());
    const prior = project.value.completion?.participants || [];
    participants.value.forEach((member) => {
      const priorMember = prior.find((item: any) => item.user_id === member.user_id);
      hoursByUser.value[member.user_id] = String(priorMember?.hours ?? defaultHours);
    });
    summary.value = project.value.completion?.summary || '';
  } catch (error) {
    uni.showToast({ title: '项目加载失败', icon: 'none' });
    project.value = null;
  } finally {
    loading.value = false;
  }
};

const goBack = () => uni.navigateBack();

const submit = async () => {
  if (!summary.value.trim()) {
    uni.showToast({ title: '请填写活动总结', icon: 'none' });
    return;
  }
  const participantHours: Record<string, number> = {};
  for (const member of participants.value) {
    const value = Number(hoursByUser.value[member.user_id]);
    if (!Number.isFinite(value) || value < 0 || value > 24) {
      uni.showToast({ title: '服务时长请填写 0 到 24 之间的数字', icon: 'none' });
      return;
    }
    participantHours[member.user_id] = value;
  }
  submitting.value = true;
  try {
    await submitProjectCompletion(projectId.value, { summary: summary.value.trim(), participantHours });
    uni.showToast({ title: '已提交管理员确认', icon: 'success' });
    setTimeout(goBack, 700);
  } catch (error: any) {
    uni.showToast({ title: getErrorMessage(error?.code, error?.message || '提交失败'), icon: 'none' });
  } finally {
    submitting.value = false;
  }
};

onLoad((options: any) => {
  projectId.value = options?.id || '';
  loadProject();
});
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';
.page-hero { @include ink-header(184rpx); padding: 64rpx 34rpx 38rpx; box-sizing: border-box; }
.nav-back { position: absolute; left: 0; font-size: 48rpx; line-height: 1; }
.form-body { padding-bottom: 148rpx; }
.project-card, .form-card, .state-card { @include soft-card; padding: 28rpx; margin-bottom: 24rpx; }
.eyebrow, .project-meta, .project-hint, .section-hint, .member-role, .count { display: block; }
.eyebrow { color: $green; font-size: 23rpx; font-weight: 700; }
.project-title { display: block; margin-top: 10rpx; color: $text-primary; font-size: 34rpx; font-weight: 800; }
.project-meta { margin-top: 10rpx; color: $text-secondary; font-size: 24rpx; }
.project-hint { margin-top: 16rpx; color: $text-muted; font-size: 23rpx; line-height: 1.6; }
.section-title { display: block; color: $text-primary; font-size: 30rpx; font-weight: 800; }
.section-hint { margin-top: 10rpx; color: $text-secondary; font-size: 23rpx; line-height: 1.55; }
.summary-input { width: 100%; min-height: 170rpx; box-sizing: border-box; margin-top: 18rpx; padding: 20rpx; border-radius: 14rpx; background: rgba(31, 78, 95, .05); color: $text-primary; font-size: 26rpx; line-height: 1.6; }
.count { margin-top: 8rpx; color: $text-muted; font-size: 22rpx; text-align: right; }
.member-row { display: flex; align-items: center; gap: 16rpx; padding: 20rpx 0; border-bottom: 1rpx solid rgba(31,78,95,.08); }
.member-row:last-child { border-bottom: 0; }
.avatar { width: 64rpx; height: 64rpx; border-radius: 50%; background: $paper-light; }
.member-copy { flex: 1; min-width: 0; }
.member-name { display: block; color: $text-primary; font-size: 27rpx; font-weight: 700; }
.member-role { margin-top: 4rpx; color: $text-secondary; font-size: 22rpx; }
.hours-input { width: 90rpx; height: 58rpx; padding: 0 12rpx; box-sizing: border-box; border-radius: 12rpx; background: rgba(31,78,95,.07); color: $ink-blue; font-size: 26rpx; font-weight: 700; text-align: center; }
.hours-unit { color: $text-secondary; font-size: 23rpx; }
.submit-button { position: fixed; left: 28rpx; right: 28rpx; bottom: calc(24rpx + env(safe-area-inset-bottom)); height: 88rpx; border-radius: 22rpx; background: $ink-blue; color: #fff; font-size: 30rpx; font-weight: 700; }
.state-card { color: $text-secondary; text-align: center; }
</style>
