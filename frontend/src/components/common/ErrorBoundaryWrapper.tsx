import { Component, ReactNode, ErrorInfo } from 'react';
import { Box, Typography, Button, Container, Paper, Alert, Collapse } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import HomeIcon from '@mui/icons-material/Home';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  showErrorDetails: boolean;
}

export class ErrorBoundaryWrapper extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      showErrorDetails: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });

    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      showErrorDetails: false,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  toggleErrorDetails = () => {
    this.setState((prev) => ({ showErrorDetails: !prev.showErrorDetails }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Container maxWidth="md" sx={{ py: 8 }}>
          <Paper
            elevation={3}
            sx={{
              p: 4,
              textAlign: 'center',
              borderRadius: 2,
            }}
          >
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <ErrorOutlineIcon
                sx={{
                  fontSize: 80,
                  color: 'error.main',
                }}
              />

              <Box>
                <Typography variant="h4" gutterBottom fontWeight={600}>
                  Oops! Something Went Wrong
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                  We encountered an unexpected error. Don&apos;t worry, we&apos;re working on fixing
                  it.
                </Typography>
              </Box>

              <Alert severity="error" sx={{ width: '100%', textAlign: 'left' }}>
                <Typography variant="body2" fontWeight={500}>
                  {this.state.error?.message || 'An unexpected error occurred'}
                </Typography>
              </Alert>

              {this.props.showDetails && this.state.errorInfo && (
                <Box sx={{ width: '100%' }}>
                  <Button
                    size="small"
                    onClick={this.toggleErrorDetails}
                    endIcon={this.state.showErrorDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  >
                    {this.state.showErrorDetails ? 'Hide' : 'Show'} Technical Details
                  </Button>
                  <Collapse in={this.state.showErrorDetails}>
                    <Paper
                      sx={{
                        p: 2,
                        mt: 2,
                        bgcolor: 'grey.100',
                        maxHeight: 300,
                        overflow: 'auto',
                      }}
                    >
                      <Typography
                        variant="caption"
                        component="pre"
                        sx={{
                          fontFamily: 'monospace',
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {this.state.error?.stack}
                        {'\n\n'}
                        {this.state.errorInfo?.componentStack}
                      </Typography>
                    </Paper>
                  </Collapse>
                </Box>
              )}

              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button variant="contained" startIcon={<RefreshIcon />} onClick={this.handleReset}>
                  Try Again
                </Button>
                <Button variant="outlined" startIcon={<RefreshIcon />} onClick={this.handleReload}>
                  Reload Page
                </Button>
                <Button variant="outlined" startIcon={<HomeIcon />} onClick={this.handleGoHome}>
                  Go Home
                </Button>
              </Box>
            </Box>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundaryWrapper;
