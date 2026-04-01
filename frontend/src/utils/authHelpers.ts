import type { UserRole } from '@/types/auth';

export const hasRole = (userRole: UserRole, allowedRoles: UserRole[]): boolean => {
  return allowedRoles.includes(userRole);
};

export const hasAnyRole = (userRole: UserRole, allowedRoles: UserRole[]): boolean => {
  return allowedRoles.includes(userRole);
};

export const hasAllRoles = (userRole: UserRole, requiredRoles: UserRole[]): boolean => {
  return requiredRoles.includes(userRole);
};

export const getRoleLabel = (role: UserRole): string => {
  const labels: Record<UserRole, string> = {
    admin: 'Administrator',
    teacher: 'Teacher',
    student: 'Student',
    parent: 'Parent',
    institution_admin: 'Institution Administrator',
    superadmin: 'Super Administrator',
  };
  return labels[role] || role;
};

export const getRolePriority = (role: UserRole): number => {
  const priorities: Record<UserRole, number> = {
    admin: 4,
    teacher: 3,
    parent: 2,
    student: 1,
    institution_admin: 5,
    superadmin: 6,
  };
  return priorities[role] || 0;
};

export const compareRoles = (role1: UserRole, role2: UserRole): number => {
  return getRolePriority(role2) - getRolePriority(role1);
};

export const isHigherRole = (role1: UserRole, role2: UserRole): boolean => {
  return getRolePriority(role1) > getRolePriority(role2);
};
