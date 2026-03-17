// Old navigation types (deprecated - use Expo Router hooks instead)
export type {
  AuthStackParamList,
  MainStackParamList,
  StudentTabParamList,
  ParentTabParamList,
  RootStackScreenProps,
  AuthStackScreenProps,
  MainStackScreenProps,
  StudentTabScreenProps,
  ParentTabScreenProps,
} from './navigation';

// New Expo Router types
export type { RootStackParamList, StudentTabRoutes, ParentTabRoutes } from './routes';

export * from './student';
export * from './offline';
export * from './parent';

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  roles?: UserRole[];
  institutionId?: number;
}

export enum UserRole {
  STUDENT = 'student',
  TEACHER = 'teacher',
  PARENT = 'parent',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  availableRoles: UserRole[];
  activeRole: UserRole | null;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}
