import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { AdminLayout } from './components/admin';
import Home from './pages/Home';
import About from './pages/About';
import NotFound from './pages/NotFound';
import UnauthorizedPage from './pages/UnauthorizedPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import InstitutionsList from './pages/InstitutionsList';
import InstitutionDetail from './pages/InstitutionDetail';
import InstitutionCreate from './pages/InstitutionCreate';
import InstitutionSubscription from './pages/InstitutionSubscription';
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

import {
  LoginPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  ProtectedRoute,
  AuthProvider,
} from './components/auth';
import RegisterPage from './components/auth/RegisterPage';
import SessionTimeoutWrapper from './components/common/SessionTimeoutWrapper';
import { ErrorBoundaryWrapper, OfflineIndicator, QueryErrorHandler } from './components/common';
import { ToastProvider } from './contexts/ToastContext';

function App() {
  const isDevelopment = import.meta.env.DEV;

  return (
    <ErrorBoundaryWrapper showDetails={isDevelopment}>
      <AuthProvider>
        <ToastProvider>
          <QueryErrorHandler>
            <SessionTimeoutWrapper>
              <OfflineIndicator position="top" />
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
                </Route>

                <Route
                  element={<ProtectedRoute allowedRoles={['admin']} requireEmailVerified={true} />}
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
                    <Route
                      path="analytics/class/:classId"
                      element={<ClassPerformanceAnalytics />}
                    />
                    <Route path="subscription" element={<SubscriptionBilling />} />
                    <Route path="data/export" element={<DataExport />} />
                    <Route path="data/import" element={<DataImport />} />
                    <Route path="search" element={<SearchResultsPage />} />
                    <Route path="settings" element={<div>Settings</div>} />
                    <Route path="profile" element={<div>Profile</div>} />
                  </Route>
                </Route>

                <Route
                  element={
                    <ProtectedRoute
                      allowedRoles={['teacher', 'admin']}
                      requireEmailVerified={true}
                    />
                  }
                >
                  <Route path="/teacher" element={<AdminLayout />}>
                    <Route index element={<TeacherDashboard />} />
                    <Route path="dashboard" element={<TeacherDashboard />} />
                    <Route
                      path="analytics/class/:classId"
                      element={<ClassPerformanceAnalytics />}
                    />
                    <Route path="goals" element={<GoalsManagement />} />
                    <Route path="gamification" element={<GamificationDashboard />} />
                    <Route path="search" element={<SearchResultsPage />} />
                  </Route>
                </Route>

                <Route
                  element={
                    <ProtectedRoute allowedRoles={['student']} requireEmailVerified={false} />
                  }
                >
                  <Route path="/student" element={<AdminLayout />}>
                    <Route index element={<StudentDashboard />} />
                    <Route path="dashboard" element={<StudentDashboard />} />
                    <Route path="analytics" element={<StudentPerformanceAnalytics />} />
                    <Route path="ai-prediction" element={<AIPredictionDashboard />} />
                    <Route path="goals" element={<GoalsManagement />} />
                    <Route path="gamification" element={<GamificationDashboard />} />
                    <Route path="search" element={<SearchResultsPage />} />
                    <Route path="assignments" element={<div>Student Assignments</div>} />
                    <Route path="materials" element={<div>Study Materials</div>} />
                    <Route path="question-bank" element={<div>Question Bank</div>} />
                    <Route path="previous-papers" element={<div>Previous Papers</div>} />
                    <Route path="progress" element={<div>My Progress</div>} />
                  </Route>
                </Route>

                <Route element={<ProtectedRoute requireSuperAdmin={true} />}>
                  <Route path="/super-admin" element={<AdminLayout />}>
                    <Route index element={<SuperAdminDashboard />} />
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

                <Route path="*" element={<NotFound />} />
              </Routes>
            </SessionTimeoutWrapper>
          </QueryErrorHandler>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundaryWrapper>
  );
}

export default App;
