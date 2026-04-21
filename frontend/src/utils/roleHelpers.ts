import type { UserRole } from '@/types/auth';

export const getDashboardRoute = (role: UserRole): string => {
  const dashboardRoutes: Record<UserRole, string> = {
    student: '/student/dashboard',
    teacher: '/teacher/dashboard',
    admin: '/admin',
    institution_admin: '/admin',
    parent: '/parent/dashboard',
    superadmin: '/super-admin',
    super_admin: '/super-admin',
    tutor: '/peer-tutoring-marketplace',
  };
  return dashboardRoutes[role] || '/';
};
