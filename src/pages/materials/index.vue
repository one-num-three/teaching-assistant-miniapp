<template>
  <view class="page-shell">
    <view class="materials-hero">
      <view class="ink-nav">资料库</view>
    </view>

    <view class="content-layer safe-bottom">
      <view class="search-box">
        <view class="search-icon"></view>
        <input class="search-input" v-model="keyword" placeholder="搜索教案、PPT、方案..." />
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
          @click="handleViewLesson(item)"
        >
          <view class="file-icon" :class="item.tone || 'blue'">
            <text>{{ item.type || 'PDF' }}</text>
          </view>
          <view class="material-info">
            <text class="material-title">{{ item.title || item.file_name }}</text>
            <view class="meta-row">
              <text>{{ item.tag || '精选' }}</text>
              <text>{{ item.count || '教案' }}</text>
              <text>{{ item.date }}</text>
            </view>
          </view>
        </view>
      </block>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { onShow } from '@dcloudio/uni-app';
import { getMaterials } from '@/api/material';
import { getTempFileURL, openDocument } from '@/utils/platform';

const categories = [
  { key: 'all', name: '全部' },
  { key: 'science', name: '科普' },
  { key: 'humanity', name: '人文' },
  { key: 'art', name: '艺术' }
];

const activeCategory = ref('all');
const keyword = ref('');
const lessons = ref<any[]>([]);
const loading = ref(false);
let didMount = false;

const filteredLessons = computed(() => {
  const search = keyword.value.trim().toLowerCase();
  return lessons.value.filter((item) => {
    const matchCategory = activeCategory.value === 'all' || item.category === activeCategory.value;
    const text = `${item.title || ''} ${item.file_name || ''} ${item.tag || ''}`.toLowerCase();
    return matchCategory && (!search || text.includes(search));
  });
});

const fetchLessons = async () => {
  loading.value = true;
  try {
    lessons.value = await getMaterials();
  } catch (err) {
    console.error(err);
    uni.showToast({ title: '资料加载失败', icon: 'none' });
  } finally {
    loading.value = false;
  }
};

const handleViewLesson = async (item: any) => {
  try {
    if (!item.file_id || String(item.file_id).startsWith('local')) {
      uni.showToast({ title: 'H5 本地文件预览占位', icon: 'none' });
      return;
    }
    uni.showLoading({ title: '获取文件中...' });
    const urlList = await getTempFileURL([item.file_id]);
    const tempUrl = urlList[0]?.tempFileURL;
    if (!tempUrl) throw new Error('获取文件链接失败');
    openDocument(tempUrl);
  } catch (err) {
    uni.showToast({ title: '打开失败', icon: 'none' });
  } finally {
    uni.hideLoading();
  }
};

onMounted(() => {
  didMount = true;
  fetchLessons();
});

onShow(() => {
  if (didMount) fetchLessons();
});
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

.search-input {
  flex: 1;
  color: $text-primary;
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
  font-size: 24rpx;
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
