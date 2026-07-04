<template>
  <view class="page-shell">
    <view class="submit-hero">
      <view class="ink-nav">
        <text class="nav-back" @click="goBack">‹</text>
        认领档期 · 提交教案
      </view>
    </view>

    <view class="success-strip">
      <text class="success-title">已成功认领！你是第一个</text>
      <text class="success-sub">其他支协成员已无法再抢占此档期</text>
    </view>

    <view class="project-strip">
      <text class="strip-label">待认领</text>
      <text class="strip-title">红色手工折纸课</text>
      <text class="strip-meta">7月12日 周六 14:00 · 雨花台区景明社区</text>
      <text class="deadline">请在 24 小时内提交教案</text>
    </view>

    <view class="form-body safe-bottom">
      <view class="field-block">
        <text class="field-label">教案标题</text>
        <input class="field-input" v-model="lessonTitle" />
      </view>

      <view class="field-block">
        <text class="field-label">教案文件</text>
        <view class="upload-zone" @click="chooseLessonFile">
          <view class="upload-mark"></view>
          <text class="upload-title">点击上传教案文件</text>
          <text class="upload-hint">支持 Word (.docx) / PDF，最大 20MB</text>
        </view>

        <view class="file-card" v-if="selectedFile">
          <view class="pdf-icon">PDF</view>
          <view class="file-info">
            <text class="file-name">{{ selectedFile.name }}</text>
            <text class="file-size">{{ selectedFile.size }}</text>
          </view>
          <text class="remove" @click.stop="selectedFile = null">×</text>
        </view>
      </view>

      <view class="preview-card">
        <text class="preview-title">{{ lessonTitle }}</text>
        <view class="preview-page">
          <text class="preview-heading">课程目标</text>
          <text class="preview-text">通过折纸活动锻炼小学生动手能力，融入红色教育元素。</text>
          <text class="page-num">第 1 页</text>
        </view>
        <view class="preview-page">
          <text class="preview-heading">教学流程</text>
          <text class="preview-text">导入展示、教师示范、分步跟学、助教巡回、作品分享。</text>
          <text class="page-num">第 2 页</text>
        </view>
      </view>

      <button class="submit-btn" @click="submitLesson">提交教案（进入审核）</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { chooseFile } from '@/utils/platform'

const lessonTitle = ref('红色手工折纸课：千纸鹤与五角星')
const selectedFile = ref<{ name: string; size: string } | null>({
  name: '红色手工折纸课教案_终稿.pdf',
  size: '2.4 MB · 4 页'
})

const goBack = () => uni.navigateBack()

const chooseLessonFile = async () => {
  try {
    const files = await chooseFile(1)
    const file = files[0]
    if (!file) return
    selectedFile.value = {
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`
    }
  } catch (err) {
    uni.showToast({ title: '请在微信小程序中选择文件', icon: 'none' })
  }
}

const submitLesson = () => {
  uni.showToast({ title: '教案已提交审核', icon: 'success' })
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.submit-hero {
  @include ink-header(186rpx);
  padding: 64rpx 34rpx 38rpx;
  box-sizing: border-box;
}

.success-strip {
  position: relative;
  z-index: 2;
  padding: 26rpx 54rpx 24rpx;
  margin-top: -20rpx;
  background: linear-gradient(90deg, rgba(230, 242, 234, 0.96), rgba(255, 250, 240, 0.94));
}

.success-title,
.success-sub,
.strip-label,
.strip-title,
.strip-meta,
.deadline {
  display: block;
}

.success-title {
  color: $green;
  font-size: 31rpx;
  font-weight: 800;
}

.success-sub {
  margin-top: 8rpx;
  color: $text-secondary;
  font-size: 24rpx;
}

.project-strip {
  padding: 28rpx 54rpx;
  background:
    radial-gradient(ellipse at 76% 80%, rgba(184, 145, 82, 0.18), transparent 34%),
    linear-gradient(135deg, #f4dc9e, #f7edcf);
}

.strip-label {
  width: max-content;
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  background: rgba(185, 130, 55, 0.16);
  color: $amber;
  font-size: 22rpx;
}

.strip-title {
  margin-top: 14rpx;
  color: #744719;
  font-size: 34rpx;
  font-weight: 800;
}

.strip-meta {
  margin-top: 10rpx;
  color: rgba(116, 71, 25, 0.78);
  font-size: 25rpx;
}

.deadline {
  width: max-content;
  margin-top: 16rpx;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.46);
  color: $amber;
  font-size: 23rpx;
}

.form-body {
  padding: 34rpx 28rpx;
}

.field-block {
  margin-bottom: 32rpx;
}

.field-label {
  display: block;
  color: $text-secondary;
  font-size: 27rpx;
  margin-bottom: 14rpx;
}

.field-input {
  @include soft-card;
  height: 84rpx;
  padding: 0 26rpx;
  color: $text-primary;
  font-size: 28rpx;
}

.upload-zone {
  @include soft-card;
  height: 190rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-style: dashed;
  gap: 10rpx;
}

.upload-mark {
  width: 44rpx;
  height: 44rpx;
  border: 4rpx solid $ink-blue;
  border-radius: 50%;
  position: relative;
  opacity: 0.7;
}

.upload-mark::before,
.upload-mark::after {
  content: '';
  position: absolute;
  background: $ink-blue;
}

.upload-mark::before {
  left: 18rpx;
  top: 8rpx;
  width: 4rpx;
  height: 26rpx;
}

.upload-mark::after {
  left: 8rpx;
  top: 18rpx;
  width: 26rpx;
  height: 4rpx;
}

.upload-title {
  color: $text-primary;
  font-size: 28rpx;
}

.upload-hint {
  color: $text-muted;
  font-size: 23rpx;
}

.file-card,
.preview-card {
  @include soft-card;
}

.file-card {
  display: flex;
  align-items: center;
  gap: 18rpx;
  margin-top: 20rpx;
  padding: 20rpx;
}

.pdf-icon {
  width: 70rpx;
  height: 70rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  background: $red;
  color: #fff;
  font-weight: 800;
  font-size: 22rpx;
}

.file-info {
  flex: 1;
  min-width: 0;
}

.file-name,
.file-size {
  display: block;
}

.file-name {
  color: $text-primary;
  font-size: 27rpx;
  font-weight: 700;
  @include text-ellipsis;
}

.file-size {
  margin-top: 6rpx;
  color: $text-muted;
  font-size: 23rpx;
}

.remove {
  color: $text-muted;
  font-size: 44rpx;
}

.preview-card {
  padding: 24rpx;
  margin-bottom: 28rpx;
}

.preview-title {
  display: block;
  color: $text-primary;
  font-size: 29rpx;
  font-weight: 800;
  margin-bottom: 18rpx;
}

.preview-page {
  background: rgba(255, 255, 255, 0.78);
  border-radius: 12rpx;
  padding: 20rpx;
  margin-bottom: 14rpx;
}

.preview-heading,
.preview-text,
.page-num {
  display: block;
}

.preview-heading {
  color: $text-primary;
  font-weight: 700;
  font-size: 25rpx;
}

.preview-text {
  margin-top: 8rpx;
  color: $text-secondary;
  font-size: 24rpx;
  line-height: 1.6;
}

.page-num {
  margin-top: 8rpx;
  color: $text-muted;
  text-align: right;
  font-size: 22rpx;
}

.submit-btn {
  height: 88rpx;
  border-radius: 22rpx;
  background: linear-gradient(135deg, $ink-blue, $ink-blue-deep);
  color: #fff;
  font-size: 30rpx;
  font-weight: 700;
}
</style>
