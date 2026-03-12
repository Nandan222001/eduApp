import React from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Alert,
} from '@mui/material';
import { Warning as WarningIcon, Notifications as NotifyIcon } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { libraryApi } from '../../api/library';
import { OverdueBookReport } from '../../types/library';

const OverdueTracking: React.FC = () => {
  const { data: overdueData, isLoading } = useQuery({
    queryKey: ['overdueBooks'],
    queryFn: () => libraryApi.getOverdueBooks(),
  });

  const { data: settingsData } = useQuery({
    queryKey: ['librarySettings'],
    queryFn: () => libraryApi.getSettings(),
  });

  const totalOverdue = overdueData?.length || 0;
  const totalFines =
    overdueData?.reduce(
      (sum: number, item: OverdueBookReport) => sum + parseFloat(String(item.fine_amount)),
      0
    ) || 0;

  const getSeverityColor = (daysOverdue: number) => {
    if (daysOverdue <= 7) return 'warning';
    if (daysOverdue <= 30) return 'error';
    return 'error';
  };

  const getSeverityLabel = (daysOverdue: number) => {
    if (daysOverdue <= 7) return 'Due Soon';
    if (daysOverdue <= 30) return 'Overdue';
    return 'Severely Overdue';
  };

  const handleNotifyStudent = (studentId: number) => {
    console.log('Notifying student:', studentId);
  };

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <WarningIcon color="error" />
                <Typography color="text.secondary" gutterBottom>
                  Overdue Books
                </Typography>
              </Box>
              <Typography variant="h4">{totalOverdue}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Fines
              </Typography>
              <Typography variant="h4" color="error">
                ₹{totalFines.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Fine Per Day
              </Typography>
              <Typography variant="h4">₹{settingsData?.fine_per_day || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {settingsData?.max_fine_amount && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Maximum fine amount is capped at ₹{settingsData.max_fine_amount}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Book Title</TableCell>
              <TableCell>Student</TableCell>
              <TableCell>Issue Date</TableCell>
              <TableCell>Due Date</TableCell>
              <TableCell>Days Overdue</TableCell>
              <TableCell>Fine Amount</TableCell>
              <TableCell>Severity</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : overdueData?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Box sx={{ py: 3 }}>
                    <Typography variant="h6" color="success.main">
                      No overdue books! 🎉
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      All books are returned on time
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              overdueData?.map((issue: OverdueBookReport) => (
                <TableRow
                  key={issue.issue_id}
                  sx={{
                    bgcolor:
                      issue.days_overdue > 30
                        ? 'error.light'
                        : issue.days_overdue > 7
                          ? 'warning.light'
                          : 'inherit',
                    opacity: issue.days_overdue > 30 ? 0.9 : 1,
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {issue.book_title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{issue.student_name}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {issue.student_id}
                    </Typography>
                  </TableCell>
                  <TableCell>{new Date(issue.issue_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Typography color="error">
                      {new Date(issue.due_date).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      color={
                        issue.days_overdue > 30
                          ? 'error'
                          : issue.days_overdue > 7
                            ? 'warning.dark'
                            : 'text.primary'
                      }
                    >
                      {issue.days_overdue} days
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography color="error" fontWeight="bold">
                      ₹{parseFloat(issue.fine_amount).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getSeverityLabel(issue.days_overdue)}
                      color={getSeverityColor(issue.days_overdue)}
                      size="small"
                      icon={<WarningIcon />}
                    />
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      startIcon={<NotifyIcon />}
                      onClick={() => handleNotifyStudent(issue.student_id)}
                      variant="outlined"
                    >
                      Notify
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default OverdueTracking;
