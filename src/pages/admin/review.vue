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
        <text class="pending-small">待审核 · 1 份教案</text>
        <text class="pending-title">红色手工折纸课</text>
        <text class="pending-meta">7月12日 周六 14:00 · 提交人：陈恩</text>
      </view>

      <view class="review-card">
        <view class="review-head">
          <text class="card-title">教案详情</text>
          <text class="pill amber">待审核</text>
        </view>

        <view class="info-block">
          <text class="info-label">教案标题</text>
          <text class="info-value">红色手工折纸课：千纸鹤与五角星</text>
        </view>

        <view class="info-block">
          <text class="info-label">教案文件</text>
          <view class="file-line">
            <view class="pdf-icon">PDF</view>
            <view>
              <text class="file-name">红色手工折纸课教案_终稿.pdf</text>
              <text class="file-size">2.4 MB · 4 页</text>
            </view>
          </view>
        </view>

        <view class="info-block">
          <text class="info-label">辅助岗位设置</text>
          <view class="chips">
            <text class="chip">助教 × 2</text>
            <text class="chip">PPT × 1</text>
            <text class="chip">摄影 × 1</text>
            <text class="chip">场务 × 1</text>
          </view>
        </view>

        <view class="info-block">
          <text class="info-label">补充说明</text>
          <text class="info-value">折纸材料已备齐，建议多带备用彩纸。</text>
        </view>

        <view class="action-row">
          <button class="approve" @click="approve">通过立项</button>
          <button class="reject" @click="reject">驳回释放</button>
        </view>
      </view>

      <view class="note-card">
        <text class="card-title">审核说明</text>
        <text class="note-line">通过：项目立项，进入招募中</text>
        <text class="note-line">驳回：档期释放，返回待认领</text>
      </view>

      <view class="note-card">
        <text class="card-title">快捷操作</text>
        <view class="quick-row">
          <button class="quick primary">发布新档期</button>
          <button class="quick ghost">查看已审核</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
const goBack = () => uni.navigateBack()
const approve = () => uni.showToast({ title: '已通过', icon: 'success' })
const reject = () => uni.showToast({ title: '已驳回', icon: 'none' })
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
.note-card {
  @include soft-card;
  padding: 28rpx;
  margin-bottom: 24rpx;
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
