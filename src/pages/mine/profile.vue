<template>
  <view class="container">
    <view class="global-header-bg"></view>
    <view class="form-container">
      <view class="header-text">
        <text class="title">完善业务资料</text>
        <text class="subtitle">请填写真实信息以解锁支教权限</text>
      </view>

      <uni-forms ref="formRef" :modelValue="formData" :rules="rules">
        <uni-forms-item label="真实姓名" name="name" required>
          <uni-easyinput v-model="formData.name" placeholder="请输入真实姓名" />
        </uni-forms-item>
        <uni-forms-item label="所属学院" name="college" required>
          <uni-data-picker v-model="formData.college" :localdata="colleges" placeholder="请选择学院" />
        </uni-forms-item>
        <uni-forms-item label="年级" name="grade" required>
          <uni-data-picker v-model="formData.grade" :localdata="grades" placeholder="请选择年级" />
        </uni-forms-item>
        <uni-forms-item label="学号" name="student_id">
          <uni-easyinput v-model="formData.student_id" type="number" placeholder="选填，用于支协内部核验" />
        </uni-forms-item>
        <uni-forms-item label="手机号码" name="phone" required>
          <uni-easyinput v-model="formData.phone" type="number" placeholder="请输入手机号" />
        </uni-forms-item>
      </uni-forms>

      <view class="btn-group safe-area-bottom">
        <button class="uni-button" @click="submit" :loading="loading">提交认证</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useUserStore } from '@/stores/user'
import { updateUserProfile } from '@/api/user'

const userStore = useUserStore()
const formRef = ref()
const loading = ref(false)

const formData = reactive({
  name: '',
  college: '',
  grade: '',
  student_id: '',
  phone: ''
})

const colleges = [
  { text: '计算机学院', value: '计算机学院' },
  { text: '文学院', value: '文学院' },
  { text: '理学院', value: '理学院' }
]

const grades = [
  { text: '大一', value: '大一' },
  { text: '大二', value: '大二' },
  { text: '大三', value: '大三' },
  { text: '大四', value: '大四' },
  { text: '研究生', value: '研究生' }
]

const rules = {
  name: { rules: [{ required: true, errorMessage: '请输入姓名' }] },
  college: { rules: [{ required: true, errorMessage: '请选择学院' }] },
  grade: { rules: [{ required: true, errorMessage: '请选择年级' }] },
  phone: { rules: [{ required: true, errorMessage: '请输入手机号' }] }
}

const submit = async () => {
  try {
    await formRef.value.validate()
    loading.value = true
    
    // 调用云函数更新用户信息，并将 roles 加上 'member'
    const res = await updateUserProfile(formData)
    
    // 更新本地 Store
    userStore.setUser(res)
    
    uni.showToast({ title: '认证成功', icon: 'success' })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  } catch (err: any) {
    console.error(err)
    uni.showToast({ title: err.message || '提交失败', icon: 'none' })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.form-container {
  margin-top: 60rpx;
  background-color: #fff;
  border-radius: 24rpx;
  padding: 40rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.05);

  .header-text {
    margin-bottom: 60rpx;
    display: flex;
    flex-direction: column;
    .title {
      font-size: 36rpx;
      font-weight: bold;
      color: #333;
      margin-bottom: 10rpx;
    }
    .subtitle {
      font-size: 24rpx;
      color: #999;
    }
  }

  .btn-group {
    margin-top: 60rpx;
  }
}
</style>
