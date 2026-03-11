import { Component, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import RefreshIcon from '@mui/icons-material/Refresh';

interface Props {
  children: ReactNode;
}

interface State {
  hasNetworkError: boolean;
}

export class NetworkErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasNetworkError: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      return { hasNetworkError: true };
    }
    return {};
  }

  componentDidCatch(error: Error) {
    if (error.message.includes('Network') || error.message.includes('fetch')) {
      console.error('Network error caught:', error);
    }
  }

  handleRetry = () => {
    this.setState({ hasNetworkError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasNetworkError) {
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            p: 3,
          }}
        >
          <Paper
            sx={{
              p: 4,
              textAlign: 'center',
              maxWidth: 400,
            }}
          >
            <WifiOffIcon sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
            <Typography variant="h5" gutterBottom>
              Network Connection Lost
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Unable to connect to the server. Please check your internet connection and try again.
            </Typography>
            <Button variant="contained" startIcon={<RefreshIcon />} onClick={this.handleRetry}>
              Retry Connection
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default NetworkErrorBoundary;
