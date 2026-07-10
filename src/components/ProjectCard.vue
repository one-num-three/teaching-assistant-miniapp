<template>
  <view class="project-card" :class="cardTone" @click="goToDetail">
    <view class="card-top">
      <text class="project-kicker">{{ project.target_audience || '支教档期' }}</text>
      <text class="pill" :class="statusClass">{{ statusText }}</text>
    </view>

    <text class="project-title">{{ project.title }}</text>

    <view class="project-meta">
      <text class="meta-item location">{{ project.location || project.school_name }}</text>
      <text class="meta-item time">{{ timeText }}</text>
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

    <view class="card-foot">
      <text>{{ memberProgress }}</text>
      <text class="detail-link">查看详情 <text class="chevron">›</text></text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  project: any;
}>();

const statusConfig: Record<string, { text: string; klass: string; tone: string }> = {
  draft: { text: '草稿', klass: 'blue', tone: 'neutral' },
  pending_claim: { text: '待认领', klass: 'amber', tone: 'waiting' },
  pending_review: { text: '待审核', klass: 'amber', tone: 'waiting' },
  recruiting: { text: '招募中', klass: 'green', tone: 'active' },
  revision_required: { text: '需修改', klass: 'red', tone: 'waiting' },
  locked: { text: '已锁定', klass: 'blue', tone: 'neutral' },
  completed: { text: '已完成', klass: 'green', tone: 'neutral' },
  cancelled: { text: '已取消', klass: 'blue', tone: 'neutral' }
};

const config = computed(() => statusConfig[props.project.project_status] || statusConfig.pending_claim);
const statusText = computed(() => config.value.text);
const statusClass = computed(() => config.value.klass);
const cardTone = computed(() => config.value.tone);

const timeText = computed(() => {
  const datetime = props.project.datetime || '';
  if (typeof datetime === 'string') return datetime.replace(/^\d{4}-\d{2}-\d{2}\s*/, '');
  return '14:00';
});

const positionName: Record<string, string> = {
  lecturer: '主讲',
  assistant: '助教',
  ppt: 'PPT',
  photographer: '摄影',
  logistics: '场务'
};

const positionSummary = computed(() => {
  return Object.entries(props.project.positions || {})
    .filter(([key]) => key !== 'lecturer')
    .filter(([, raw]: any) => Number(raw.total || 0) > 0)
    .map(([key, raw]: any) => {
      const used = raw.members?.length || 0;
      return {
        key,
        name: positionName[key] || key,
        open: Math.max((raw.total || 0) - used, 0)
      };
    });
});

const memberProgress = computed(() => {
  const positions = Object.values(props.project.positions || {}) as any[];
  const total = positions.reduce((sum, item) => sum + Number(item.total || 0), 0);
  const joined = positions.reduce((sum, item) => sum + Number(item.members?.length || 0), 0);
  return total ? `${joined}/${total} 人已确认` : '岗位待配置';
});

const goToDetail = () => {
  uni.navigateTo({
    url: `/pages/project/detail?id=${props.project._id}`
  });
};
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.project-card {
  @include soft-card;
  position: relative;
  padding: 26rpx 26rpx 22rpx;
  margin-bottom: 18rpx;
  overflow: hidden;
  border-left: 5rpx solid rgba(79, 132, 108, 0.7);
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
  opacity: 0.1;
  background: url('/static/card-ink-corner.png') right bottom / contain no-repeat;
}

.card-top {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
}

.project-kicker {
  color: $text-muted;
  font-size: 21rpx;
  line-height: 1.3;
}

.project-title {
  display: block;
  position: relative;
  z-index: 1;
  margin-top: 15rpx;
  color: $text-primary;
  font-family: $font-family-display;
  font-size: 31rpx;
  font-weight: 700;
  line-height: 1.42;
}

.project-meta {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx 22rpx;
  margin-top: 12rpx;
  color: $text-secondary;
  font-size: 23rpx;
}

.meta-item {
  position: relative;
  padding-left: 18rpx;
}

.meta-item::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  width: 7rpx;
  height: 7rpx;
  border-radius: 50%;
  background: $mist-blue;
  transform: translateY(-50%);
}

.meta-item.time::before {
  background: $amber;
}

.role-row {
  position: relative;
  z-index: 1;
  display: flex;
  flex-wrap: wrap;
  gap: 10rpx;
  margin-top: 18rpx;
}

.role-tag {
  padding: 7rpx 13rpx;
  border-radius: 6rpx;
  color: $text-secondary;
  background: rgba(31, 78, 95, 0.06);
  font-size: 21rpx;
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

.card-foot {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20rpx;
  padding-top: 18rpx;
  border-top: 1rpx solid rgba(69, 89, 88, 0.09);
  color: $text-muted;
  font-size: 21rpx;
}

.detail-link {
  color: $ink-blue;
  font-weight: 650;
}

.chevron {
  margin-left: 4rpx;
  font-size: 28rpx;
  line-height: 1;
}
</style>
