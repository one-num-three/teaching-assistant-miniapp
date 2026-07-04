<template>
  <view class="project-card" :class="cardTone" @click="goToDetail">
    <view class="card-top">
      <view class="title-wrap">
        <text class="project-title">{{ project.title }}</text>
        <text class="project-meta">{{ project.location || project.school_name }} · {{ timeText }}</text>
      </view>
      <text class="pill" :class="statusClass">{{ statusText }}</text>
    </view>

    <view class="role-row" v-if="project.positions">
      <text class="role-tag filled" v-if="project.leader?.name">主讲 {{ project.leader.name }}</text>
      <text class="role-tag open" v-else>等待支协成员抢占</text>
      <text
        class="role-tag"
        v-for="item in positionSummary"
        :key="item.key"
        :class="{ open: item.open > 0, filled: item.open === 0 }"
      >
        {{ item.name }} {{ item.open > 0 ? `${item.open}人` : '已满' }}
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  project: any
}>()

const statusConfig: Record<string, { text: string; klass: string; tone: string }> = {
  draft: { text: '草稿', klass: 'blue', tone: 'neutral' },
  pending_claim: { text: '待认领', klass: 'amber', tone: 'waiting' },
  recruiting: { text: '招募中', klass: 'green', tone: 'active' },
  revision_required: { text: '需修改', klass: 'red', tone: 'waiting' },
  locked: { text: '已锁定', klass: 'blue', tone: 'neutral' },
  completed: { text: '已完成', klass: 'green', tone: 'neutral' },
  cancelled: { text: '已取消', klass: 'blue', tone: 'neutral' }
}

const config = computed(() => statusConfig[props.project.project_status] || statusConfig.pending_claim)
const statusText = computed(() => config.value.text)
const statusClass = computed(() => config.value.klass)
const cardTone = computed(() => config.value.tone)

const timeText = computed(() => {
  const datetime = props.project.datetime || ''
  if (typeof datetime === 'string') return datetime.replace(/^\d{4}-\d{2}-\d{2}\s*/, '')
  return '14:00'
})

const positionName: Record<string, string> = {
  lecturer: '主讲',
  assistant: '助教',
  ppt: 'PPT',
  photographer: '摄影',
  logistics: '场务'
}

const positionSummary = computed(() => {
  return Object.entries(props.project.positions || {})
    .filter(([key]) => key !== 'lecturer')
    .map(([key, raw]: any) => {
      const used = raw.members?.length || 0
      return {
        key,
        name: positionName[key] || key,
        open: Math.max((raw.total || 0) - used, 0)
      }
    })
})

const goToDetail = () => {
  uni.navigateTo({
    url: `/pages/project/detail?id=${props.project._id}`
  })
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.project-card {
  @include soft-card;
  position: relative;
  padding: 26rpx 28rpx;
  margin-bottom: 22rpx;
  overflow: hidden;
  border-left: 6rpx solid rgba(95, 156, 121, 0.58);
}

.project-card.waiting {
  border-left-color: rgba(185, 130, 55, 0.78);
}

.project-card.neutral {
  border-left-color: rgba(31, 78, 95, 0.22);
}

.project-card::after {
  content: '';
  position: absolute;
  right: -42rpx;
  bottom: -38rpx;
  width: 260rpx;
  height: 150rpx;
  opacity: 0.14;
  background: url('/static/card-ink-corner.png') right bottom / contain no-repeat;
}

.card-top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
}

.title-wrap {
  min-width: 0;
  flex: 1;
}

.project-title {
  display: block;
  color: $text-primary;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 1.35;
}

.project-meta {
  display: block;
  margin-top: 10rpx;
  color: $text-secondary;
  font-size: 24rpx;
}

.role-row {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 20rpx;
}

.role-tag {
  padding: 8rpx 16rpx;
  border-radius: 10rpx;
  color: $text-secondary;
  background: rgba(31, 78, 95, 0.06);
  font-size: 23rpx;
  line-height: 1;
}

.role-tag.filled {
  color: $green;
  background: $green-bg;
}

.role-tag.open {
  color: $amber;
  background: $amber-bg;
}
</style>
