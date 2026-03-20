import { NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

export type AuthStackParamList = {
  Login: undefined;
  OTPLogin: undefined;
  OTPVerify: { email: string; institution_id?: number };
};

export type MainTabParamList = {
  StudentHome: undefined;
  StudentCourses: undefined;
  StudentAssignments: undefined;
  StudentProfile: undefined;
  ParentHome: undefined;
  ParentChildren: undefined;
  ParentReports: undefined;
  ParentProfile: undefined;
  AssignmentDetail: { assignmentId: number };
  AssignmentSubmission: { assignmentId: number };
  CameraScreen: { onPhotoTaken: (photo: any) => void };
  StudyMaterialsScreen: undefined;
  SubjectMaterials: { subjectId: number; subjectName: string };
  MaterialDetail: { materialId: number };
  NotificationPreferences: undefined;
  ParentDashboard: undefined;
  AttendanceMonitor: { childId: number };
  GradesMonitor: { childId: number };
  Communication: undefined;
  FeeManagement: { childId: number };
};

export type ParentStackParamList = {
  ParentHome: undefined;
  AttendanceMonitor: { childId: number };
  GradesMonitor: { childId: number };
  Communication: undefined;
  FeeManagement: { childId: number };
};

export type DeepLinkConfig = {
  prefixes: string[];
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login';
          OTPLogin: 'otp-login';
          OTPVerify: 'otp-verify';
        };
      };
      Main: {
        screens: {
          StudentHome: 'student/home';
          StudentCourses: 'student/courses';
          StudentAssignments: 'student/assignments';
          StudentProfile: 'student/profile';
          ParentDashboard: 'parent/dashboard';
          ParentChildren: 'parent/children';
          ParentReports: 'parent/reports';
          ParentProfile: 'parent/profile';
          AttendanceMonitor: 'parent/attendance/:childId';
          GradesMonitor: 'parent/grades/:childId';
          Communication: 'parent/communication';
          FeeManagement: 'parent/fees/:childId';
        };
      };
    };
  };
};
