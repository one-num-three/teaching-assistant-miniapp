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
            :class="{
              muted: !day.inMonth,
              'selected-week': day.isSelectedWeek,
              'week-start': day.isWeekStart,
              'week-end': day.isWeekEnd,
              'selected-day': day.date === selectedDate
            }"
            @click="selectDay(day)"
          >
            <text>{{ day.label }}</text>
            <view v-if="day.projectCount" class="day-count" :class="day.mark">{{ day.projectCount }}</view>
          </view>
        </view>
      </view>

      <view class="selection-summary">
        <text class="summary-title">{{ scheduleTitle }}</text>
        <text class="summary-subtitle">{{ scheduleSubtitle }}</text>
      </view>

      <view v-if="loading" class="state-card">正在加载档期...</view>
      <view v-else-if="visibleProjects.length === 0" class="state-card">{{ emptyText }}</view>
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
  projectCount: number;
  isSelectedWeek: boolean;
  isWeekStart: boolean;
  isWeekEnd: boolean;
}

const weeks = ['日', '一', '二', '三', '四', '五', '六'];
const today = new Date();
const currentYear = ref(today.getFullYear());
const currentMonth = ref(today.getMonth());
const selectedWeekStart = ref('');
const selectedDate = ref('');
const projects = ref<any[]>([]);
const loading = ref(false);
let didMount = false;

const pad = (value: number) => String(value).padStart(2, '0');

const formatDate = (date: Date) => {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const parseDate = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const addDays = (date: Date, offset: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + offset);
  return next;
};

const getWeekStart = (date: Date) => {
  return addDays(date, -date.getDay());
};

const getWeekEnd = (weekStartIso: string) => {
  return formatDate(addDays(parseDate(weekStartIso), 6));
};

const formatMonthDay = (dateIso: string) => {
  const date = parseDate(dateIso);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
};

const projectDate = (project: any) => project.date || String(project.datetime || '').slice(0, 10);

const projectsByDate = computed(() => {
  const map: Record<string, any[]> = {};
  projects.value.forEach((project) => {
    const date = projectDate(project);
    if (!map[date]) map[date] = [];
    map[date].push(project);
  });
  return map;
});

const selectedWeekEnd = computed(() => {
  if (!selectedWeekStart.value) return '';
  return getWeekEnd(selectedWeekStart.value);
});

const calendarDays = computed<CalendarDay[]>(() => {
  const start = new Date(currentYear.value, currentMonth.value, 1);
  const firstDay = start.getDay();
  const daysInMonth = new Date(currentYear.value, currentMonth.value + 1, 0).getDate();
  const prevDays = new Date(currentYear.value, currentMonth.value, 0).getDate();
  const cells: CalendarDay[] = [];

  const createCell = (date: Date, label: number, inMonth: boolean, key: string): CalendarDay => {
    const iso = formatDate(date);
    const dayProjects = projectsByDate.value[iso] || [];
    const pending = dayProjects.some((item) => ['pending_claim', 'pending_review'].includes(item.project_status));
    const weekStart = formatDate(getWeekStart(date));
    return {
      key,
      label,
      date: iso,
      inMonth,
      mark: dayProjects.length ? (pending ? 'amber' : 'green') : undefined,
      projectCount: dayProjects.length,
      isSelectedWeek: selectedWeekStart.value === weekStart,
      isWeekStart: date.getDay() === 0,
      isWeekEnd: date.getDay() === 6
    };
  };

  for (let i = firstDay - 1; i >= 0; i -= 1) {
    const label = prevDays - i;
    const date = new Date(currentYear.value, currentMonth.value - 1, label);
    cells.push(createCell(date, label, false, `p-${formatDate(date)}`));
  }

  for (let label = 1; label <= daysInMonth; label += 1) {
    const date = new Date(currentYear.value, currentMonth.value, label);
    cells.push(createCell(date, label, true, `c-${formatDate(date)}`));
  }

  const rest = 42 - cells.length;
  for (let label = 1; label <= rest; label += 1) {
    const date = new Date(currentYear.value, currentMonth.value + 1, label);
    cells.push(createCell(date, label, false, `n-${formatDate(date)}`));
  }

  return cells;
});

const visibleProjects = computed(() => {
  if (selectedDate.value) {
    return projects.value.filter((item) => projectDate(item) === selectedDate.value);
  }
  if (!selectedWeekStart.value || !selectedWeekEnd.value) return [];
  return projects.value.filter((item) => {
    const date = projectDate(item);
    return date >= selectedWeekStart.value && date <= selectedWeekEnd.value;
  });
});

const scheduleTitle = computed(() => {
  if (selectedDate.value) return `${formatMonthDay(selectedDate.value)} 当日安排`;
  if (!selectedWeekStart.value || !selectedWeekEnd.value) return '本周安排';
  return `${formatMonthDay(selectedWeekStart.value)} - ${formatMonthDay(selectedWeekEnd.value)} 周安排`;
});

const scheduleSubtitle = computed(() => {
  if (selectedDate.value) return '再次点击当天，可回到整周安排';
  return '点击高亮周中的某一天，可只查看当天档期';
});

const emptyText = computed(() => {
  return selectedDate.value ? '当日暂无支教档期，看看本周其他安排' : '本周暂无支教档期';
});

const selectDay = (day: CalendarDay) => {
  const weekStart = formatDate(getWeekStart(parseDate(day.date)));
  const isSameWeek = selectedWeekStart.value === weekStart;
  const isSameDate = selectedDate.value === day.date;

  selectedWeekStart.value = weekStart;

  if (!isSameWeek) {
    selectedDate.value = '';
    return;
  }

  selectedDate.value = isSameDate ? '' : day.date;
};

const shiftMonth = (offset: number) => {
  const next = new Date(currentYear.value, currentMonth.value + offset, 1);
  currentYear.value = next.getFullYear();
  currentMonth.value = next.getMonth();

  const firstVisible = new Date(currentYear.value, currentMonth.value, 1);
  selectedWeekStart.value = formatDate(getWeekStart(firstVisible));
  selectedDate.value = '';
};

const selectInitialWeek = (list: any[]) => {
  const todayWeekStart = formatDate(getWeekStart(today));
  selectedWeekStart.value = todayWeekStart;
  selectedDate.value = '';

  const hasThisWeekProject = list.some((item) => {
    const date = projectDate(item);
    return date >= todayWeekStart && date <= getWeekEnd(todayWeekStart);
  });

  if (hasThisWeekProject) return;

  const first = list[0];
  if (!first) return;
  const firstDate = projectDate(first);
  const parsed = parseDate(firstDate);
  if (Number.isNaN(parsed.getTime())) return;

  currentYear.value = parsed.getFullYear();
  currentMonth.value = parsed.getMonth();
  selectedWeekStart.value = formatDate(getWeekStart(parsed));
};

const fetchProjects = async () => {
  loading.value = true;
  try {
    const list = await getProjects();
    projects.value = list;
    if (!selectedWeekStart.value) selectInitialWeek(list);
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
  @include ink-header(232rpx);
  padding: 64rpx 34rpx 48rpx;
  box-sizing: border-box;
}

.calendar-panel {
  position: relative;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.985) 100%),
    url('/static/ink-mountain-fade.png') center top / 100% auto no-repeat;
  border: 1rpx solid rgba(69, 89, 88, 0.1);
  border-radius: $radius-md;
  box-shadow: $shadow-card;
  padding: 20rpx 18rpx 24rpx;
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
  padding: 8rpx 2rpx 22rpx;
}

.month-title {
  position: relative;
  z-index: 1;
  color: $text-primary;
  font-family: $font-family-display;
  font-size: 33rpx;
  font-weight: 700;
}

.arrow {
  position: relative;
  z-index: 1;
  width: 60rpx;
  height: 60rpx;
  color: $ink-blue-soft;
  font-size: 42rpx;
  line-height: 60rpx;
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
  height: 68rpx;
  color: $text-primary;
  font-size: 27rpx;
  line-height: 68rpx;
}

.date-cell::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 8rpx;
  bottom: 8rpx;
  background: transparent;
  z-index: -1;
}

.date-cell.selected-week::before {
  background: rgba(79, 132, 108, 0.1);
}

.date-cell.week-start::before {
  left: 8rpx;
  border-radius: 999rpx 0 0 999rpx;
}

.date-cell.week-end::before {
  right: 8rpx;
  border-radius: 0 999rpx 999rpx 0;
}

.date-cell.muted {
  color: rgba(131, 148, 166, 0.72);
}

.date-cell text {
  position: relative;
  z-index: 1;
}

.date-cell.selected-day text {
  display: inline-flex;
  width: 52rpx;
  height: 52rpx;
  align-items: center;
  justify-content: center;
  color: #fff;
  border-radius: 50%;
  background: $ink-blue;
  box-shadow: 0 8rpx 18rpx rgba(23, 55, 67, 0.18);
}

.day-count {
  position: absolute;
  left: 50%;
  bottom: 2rpx;
  min-width: 12rpx;
  height: 12rpx;
  padding: 0 4rpx;
  margin-left: -8rpx;
  border-radius: 999rpx;
  color: transparent;
  font-size: 0;
}

.day-count.green {
  background: $green;
}

.day-count.amber {
  background: $amber;
}

.selection-summary {
  margin: 32rpx 2rpx 18rpx;
  padding-left: 18rpx;
  border-left: 5rpx solid $green;
}

.summary-title,
.summary-subtitle {
  display: block;
}

.summary-title {
  color: $text-primary;
  font-family: $font-family-display;
  font-size: 31rpx;
  font-weight: 700;
}

.summary-subtitle {
  margin-top: 8rpx;
  color: $text-secondary;
  font-size: 24rpx;
}

.state-card {
  @include soft-card;
  padding: 42rpx;
  color: $text-secondary;
  text-align: center;
}
</style>
