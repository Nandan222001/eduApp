import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { RootStackParamList } from '@types';

const prefix = Linking.createURL('/');

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [prefix, 'edumobile://', 'https://edu.app'],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          Register: 'register',
          ForgotPassword: 'forgot-password',
          ResetPassword: 'reset-password/:token',
        },
      },
      Main: {
        screens: {
          StudentTabs: {
            screens: {
              Dashboard: 'dashboard',
              Courses: 'courses',
              CourseDetail: 'courses/:courseId',
              Assignments: 'assignments',
              AssignmentDetail: 'assignments/:assignmentId',
              Grades: 'grades',
              Schedule: 'schedule',
            },
          },
          ParentTabs: {
            screens: {
              Dashboard: 'parent/dashboard',
              Children: 'parent/children',
              ChildDetail: 'parent/children/:childId',
              Grades: 'parent/grades',
              Attendance: 'parent/attendance',
              Messages: 'parent/messages',
              MessageDetail: 'parent/messages/:messageId',
            },
          },
          Profile: 'profile',
          Settings: 'settings',
          Notifications: 'notifications',
          NotificationDetail: 'notifications/:notificationId',
        },
      },
    },
  },
};
