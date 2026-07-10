<template>
  <view class="page-shell">
    <view class="page-hero"><view class="ink-nav"><text class="nav-back" @click="goBack">‹</text>志愿服务证明</view></view>
    <view v-if="loading" class="content-layer"><view class="state-card">正在生成服务证明...</view></view>
    <view v-else-if="!certificate" class="content-layer"><view class="state-card">暂时无法生成服务证明</view></view>
    <view v-else class="content-layer safe-bottom">
      <view class="certificate-sheet">
        <text class="org-name">大学生支教志愿服务</text><text class="certificate-title">志愿服务证明</text><view class="seal-line"></view>
        <text class="certificate-copy">兹证明</text><text class="volunteer-name">{{ certificate.user_name }}</text><text class="certificate-copy">来自 {{ certificate.college || '支教协会' }}，已参加 {{ certificate.project_count }} 个支教项目，累计完成经确认的志愿服务时长：</text>
        <view class="hours-block"><text class="hours-num">{{ certificate.total_hours }}</text><text class="hours-unit">小时</text></view>
        <view class="record-section"><text class="record-title">服务记录</text><view v-for="item in certificate.records" :key="item._id" class="record-row"><view><text class="project-name">{{ item.project_title }}</text><text class="project-meta">{{ item.project_date }} · {{ item.position_name }}</text></view><text class="record-hours">{{ item.hours }}h</text></view></view>
        <view class="certificate-footer"><text>证明编号：{{ certificate.certificate_no }}</text><text>生成日期：{{ issueDate }}</text></view>
      </view>
      <button class="copy-button" @click="copyNumber">复制证明编号</button>
    </view>
  </view>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue'; import { onLoad } from '@dcloudio/uni-app'; import { getVolunteerCertificate } from '@/api/user';
const certificate=ref<any>(null);const loading=ref(true);const issueDate=computed(()=>certificate.value?new Date(certificate.value.issued_at).toLocaleDateString('zh-CN'):'');const goBack=()=>uni.navigateBack();const load=async()=>{loading.value=true;try{certificate.value=await getVolunteerCertificate()}catch{certificate.value=null;uni.showToast({title:'服务证明生成失败',icon:'none'})}finally{loading.value=false}};const copyNumber=()=>uni.setClipboardData({data:certificate.value.certificate_no,success:()=>uni.showToast({title:'证明编号已复制',icon:'success'})});onLoad(load);
</script>
<style lang="scss" scoped>
@import '@/styles/variables.scss';@import '@/styles/mixins.scss';.page-hero{@include ink-header(184rpx);padding:64rpx 34rpx 38rpx;box-sizing:border-box}.nav-back{position:absolute;left:0;font-size:48rpx;line-height:1}.certificate-sheet{position:relative;padding:48rpx 38rpx;border:2rpx solid rgba(185,145,82,.45);background:#fffdf7;box-shadow:0 18rpx 42rpx rgba(31,78,95,.12)}.certificate-sheet::after{content:'志愿';position:absolute;right:34rpx;bottom:100rpx;width:130rpx;height:130rpx;display:flex;align-items:center;justify-content:center;border:8rpx double rgba(192,57,43,.48);border-radius:50%;color:rgba(192,57,43,.48);font-size:31rpx;font-weight:800;transform:rotate(-12deg)}.org-name,.certificate-title,.certificate-copy,.volunteer-name{display:block;text-align:center}.org-name{color:$text-secondary;font-size:23rpx}.certificate-title{margin-top:18rpx;color:$text-primary;font-size:42rpx;font-weight:800}.seal-line{width:90rpx;height:5rpx;margin:22rpx auto 40rpx;background:$amber}.certificate-copy{margin-top:18rpx;color:$text-secondary;font-size:26rpx;line-height:1.8}.volunteer-name{margin:12rpx 0;color:$ink-blue;font-size:38rpx;font-weight:800}.hours-block{display:flex;align-items:baseline;justify-content:center;margin:30rpx 0}.hours-num{color:$green;font-size:64rpx;font-weight:800}.hours-unit{margin-left:8rpx;color:$text-secondary;font-size:25rpx}.record-section{margin-top:34rpx;padding-top:24rpx;border-top:1rpx solid rgba(31,78,95,.12)}.record-title{display:block;color:$text-primary;font-size:27rpx;font-weight:800}.record-row{display:flex;align-items:center;justify-content:space-between;gap:16rpx;padding:17rpx 0;border-bottom:1rpx solid rgba(31,78,95,.07)}.project-name,.project-meta{display:block}.project-name{color:$text-primary;font-size:24rpx;font-weight:700}.project-meta{margin-top:5rpx;color:$text-muted;font-size:21rpx}.record-hours{color:$green;font-size:25rpx;font-weight:800}.certificate-footer{display:flex;flex-direction:column;gap:7rpx;margin-top:32rpx;color:$text-muted;font-size:20rpx}.copy-button{height:82rpx;margin-top:24rpx;border-radius:18rpx;background:$ink-blue;color:#fff;font-size:27rpx;font-weight:700}.state-card{@include soft-card;padding:42rpx;color:$text-secondary;text-align:center}
</style>
