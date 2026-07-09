<template>
  <view class="page-shell">
    <view class="calendar-hero">
      <view class="ink-nav">支教日历</view>
    </view>

    <view class="content-layer safe-bottom">
      <view class="calendar-panel">
        <view class="month-bar">
          <text class="arrow" @click="shiftMonth(-1)">‹</text>
          <text class="month-title">{{ currentYear }} 年 {{ currentMonth + 1 }} 月</text>
          <text class="arrow" @click="shiftMonth(1)">›</text>
        </view>

        <view class="week-row">
          <text v-for="item in weeks" :key="item">{{ item }}</text>
        </view>

        <view class="date-grid">
          <view
            v-for="day in calendarDays"
            :key="day.key"
            class="date-cell"
            :class="{ muted: !day.inMonth, selected: day.date === selectedDate }"
            @click="selectDay(day)"
          >
            <text>{{ day.label }}</text>
            <view v-if="day.mark" class="day-dot" :class="day.mark"></view>
          </view>
        </view>
      </view>

      <view class="section-heading">{{ scheduleTitle }}</view>
      <view v-if="loading" class="state-card">正在加载档期...</view>
      <view v-else-if="visibleProjects.length === 0" class="state-card">当前日期暂无支教档期</view>
      <block v-else>
        <ProjectCard
          v-for="proj in visibleProjects"
          :key="proj._id"
          :project="proj"
        />
      </block>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import ProjectCard from '@/components/ProjectCard.vue';
import { getProjects } from '@/api/project';

interface CalendarDay {
  key: string;
  label: number;
  date: string;
  inMonth: boolean;
  mark?: 'green' | 'amber';
}

const weeks = ['日', '一', '二', '三', '四', '五', '六'];
const currentYear = ref(2025);
const currentMonth = ref(6);
const selectedDate = ref('2025-07-05');
const projects = ref<any[]>([]);
const loading = ref(false);
let didMount = false;

const formatDate = (date: Date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const projectDate = (project: any) => project.date || String(project.datetime || '').slice(0, 10);

const calendarDays = computed<CalendarDay[]>(() => {
  const start = new Date(currentYear.value, currentMonth.value, 1);
  const firstDay = start.getDay();
  const daysInMonth = new Date(currentYear.value, currentMonth.value + 1, 0).getDate();
  const prevDays = new Date(currentYear.value, currentMonth.value, 0).getDate();
  const cells: CalendarDay[] = [];

  for (let i = firstDay - 1; i >= 0; i -= 1) {
    const label = prevDays - i;
    const date = new Date(currentYear.value, currentMonth.value - 1, label);
    cells.push({ key: `p-${label}`, label, date: formatDate(date), inMonth: false });
  }

  for (let label = 1; label <= daysInMonth; label += 1) {
    const date = new Date(currentYear.value, currentMonth.value, label);
    const iso = formatDate(date);
    const dayProjects = projects.value.filter((item) => projectDate(item) === iso);
    const hasProject = dayProjects.length > 0;
    const pending = dayProjects.some((item) => item.project_status === 'pending_claim');
    cells.push({
      key: `c-${label}`,
      label,
      date: iso,
      inMonth: true,
      mark: hasProject ? (pending ? 'amber' : 'green') : undefined
    });
  }

  const rest = 42 - cells.length;
  for (let label = 1; label <= rest; label += 1) {
    const date = new Date(currentYear.value, currentMonth.value + 1, label);
    cells.push({ key: `n-${label}`, label, date: formatDate(date), inMonth: false });
  }

  return cells;
});

const visibleProjects = computed(() => {
  const exact = projects.value.filter((item) => projectDate(item) === selectedDate.value);
  if (exact.length) return exact;
  return projects.value.filter((item) => {
    const date = projectDate(item);
    return date.startsWith(`${currentYear.value}-${String(currentMonth.value + 1).padStart(2, '0')}`);
  });
});

const scheduleTitle = computed(() => {
  const hasExact = projects.value.some((item) => projectDate(item) === selectedDate.value);
  return hasExact ? `${selectedDate.value} 安排` : '本月安排';
});

const selectDay = (day: CalendarDay) => {
  selectedDate.value = day.date;
};

const shiftMonth = (offset: number) => {
  const next = new Date(currentYear.value, currentMonth.value + offset, 1);
  currentYear.value = next.getFullYear();
  currentMonth.value = next.getMonth();
};

const fetchProjects = async () => {
  loading.value = true;
  try {
    const list = await getProjects();
    projects.value = list;
    if (list.length && !list.some((item) => projectDate(item) === selectedDate.value)) {
      const first = list[0];
      selectedDate.value = projectDate(first);
      const date = new Date(selectedDate.value);
      if (!Number.isNaN(date.getTime())) {
        currentYear.value = date.getFullYear();
        currentMonth.value = date.getMonth();
      }
    }
  } catch (err) {
    console.error('Fetch projects failed', err);
    uni.showToast({ title: '档期加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  didMount = true;
  fetchProjects();
});

onShow(() => {
  if (didMount) fetchProjects();
});
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.calendar-hero {
  @include ink-header(250rpx);
  padding: 64rpx 34rpx 54rpx;
  box-sizing: border-box;
}

.calendar-panel {
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.985) 100%),
    url('/static/ink-mountain-fade.png') center top / 100% auto no-repeat;
  border-radius: 0 0 28rpx 28rpx;
  box-shadow: 0 18rpx 48rpx rgba(31, 78, 95, 0.08);
  padding: 22rpx 22rpx 30rpx;
  color: $text-primary;
}

.calendar-panel::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 90rpx;
  background: linear-gradient(180deg, rgba(242, 244, 248, 0.32), transparent);
  pointer-events: none;
}

.month-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10rpx 0 28rpx;
}

.month-title {
  position: relative;
  z-index: 1;
  color: $text-primary;
  font-size: 34rpx;
  font-weight: 700;
}

.arrow {
  position: relative;
  z-index: 1;
  width: 64rpx;
  color: rgba(31, 78, 95, 0.34);
  font-size: 48rpx;
  text-align: center;
}

.week-row,
.date-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
}

.week-row text {
  position: relative;
  z-index: 1;
  color: $text-muted;
  font-size: 24rpx;
  line-height: 52rpx;
}

.date-cell {
  position: relative;
  z-index: 1;
  height: 62rpx;
  color: $text-primary;
  font-size: 27rpx;
  line-height: 62rpx;
}

.date-cell.muted {
  color: rgba(131, 148, 166, 0.72);
}

.date-cell.selected text {
  display: inline-flex;
  width: 52rpx;
  height: 52rpx;
  align-items: center;
  justify-content: center;
  color: #fff;
  border-radius: 50%;
  background: $ink-blue-deep;
  box-shadow: 0 8rpx 18rpx rgba(9, 86, 140, 0.18);
}

.day-dot {
  position: absolute;
  left: 50%;
  bottom: 4rpx;
  width: 8rpx;
  height: 8rpx;
  margin-left: -4rpx;
  border-radius: 50%;
}

.day-dot.green {
  background: $green;
}

.day-dot.amber {
  background: $amber;
}

.state-card {
  @include soft-card;
  padding: 42rpx;
  color: $text-secondary;
  text-align: center;
}
</style>
