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

      <view class="section-heading">本周安排</view>
      <view v-if="loading" class="state-card">正在加载档期...</view>
      <view v-else-if="visibleProjects.length === 0" class="state-card">本周暂无支教档期</view>
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
import { computed, onMounted, ref } from 'vue'
import ProjectCard from '@/components/ProjectCard.vue'

interface CalendarDay {
  key: string
  label: number
  date: string
  inMonth: boolean
  mark?: 'green' | 'amber'
}

const weeks = ['日', '一', '二', '三', '四', '五', '六']
const today = new Date(2025, 6, 7)
const currentYear = ref(2025)
const currentMonth = ref(6)
const selectedDate = ref('2025-07-07')
const projects = ref<any[]>([])
const loading = ref(false)

const sampleProjects = [
  {
    _id: 'project-1',
    title: '趣味科普：地球的呼吸',
    location: '江宁区东山社区',
    datetime: '2025-07-05 14:00',
    project_status: 'recruiting',
    leader: { user_id: 'u1', name: '王明', avatar: '' },
    positions: {
      lecturer: { total: 1, members: [{ user_id: 'u1', name: '王明' }] },
      ppt: { total: 1, members: [{ user_id: 'u2', name: '李华' }] },
      assistant: { total: 2, members: [] }
    }
  },
  {
    _id: 'project-2',
    title: '古诗诵读与飞花令',
    location: '建邺区燕然社区',
    datetime: '2025-07-07 10:00',
    project_status: 'recruiting',
    leader: { user_id: 'u3', name: '陈恩', avatar: '' },
    positions: {
      lecturer: { total: 1, members: [{ user_id: 'u3', name: '陈恩' }] },
      assistant: { total: 1, members: [] },
      ppt: { total: 1, members: [] }
    }
  },
  {
    _id: 'project-3',
    title: '红色手工折纸课',
    location: '雨花台区景明社区',
    datetime: '2025-07-12 14:00',
    project_status: 'pending_claim',
    leader: null,
    positions: {
      lecturer: { total: 1, members: [] },
      assistant: { total: 2, members: [] }
    }
  }
]

const formatDate = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const calendarDays = computed<CalendarDay[]>(() => {
  const start = new Date(currentYear.value, currentMonth.value, 1)
  const firstDay = start.getDay()
  const daysInMonth = new Date(currentYear.value, currentMonth.value + 1, 0).getDate()
  const prevDays = new Date(currentYear.value, currentMonth.value, 0).getDate()
  const cells: CalendarDay[] = []

  for (let i = firstDay - 1; i >= 0; i -= 1) {
    const label = prevDays - i
    const date = new Date(currentYear.value, currentMonth.value - 1, label)
    cells.push({ key: `p-${label}`, label, date: formatDate(date), inMonth: false })
  }

  for (let label = 1; label <= daysInMonth; label += 1) {
    const date = new Date(currentYear.value, currentMonth.value, label)
    const iso = formatDate(date)
    const hasProject = sampleProjects.some((item) => item.datetime?.startsWith(iso))
    const pending = sampleProjects.some((item) => item.datetime?.startsWith(iso) && item.project_status === 'pending_claim')
    cells.push({
      key: `c-${label}`,
      label,
      date: iso,
      inMonth: true,
      mark: hasProject ? (pending ? 'amber' : 'green') : undefined
    })
  }

  const rest = 42 - cells.length
  for (let label = 1; label <= rest; label += 1) {
    const date = new Date(currentYear.value, currentMonth.value + 1, label)
    cells.push({ key: `n-${label}`, label, date: formatDate(date), inMonth: false })
  }

  return cells
})

const visibleProjects = computed(() => {
  if (projects.value.length) return projects.value
  return sampleProjects
})

const selectDay = (day: CalendarDay) => {
  selectedDate.value = day.date
}

const shiftMonth = (offset: number) => {
  const next = new Date(currentYear.value, currentMonth.value + offset, 1)
  currentYear.value = next.getFullYear()
  currentMonth.value = next.getMonth()
}

const fetchProjects = async () => {
  loading.value = true
  try {
    // #ifdef MP-WEIXIN
    const db = wx.cloud.database()
    const res = await db.collection('projects').orderBy('datetime', 'asc').limit(20).get()
    projects.value = res.data.length ? res.data : sampleProjects
    // #endif

    // #ifndef MP-WEIXIN
    projects.value = sampleProjects
    // #endif
  } catch (err) {
    console.error('Fetch projects failed', err)
    projects.value = sampleProjects
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  selectedDate.value = formatDate(today)
  fetchProjects()
})
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.calendar-hero {
  @include ink-header(242rpx);
  padding: 64rpx 34rpx 54rpx;
  box-sizing: border-box;
}

.calendar-panel {
  position: relative;
  overflow: hidden;
  background: linear-gradient(180deg, $ink-blue 0%, $ink-blue-deep 100%);
  border-radius: 0 0 $radius-md $radius-md;
  box-shadow: $shadow-soft;
  padding: 24rpx 22rpx 26rpx;
  color: #fff;
}

.calendar-panel::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -10rpx;
  height: 116rpx;
  opacity: 0.28;
  background: url('/static/ink-mountain-fade.png') center bottom / 100% auto no-repeat;
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
  color: #fff;
  font-size: 34rpx;
  font-weight: 700;
}

.arrow {
  position: relative;
  z-index: 1;
  width: 64rpx;
  color: rgba(255, 255, 255, 0.68);
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
  color: rgba(255, 255, 255, 0.56);
  font-size: 24rpx;
  line-height: 52rpx;
}

.date-cell {
  position: relative;
  z-index: 1;
  height: 62rpx;
  color: rgba(255, 255, 255, 0.86);
  font-size: 27rpx;
  line-height: 62rpx;
}

.date-cell.muted {
  color: rgba(255, 255, 255, 0.34);
}

.date-cell.selected text {
  display: inline-flex;
  width: 52rpx;
  height: 52rpx;
  align-items: center;
  justify-content: center;
  color: $ink-blue;
  border-radius: 50%;
  background: $paper;
  box-shadow: 0 8rpx 18rpx rgba(0, 0, 0, 0.14);
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
