<template>
  <view class="page-shell">
    <view class="page-hero"><view class="ink-nav"><text class="nav-back" @click="goBack">‹</text>通知中心<text v-if="unreadCount" class="mark-all" @click="markAll">全部已读</text></view></view>
    <view class="content-layer safe-bottom">
      <view v-if="loading" class="state-card">正在加载通知...</view>
      <view v-else-if="!items.length" class="state-card">暂无通知</view>
      <view v-for="item in items" :key="item._id" class="notice-card" :class="{ unread: !item.read }" @click="openNotice(item)">
        <view class="notice-dot" :class="{ hidden: item.read }"></view>
        <view class="notice-copy"><text class="notice-title">{{ item.title }}</text><text class="notice-content">{{ item.content }}</text><text class="notice-time">{{ formatTime(item.created_at) }}</text></view>
        <text v-if="item.project_id" class="arrow">›</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/api/user';
const items = ref<any[]>([]);
const loading = ref(false);
const unreadCount = computed(() => items.value.filter((item) => !item.read).length);
const goBack = () => uni.navigateBack();
const formatTime = (value: number) => new Date(value).toLocaleString('zh-CN', { hour12: false });
const load = async () => { loading.value = true; try { items.value = await getNotifications(); } catch { uni.showToast({ title: '通知加载失败', icon: 'none' }); } finally { loading.value = false; } };
const markAll = async () => { if (!unreadCount.value) return; await markAllNotificationsRead(); items.value = items.value.map((item) => ({ ...item, read: true })); };
const openNotice = async (item: any) => { try { if (!item.read) { await markNotificationRead(item._id); item.read = true; } if (item.project_id) uni.navigateTo({ url: `/pages/project/detail?id=${item.project_id}` }); else if (item.reimbursement_id) uni.navigateTo({ url: '/pages/mine/reimbursements' }); } catch { uni.showToast({ title: '通知处理失败', icon: 'none' }); } };
onShow(load);
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss'; @import '@/styles/mixins.scss';
.page-hero { @include ink-header(184rpx); padding:64rpx 34rpx 38rpx; box-sizing:border-box; }.nav-back { position:absolute; left:0; font-size:48rpx; line-height:1; }.mark-all { position:absolute; right:0; color:rgba(255,255,255,.85); font-size:24rpx; font-weight:500; }.notice-card,.state-card { @include soft-card; display:flex; align-items:flex-start; gap:16rpx; padding:26rpx; margin-bottom:18rpx; }.notice-card.unread { border:1rpx solid rgba(50,130,103,.22); }.notice-dot { width:14rpx; height:14rpx; flex:0 0 auto; margin-top:9rpx; border-radius:50%; background:$green; }.notice-dot.hidden { opacity:0; }.notice-copy { flex:1; min-width:0; }.notice-title,.notice-content,.notice-time { display:block; }.notice-title { color:$text-primary; font-size:28rpx; font-weight:800; }.notice-content { margin-top:10rpx; color:$text-secondary; font-size:24rpx; line-height:1.55; }.notice-time { margin-top:10rpx; color:$text-muted; font-size:21rpx; }.arrow { align-self:center; color:$text-muted; font-size:36rpx; }.state-card { justify-content:center; color:$text-secondary; }
</style>
