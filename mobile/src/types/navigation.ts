import { NavigatorScreenParams } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CompositeScreenProps } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainStackParamList>;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { token: string };
};

export type MainStackParamList = {
  StudentTabs: NavigatorScreenParams<StudentTabParamList>;
  ParentTabs: NavigatorScreenParams<ParentTabParamList>;
  Profile: undefined;
  Settings: undefined;
  Notifications: undefined;
  NotificationDetail: { notificationId: string };
  CourseDetail: { courseId: string };
  AssignmentDetail: { assignmentId: string };
  ChildDetail: { childId: string };
  MessageDetail: { messageId: string };
};

export type StudentTabParamList = {
  Dashboard: undefined;
  Courses: undefined;
  Assignments: undefined;
  Grades: undefined;
  Schedule: undefined;
};

export type ParentTabParamList = {
  Dashboard: undefined;
  Children: undefined;
  Grades: { childId?: string };
  Attendance: { childId?: string };
  Messages: undefined;
};

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type AuthStackScreenProps<T extends keyof AuthStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<AuthStackParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

export type MainStackScreenProps<T extends keyof MainStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<MainStackParamList, T>,
  NativeStackScreenProps<RootStackParamList>
>;

export type StudentTabScreenProps<T extends keyof StudentTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<StudentTabParamList, T>,
  CompositeScreenProps<
    NativeStackScreenProps<MainStackParamList>,
    NativeStackScreenProps<RootStackParamList>
  >
>;

export type ParentTabScreenProps<T extends keyof ParentTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<ParentTabParamList, T>,
  CompositeScreenProps<
    NativeStackScreenProps<MainStackParamList>,
    NativeStackScreenProps<RootStackParamList>
  >
>;

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
