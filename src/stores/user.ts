import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@/types/user';

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<User | null>(null);
  const isLoggedIn = computed(() => !!userInfo.value?.openid);
  const isMember = computed(() => userInfo.value?.roles.includes('member') || userInfo.value?.roles.includes('admin') || userInfo.value?.roles.includes('super_admin'));

  function setUser(user: User) {
    userInfo.value = user;
  }

  function clearUser() {
    userInfo.value = null;
  }

  return {
    userInfo,
    isLoggedIn,
    isMember,
    setUser,
    clearUser
  };
});
