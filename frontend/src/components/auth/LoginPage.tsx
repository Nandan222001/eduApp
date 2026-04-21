import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  InputAdornment,
  IconButton,
  Tabs,
  Tab,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, VpnKey } from '@mui/icons-material';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { getDashboardRoute } from '@/utils/roleHelpers';
import { motion } from 'motion/react';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [tabValue, setTabValue] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [emailPassword, setEmailPassword] = useState({
    email: '',
    password: '',
  });

  const [otpLogin, setOtpLogin] = useState({
    email: '',
    otp: '',
  });

  const [otpRequested, setOtpRequested] = useState(false);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError('');
    setSuccess('');
    setOtpRequested(false);
  };

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.login(emailPassword);
      login(response.user, response.tokens);
      const route = getDashboardRoute(response.user.role);
      console.log('[Login] role:', response.user.role, '→ route:', route);
      navigate(route);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid email or password';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOTP = async () => {
    if (!otpLogin.email) {
      setError('Please enter your email address');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await authApi.requestOTP(otpLogin.email);
      setOtpRequested(true);
      setSuccess('OTP sent to your email. Please check your inbox.');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send OTP';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOTPLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.loginWithOTP(otpLogin);
      login(response.user, response.tokens);
      navigate(getDashboardRoute(response.user.role));
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Invalid OTP';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
          style={{ width: '100%' }}
        >
          <Paper elevation={3} sx={{ width: '100%', p: 4, borderRadius: 4, border: 'none' }}>
            <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontFamily: 'Manrope', fontWeight: 800 }}>
              Welcome Back
            </Typography>
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mb: 3 }}>
              Sign in to continue to your account
            </Typography>

          <Tabs value={tabValue} onChange={handleTabChange} centered sx={{ mb: 2 }}>
            <Tab label="Email & Password" />
            <Tab label="Login with OTP" />
          </Tabs>

          <Divider sx={{ mb: 2 }} />

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          <TabPanel value={tabValue} index={0}>
            <Box component="form" onSubmit={handleEmailPasswordLogin}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={emailPassword.email}
                onChange={(e) => setEmailPassword({ ...emailPassword, email: e.target.value })}
                required
                margin="normal"
                autoComplete="email"
                autoFocus
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={emailPassword.password}
                onChange={(e) => setEmailPassword({ ...emailPassword, password: e.target.value })}
                required
                margin="normal"
                autoComplete="current-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ textAlign: 'right', mt: 1 }}>
                <Link
                  component={RouterLink}
                  to="/forgot-password"
                  variant="body2"
                  underline="hover"
                >
                  Forgot password?
                </Link>
              </Box>

              <motion.div style={{ width: '100%', marginTop: '24px', marginBottom: '16px' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={isLoading}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
                </Button>
              </motion.div>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box component="form" onSubmit={handleOTPLogin}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={otpLogin.email}
                onChange={(e) => setOtpLogin({ ...otpLogin, email: e.target.value })}
                required
                margin="normal"
                autoComplete="email"
                disabled={otpRequested}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
              />

              {!otpRequested ? (
                <motion.div style={{ width: '100%', marginTop: '16px' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="large"
                    onClick={handleRequestOTP}
                    disabled={isLoading}
                  >
                    {isLoading ? <CircularProgress size={24} /> : 'Request OTP'}
                  </Button>
                </motion.div>
              ) : (
                <>
                  <TextField
                    fullWidth
                    label="OTP Code"
                    type="text"
                    value={otpLogin.otp}
                    onChange={(e) => setOtpLogin({ ...otpLogin, otp: e.target.value })}
                    required
                    margin="normal"
                    autoComplete="one-time-code"
                    autoFocus
                    inputProps={{ maxLength: 6 }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <VpnKey />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <motion.div style={{ width: '100%', marginTop: '24px', marginBottom: '16px' }} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={isLoading}
                    >
                      {isLoading ? <CircularProgress size={24} /> : 'Verify & Sign In'}
                    </Button>
                  </motion.div>

                  <Button fullWidth variant="text" onClick={handleRequestOTP} disabled={isLoading}>
                    Resend OTP
                  </Button>
                </>
              )}
            </Box>
          </TabPanel>

          <Divider sx={{ my: 3 }} />

          <Typography variant="body2" align="center">
            Don&apos;t have an account?{' '}
            <Link component={RouterLink} to="/register" underline="hover">
              Sign up
            </Link>
          </Typography>
          </Paper>
        </motion.div>
      </Box>
    </Container>
  );
}
