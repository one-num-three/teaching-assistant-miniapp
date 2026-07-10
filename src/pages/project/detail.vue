<template>
  <view class="page-shell">
    <view class="detail-hero">
      <view class="ink-nav"><text class="nav-back" @click="goBack">‹</text>项目详情</view>
      <view v-if="project" class="hero-detail">
        <text class="pill" :class="statusClass">{{ statusText }}</text>
        <text class="detail-title">{{ project.title }}</text>
        <view class="meta-list"><text>时间：{{ project.datetime }}</text><text>地点：{{ project.location }}</text><text>受众：{{ project.target_audience }}</text></view>
      </view>
    </view>

    <view v-if="loading" class="content-layer"><view class="state-card">正在加载项目...</view></view>
    <view v-else-if="!project" class="content-layer"><view class="state-card">未找到项目信息</view></view>

    <view v-else class="content-layer detail-content safe-bottom">
      <view class="section-block">
        <view class="block-title">教案大纲</view>
        <view class="outline-list"><view v-for="(item, index) in outline" :key="item" class="outline-item"><text class="outline-index">{{ index + 1 }}</text><text>{{ item }}</text></view></view>
      </view>

      <view class="section-block">
        <view class="block-title">项目负责人</view>
        <view class="leader-card">
          <image class="member-avatar" :src="project.leader?.avatar || defaultAvatar" />
          <view class="leader-copy"><text class="member-name">{{ project.leader?.name || '待认领' }}</text><text class="member-role">{{ leaderHint }}</text></view>
          <view v-if="canClaimLeader" class="claim-main" :class="{ disabled: claiming }" @click="handleClaimLeader">抢占</view>
          <view v-else-if="canReleaseLeader" class="slot-action remove" @click="confirmReleaseLeader">移除负责人</view>
        </view>
      </view>

      <view class="section-block">
        <view class="block-title">教案状态</view>
        <view class="lesson-card">
          <view class="lesson-head"><view><text class="lesson-title">{{ lessonTitle }}</text><text class="lesson-meta">{{ lessonMeta }}</text></view><text class="pill" :class="lessonStatusTone">{{ lessonStatusText }}</text></view>
          <view v-if="project.lesson_plan" class="lesson-action" @click="viewLessonPlan">查阅教案</view>
          <text v-else class="lesson-empty">负责人认领后提交教案，成员可在这里查看提交状态。</text>
        </view>
      </view>

      <view v-if="lessonVersions.length" class="section-block">
        <view class="block-title">教案版本</view>
        <view v-for="item in lessonVersions" :key="item._id" class="version-card" @click="previewVersion(item)">
          <view><text class="version-title">第 {{ item.version }} 版 · {{ item.file_name }}</text><text class="version-meta">{{ item.submitter_name }} · {{ formatTime(item.submitted_at) }}</text></view>
          <text class="version-status" :class="item.review_status">{{ versionStatusText(item.review_status) }}</text>
        </view>
      </view>

      <view v-if="reviewHistory.length" class="section-block">
        <view class="block-title">审核记录</view>
        <view v-for="item in reviewHistory" :key="item._id" class="review-card">
          <view class="review-head"><text class="review-action" :class="item.action">{{ item.action === 'approve' ? '审核通过' : '退回修改' }}</text><text class="review-time">第 {{ item.lesson_version || 1 }} 版</text></view>
          <text class="review-comment">{{ item.comment || '未填写审核意见' }}</text>
          <text class="review-meta">{{ item.reviewer_name }} · {{ formatTime(item.created_at) }}</text>
        </view>
      </view>

      <view v-if="project.completion" class="section-block">
        <view class="block-title">项目完成记录</view>
        <view class="completion-card"><text class="completion-title">{{ completionStatusText }}</text><text class="completion-copy">{{ completionCopy }}</text></view>
      </view>

      <view class="section-block">
        <view class="block-title">岗位认领 · {{ filledCount }}/{{ totalCount }} 已满</view>
        <view v-if="slots.length === 0" class="state-card compact">暂无辅助岗位</view>
        <view v-for="slot in slots" :key="slot.uid" class="slot-card">
          <image class="member-avatar" :src="slot.avatar || defaultAvatar" />
          <view class="slot-copy"><text class="member-name">{{ slot.name }}</text><text class="member-role">{{ slot.role }}{{ slot.hint }}</text></view>
          <view class="slot-actions">
            <view class="slot-action" :class="{ disabled: slot.disabled, cancel: slot.canCancel, contact: slot.contactAdmin }" @click="handleSlotAction(slot)">{{ slot.actionText }}</view>
            <view v-if="isAdmin && slot.claimed && canAdminChange" class="slot-action remove" @click="confirmRemoveMember(slot)">移除</view>
          </view>
        </view>
      </view>

      <view v-if="isAdmin && canAdminChange" class="section-block">
        <view class="block-title">管理员操作</view>
        <view class="admin-card"><text>取消项目会保留当前认领和历史记录，但停止后续认领与完成确认。</text><view class="admin-cancel" @click="confirmCancelProject">取消项目</view></view>
      </view>

      <view v-if="showCancelTip" class="cancel-tip"><text>已认领成功，10 分钟内可随时取消；超过后请联系管理员处理。</text></view>
      <button v-if="isLeader && canSubmitLesson" class="bottom-action" @click="goSubmit">{{ submitActionText }}</button>
      <button v-else-if="isLeader && canSubmitCompletion" class="bottom-action" @click="goCompletion">提交项目完成记录</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { cancelPosition, cancelProject, claimPosition, claimProjectLeader, getLessonVersions, getProjectDetail, getProjectReviews, removeProjectMember } from '@/api/project';
import { getErrorMessage } from '@/constants/errors';
import { useUserStore } from '@/stores/user';

const CANCEL_WINDOW_MS = 10 * 60 * 1000;
const userStore = useUserStore();
const project = ref<any>(null);
const loading = ref(true);
const claiming = ref(false);
const projectId = ref('');
const showCancelTip = ref(false);
const reviewHistory = ref<any[]>([]);
const lessonVersions = ref<any[]>([]);
const clockTick = ref(Date.now());
const defaultAvatar = '/static/logo.png';
let clockTimer: ReturnType<typeof setInterval> | null = null;

const statusMap: Record<string, { text: string; klass: string }> = {
  pending_claim: { text: '待认领', klass: 'amber' }, pending_review: { text: '待审核', klass: 'amber' }, recruiting: { text: '招募中', klass: 'green' }, revision_required: { text: '需修改', klass: 'red' }, locked: { text: '已锁定', klass: 'blue' }, completion_pending: { text: '待完成确认', klass: 'amber' }, completed: { text: '已完成', klass: 'blue' }, cancelled: { text: '已取消', klass: 'red' }
};
const lessonStatusMap: Record<string, { text: string; klass: string }> = { not_submitted: { text: '未提交', klass: 'amber' }, pending_review: { text: '待审核', klass: 'amber' }, approved: { text: '已通过', klass: 'green' }, rejected: { text: '已驳回', klass: 'red' } };
const positionNames: Record<string, string> = { assistant: '助教', ppt: 'PPT', photographer: '摄影', logistics: '场务' };

const currentUserId = computed(() => userStore.userInfo?.openid || '');
const isLeader = computed(() => Boolean(currentUserId.value && project.value?.leader?.user_id === currentUserId.value));
const isAdmin = computed(() => userStore.isAdmin);
const statusText = computed(() => statusMap[project.value?.project_status]?.text || '待认领');
const statusClass = computed(() => statusMap[project.value?.project_status]?.klass || 'amber');
const outline = computed(() => project.value?.outline?.length ? project.value.outline : ['课程导入', '主题讲解', '互动练习', '总结反馈']);
const canClaimLeader = computed(() => project.value?.project_status === 'pending_claim' && !project.value?.leader);
const canClaimSupport = computed(() => project.value?.project_status === 'recruiting');
const canSubmitLesson = computed(() => ['pending_review', 'revision_required'].includes(project.value?.project_status));
const canSubmitCompletion = computed(() => ['recruiting', 'locked'].includes(project.value?.project_status));
const canAdminChange = computed(() => !['completed', 'cancelled', 'completion_pending'].includes(project.value?.project_status));
const canReleaseLeader = computed(() => isAdmin.value && ['pending_review', 'revision_required'].includes(project.value?.project_status) && Boolean(project.value?.leader));
const leaderHint = computed(() => !project.value?.leader?.name ? '抢占档期后提交教案' : isLeader.value ? '负责人已锁定，如需退出请联系管理员' : '支协成员 · 已认领');
const lessonStatus = computed(() => project.value?.lesson_status || 'not_submitted');
const lessonStatusText = computed(() => lessonStatusMap[lessonStatus.value]?.text || '未提交');
const lessonStatusTone = computed(() => lessonStatusMap[lessonStatus.value]?.klass || 'amber');
const lessonTitle = computed(() => project.value?.lesson_plan?.title || '暂未提交教案');
const lessonMeta = computed(() => {
  const lesson = project.value?.lesson_plan;
  if (!lesson) return '负责人提交后，可在此查看教案文件信息';
  return `${lesson.file_name || '本地测试教案.pdf'} · ${lesson.size || '未知大小'} · 第 ${lesson.version || 1} 版`;
});
const submitActionText = computed(() => project.value?.project_status === 'revision_required' ? '修改并重新提交教案' : project.value?.lesson_status === 'pending_review' ? '查看/修改教案' : '提交教案');
const completionStatusText = computed(() => project.value?.completion?.status === 'approved' ? '已确认，时长已入账' : project.value?.completion?.status === 'rejected' ? '已退回修改' : '等待管理员确认');
const completionCopy = computed(() => project.value?.completion?.admin_comment || project.value?.completion?.summary || '负责人已提交活动总结与成员服务时长。');

const slots = computed(() => {
  const result: any[] = []; const now = clockTick.value;
  Object.entries(project.value?.positions || {}).filter(([key]) => key !== 'lecturer').forEach(([key, raw]: any) => {
    for (let i = 0; i < Number(raw.total || 0); i += 1) {
      const member = raw.members?.[i]; const claimed = Boolean(member); const isMine = member?.user_id === currentUserId.value;
      const canCancel = Boolean(isMine && ['recruiting', 'locked'].includes(project.value?.project_status) && now - Number(member?.claimed_at || 0) <= CANCEL_WINDOW_MS);
      const contactAdmin = Boolean(isMine && claimed && !canCancel && ['recruiting', 'locked'].includes(project.value?.project_status));
      result.push({ uid: `${key}-${i}`, key, role: positionNames[key] || key, name: member?.name || '等待认领', avatar: member?.avatar || '', userId: member?.user_id || '', claimed, canCancel, contactAdmin, hint: isMine ? (canCancel ? ' · 10 分钟内可取消' : contactAdmin ? ' · 超过 10 分钟' : '') : '', disabled: claiming.value || (claimed && !canCancel && !contactAdmin) || (!claimed && !canClaimSupport.value), actionText: claimed ? (canCancel ? '取消' : contactAdmin ? '联系管理员取消' : '已认领') : '认领' });
    }
  }); return result;
});
const totalCount = computed(() => slots.value.length);
const filledCount = computed(() => slots.value.filter((item) => item.claimed).length);
const goBack = () => uni.navigateBack();
const goSubmit = () => uni.navigateTo({ url: `/pages/lesson-plan/submit?id=${project.value?._id || projectId.value}` });
const goCompletion = () => uni.navigateTo({ url: `/pages/project/complete?id=${project.value?._id || projectId.value}` });

const fetchProjectDetail = async () => {
  if (!projectId.value) return; loading.value = true;
  try { project.value = await getProjectDetail(projectId.value); clockTick.value = Date.now(); const isMember = isLeader.value || isAdmin.value || Object.values(project.value.positions || {}).some((position: any) => (position.members || []).some((member: any) => member.user_id === currentUserId.value)); reviewHistory.value = (isLeader.value || isAdmin.value) ? await getProjectReviews(projectId.value) : []; lessonVersions.value = isMember ? await getLessonVersions(projectId.value) : []; }
  catch { project.value = null; reviewHistory.value = []; lessonVersions.value = []; }
  finally { loading.value = false; }
};
const handleClaimLeader = async () => { if (claiming.value || !canClaimLeader.value) return; claiming.value = true; try { project.value = await claimProjectLeader(project.value._id); uni.showToast({ title: '认领成功', icon: 'success' }); } catch (err: any) { uni.showToast({ title: getErrorMessage(err?.code, err?.message || '认领失败'), icon: 'none' }); } finally { claiming.value = false; } };
const handleSlotAction = (slot: any) => { if (slot.disabled) return; if (slot.contactAdmin) return showContactAdminTip(); if (slot.claimed && slot.canCancel) return confirmCancelPosition(slot.key); if (!slot.claimed) handleClaimPosition(slot.key); };
const handleClaimPosition = async (key: string) => { claiming.value = true; try { project.value = await claimPosition(project.value._id, key); clockTick.value = Date.now(); showCancelWindowTip(); uni.showToast({ title: '认领成功', icon: 'success' }); } catch (err: any) { uni.showToast({ title: getErrorMessage(err?.code, err?.message || '认领失败'), icon: 'none' }); } finally { claiming.value = false; } };
const confirmCancelPosition = (key: string) => uni.showModal({ title: '取消认领', content: '确认取消该岗位吗？取消后其他成员可以继续认领。', confirmText: '取消认领', confirmColor: '#C0392B', success: (res) => { if (res.confirm) handleCancelPosition(key); } });
const handleCancelPosition = async (key: string) => { claiming.value = true; try { project.value = await cancelPosition(project.value._id, key); showCancelTip.value = false; uni.showToast({ title: '已取消认领', icon: 'none' }); } catch (err: any) { uni.showToast({ title: getErrorMessage(err?.code, err?.message || '取消失败'), icon: 'none' }); } finally { claiming.value = false; } };
const showCancelWindowTip = () => { showCancelTip.value = true; setTimeout(() => { showCancelTip.value = false; }, 5000); };
const showContactAdminTip = () => uni.showModal({ title: '请联系管理员', content: '该岗位认领已超过 10 分钟，不能自助取消。请联系管理员协助处理。', showCancel: false, confirmText: '知道了' });
const viewLessonPlan = () => { if (!project.value?.lesson_plan) return; uni.navigateTo({ url: `/pages/document/preview?source=project&id=${project.value._id}` }); };
const previewVersion = (item: any) => uni.navigateTo({ url: `/pages/document/preview?source=project&id=${project.value._id}&version=${item.version}` });
const versionStatusText = (status: string) => ({ pending_review: '待审核', approved: '已通过', rejected: '已驳回' }[status] || status);
const formatTime = (value: number) => new Date(value).toLocaleString('zh-CN', { hour12: false });
const confirmRemoveMember = (slot: any) => uni.showModal({ title: '移除成员', content: `确认将 ${slot.name} 从${slot.role}岗位移除吗？`, confirmText: '确认移除', confirmColor: '#C0392B', success: (res) => { if (res.confirm) handleRemoveMember(slot.key, slot.userId); } });
const confirmReleaseLeader = () => uni.showModal({ title: '移除负责人', content: '仅未通过教案审核的负责人可以被移除。移除后需重新认领并提交教案。', confirmText: '确认移除', confirmColor: '#C0392B', success: (res) => { if (res.confirm) handleRemoveMember('lecturer', project.value.leader.user_id); } });
const handleRemoveMember = async (positionKey: string, targetUserId: string) => { claiming.value = true; try { project.value = await removeProjectMember(project.value._id, positionKey, targetUserId, '管理员调整成员安排'); reviewHistory.value = []; uni.showToast({ title: '成员已移除', icon: 'none' }); } catch (err: any) { uni.showToast({ title: getErrorMessage(err?.code, err?.message || '移除失败'), icon: 'none' }); } finally { claiming.value = false; } };
const confirmCancelProject = () => uni.showModal({ title: '取消项目', content: '确认取消该项目吗？已认领成员不会被删除，但项目将停止后续流程。', confirmText: '确认取消', confirmColor: '#C0392B', success: (res) => { if (res.confirm) handleCancelProject(); } });
const handleCancelProject = async () => { claiming.value = true; try { project.value = await cancelProject(project.value._id, '管理员取消项目'); uni.showToast({ title: '项目已取消', icon: 'none' }); } catch (err: any) { uni.showToast({ title: getErrorMessage(err?.code, err?.message || '取消失败'), icon: 'none' }); } finally { claiming.value = false; } };
onLoad((options: any) => { projectId.value = options?.id || 'project-1'; fetchProjectDetail(); });
onShow(() => { if (projectId.value) fetchProjectDetail(); });
onMounted(() => { clockTimer = setInterval(() => { clockTick.value = Date.now(); }, 30 * 1000); });
onUnmounted(() => { if (clockTimer) clearInterval(clockTimer); });
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';
.detail-hero { @include ink-header(396rpx); padding: 64rpx 34rpx 46rpx; box-sizing: border-box; }.nav-back { position: absolute; left: 0; font-size: 48rpx; line-height: 1; }.detail-content { padding-bottom: 160rpx; }.hero-detail { position: relative; z-index: 1; margin-top: 34rpx; }.detail-title { display:block; margin-top:20rpx; color:#fff; font-size:38rpx; font-weight:800; line-height:1.36; }.meta-list { display:flex; flex-direction:column; gap:10rpx; margin-top:24rpx; color:rgba(255,255,255,.78); font-size:25rpx; }.section-block { margin-top:42rpx; }.block-title { color:$text-secondary; font-size:28rpx; font-weight:700; margin-bottom:18rpx; }.outline-list { display:flex; flex-direction:column; gap:16rpx; color:$text-primary; font-size:28rpx; }.outline-item { display:flex; align-items:center; gap:16rpx; }.outline-index { width:34rpx; height:34rpx; display:flex; align-items:center; justify-content:center; border:2rpx solid rgba(31,78,95,.32); border-radius:50%; color:$ink-blue; font-size:22rpx; }.leader-card,.slot-card,.lesson-card,.review-card,.version-card,.completion-card,.admin-card { @include soft-card; padding:22rpx 24rpx; margin-bottom:18rpx; }.leader-card,.slot-card,.version-card { display:flex; align-items:center; gap:20rpx; }.lesson-card,.review-card,.completion-card,.admin-card { display:block; }.member-avatar { width:72rpx; height:72rpx; border-radius:50%; background:rgba(31,78,95,.08); }.leader-copy,.slot-copy { flex:1; min-width:0; }.member-name,.member-role,.lesson-title,.lesson-meta,.lesson-empty,.review-comment,.review-meta,.completion-title,.completion-copy { display:block; }.member-name,.lesson-title,.completion-title { color:$text-primary; font-size:29rpx; font-weight:700; }.member-role,.lesson-meta,.lesson-empty,.completion-copy { margin-top:6rpx; color:$text-secondary; font-size:24rpx; line-height:1.5; }.lesson-head,.review-head { display:flex; align-items:flex-start; justify-content:space-between; gap:20rpx; }.lesson-action { display:inline-flex; align-items:center; justify-content:center; height:58rpx; padding:0 24rpx; margin-top:20rpx; border-radius:999rpx; background:rgba(31,78,95,.08); color:$ink-blue; font-size:24rpx; font-weight:700; }.claim-main,.slot-action { min-width:108rpx; height:54rpx; line-height:54rpx; padding:0 16rpx; box-sizing:border-box; border-radius:999rpx; background:$ink-blue; color:#fff; font-size:23rpx; text-align:center; }.slot-actions { display:flex; flex-direction:column; align-items:flex-end; gap:10rpx; }.slot-action.cancel { background:$red-bg; color:$red; }.slot-action.contact { background:$amber-bg; color:#94601d; }.slot-action.remove { background:$red-bg; color:$red; }.claim-main.disabled,.slot-action.disabled { background:rgba(31,78,95,.08); color:$text-muted; }.review-card { margin-bottom:14rpx; }.version-card { justify-content:space-between; }.version-title,.version-meta { display:block; }.version-title { color:$text-primary; font-size:26rpx; font-weight:800; }.version-meta { margin-top:7rpx; color:$text-muted; font-size:21rpx; }.version-status { flex:0 0 auto; padding:7rpx 12rpx; border-radius:999rpx; background:$amber-bg; color:#94601d; font-size:21rpx; }.version-status.approved { background:$green-bg; color:$green; }.version-status.rejected { background:$red-bg; color:$red; }.review-head { align-items:center; }.review-action { color:$ink-blue; font-size:26rpx; font-weight:800; }.review-action.reject { color:$red; }.review-action.approve { color:$green; }.review-time,.review-meta { color:$text-muted; font-size:22rpx; }.review-comment { margin-top:12rpx; color:$text-secondary; font-size:25rpx; line-height:1.55; }.admin-card { color:$text-secondary; font-size:24rpx; line-height:1.55; }.admin-cancel { width:max-content; margin-top:18rpx; padding:12rpx 20rpx; border-radius:999rpx; background:$red-bg; color:$red; font-size:24rpx; font-weight:700; }.bottom-action { position:fixed; left:28rpx; right:28rpx; bottom:calc(24rpx + env(safe-area-inset-bottom)); height:88rpx; border-radius:22rpx; background:linear-gradient(135deg,$ink-blue,$ink-blue-deep); color:#fff; font-size:30rpx; font-weight:700; box-shadow:0 16rpx 30rpx rgba(15,47,61,.22); }.cancel-tip { position:fixed; left:28rpx; right:28rpx; bottom:calc(126rpx + env(safe-area-inset-bottom)); z-index:10; padding:22rpx 26rpx; border-radius:18rpx; background:rgba(15,47,61,.92); color:#fff; font-size:25rpx; line-height:1.5; }.state-card { @include soft-card; padding:48rpx; color:$text-secondary; text-align:center; }.state-card.compact { padding:28rpx; }
</style>
