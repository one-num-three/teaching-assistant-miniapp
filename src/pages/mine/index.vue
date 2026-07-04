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
          <text class="name">{{ userInfo?.name || '陈恩' }}</text>
          <text class="role">{{ roleLine }}</text>
        </view>
      </view>
    </view>

    <view class="content-layer safe-bottom">
      <view class="stats-card">
        <view class="stat-item">
          <text class="num">{{ userInfo?.stats?.joined_projects || 12 }}</text>
          <text class="label">参与项目</text>
        </view>
        <view class="stat-item">
          <text class="num">{{ userInfo?.stats?.volunteer_hours || 48 }}</text>
          <text class="label">志愿时长/h</text>
        </view>
        <view class="stat-item">
          <text class="num">{{ userInfo?.stats?.leader_count || 3 }}</text>
          <text class="label">带队次数</text>
        </view>
      </view>

      <view class="section-title-small">我的项目</view>
      <view class="project-mini-card">
        <view>
          <text class="mini-title">古诗诵读与飞花令</text>
          <text class="mini-meta">主讲 · 7月7日</text>
        </view>
        <text class="pill green">已完成</text>
      </view>
      <view class="project-mini-card">
        <view>
          <text class="mini-title">趣味科普：地球的呼吸</text>
          <text class="mini-meta">项目负责人 · 7月5日</text>
        </view>
        <text class="pill green">招募中</text>
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
import { computed } from 'vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)
const defaultAvatar = '/static/logo.png'
const showAdminEntry = computed(() => userStore.isAdmin)

const roleLine = computed(() => {
  if (userInfo.value?.college) return `${userInfo.value.college} · ${userInfo.value.grade}`
  if (userStore.isGuest) return '待完善资料'
  return '支协成员 · 项目负责人'
})

const goProfile = () => {
  uni.navigateTo({ url: '/pages/mine/profile' })
}

const goReview = () => {
  uni.navigateTo({ url: '/pages/admin/review' })
}

const goAdmin = () => {
  uni.showToast({ title: '档期发布工具开发中', icon: 'none' })
}
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
  color: rgba(255, 255, 255, 0.74);
  font-size: 25rpx;
}

.stats-card {
  @include soft-card;
  display: flex;
  padding: 28rpx 0;
  margin-bottom: 34rpx;
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

.section-title-small {
  margin: 10rpx 8rpx 18rpx;
  color: $text-primary;
  font-size: 30rpx;
  font-weight: 700;
}

.project-mini-card {
  @include soft-card;
  min-height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 28rpx;
  margin-bottom: 18rpx;
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
</style>
