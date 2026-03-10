import { ReactNode } from 'react';
import { UserRole } from './auth';

export interface NavigationItem {
  id: string;
  title: string;
  path?: string;
  icon?: ReactNode;
  children?: NavigationItem[];
  roles?: UserRole[];
  badge?: number | string;
  disabled?: boolean;
}

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

export interface Institution {
  id: string;
  name: string;
  logo?: string;
  type?: string;
}
