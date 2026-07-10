<template>
  <view class="page-shell">
    <view class="preview-hero"><view class="ink-nav"><text class="nav-back" @click="goBack">‹</text>文档预览</view></view>
    <view v-if="loading" class="content-layer"><view class="state-card">正在加载文档...</view></view>
    <view v-else-if="!document" class="content-layer"><view class="state-card">未找到文档内容</view></view>
    <view v-else class="content-layer preview-body safe-bottom">
      <view class="file-summary"><view class="file-badge" :class="document.type.toLowerCase()">{{ document.type }}</view><view class="file-copy"><text class="file-title">{{ document.title }}</text><text class="file-meta">{{ document.fileName }} · {{ document.size || '本地资料' }}</text></view></view>
      <view v-if="document.type === 'PPT'" class="ppt-viewer"><view v-for="(slide, index) in slides" :key="`${slide.title}-${index}`" class="ppt-slide"><text class="slide-index">{{ String(index + 1).padStart(2, '0') }}</text><text class="slide-title">{{ slide.title }}</text><view class="slide-rule"></view><text v-for="point in slide.points" :key="point" class="slide-point">{{ point }}</text><text class="slide-page">{{ index + 1 }} / {{ slides.length }}</text></view></view>
      <view v-else class="paper-view" :class="document.type.toLowerCase()"><view class="paper-head"><text>{{ document.type === 'WORD' ? 'Word 文档' : 'PDF 文档' }}</text><text>本地预览</text></view><text class="paper-heading">{{ document.title }}</text><text v-for="(paragraph, index) in paragraphs" :key="`${paragraph}-${index}`" class="paper-paragraph">{{ paragraph }}</text><text class="paper-page">第 1 页</text></view>
      <view class="preview-note"><text>当前展示已提交的文档正文、教案摘要或幻灯片内容。微信端接入云存储后，可直接打开原始 Word、PDF、PPT 文件。</text></view>
      <button class="open-button" @click="openOriginal">在微信中打开原文件</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { onLoad, onShow } from '@dcloudio/uni-app';
import { getMaterialDetail } from '@/api/material';
import { getProjectDetail } from '@/api/project';
import { getTempFileURL, openDocument } from '@/utils/platform';
import { getDocumentType, splitPreviewParagraphs } from '@/utils/document';
const loading = ref(true); const document = ref<any>(null);
const paragraphs = computed(() => splitPreviewParagraphs(document.value?.content || '', document.value?.outline?.length ? document.value.outline : ['暂无正文内容。']));
const slides = computed(() => { const stored = document.value?.slides; if (Array.isArray(stored) && stored.length) return stored; const source = splitPreviewParagraphs(document.value?.content || '', document.value?.outline || []); const fallback = source.length ? source : ['课程导入', '核心内容', '互动练习', '总结反馈']; return fallback.map((item, index) => ({ title: item.replace(/^.+?[：:]/, '').slice(0, 22) || `第 ${index + 1} 页`, points: [item, index === fallback.length - 1 ? '课堂总结与反馈' : '请结合讲解与互动活动展开'] })); });
const goBack = () => uni.navigateBack();
const load = async (source: string, id: string) => { loading.value = true; try { if (source === 'project') { const project = await getProjectDetail(id); const lesson = project.lesson_plan; if (!lesson) throw new Error('暂无教案'); document.value = { title: lesson.title || project.title, fileName: lesson.file_name || '教案文件', fileId: lesson.file_id, size: lesson.size, type: getDocumentType(lesson.file_name, lesson.file_type), content: lesson.content, outline: project.outline || [], slides: lesson.slides || [] }; } else { const material = await getMaterialDetail(id); document.value = { title: material.title || material.file_name, fileName: material.file_name || material.title, fileId: material.file_id, size: material.size || material.count, type: getDocumentType(material.file_name, material.type), content: material.preview_content || material.content, outline: material.outline || [], slides: material.slides || [] }; } } catch { document.value = null; uni.showToast({ title: '文档加载失败', icon: 'none' }); } finally { loading.value = false; } };
const openOriginal = async () => { const fileId = document.value?.fileId; if (!fileId || String(fileId).startsWith('local')) { uni.showToast({ title: '当前正在查看本地预览', icon: 'none' }); return; } try { uni.showLoading({ title: '正在打开文件' }); const list = await getTempFileURL([fileId]); const url = list[0]?.tempFileURL; if (!url) throw new Error('no file'); openDocument(url, document.value.type?.toLowerCase()); } catch { uni.showToast({ title: '原文件打开失败', icon: 'none' }); } finally { uni.hideLoading(); } };
const loadFromRoute = (options?: any) => {
  const page = getCurrentPages().slice(-1)[0] as any;
  const query = options || page?.options || {};
  load(query.source || 'material', query.id || '');
};
onLoad((options: any) => loadFromRoute(options));
onShow(() => loadFromRoute());
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss'; @import '@/styles/mixins.scss';
.preview-hero{@include ink-header(184rpx);padding:64rpx 34rpx 38rpx;box-sizing:border-box}.nav-back{position:absolute;left:0;font-size:48rpx;line-height:1}.preview-body{padding-bottom:148rpx}.file-summary,.preview-note,.state-card{@include soft-card;padding:26rpx;margin-bottom:24rpx}.file-summary{display:flex;align-items:center;gap:20rpx}.file-badge{width:84rpx;height:84rpx;display:flex;align-items:center;justify-content:center;border-radius:14rpx;color:#fff;font-size:23rpx;font-weight:800}.file-badge.pdf{background:$red}.file-badge.word{background:$ink-blue}.file-badge.ppt{background:$green}.file-copy{flex:1;min-width:0}.file-title,.file-meta{display:block}.file-title{color:$text-primary;font-size:29rpx;font-weight:800;@include text-ellipsis}.file-meta{margin-top:8rpx;color:$text-secondary;font-size:23rpx;@include text-ellipsis}.paper-view{min-height:720rpx;padding:48rpx 38rpx;box-sizing:border-box;border-radius:8rpx;background:#fff;box-shadow:0 16rpx 40rpx rgba(31,78,95,.12)}.paper-view.word{border-top:12rpx solid $ink-blue}.paper-view.pdf{border-top:12rpx solid $red}.paper-head{display:flex;justify-content:space-between;color:$text-muted;font-size:21rpx}.paper-heading{display:block;margin:52rpx 0 32rpx;color:$text-primary;font-size:35rpx;font-weight:800;line-height:1.4}.paper-paragraph{display:block;margin-top:22rpx;color:$text-secondary;font-size:27rpx;line-height:1.85;white-space:pre-wrap}.paper-page{display:block;margin-top:66rpx;color:$text-muted;font-size:21rpx;text-align:right}.ppt-viewer{display:flex;flex-direction:column;gap:24rpx}.ppt-slide{position:relative;min-height:420rpx;padding:42rpx 38rpx;box-sizing:border-box;overflow:hidden;border-radius:8rpx;background:linear-gradient(135deg,$ink-blue,$ink-blue-deep);color:#fff;box-shadow:0 16rpx 36rpx rgba(15,47,61,.24)}.ppt-slide:nth-child(2n){background:linear-gradient(135deg,#2d7b68,#1f4e5f)}.ppt-slide::after{content:'';position:absolute;right:-70rpx;bottom:-80rpx;width:260rpx;height:260rpx;border:28rpx solid rgba(255,255,255,.1);border-radius:50%}.slide-index,.slide-title,.slide-point,.slide-page{display:block;position:relative;z-index:1}.slide-index{color:rgba(255,255,255,.7);font-size:23rpx;letter-spacing:2rpx}.slide-title{margin-top:32rpx;font-size:40rpx;font-weight:800;line-height:1.35}.slide-rule{position:relative;z-index:1;width:84rpx;height:6rpx;margin:28rpx 0;border-radius:999rpx;background:rgba(255,255,255,.72)}.slide-point{margin-top:16rpx;color:rgba(255,255,255,.88);font-size:27rpx;line-height:1.55}.slide-point::before{content:'•';margin-right:12rpx}.slide-page{position:absolute;right:34rpx;bottom:28rpx;color:rgba(255,255,255,.72);font-size:21rpx}.preview-note{color:$text-secondary;font-size:23rpx;line-height:1.6}.open-button{position:fixed;left:28rpx;right:28rpx;bottom:calc(24rpx + env(safe-area-inset-bottom));height:88rpx;border-radius:22rpx;background:$ink-blue;color:#fff;font-size:29rpx;font-weight:700}.state-card{color:$text-secondary;text-align:center}
</style>
