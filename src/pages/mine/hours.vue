<template>
  <view class="page-shell">
    <view class="page-hero"><view class="ink-nav"><text class="nav-back" @click="goBack">‹</text>志愿服务时长</view></view>
    <view class="content-layer safe-bottom">
      <view class="summary-card">
        <text class="summary-label">已确认累计时长</text>
        <text class="summary-num">{{ totalHours }}</text><text class="summary-unit">小时</text>
        <text class="summary-copy">仅统计经管理员确认的项目完成记录</text>
        <view v-if="records.length" class="certificate-entry" @click="goCertificate">生成志愿服务证明</view>
      </view>
      <view class="section-title">服务时长明细</view>
      <view v-if="loading" class="state-card">正在加载明细...</view>
      <view v-else-if="!records.length" class="state-card">暂无已确认的服务时长</view>
      <view v-for="item in records" :key="item._id" class="record-card">
        <view class="record-main"><text class="record-title">{{ item.project_title }}</text><text class="record-meta">{{ item.project_date }} · {{ item.position_name }}</text></view>
        <view class="record-hours"><text>{{ item.hours }}</text><text>小时</text></view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getVolunteerHours } from '@/api/user';
const records = ref<any[]>([]);
const loading = ref(false);
const totalHours = computed(() => records.value.reduce((total, item) => total + Number(item.hours || 0), 0));
const goBack = () => uni.navigateBack();
const goCertificate = () => uni.navigateTo({ url: '/pages/mine/certificate' });
const load = async () => {
  loading.value = true;
  try { records.value = await getVolunteerHours(); } catch { uni.showToast({ title: '时长明细加载失败', icon: 'none' }); } finally { loading.value = false; }
};
onShow(load);
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';
.page-hero { @include ink-header(184rpx); padding: 64rpx 34rpx 38rpx; box-sizing: border-box; }
.nav-back { position: absolute; left: 0; font-size: 48rpx; line-height: 1; }
.summary-card { padding: 34rpx 30rpx; border-radius: $radius-md; background: linear-gradient(135deg, $ink-blue, $ink-blue-deep); color: #fff; box-shadow: 0 14rpx 30rpx rgba(15,47,61,.18); }
.summary-label, .summary-copy { display: block; color: rgba(255,255,255,.72); font-size: 24rpx; }
.summary-num { display: inline-block; margin-top: 12rpx; font-size: 58rpx; font-weight: 800; }
.summary-unit { margin-left: 8rpx; font-size: 25rpx; }
.summary-copy { margin-top: 10rpx; font-size: 22rpx; }
.certificate-entry { width: max-content; margin-top: 20rpx; padding: 10rpx 18rpx; border: 1rpx solid rgba(255,255,255,.5); border-radius: 999rpx; color: #fff; font-size: 23rpx; font-weight: 700; }
.section-title { margin: 34rpx 6rpx 18rpx; color: $text-primary; font-size: 30rpx; font-weight: 800; }
.record-card, .state-card { @include soft-card; display: flex; align-items: center; gap: 18rpx; padding: 25rpx 26rpx; margin-bottom: 18rpx; }
.state-card { color: $text-secondary; justify-content: center; }
.record-main { flex: 1; min-width: 0; }
.record-title, .record-meta { display: block; }
.record-title { color: $text-primary; font-size: 28rpx; font-weight: 700; @include text-ellipsis; }
.record-meta { margin-top: 8rpx; color: $text-secondary; font-size: 23rpx; }
.record-hours { display: flex; flex-direction: column; align-items: flex-end; color: $green; font-size: 22rpx; }
.record-hours text:first-child { font-size: 34rpx; font-weight: 800; }
</style>
