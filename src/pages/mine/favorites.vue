<template>
  <view class="page-shell"><view class="page-hero"><view class="ink-nav"><text class="nav-back" @click="goBack">‹</text>我的资料收藏</view></view><view class="content-layer safe-bottom"><view v-if="loading" class="state-card">正在加载收藏...</view><view v-else-if="!items.length" class="state-card">还没有收藏资料</view><view v-for="item in items" :key="item._id" class="material-card" @click="view(item)"><view class="file-icon" :class="item.tone || 'blue'">{{ item.type || 'PDF' }}</view><view class="material-copy"><text class="material-title">{{ item.title }}</text><text class="material-meta">{{ item.tag || '资料' }} · {{ item.date }}</text></view><view class="remove" @click.stop="toggle(item)">取消收藏</view></view></view></view>
</template>
<script setup lang="ts">
import { ref } from 'vue'; import { onShow } from '@dcloudio/uni-app'; import { getFavoriteMaterials, toggleMaterialFavorite } from '@/api/material';
const items = ref<any[]>([]); const loading = ref(false); const goBack = () => uni.navigateBack();
const load = async () => { loading.value = true; try { items.value = await getFavoriteMaterials(); } catch { uni.showToast({ title: '收藏加载失败', icon: 'none' }); } finally { loading.value = false; } };
const toggle = async (item: any) => { await toggleMaterialFavorite(item._id); items.value = items.value.filter((entry) => entry._id !== item._id); uni.showToast({ title: '已取消收藏', icon: 'none' }); };
const view = (item: any) => uni.showModal({ title: item.title, content: `文件：${item.file_name || '本地资料'}\nH5 阶段仅展示文件信息。`, showCancel: false });
onShow(load);
</script>
<style lang="scss" scoped>
@import '@/styles/variables.scss'; @import '@/styles/mixins.scss'; .page-hero { @include ink-header(184rpx); padding:64rpx 34rpx 38rpx; box-sizing:border-box; }.nav-back { position:absolute; left:0; font-size:48rpx; line-height:1; }.material-card,.state-card { @include soft-card; display:flex; align-items:center; gap:20rpx; padding:26rpx; margin-bottom:18rpx; }.state-card { justify-content:center; color:$text-secondary; }.file-icon { width:74rpx; height:74rpx; display:flex; align-items:center; justify-content:center; border-radius:12rpx; color:#fff; font-size:21rpx; font-weight:800; }.file-icon.blue{background:$ink-blue}.file-icon.green{background:$green}.file-icon.amber{background:$amber}.material-copy{flex:1;min-width:0}.material-title,.material-meta{display:block}.material-title{color:$text-primary;font-size:28rpx;font-weight:800;@include text-ellipsis}.material-meta{margin-top:8rpx;color:$text-secondary;font-size:23rpx}.remove{padding:10rpx 14rpx;border-radius:999rpx;background:$red-bg;color:$red;font-size:21rpx;}
</style>
