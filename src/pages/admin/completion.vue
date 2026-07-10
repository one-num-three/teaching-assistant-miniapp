<template>
  <view class="page-shell">
    <view class="page-hero"><view class="ink-nav"><text class="nav-back" @click="goBack">‹</text>项目完成确认台</view></view>
    <view class="content-layer safe-bottom">
      <view v-if="permissionDenied" class="state-card"><text class="state-title">仅管理员可查看</text><text class="state-copy">请切换到管理员身份后再进入。</text></view>
      <block v-else>
        <view class="pending-card"><text class="pending-label">待确认 · {{ projects.length }} 个项目</text><text class="pending-title">{{ current?.title || '暂无待确认项目' }}</text><text class="pending-meta">{{ current?.completion?.submitted_by_name || '负责人' }} 提交完成记录</text></view>
        <view v-if="loading" class="state-card">正在加载完成记录...</view>
        <view v-else-if="!current" class="state-card">所有项目完成记录都已处理</view>
        <block v-else>
          <view class="review-card">
            <text class="section-title">活动总结</text>
            <text class="summary">{{ current.completion?.summary || '负责人未填写总结' }}</text>
          </view>
          <view class="review-card">
            <text class="section-title">成员时长确认</text>
            <view v-for="item in current.completion?.participants || []" :key="item.user_id" class="member-row">
              <view class="member-copy"><text class="member-name">{{ item.name }}</text><text class="member-role">{{ item.position_name }}</text></view>
              <text class="hours">{{ item.hours }} 小时</text>
            </view>
          </view>
          <view class="review-card">
            <text class="section-title">管理员说明</text>
            <textarea v-model="comment" class="comment-input" maxlength="300" placeholder="通过时可填写备注；驳回时必须说明原因。" />
          </view>
          <view class="actions"><view class="action reject" :class="{ disabled: submitting }" @click="reject">驳回修改</view><view class="action approve" :class="{ disabled: submitting }" @click="approve">确认并计入时长</view></view>
        </block>
      </block>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { getCompletionProjects, reviewProjectCompletion } from '@/api/project';
import { login } from '@/api/user';
import { getErrorMessage } from '@/constants/errors';
import { useUserStore } from '@/stores/user';
const userStore = useUserStore();
const projects = ref<any[]>([]);
const loading = ref(false);
const submitting = ref(false);
const permissionDenied = ref(false);
const comment = ref('');
const current = computed(() => projects.value[0] || null);
const goBack = () => uni.navigateBack();
const load = async () => {
  loading.value = true; permissionDenied.value = false; comment.value = '';
  try {
    if (!userStore.userInfo) userStore.setUser(await login());
    if (!userStore.isAdmin) { permissionDenied.value = true; return; }
    projects.value = await getCompletionProjects();
  } catch (error: any) {
    uni.showToast({ title: getErrorMessage(error?.code, error?.message || '加载失败'), icon: 'none' });
  } finally { loading.value = false; }
};
const review = async (action: 'approve' | 'reject') => {
  if (!current.value || submitting.value) return;
  if (action === 'reject' && !comment.value.trim()) { uni.showToast({ title: '驳回时请填写原因', icon: 'none' }); return; }
  submitting.value = true;
  try {
    await reviewProjectCompletion(current.value._id, action, comment.value.trim());
    uni.showToast({ title: action === 'approve' ? '已确认并计入时长' : '已退回负责人修改', icon: 'success' });
    await load();
  } catch (error: any) { uni.showToast({ title: getErrorMessage(error?.code, error?.message || '操作失败'), icon: 'none' }); } finally { submitting.value = false; }
};
const approve = () => review('approve');
const reject = () => review('reject');
onMounted(load);
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';
.page-hero { @include ink-header(184rpx); padding: 64rpx 34rpx 38rpx; box-sizing: border-box; }
.nav-back { position: absolute; left: 0; font-size: 48rpx; line-height: 1; }
.pending-card { padding: 30rpx; border-radius: $radius-md; background: linear-gradient(135deg, $ink-blue, $ink-blue-deep); color: #fff; }
.pending-label, .pending-meta, .state-title, .state-copy, .summary, .member-role { display: block; }
.pending-label, .pending-meta { color: rgba(255,255,255,.74); font-size: 24rpx; }
.pending-title { display: block; margin-top: 10rpx; font-size: 34rpx; font-weight: 800; }
.pending-meta { margin-top: 10rpx; }
.review-card, .state-card { @include soft-card; padding: 28rpx; margin-top: 24rpx; }
.state-card { color: $text-secondary; text-align: center; }
.state-title { color: $text-primary; font-size: 31rpx; font-weight: 800; }
.state-copy { margin-top: 12rpx; font-size: 25rpx; }
.section-title { display: block; color: $text-primary; font-size: 29rpx; font-weight: 800; }
.summary { margin-top: 16rpx; color: $text-secondary; font-size: 26rpx; line-height: 1.65; white-space: pre-wrap; }
.member-row { display: flex; align-items: center; justify-content: space-between; padding: 18rpx 0; border-bottom: 1rpx solid rgba(31,78,95,.08); }
.member-row:last-child { border-bottom: 0; }
.member-name { display: block; color: $text-primary; font-size: 27rpx; font-weight: 700; }
.member-role { margin-top: 5rpx; color: $text-secondary; font-size: 22rpx; }
.hours { color: $green; font-size: 27rpx; font-weight: 800; }
.comment-input { width: 100%; min-height: 130rpx; box-sizing: border-box; margin-top: 18rpx; padding: 18rpx; border-radius: 14rpx; background: rgba(31,78,95,.06); color: $text-primary; font-size: 26rpx; line-height: 1.6; }
.actions { display: flex; gap: 18rpx; margin-top: 24rpx; }
.action { flex: 1; height: 82rpx; line-height: 82rpx; border-radius: 18rpx; font-size: 27rpx; font-weight: 800; text-align: center; }
.approve { background: $green; color: #fff; }.reject { background: $amber-bg; color: #94601d; }.disabled { opacity: .55; }
</style>
