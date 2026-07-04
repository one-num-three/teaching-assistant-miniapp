export const PROJECT_STATUS = {
  DRAFT: 'draft',
  PENDING_CLAIM: 'pending_claim',
  PENDING_REVIEW: 'pending_review',
  RECRUITING: 'recruiting',
  REVISION_REQUIRED: 'revision_required',
  LOCKED: 'locked',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export const LESSON_STATUS = {
  NOT_SUBMITTED: 'not_submitted',
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected'
} as const;

export const USER_ROLE = {
  GUEST: 'guest',
  MEMBER: 'member',
  ADMIN: 'admin',
  REVIEWER: 'reviewer',
  SUPER_ADMIN: 'super_admin'
} as const;

export type ProjectStatus = (typeof PROJECT_STATUS)[keyof typeof PROJECT_STATUS];
export type LessonStatus = (typeof LESSON_STATUS)[keyof typeof LESSON_STATUS];
export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];
