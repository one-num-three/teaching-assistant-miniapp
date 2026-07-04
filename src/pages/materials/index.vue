<template>
  <view class="page-shell">
    <view class="materials-hero">
      <view class="ink-nav">资料库</view>
    </view>

    <view class="content-layer safe-bottom">
      <view class="search-box">
        <view class="search-icon"></view>
        <text>搜索教案、PPT、方案...</text>
      </view>

      <view class="category-tabs">
        <text
          v-for="item in categories"
          :key="item.key"
          class="tab-item"
          :class="{ active: activeCategory === item.key }"
          @click="activeCategory = item.key"
        >
          {{ item.name }}
        </text>
      </view>

      <view v-if="loading" class="state-card">正在加载资料...</view>
      <view v-else-if="filteredLessons.length === 0" class="state-card">暂无匹配资料</view>
      <block v-else>
        <view
          v-for="item in filteredLessons"
          :key="item._id"
          class="material-card"
          @click="handleViewLesson(item.file_id)"
        >
          <view class="file-icon" :class="item.tone">
            <text>{{ item.type }}</text>
          </view>
          <view class="material-info">
            <text class="material-title">{{ item.title || item.file_name }}</text>
            <view class="meta-row">
              <text>{{ item.tag || '精选' }}</text>
              <text>{{ item.count }}</text>
              <text>{{ item.date }}</text>
            </view>
          </view>
        </view>
      </block>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { getTempFileURL, openDocument } from '@/utils/platform'

const categories = [
  { key: 'all', name: '全部' },
  { key: 'science', name: '科普' },
  { key: 'humanity', name: '人文' },
  { key: 'art', name: '艺术' }
]

const activeCategory = ref('all')
const lessons = ref<any[]>([])
const loading = ref(false)

const sampleLessons = [
  {
    _id: 'm1',
    title: '光合作用趣味实验教案',
    file_name: '光合作用趣味实验教案.pdf',
    file_id: 'mock-file-id-1',
    category: 'science',
    type: '文',
    tone: 'blue',
    tag: '精选',
    count: '1428 字',
    date: '2025-06-01'
  },
  {
    _id: 'm2',
    title: '古诗飞花令互动课 PPT',
    file_name: '古诗飞花令互动课.pptx',
    file_id: 'mock-file-id-2',
    category: 'humanity',
    type: 'P',
    tone: 'green',
    tag: '精选',
    count: '24 页',
    date: '2025-05-20'
  },
  {
    _id: 'm3',
    title: '非遗剪纸手工课方案',
    file_name: '非遗剪纸手工课方案.docx',
    file_id: 'mock-file-id-3',
    category: 'art',
    type: '艺',
    tone: 'amber',
    tag: '未中标遗珠',
    count: '980 字',
    date: '2025-06-05'
  },
  {
    _id: 'm4',
    title: '趣味数学：七巧板挑战',
    file_name: '七巧板挑战.pdf',
    file_id: 'mock-file-id-4',
    category: 'science',
    type: '数',
    tone: 'red',
    tag: '精选',
    count: '16 页',
    date: '2025-04-18'
  },
  {
    _id: 'm5',
    title: '环保小卫士主题活动',
    file_name: '环保小卫士主题活动.docx',
    file_id: 'mock-file-id-5',
    category: 'science',
    type: '环',
    tone: 'gray',
    tag: '精选',
    count: '1120 字',
    date: '2025-03-22'
  }
]

const filteredLessons = computed(() => {
  if (activeCategory.value === 'all') return lessons.value
  return lessons.value.filter((item) => item.category === activeCategory.value)
})

const fetchLessons = async () => {
  loading.value = true
  try {
    // #ifdef MP-WEIXIN
    const db = wx.cloud.database()
    const res = await db.collection('materials').orderBy('created_at', 'desc').limit(50).get()
    lessons.value = res.data.length ? res.data : sampleLessons
    // #endif

    // #ifndef MP-WEIXIN
    lessons.value = sampleLessons
    // #endif
  } catch (err) {
    console.error(err)
    lessons.value = sampleLessons
  } finally {
    loading.value = false
  }
}

const handleViewLesson = async (fileId: string) => {
  if (fileId.startsWith('mock')) return
  try {
    uni.showLoading({ title: '获取文件中...' })
    // #ifdef MP-WEIXIN
    const urlList = await getTempFileURL([fileId])
    const tempUrl = urlList[0]?.tempFileURL
    if (!tempUrl) throw new Error('获取文件链接失败')
    wx.downloadFile({
      url: tempUrl,
      success: (res: any) => {
        if (res.statusCode === 200) openDocument(res.tempFilePath)
      },
      complete: () => uni.hideLoading()
    })
    // #endif
  } catch (err) {
    uni.hideLoading()
    uni.showToast({ title: '打开失败', icon: 'none' })
  }
}

onMounted(fetchLessons)
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.materials-hero {
  @include ink-header(216rpx);
  padding: 64rpx 34rpx 46rpx;
  box-sizing: border-box;
}

.search-box {
  @include soft-card;
  height: 82rpx;
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding: 0 30rpx;
  border-radius: 999rpx;
  color: $text-muted;
  font-size: 27rpx;
}

.search-icon {
  width: 24rpx;
  height: 24rpx;
  border: 4rpx solid $ink-blue;
  border-radius: 50%;
  opacity: 0.78;
  position: relative;
}

.search-icon::after {
  content: '';
  position: absolute;
  right: -12rpx;
  bottom: -10rpx;
  width: 14rpx;
  height: 4rpx;
  border-radius: 999rpx;
  background: $ink-blue;
  transform: rotate(45deg);
}

.category-tabs {
  display: flex;
  gap: 44rpx;
  padding: 34rpx 18rpx 22rpx;
}

.tab-item {
  position: relative;
  color: $text-secondary;
  font-size: 28rpx;
  font-weight: 600;
  padding-bottom: 12rpx;
}

.tab-item.active {
  color: $ink-blue;
}

.tab-item.active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 4rpx;
  border-radius: 999rpx;
  background: $ink-blue;
}

.material-card {
  @include soft-card;
  display: flex;
  align-items: center;
  gap: 26rpx;
  padding: 28rpx;
  margin-bottom: 22rpx;
}

.file-icon {
  width: 86rpx;
  height: 86rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12rpx;
  color: #fff;
  font-size: 28rpx;
  font-weight: 700;
}

.file-icon.blue { background: $ink-blue; }
.file-icon.green { background: $green; }
.file-icon.amber { background: #d29645; }
.file-icon.red { background: #c75b4d; }
.file-icon.gray { background: #a9aba7; }

.material-info {
  min-width: 0;
  flex: 1;
}

.material-title {
  display: block;
  color: $text-primary;
  font-size: 31rpx;
  font-weight: 700;
  @include text-ellipsis;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-top: 12rpx;
  color: $text-muted;
  font-size: 24rpx;
}

.state-card {
  @include soft-card;
  padding: 48rpx;
  color: $text-secondary;
  text-align: center;
}
</style>
