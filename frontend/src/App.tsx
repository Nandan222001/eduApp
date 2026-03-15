import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import { AdminLayout } from './components/admin';
import { ParentLayout } from './components/parent';
import Home from './pages/Home';
import About from './pages/About';
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
import TeacherVolunteerVerification from './pages/TeacherVolunteerVerification';
import VolunteerLeaderboard from './pages/VolunteerLeaderboard';
import AdminVolunteerAnalytics from './pages/AdminVolunteerAnalytics';
import PeerRecognition from './pages/PeerRecognition';
import AppreciationWall from './pages/AppreciationWall';
import TeacherRecognitionModeration from './pages/TeacherRecognitionModeration';
import SchoolCultureAnalyticsDashboard from './pages/SchoolCultureAnalyticsDashboard';
import RecognitionSettings from './pages/RecognitionSettings';
import AIStudyBuddy from './pages/AIStudyBuddy';

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
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route path="/unauthorized" element={<UnauthorizedPage />} />
              <Route path="/verify-email" element={<VerifyEmailPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Layout />}>
                  <Route index element={<Home />} />
                  <Route path="about" element={<About />} />
                </Route>
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
                  <Route path="institutions" element={<div>Institutions</div>} />
                  <Route path="institutions/add" element={<div>Add Institution</div>} />
                  <Route path="users/students" element={<div>Students</div>} />
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
                  <Route path="users/admins" element={<div>Administrators</div>} />
                  <Route path="academic/classes" element={<div>Classes</div>} />
                  <Route path="academic/subjects" element={<div>Subjects</div>} />
                  <Route path="academic/syllabus" element={<div>Syllabus</div>} />
                  <Route path="assignments" element={<div>Assignments</div>} />
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
                  <Route path="communication/announcements" element={<div>Announcements</div>} />
                  <Route path="communication/messages" element={<div>Messages</div>} />
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
