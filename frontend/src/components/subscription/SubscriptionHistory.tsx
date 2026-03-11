import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  useTheme,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';

interface HistoryItem {
  id: number;
  type: 'created' | 'upgraded' | 'downgraded' | 'renewed' | 'canceled' | 'payment';
  title: string;
  description: string;
  date: string;
  amount?: number;
}

interface SubscriptionHistoryProps {
  history: HistoryItem[];
}

export default function SubscriptionHistory({ history }: SubscriptionHistoryProps) {
  const theme = useTheme();

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'created':
        return <AddIcon />;
      case 'upgraded':
        return <TrendingUpIcon />;
      case 'downgraded':
        return <TrendingDownIcon />;
      case 'renewed':
        return <RefreshIcon />;
      case 'canceled':
        return <CancelIcon />;
      case 'payment':
        return <PaymentIcon />;
      default:
        return <AddIcon />;
    }
  };

  const getEventColor = (type: string): 'primary' | 'success' | 'warning' | 'error' | 'info' => {
    switch (type) {
      case 'created':
      case 'renewed':
        return 'success';
      case 'upgraded':
        return 'primary';
      case 'downgraded':
        return 'warning';
      case 'canceled':
        return 'error';
      case 'payment':
        return 'info';
      default:
        return 'primary';
    }
  };

  return (
    <Box>
      <Typography variant="h6" fontWeight={600} sx={{ mb: 3 }}>
        Subscription History
      </Typography>

      {history.length === 0 ? (
        <Card
          elevation={0}
          sx={{
            border: `1px dashed ${theme.palette.divider}`,
            textAlign: 'center',
            py: 6,
          }}
        >
          <CardContent>
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No History
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Subscription activity will appear here
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <List>
          {history.map((item) => (
            <Card
              key={item.id}
              elevation={0}
              sx={{
                border: `1px solid ${theme.palette.divider}`,
                mb: 2,
              }}
            >
              <ListItem alignItems="flex-start">
                <ListItemIcon>
                  <Avatar
                    sx={{
                      bgcolor: alpha(
                        getEventColor(item.type) === 'success'
                          ? theme.palette.success.main
                          : getEventColor(item.type) === 'primary'
                            ? theme.palette.primary.main
                            : getEventColor(item.type) === 'warning'
                              ? theme.palette.warning.main
                              : getEventColor(item.type) === 'error'
                                ? theme.palette.error.main
                                : theme.palette.info.main,
                        0.1
                      ),
                      color:
                        getEventColor(item.type) === 'success'
                          ? theme.palette.success.main
                          : getEventColor(item.type) === 'primary'
                            ? theme.palette.primary.main
                            : getEventColor(item.type) === 'warning'
                              ? theme.palette.warning.main
                              : getEventColor(item.type) === 'error'
                                ? theme.palette.error.main
                                : theme.palette.info.main,
                    }}
                  >
                    {getEventIcon(item.type)}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body1" fontWeight={600}>
                        {item.title}
                      </Typography>
                      <Chip
                        label={item.type}
                        size="small"
                        color={getEventColor(item.type)}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        {item.description}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(item.date).toLocaleDateString()} at{' '}
                        {new Date(item.date).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Typography>
                      {item.amount && (
                        <Typography variant="body2" fontWeight={600} sx={{ mt: 1 }}>
                          Amount: ₹{item.amount.toLocaleString()}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            </Card>
          ))}
        </List>
      )}
    </Box>
  );
}
