import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  ConfirmationNumber as TicketIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { eventsApi } from '@/api/events';
import { ParentNotificationPreferences } from '@/components/events/ParentNotificationPreferences';
import { format } from 'date-fns';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ParentEventSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);

  const { data: myTickets = [] } = useQuery({
    queryKey: ['myTickets'],
    queryFn: () => eventsApi.getMyTickets(),
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ['eventReminders'],
    queryFn: () => eventsApi.getReminders(),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      case 'refunded':
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <SettingsIcon fontSize="large" />
            <Typography variant="h4">Event Settings</Typography>
          </Box>
          <Typography variant="body1" color="text.secondary">
            Manage your event preferences, tickets, and reminders
          </Typography>
        </Box>

        <Paper sx={{ width: '100%' }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
          >
            <Tab
              label="Notification Preferences"
              icon={<NotificationsIcon />}
              iconPosition="start"
            />
            <Tab label="My Tickets" icon={<TicketIcon />} iconPosition="start" />
            <Tab label="Event Reminders" icon={<NotificationsIcon />} iconPosition="start" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            <TabPanel value={activeTab} index={0}>
              <ParentNotificationPreferences />
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Typography variant="h6" gutterBottom>
                Purchased Tickets
              </Typography>
              {myTickets.length > 0 ? (
                <Grid container spacing={2}>
                  {myTickets.map((ticket) => (
                    <Grid item xs={12} md={6} key={ticket.id}>
                      <Card variant="outlined">
                        <CardContent>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              mb: 2,
                            }}
                          >
                            <Box>
                              <Typography variant="h6" gutterBottom>
                                Ticket #{ticket.ticket_number}
                              </Typography>
                              <Chip
                                label={ticket.payment_status}
                                color={getStatusColor(ticket.payment_status)}
                                size="small"
                              />
                            </Box>
                            <Typography variant="h6" color="primary">
                              ${ticket.amount_paid.toFixed(2)}
                            </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Purchased: {format(new Date(ticket.purchase_date), 'PPP')}
                          </Typography>
                          {ticket.transaction_id && (
                            <Typography variant="caption" color="text.secondary">
                              Transaction ID: {ticket.transaction_id}
                            </Typography>
                          )}
                          <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<DownloadIcon />}
                              fullWidth
                            >
                              Download
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <TicketIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      You haven&apos;t purchased any event tickets yet
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <Typography variant="h6" gutterBottom>
                Active Reminders
              </Typography>
              {reminders.length > 0 ? (
                <List>
                  {reminders.map((reminder) => (
                    <ListItem key={reminder.id} divider>
                      <ListItemText
                        primary={`Event Reminder`}
                        secondary={
                          <>
                            <Typography component="span" variant="body2" color="text.primary">
                              Reminder at: {format(new Date(reminder.reminder_time), 'PPpp')}
                            </Typography>
                            <br />
                            <Chip label={reminder.reminder_type} size="small" sx={{ mt: 0.5 }} />
                            {reminder.is_sent && (
                              <Chip
                                label="Sent"
                                color="success"
                                size="small"
                                sx={{ mt: 0.5, ml: 1 }}
                              />
                            )}
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" aria-label="delete">
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Card variant="outlined">
                  <CardContent sx={{ textAlign: 'center', py: 4 }}>
                    <NotificationsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      No active event reminders
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </TabPanel>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default ParentEventSettings;
