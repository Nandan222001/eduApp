import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import NotFound from './pages/NotFound';
import UnauthorizedPage from './pages/UnauthorizedPage';
import VerifyEmailPage from './pages/VerifyEmailPage';

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
            <Route path="/admin" element={<Layout />}>
              <Route index element={<div>Admin Dashboard</div>} />
            </Route>
          </Route>

          <Route
            element={
              <ProtectedRoute allowedRoles={['teacher', 'admin']} requireEmailVerified={true} />
            }
          >
            <Route path="/teacher" element={<Layout />}>
              <Route index element={<div>Teacher Dashboard</div>} />
            </Route>
          </Route>

          <Route
            element={<ProtectedRoute allowedRoles={['student']} requireEmailVerified={false} />}
          >
            <Route path="/student" element={<Layout />}>
              <Route index element={<div>Student Dashboard</div>} />
            </Route>
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </SessionTimeoutWrapper>
    </AuthProvider>
  );
}

export default App;
