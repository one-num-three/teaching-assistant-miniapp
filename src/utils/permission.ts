import { USER_ROLE, type UserRole } from '@/constants/status';

export function hasRole(roles: string[] = [], role: UserRole | string) {
  return roles.includes(role);
}

export function isGuest(roles: string[] = []) {
  return roles.length === 0 || roles.includes(USER_ROLE.GUEST);
}

export function isAdmin(roles: string[] = []) {
  return (
    roles.includes(USER_ROLE.ADMIN) ||
    roles.includes(USER_ROLE.REVIEWER) ||
    roles.includes(USER_ROLE.SUPER_ADMIN)
  );
}

export function isMember(roles: string[] = []) {
  return roles.includes(USER_ROLE.MEMBER) || isAdmin(roles);
}

export function canSeeAdminEntry(roles: string[] = []) {
  return isAdmin(roles);
}
