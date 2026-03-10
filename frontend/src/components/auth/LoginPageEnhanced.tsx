import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
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
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, VpnKey } from '@mui/icons-material';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { getErrorMessage } from '@/utils/errorHandlers';
import AuthCard from './AuthCard';
import MobileAuthHeader from './MobileAuthHeader';

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

export default function LoginPageEnhanced() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
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
      setError(getErrorMessage(err));
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
      navigate('/dashboard');
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: { xs: 'background.default', sm: 'grey.100' },
        py: { xs: 0, sm: 4 },
      }}
    >
      <Container maxWidth="sm">
        <AuthCard>
          <MobileAuthHeader title="Welcome Back" subtitle="Sign in to continue to your account" />

          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            centered={!isMobile}
            variant={isMobile ? 'fullWidth' : 'standard'}
            sx={{ mb: 2 }}
          >
            <Tab label="Password" />
            <Tab label="OTP" />
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
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        size={isMobile ? 'small' : 'medium'}
                      >
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

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={isLoading}
                sx={{ mt: 3, mb: 2 }}
              >
                {isLoading ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>
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
                <Button
                  fullWidth
                  variant="outlined"
                  size="large"
                  onClick={handleRequestOTP}
                  disabled={isLoading}
                  sx={{ mt: 2 }}
                >
                  {isLoading ? <CircularProgress size={24} /> : 'Request OTP'}
                </Button>
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
                    inputProps={{
                      maxLength: 6,
                      inputMode: 'numeric',
                      pattern: '[0-9]*',
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <VpnKey />
                        </InputAdornment>
                      ),
                    }}
                  />

                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    size="large"
                    disabled={isLoading}
                    sx={{ mt: 3, mb: 2 }}
                  >
                    {isLoading ? <CircularProgress size={24} /> : 'Verify & Sign In'}
                  </Button>

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
        </AuthCard>
      </Container>
    </Box>
  );
}
