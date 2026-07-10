<template>
  <view class="page-shell">
    <view class="page-hero"><view class="ink-nav"><text class="nav-back" @click="goBack">‹</text>报销审核台</view></view>
    <view class="content-layer safe-bottom">
      <view v-if="permissionDenied" class="state-card"><text class="state-title">仅管理员可审核报销</text><text class="state-copy">请在个人中心切换为管理员身份。</text></view>
      <block v-else>
        <view class="summary-card"><text class="summary-label">待审核报销</text><text class="summary-num">{{ pendingCount }}</text><text class="summary-unit">笔</text></view>
        <view class="filters"><text v-for="item in filters" :key="item.key" class="filter" :class="{ active: activeFilter === item.key }" @click="activeFilter = item.key">{{ item.name }}</text></view>
        <view v-if="loading" class="state-card">正在加载报销记录...</view>
        <view v-else-if="!filteredItems.length" class="state-card">暂无符合条件的报销记录</view>
        <view v-for="item in filteredItems" :key="item._id" class="record-card">
          <view class="record-head"><view><text class="record-title">{{ item.title }}</text><text class="record-meta">{{ item.user_name }} · {{ item.project_name || '未关联项目' }}</text></view><text class="amount">¥{{ item.amount }}</text></view>
          <text v-if="item.note" class="record-note">说明：{{ item.note }}</text>
          <text v-if="item.review_comment" class="review-result">审核意见：{{ item.review_comment }}</text>
          <textarea v-if="item.status === 'pending'" v-model="comments[item._id]" class="comment-input" maxlength="200" placeholder="通过可选填；驳回必须填写原因。" />
          <view v-if="item.status === 'pending'" class="actions"><view class="action reject" @click="handleReview(item, 'reject')">驳回</view><view class="action approve" @click="handleReview(item, 'approve')">通过</view></view>
          <view v-else-if="item.status === 'approved'" class="actions"><view class="action paid" @click="handleReview(item, 'paid')">标记已打款</view></view>
          <text v-else class="status-result" :class="item.status">{{ statusText(item.status) }}</text>
        </view>
      </block>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getAdminReimbursements, login, reviewReimbursement } from '@/api/user';
import { getErrorMessage } from '@/constants/errors';
import { useUserStore } from '@/stores/user';
const userStore = useUserStore(); const items = ref<any[]>([]); const loading = ref(false); const permissionDenied = ref(false); const activeFilter = ref('pending'); const comments = ref<Record<string, string>>({});
const filters = [{ key: 'pending', name: '待审核' }, { key: 'approved', name: '待打款' }, { key: 'finished', name: '已完成' }, { key: 'all', name: '全部' }];
const pendingCount = computed(() => items.value.filter((item) => item.status === 'pending').length);
const filteredItems = computed(() => items.value.filter((item) => activeFilter.value === 'all' || (activeFilter.value === 'finished' ? ['paid', 'rejected'].includes(item.status) : item.status === activeFilter.value)));
const statusText = (status: string) => ({ pending: '待审核', approved: '已通过，待打款', rejected: '已驳回', paid: '已打款' }[status] || status);
const goBack = () => uni.navigateBack();
const load = async () => { loading.value = true; permissionDenied.value = false; try { if (!userStore.userInfo) userStore.setUser(await login()); if (!userStore.isAdmin) { permissionDenied.value = true; return; } items.value = await getAdminReimbursements(); } catch (error: any) { if (error?.code === 'NO_PERMISSION') permissionDenied.value = true; else uni.showToast({ title: '报销记录加载失败', icon: 'none' }); } finally { loading.value = false; } };
const handleReview = async (item: any, action: 'approve' | 'reject' | 'paid') => { const comment = comments.value[item._id]?.trim() || ''; if (action === 'reject' && !comment) { uni.showToast({ title: '驳回时请填写原因', icon: 'none' }); return; } try { await reviewReimbursement(item._id, action, comment); uni.showToast({ title: action === 'paid' ? '已标记打款' : action === 'approve' ? '报销已通过' : '报销已驳回', icon: 'success' }); await load(); } catch (error: any) { uni.showToast({ title: getErrorMessage(error?.code, error?.message || '操作失败'), icon: 'none' }); } };
onShow(load);
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss'; @import '@/styles/mixins.scss';
.page-hero{@include ink-header(184rpx);padding:64rpx 34rpx 38rpx;box-sizing:border-box}.nav-back{position:absolute;left:0;font-size:48rpx;line-height:1}.summary-card{padding:28rpx;border-radius:$radius-md;background:$ink-blue;color:#fff}.summary-label{display:block;color:rgba(255,255,255,.75);font-size:24rpx}.summary-num{display:inline-block;margin-top:8rpx;font-size:52rpx;font-weight:800}.summary-unit{margin-left:8rpx;font-size:24rpx}.filters{display:flex;gap:12rpx;margin:24rpx 0;overflow-x:auto}.filter{flex:0 0 auto;padding:11rpx 18rpx;border-radius:999rpx;background:rgba(31,78,95,.07);color:$text-secondary;font-size:23rpx}.filter.active{background:$ink-blue;color:#fff}.record-card,.state-card{@include soft-card;padding:26rpx;margin-bottom:20rpx}.state-card{text-align:center;color:$text-secondary}.state-title,.state-copy{display:block}.state-title{color:$text-primary;font-size:30rpx;font-weight:800}.state-copy{margin-top:12rpx;font-size:24rpx}.record-head{display:flex;justify-content:space-between;gap:18rpx}.record-title,.record-meta,.record-note,.review-result,.status-result{display:block}.record-title{color:$text-primary;font-size:29rpx;font-weight:800}.record-meta,.record-note,.review-result{margin-top:8rpx;color:$text-secondary;font-size:23rpx;line-height:1.5}.amount{color:$ink-blue;font-size:29rpx;font-weight:800}.comment-input{width:100%;min-height:110rpx;box-sizing:border-box;margin-top:18rpx;padding:16rpx;border-radius:12rpx;background:rgba(31,78,95,.06);color:$text-primary;font-size:24rpx}.actions{display:flex;gap:16rpx;margin-top:18rpx}.action{flex:1;height:68rpx;line-height:68rpx;border-radius:14rpx;text-align:center;font-size:25rpx;font-weight:800}.approve,.paid{background:$green;color:#fff}.reject{background:$amber-bg;color:#94601d}.status-result{width:max-content;margin-top:18rpx;padding:7rpx 13rpx;border-radius:999rpx;background:$green-bg;color:$green;font-size:22rpx}.status-result.rejected{background:$red-bg;color:$red}
</style>
