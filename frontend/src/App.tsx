import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import { AdminLayout } from './components/admin';
import Home from './pages/Home';
import About from './pages/About';
import NotFound from './pages/NotFound';
import UnauthorizedPage from './pages/UnauthorizedPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import Dashboard from './pages/Dashboard';

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
              <Route index element={<Dashboard />} />
              <Route path="institutions" element={<div>Institutions</div>} />
              <Route path="institutions/add" element={<div>Add Institution</div>} />
              <Route path="users/students" element={<div>Students</div>} />
              <Route path="users/teachers" element={<div>Teachers</div>} />
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

          <Route path="*" element={<NotFound />} />
        </Routes>
      </SessionTimeoutWrapper>
    </AuthProvider>
  );
}

export default App;
