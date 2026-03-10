import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { AdminLayout } from './components/admin';
import Home from './pages/Home';
import About from './pages/About';
import NotFound from './pages/NotFound';
import UnauthorizedPage from './pages/UnauthorizedPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import Dashboard from './pages/Dashboard';
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

import {
  LoginPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  ProtectedRoute,
  AuthProvider,
} from './components/auth';
import RegisterPage from './components/auth/RegisterPage';
import SessionTimeoutWrapper from './components/common/SessionTimeoutWrapper';

function App() {
  return (
    <AuthProvider>
      <SessionTimeoutWrapper>
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

          <Route element={<ProtectedRoute allowedRoles={['admin']} requireEmailVerified={true} />}>
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
              <Route path="examinations/schedule" element={<div>Exam Schedule</div>} />
              <Route path="examinations/results" element={<div>Exam Results</div>} />
              <Route path="examinations/analysis" element={<div>Exam Analysis</div>} />
              <Route path="attendance" element={<div>Attendance</div>} />
              <Route path="gamification/achievements" element={<div>Achievements</div>} />
              <Route path="gamification/leaderboard" element={<div>Leaderboard</div>} />
              <Route path="communication/announcements" element={<div>Announcements</div>} />
              <Route path="communication/messages" element={<div>Messages</div>} />
              <Route path="analytics" element={<div>Analytics</div>} />
              <Route path="settings" element={<div>Settings</div>} />
              <Route path="profile" element={<div>Profile</div>} />
            </Route>
          </Route>

          <Route
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']} requireEmailVerified={true} />
            }
          >
            <Route path="/teacher" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
            </Route>
          </Route>

          <Route
            element={<ProtectedRoute allowedRoles={['student']} requireEmailVerified={false} />}
          >
            <Route path="/student" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute requireSuperAdmin={true} />}>
            <Route path="/super-admin" element={<AdminLayout />}>
              <Route index element={<SuperAdminDashboard />} />
              <Route path="institutions" element={<InstitutionsList />} />
              <Route path="institutions/create" element={<InstitutionCreate />} />
              <Route path="institutions/:id" element={<InstitutionDetail />} />
              <Route path="institutions/:id/edit" element={<InstitutionDetail />} />
              <Route path="institutions/:id/subscription" element={<InstitutionSubscription />} />
              <Route path="institutions/:id/analytics" element={<InstitutionAnalytics />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </SessionTimeoutWrapper>
    </AuthProvider>
  );
}

export default App;
