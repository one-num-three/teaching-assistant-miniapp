<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { useUserStore } from '@/stores/user'
import { login } from '@/api/user'

onLaunch(async () => {
  console.log('App Launch')

  // #ifdef MP-WEIXIN
  if (!wx.cloud) {
    console.error('请使用 2.2.3 或以上基础库以使用云能力')
  } else {
    wx.cloud.init({
      traceUser: true
    })
  }

  try {
    const userStore = useUserStore()
    const userInfo = await login()
    userStore.setUser(userInfo)
  } catch (err) {
    console.error('Silent login failed', err)
  }
  // #endif
})

onShow(() => {
  console.log('App Show')
})

onHide(() => {
  console.log('App Hide')
})
</script>

<style lang="scss">
@import '@/styles/variables.scss';
@import '@/styles/theme.scss';
@import '@/styles/override-uni.scss';
</style>
