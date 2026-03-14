import type { UserRole } from '@/types/auth';

export const getDashboardRoute = (role: UserRole): string => {
  const dashboardRoutes: Record<UserRole, string> = {
    student: '/student/dashboard',
    teacher: '/teacher/dashboard',
    admin: '/admin',
    parent: '/parent/dashboard',
    superadmin: '/super-admin',
  };
  return dashboardRoutes[role] || '/';
};
