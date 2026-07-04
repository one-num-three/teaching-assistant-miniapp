import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User } from '@/types/user';
import { isAdmin as checkAdmin, isGuest as checkGuest, isMember as checkMember } from '@/utils/permission';

export const useUserStore = defineStore('user', () => {
  const userInfo = ref<User | null>(null);
  const isLoggedIn = computed(() => !!userInfo.value?.openid);
  const roles = computed(() => userInfo.value?.roles || []);
  const isGuest = computed(() => checkGuest(roles.value));
  const isMember = computed(() => checkMember(roles.value));
  const isAdmin = computed(() => checkAdmin(roles.value));
  const profileCompleted = computed(() => Boolean(userInfo.value?.name && userInfo.value?.phone));

  function setUser(user: User) {
    userInfo.value = user;
  }

  function clearUser() {
    userInfo.value = null;
  }

  return {
    userInfo,
    isLoggedIn,
    roles,
    isGuest,
    isMember,
    isAdmin,
    profileCompleted,
    setUser,
    clearUser
  };
});
