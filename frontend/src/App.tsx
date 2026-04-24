import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { AdminLayout } from './components/admin';
import { ParentLayout } from './components/parent';
import Home from './pages/Home';
import About from './pages/About';
import WelcomePage from './pages/WelcomePage';
import NotFound from './pages/NotFound';
import UnauthorizedPage from './pages/UnauthorizedPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import { useGlobalKeyboardShortcuts } from './hooks/useGlobalKeyboardShortcuts';
import { useAccessibility } from './contexts/AccessibilityContext';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import InstitutionsList from './pages/InstitutionsList';
import InstitutionDetail from './pages/InstitutionDetail';
import InstitutionCreate from './pages/InstitutionCreate';
import InstitutionSubscription from './pages/InstitutionSubscription';
import SuperAdminCrossInstitutionAnalytics from './pages/SuperAdminCrossInstitutionAnalytics';
import InstitutionAnalytics from './pages/InstitutionAnalytics';
import InstitutionAdminDashboard from './pages/InstitutionAdminDashboard';
import TeacherList from './pages/TeacherList';
import TeacherProfile from './pages/TeacherProfile';
import TeacherForm from './pages/TeacherForm';
import TeacherAssignments from './pages/TeacherAssignments';
import TeacherBulkImport from './pages/TeacherBulkImport';
import TeacherPerformanceDashboard from './pages/TeacherPerformanceDashboard';
import TeacherRoleAssignment from './pages/TeacherRoleAssignment';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import StudentList from './pages/StudentList';
import StudentForm from './pages/StudentForm';
import StudentProfile from './pages/StudentProfile';
import AttendanceOverviewPage from './pages/AttendanceOverviewPage';
import AttendanceMarkingPage from './pages/AttendanceMarkingPage';
import AttendanceSheetPage from './pages/AttendanceSheetPage';
import AttendanceDefaultersPage from './pages/AttendanceDefaultersPage';
import AttendanceCorrectionPage from './pages/AttendanceCorrectionPage';
import ExamListPage from './pages/ExamListPage';
import ExamCreationWizard from './pages/ExamCreationWizard';
import MarksEntryPage from './pages/MarksEntryPage';
import MarksVerificationPage from './pages/MarksVerificationPage';
import ResultGenerationPage from './pages/ResultGenerationPage';
import StudentMarksheetPage from './pages/StudentMarksheetPage';
import ExamAnalyticsDashboard from './pages/ExamAnalyticsDashboard';
import PaperListPage from './pages/PaperListPage';
import PaperUploadPage from './pages/PaperUploadPage';
import PaperViewerPage from './pages/PaperViewerPage';
import QuestionBankBrowserPage from './pages/QuestionBankBrowserPage';
import AIPredictionDashboard from './pages/AIPredictionDashboard';
import GoalsManagement from './pages/GoalsManagement';
import GamificationDashboard from './pages/GamificationDashboard';
import StudentPerformanceAnalytics from './pages/StudentPerformanceAnalytics';
import ClassPerformanceAnalytics from './pages/ClassPerformanceAnalytics';
import InstitutionAnalyticsDashboard from './pages/InstitutionAnalyticsDashboard';
import SubscriptionBilling from './pages/SubscriptionBilling';
import SearchResultsPage from './pages/SearchResultsPage';
import DataExport from './pages/DataExport';
import DataImport from './pages/DataImport';
import FlashcardDeckList from './pages/FlashcardDeckList';
import FlashcardStudyPage from './pages/FlashcardStudyPage';
import QuizList from './pages/QuizList';
import QuizTakePage from './pages/QuizTakePage';
import QuizLeaderboardPage from './pages/QuizLeaderboardPage';
import QuizAnalyticsPage from './pages/QuizAnalyticsPage';
import PomodoroTimer from './pages/PomodoroTimer';
import SettingsPage from './pages/SettingsPage';
import ParentDashboard from './pages/ParentDashboard';
import ParentAttendanceMonitor from './pages/ParentAttendanceMonitor';
import ParentGradesMonitor from './pages/ParentGradesMonitor';
import ParentCommunicationDashboard from './pages/ParentCommunicationDashboard';
import ParentAssignmentsView from './pages/ParentAssignmentsView';
import ParentProgressView from './pages/ParentProgressView';
import ParentScheduleView from './pages/ParentScheduleView';
import ParentNotifications from './pages/ParentNotifications';
import PeerTutoringMarketplace from './pages/PeerTutoringMarketplace';
import SchoolMerchandiseStore from './pages/SchoolMerchandiseStore';
import MerchandiseOrderTracking from './pages/MerchandiseOrderTracking';
import AdminMerchandiseManager from './pages/AdminMerchandiseManager';
import AdminOnboardingDesigner from './pages/AdminOnboardingDesigner';
import ParentVolunteerHours from './pages/ParentVolunteerHours';
import ParentConferenceBooking from './pages/ParentConferenceBooking';
import TeacherVolunteerVerification from './pages/TeacherVolunteerVerification';
import VolunteerLeaderboard from './pages/VolunteerLeaderboard';
import AdminVolunteerAnalytics from './pages/AdminVolunteerAnalytics';
import MessagingCenter from './pages/MessagingCenter';
import PeerRecognition from './pages/PeerRecognition';
import AppreciationWall from './pages/AppreciationWall';
import TeacherRecognitionModeration from './pages/TeacherRecognitionModeration';
import SchoolCultureAnalyticsDashboard from './pages/SchoolCultureAnalyticsDashboard';
import RecognitionSettings from './pages/RecognitionSettings';
import AIStudyBuddy from './pages/AIStudyBuddy';
import HomeworkScanner from './pages/HomeworkScanner';
import AdministratorsList from './pages/AdministratorsList';
import ClassManagement from './pages/ClassManagement';
import AssignmentManagement from './pages/AssignmentManagement';
import VirtualOlympics from './pages/VirtualOlympics';
import OlympicsDetailPage from './pages/OlympicsDetailPage';
import OlympicsCompetitionPage from './pages/OlympicsCompetitionPage';
import SubjectManagement from './pages/SubjectManagement';
import SyllabusManagement from './pages/SyllabusManagement';
import StudentJobBoard from './pages/StudentJobBoard';
import WorkPermitManager from './pages/WorkPermitManager';
import MyEmploymentDashboard from './pages/MyEmploymentDashboard';
import JobDetail from './pages/JobDetail';
import EmployerPortal from './pages/EmployerPortal';
import CareerCounselorWorkflow from './pages/CareerCounselorWorkflow';
import WorkHourMonitoring from './pages/WorkHourMonitoring';
import MistakeReplay from './pages/MistakeReplay';
import MistakeInsurance from './pages/MistakeInsurance';
import ReverseClassroom from './pages/ReverseClassroom';
import AnnouncementManagement from './pages/AnnouncementManagement';
import SubjectBattles from './pages/SubjectBattles';
import SubjectPassport from './pages/SubjectPassport';
import StressOMeter from './pages/StressOMeter';
import ParentROIDashboard from './pages/ParentROIDashboard';
import CertificateManagement from './pages/CertificateManagement';
import IDCardTemplateManager from './pages/IDCardTemplateManager';
import StaffManagement from './pages/StaffManagement';
import PayrollManagement from './pages/PayrollManagement';
import EnquiryManagement from './pages/EnquiryManagement';
import SMSTemplateManagement from './pages/SMSTemplateManagement';

import {
  LoginPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  ProtectedRoute,
  AuthProvider,
} from './components/auth';
import RegisterPage from './components/auth/RegisterPage';
import SessionTimeoutWrapper from './components/common/SessionTimeoutWrapper';
import { ErrorBoundaryWrapper, QueryErrorHandler } from './components/common';
import { ChatbotWidget } from './components/chatbot';
import { InstallPrompt } from './components/common/InstallPrompt';
import { UpdatePrompt } from './components/common/UpdatePrompt';
import { OfflineIndicator as PWAOfflineIndicator } from './components/common/PWAOfflineIndicator';
import { useAuthStore } from './store/useAuthStore';
import { getDashboardRoute } from './utils/roleHelpers';

function DashboardRedirect() {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const dashboardRoute = getDashboardRoute(user.role);
  return <Navigate to={dashboardRoute} replace />;
}

function HomeOrDashboard() {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) return null;

  if (isAuthenticated && user) {
    return <Navigate to={getDashboardRoute(user.role)} replace />;
  }

  return <Home />;
}

function App() {
  const isDevelopment = import.meta.env.DEV;
  const { announce } = useAccessibility();

  useGlobalKeyboardShortcuts([
    {
      key: 's',
      alt: true,
      callback: () => {
        const searchInput = document.querySelector('[aria-label*="search" i]') as HTMLElement;
        if (searchInput) {
          searchInput.focus();
          announce('Search focused');
        }
      },
      description: 'Focus search',
    },
    {
      key: '/',
      callback: () => {
        const searchInput = document.querySelector('[aria-label*="search" i]') as HTMLElement;
        if (searchInput) {
          searchInput.focus();
        }
      },
      description: 'Focus search',
    },
  ]);

  return (
    <ErrorBoundaryWrapper showDetails={isDevelopment}>
      <AuthProvider>
        <QueryErrorHandler>
          <SessionTimeoutWrapper>
            <PWAOfflineIndicator />
            <InstallPrompt />
            <UpdatePrompt />
            <ChatbotWidget />
            <Routes>
              <Route path="/welcome" element={<WelcomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />

              {/* Public marketing pages — no auth required */}
              <Route path="/" element={<Layout />}>
                <Route index element={<HomeOrDashboard />} />
                <Route path="about" element={<About />} />
              </Route>

              <Route element={<ProtectedRoute />}>
                <Route path="/dashboard" element={<DashboardRedirect />} />
              </Route>

              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={['admin', 'institution_admin']}
                    requireEmailVerified={true}
                  />
                }
              >
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<InstitutionAdminDashboard />} />
                  <Route path="dashboard" element={<InstitutionAdminDashboard />} />
                  <Route path="users/students" element={<StudentList />} />
                  <Route path="users/students/new" element={<StudentForm />} />
                  <Route path="users/students/:id" element={<StudentProfile />} />
                  <Route path="users/students/:id/edit" element={<StudentForm />} />
                  <Route path="users/teachers" element={<TeacherList />} />
                  <Route path="users/teachers/new" element={<TeacherForm />} />
                  <Route path="users/teachers/:id" element={<TeacherProfile />} />
                  <Route path="users/teachers/:id/edit" element={<TeacherProfile />} />
                  <Route path="users/teachers/:id/assignments" element={<TeacherAssignments />} />
                  <Route
                    path="users/teachers/:id/performance"
                    element={<TeacherPerformanceDashboard />}
                  />
                  <Route path="users/teachers/:id/roles" element={<TeacherRoleAssignment />} />
                  <Route path="users/teachers/bulk-import" element={<TeacherBulkImport />} />
                  <Route path="users/admins" element={<AdministratorsList />} />
                  <Route path="academic/classes" element={<ClassManagement />} />
                  <Route path="academic/subjects" element={<SubjectManagement />} />
                  <Route path="academic/syllabus" element={<SyllabusManagement />} />
                  <Route path="assignments" element={<AssignmentManagement />} />
                  <Route path="examinations/list" element={<ExamListPage />} />
                  <Route path="examinations/create" element={<ExamCreationWizard />} />
                  <Route path="examinations/:examId/marks-entry" element={<MarksEntryPage />} />
                  <Route
                    path="examinations/:examId/verification"
                    element={<MarksVerificationPage />}
                  />
                  <Route
                    path="examinations/:examId/results/generate"
                    element={<ResultGenerationPage />}
                  />
                  <Route
                    path="examinations/:examId/analytics"
                    element={<ExamAnalyticsDashboard />}
                  />
                  <Route
                    path="examinations/:examId/student/:studentId/marksheet"
                    element={<StudentMarksheetPage />}
                  />
                  <Route path="examinations/schedule" element={<div>Exam Schedule</div>} />
                  <Route path="examinations/results" element={<div>Exam Results</div>} />
                  <Route path="examinations/analysis" element={<div>Exam Analysis</div>} />
                  <Route path="papers/list" element={<PaperListPage />} />
                  <Route path="papers/upload" element={<PaperUploadPage />} />
                  <Route path="papers/view/:paperId" element={<PaperViewerPage />} />
                  <Route path="papers/question-bank" element={<QuestionBankBrowserPage />} />
                  <Route path="attendance" element={<AttendanceOverviewPage />} />
                  <Route path="attendance/mark" element={<AttendanceMarkingPage />} />
                  <Route path="attendance/sheet" element={<AttendanceSheetPage />} />
                  <Route path="attendance/defaulters" element={<AttendanceDefaultersPage />} />
                  <Route path="attendance/corrections" element={<AttendanceCorrectionPage />} />
                  <Route path="goals" element={<GoalsManagement />} />
                  <Route path="gamification" element={<GamificationDashboard />} />
                  <Route path="communication/announcements" element={<AnnouncementManagement />} />
                  <Route path="communication/messages" element={<MessagingCenter />} />
                  <Route path="analytics" element={<InstitutionAnalyticsDashboard />} />
                  <Route path="analytics/class/:classId" element={<ClassPerformanceAnalytics />} />
                  <Route path="subscription" element={<SubscriptionBilling />} />
                  <Route path="data/export" element={<DataExport />} />
                  <Route path="data/import" element={<DataImport />} />
                  <Route path="search" element={<SearchResultsPage />} />
                  <Route path="flashcards" element={<FlashcardDeckList />} />
                  <Route path="flashcards/deck/:deckId/study" element={<FlashcardStudyPage />} />
                  <Route path="quizzes" element={<QuizList />} />
                  <Route path="quizzes/:quizId/take" element={<QuizTakePage />} />
                  <Route path="quizzes/:quizId/leaderboard" element={<QuizLeaderboardPage />} />
                  <Route path="quizzes/:quizId/analytics" element={<QuizAnalyticsPage />} />
                  <Route path="merchandise" element={<AdminMerchandiseManager />} />
                  <Route path="onboarding-designer" element={<AdminOnboardingDesigner />} />
                  <Route path="volunteer/analytics" element={<AdminVolunteerAnalytics />} />
                  <Route path="volunteer/leaderboard" element={<VolunteerLeaderboard />} />
                  <Route
                    path="recognition/analytics"
                    element={<SchoolCultureAnalyticsDashboard />}
                  />
                  <Route path="employment/employer-portal" element={<EmployerPortal />} />
                  <Route path="employment/counselor" element={<CareerCounselorWorkflow />} />
                  <Route path="school-admin">
                    <Route path="certificates" element={<CertificateManagement />} />
                    <Route path="id-cards" element={<IDCardTemplateManager />} />
                    <Route path="staff" element={<StaffManagement />} />
                    <Route path="payroll" element={<PayrollManagement />} />
                    <Route path="enquiries" element={<EnquiryManagement />} />
                    <Route path="sms-templates" element={<SMSTemplateManagement />} />
                  </Route>

                  {/* Keep legacy top-level admin paths for backward compatibility */}
                  <Route path="certificates" element={<CertificateManagement />} />
                  <Route path="id-cards" element={<IDCardTemplateManager />} />
                  <Route path="staff" element={<StaffManagement />} />
                  <Route path="payroll" element={<PayrollManagement />} />
                  <Route path="enquiries" element={<EnquiryManagement />} />
                  <Route path="sms-templates" element={<SMSTemplateManagement />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="profile" element={<SettingsPage />} />
                </Route>
              </Route>

              <Route
                element={
                  <ProtectedRoute
                    allowedRoles={['teacher', 'admin', 'institution_admin']}
                    requireEmailVerified={true}
                  />
                }
              >
                <Route path="/teacher" element={<AdminLayout />}>
                  <Route index element={<TeacherDashboard />} />
                  <Route path="dashboard" element={<TeacherDashboard />} />
                  <Route path="analytics/class/:classId" element={<ClassPerformanceAnalytics />} />
                  <Route path="goals" element={<GoalsManagement />} />
                  <Route path="gamification" element={<GamificationDashboard />} />
                  <Route path="search" element={<SearchResultsPage />} />
                  <Route path="flashcards" element={<FlashcardDeckList />} />
                  <Route path="flashcards/deck/:deckId/study" element={<FlashcardStudyPage />} />
                  <Route path="quizzes" element={<QuizList />} />
                  <Route path="quizzes/:quizId/take" element={<QuizTakePage />} />
                  <Route path="quizzes/:quizId/leaderboard" element={<QuizLeaderboardPage />} />
                  <Route path="quizzes/:quizId/analytics" element={<QuizAnalyticsPage />} />
                  <Route path="peer-tutoring" element={<PeerTutoringMarketplace />} />
                  <Route path="merchandise/store" element={<SchoolMerchandiseStore />} />
                  <Route path="merchandise/orders" element={<MerchandiseOrderTracking />} />
                  <Route path="volunteer/verification" element={<TeacherVolunteerVerification />} />
                  <Route path="volunteer/leaderboard" element={<VolunteerLeaderboard />} />
                  <Route path="recognition/moderation" element={<TeacherRecognitionModeration />} />
                  <Route path="appreciation-wall" element={<AppreciationWall />} />
                  <Route path="employment/counselor" element={<CareerCounselorWorkflow />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
              </Route>

              <Route
                element={<ProtectedRoute allowedRoles={['student']} requireEmailVerified={false} />}
              >
                <Route path="/student" element={<AdminLayout />}>
                  <Route index element={<StudentDashboard />} />
                  <Route path="dashboard" element={<StudentDashboard />} />
                  <Route path="analytics" element={<StudentPerformanceAnalytics />} />
                  <Route path="ai-prediction" element={<AIPredictionDashboard />} />
                  <Route path="study-buddy" element={<AIStudyBuddy />} />
                  <Route path="homework-scanner" element={<HomeworkScanner />} />
                  <Route path="pomodoro" element={<PomodoroTimer />} />
                  <Route path="goals" element={<GoalsManagement />} />
                  <Route path="gamification" element={<GamificationDashboard />} />
                  <Route path="search" element={<SearchResultsPage />} />
                  <Route path="assignments" element={<div>Student Assignments</div>} />
                  <Route path="materials" element={<div>Study Materials</div>} />
                  <Route path="question-bank" element={<div>Question Bank</div>} />
                  <Route path="previous-papers" element={<div>Previous Papers</div>} />
                  <Route path="progress" element={<div>My Progress</div>} />
                  <Route path="flashcards" element={<FlashcardDeckList />} />
                  <Route path="flashcards/deck/:deckId/study" element={<FlashcardStudyPage />} />
                  <Route path="quizzes" element={<QuizList />} />
                  <Route path="quizzes/:quizId/take" element={<QuizTakePage />} />
                  <Route path="quizzes/:quizId/leaderboard" element={<QuizLeaderboardPage />} />
                  <Route path="quizzes/:quizId/analytics" element={<QuizAnalyticsPage />} />
                  <Route path="peer-tutoring" element={<PeerTutoringMarketplace />} />
                  <Route path="volunteer/leaderboard" element={<VolunteerLeaderboard />} />
                  <Route path="merchandise/store" element={<SchoolMerchandiseStore />} />
                  <Route path="merchandise/orders" element={<MerchandiseOrderTracking />} />
                  <Route path="peer-recognition" element={<PeerRecognition />} />
                  <Route path="appreciation-wall" element={<AppreciationWall />} />
                  <Route path="recognition/settings" element={<RecognitionSettings />} />
                  <Route path="olympics" element={<VirtualOlympics />} />
                  <Route path="olympics/:competitionId" element={<OlympicsDetailPage />} />
                  <Route path="olympics/event/:eventId" element={<OlympicsCompetitionPage />} />
                  <Route path="employment/job-board" element={<StudentJobBoard />} />
                  <Route path="employment/jobs/:id" element={<JobDetail />} />
                  <Route path="employment/work-permits" element={<WorkPermitManager />} />
                  <Route path="employment/my-employment" element={<MyEmploymentDashboard />} />
                  <Route path="employment/work-hours" element={<WorkHourMonitoring />} />
                  <Route path="mistakes/replay" element={<MistakeReplay />} />
                  <Route path="mistakes/insurance" element={<MistakeInsurance />} />
                  <Route path="teach" element={<ReverseClassroom />} />
                  <Route path="battles" element={<SubjectBattles />} />
                  <Route path="passport" element={<SubjectPassport />} />
                  <Route path="wellbeing/stress-meter" element={<StressOMeter />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>
              </Route>

              <Route element={<ProtectedRoute requireSuperAdmin={true} />}>
                <Route path="/super-admin" element={<AdminLayout />}>
                  <Route index element={<SuperAdminDashboard />} />
                  <Route
                    path="analytics/cross-institution"
                    element={<SuperAdminCrossInstitutionAnalytics />}
                  />
                  <Route path="institutions" element={<InstitutionsList />} />
                  <Route path="institutions/create" element={<InstitutionCreate />} />
                  <Route path="institutions/:id" element={<InstitutionDetail />} />
                  <Route path="institutions/:id/edit" element={<InstitutionDetail />} />
                  <Route
                    path="institutions/:id/subscription"
                    element={<InstitutionSubscription />}
                  />
                  <Route path="institutions/:id/analytics" element={<InstitutionAnalytics />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="profile" element={<SettingsPage />} />
                </Route>
              </Route>

              <Route
                element={<ProtectedRoute allowedRoles={['parent']} requireEmailVerified={false} />}
              >
                <Route path="/parent" element={<ParentLayout />}>
                  <Route index element={<ParentDashboard />} />
                  <Route path="dashboard" element={<ParentDashboard />} />
                  <Route path="attendance" element={<ParentAttendanceMonitor />} />
                  <Route path="grades" element={<ParentGradesMonitor />} />
                  <Route path="assignments" element={<ParentAssignmentsView />} />
                  <Route path="progress" element={<ParentProgressView />} />
                  <Route path="goals" element={<GoalsManagement />} />
                  <Route path="communication" element={<ParentCommunicationDashboard />} />
                  <Route path="schedule" element={<ParentScheduleView />} />
                  <Route path="notifications" element={<ParentNotifications />} />
                  <Route path="volunteer" element={<ParentVolunteerHours />} />
                  <Route path="volunteer/leaderboard" element={<VolunteerLeaderboard />} />
                  <Route path="merchandise/store" element={<SchoolMerchandiseStore />} />
                  <Route path="merchandise/orders" element={<MerchandiseOrderTracking />} />
                  <Route path="roi-dashboard" element={<ParentROIDashboard />} />
                  <Route path="conferences/booking" element={<ParentConferenceBooking />} />
                  <Route path="settings" element={<SettingsPage />} />
                  <Route path="profile" element={<SettingsPage />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </SessionTimeoutWrapper>
        </QueryErrorHandler>
      </AuthProvider>
    </ErrorBoundaryWrapper>
  );
}

export default App;
