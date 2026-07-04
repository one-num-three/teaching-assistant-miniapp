<template>
  <view class="page-shell">
    <view class="publish-hero">
      <view class="ink-nav">
        <text class="back" @click="goBack">‹</text>
        发布档期
      </view>
    </view>

    <view class="content-layer safe-bottom">
      <view class="form-card">
        <uni-forms ref="formRef" :modelValue="formData" :rules="rules">
          <uni-forms-item label="课程主题" name="title" required>
            <uni-easyinput v-model="formData.title" placeholder="例如：趣味科普：地球的呼吸" />
          </uni-forms-item>

          <uni-forms-item label="授课日期" name="date" required>
            <uni-datetime-picker v-model="formData.date" type="date" />
          </uni-forms-item>

          <uni-forms-item label="开始时间" name="start_time" required>
            <uni-datetime-picker v-model="formData.start_time" type="time" />
          </uni-forms-item>

          <uni-forms-item label="结束时间" name="end_time" required>
            <uni-datetime-picker v-model="formData.end_time" type="time" />
          </uni-forms-item>

          <uni-forms-item label="授课地点" name="location" required>
            <uni-easyinput v-model="formData.location" placeholder="例如：江宁区东山社区活动中心" />
          </uni-forms-item>

          <uni-forms-item label="受众" name="target_audience" required>
            <uni-easyinput v-model="formData.target_audience" placeholder="例如：小学生 3-6 年级，约 25 人" />
          </uni-forms-item>

          <uni-forms-item label="教案大纲">
            <uni-easyinput
              v-model="formData.outlineText"
              type="textarea"
              placeholder="每行一个环节，例如：课程导入、实验演示、互动问答"
            />
          </uni-forms-item>
        </uni-forms>
      </view>

      <view class="form-card">
        <view class="section-title-small">岗位配置</view>
        <view class="position-row" v-for="item in positionItems" :key="item.key">
          <view>
            <text class="position-name">{{ item.label }}</text>
            <text class="position-desc">{{ item.desc }}</text>
          </view>
          <uni-number-box v-model="formData.positions[item.key]" :min="item.min" :max="6" />
        </view>
      </view>

      <button class="primary-btn" :loading="submitting" :disabled="submitting" @click="submit">
        发布档期
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { publishProject } from '@/api/project';
import { getErrorMessage } from '@/constants/errors';

const formRef = ref();
const submitting = ref(false);

const formData = reactive({
  title: '',
  date: '',
  start_time: '',
  end_time: '',
  location: '',
  target_audience: '',
  outlineText: '',
  positions: {
    assistant: 2,
    ppt: 1,
    photographer: 1,
    logistics: 1
  }
});

const positionItems = [
  { key: 'assistant', label: '助教', desc: '课堂秩序与小组协助', min: 0 },
  { key: 'ppt', label: 'PPT', desc: '课件协作与现场播放', min: 0 },
  { key: 'photographer', label: '摄影', desc: '活动照片与素材记录', min: 0 },
  { key: 'logistics', label: '场务', desc: '物资、签到与现场支持', min: 0 }
] as const;

const rules = {
  title: { rules: [{ required: true, errorMessage: '请输入课程主题' }] },
  date: { rules: [{ required: true, errorMessage: '请选择授课日期' }] },
  start_time: { rules: [{ required: true, errorMessage: '请选择开始时间' }] },
  end_time: { rules: [{ required: true, errorMessage: '请选择结束时间' }] },
  location: { rules: [{ required: true, errorMessage: '请输入授课地点' }] },
  target_audience: { rules: [{ required: true, errorMessage: '请输入受众信息' }] }
};

function goBack() {
  uni.navigateBack();
}

async function submit() {
  try {
    await formRef.value.validate();
    submitting.value = true;

    await publishProject({
      title: formData.title,
      date: formData.date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      location: formData.location,
      target_audience: formData.target_audience,
      outline: formData.outlineText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
      positions: formData.positions
    });

    uni.showToast({ title: '发布成功', icon: 'success' });
    setTimeout(() => {
      uni.navigateBack();
    }, 800);
  } catch (err: any) {
    const code = err?.code || err?.errCode;
    uni.showToast({ title: getErrorMessage(code, err?.msg || '发布失败'), icon: 'none' });
  } finally {
    submitting.value = false;
  }
}
</script>

<style lang="scss" scoped>
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.publish-hero {
  @include ink-header(220rpx);
  padding: 64rpx 34rpx 54rpx;
  box-sizing: border-box;
}

.back {
  position: absolute;
  left: 0;
  font-size: 48rpx;
  line-height: 1;
}

.form-card {
  @include soft-card;
  padding: 28rpx;
  margin-bottom: 24rpx;
}

.section-title-small {
  margin-bottom: 12rpx;
  color: $text-primary;
  font-size: 30rpx;
  font-weight: 700;
}

.position-row {
  min-height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24rpx;
  border-bottom: 1rpx solid rgba(31, 78, 95, 0.08);
}

.position-row:last-child {
  border-bottom: none;
}

.position-name,
.position-desc {
  display: block;
}

.position-name {
  color: $text-primary;
  font-size: 28rpx;
  font-weight: 700;
}

.position-desc {
  margin-top: 6rpx;
  color: $text-secondary;
  font-size: 23rpx;
}

.primary-btn {
  height: 92rpx;
  line-height: 92rpx;
  border-radius: 12rpx;
  background: $ink-blue;
  color: #fff;
  font-size: 30rpx;
  font-weight: 700;
}
</style>
