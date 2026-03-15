import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  TrendingUp,
  LocalGasStation,
  Timeline,
  EmojiEvents,
  Speed,
  Park,
} from '@mui/icons-material';
import { CarpoolAnalytics } from '@/types/carpool';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const mockAnalytics: CarpoolAnalytics = {
  carpool_group_id: 1,
  period_start: '2024-01-01',
  period_end: '2024-03-15',
  cost_savings: {
    total_gas_saved: 245.5,
    total_mileage_saved: 1247,
    estimated_cost_saved: 1850,
    cost_per_member: 462.5,
  },
  environmental_impact: {
    co2_reduced_kg: 423,
    trees_equivalent: 19,
    gallons_saved: 62.3,
  },
  participation: {
    total_rides: 156,
    total_members: 4,
    participation_rate: 94,
    member_stats: [
      {
        member_id: 1,
        member_name: 'Sarah Johnson',
        rides_driven: 42,
        rides_taken: 38,
        consistency_score: 96,
      },
      {
        member_id: 2,
        member_name: 'Michael Chen',
        rides_driven: 39,
        rides_taken: 41,
        consistency_score: 95,
      },
      {
        member_id: 3,
        member_name: 'Jessica Martinez',
        rides_driven: 38,
        rides_taken: 39,
        consistency_score: 92,
      },
      {
        member_id: 4,
        member_name: 'David Wilson',
        rides_driven: 37,
        rides_taken: 38,
        consistency_score: 88,
      },
    ],
  },
  reliability: {
    on_time_percentage: 92,
    cancellation_rate: 3,
    average_delay_minutes: 4.2,
  },
};

const CarpoolAnalyticsDashboard: React.FC = () => {
  const [analytics] = useState<CarpoolAnalytics>(mockAnalytics);
  const [timePeriod, setTimePeriod] = useState('3months');

  const savingsTrendData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Cost Saved ($)',
        data: [450, 520, 610, 580, 650, 720],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">Carpool Analytics</Typography>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Time Period</InputLabel>
          <Select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value)}
            label="Time Period"
          >
            <MenuItem value="1month">Last Month</MenuItem>
            <MenuItem value="3months">Last 3 Months</MenuItem>
            <MenuItem value="6months">Last 6 Months</MenuItem>
            <MenuItem value="year">This Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box
                  sx={{
                    bgcolor: 'success.light',
                    borderRadius: 1,
                    p: 1,
                    mr: 2,
                    display: 'flex',
                  }}
                >
                  <TrendingUp sx={{ color: 'success.dark' }} />
                </Box>
                <Box>
                  <Typography variant="h4" color="success.main">
                    ${analytics.cost_savings.estimated_cost_saved}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Cost Saved
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                ${analytics.cost_savings.cost_per_member} per member
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box
                  sx={{
                    bgcolor: 'info.light',
                    borderRadius: 1,
                    p: 1,
                    mr: 2,
                    display: 'flex',
                  }}
                >
                  <LocalGasStation sx={{ color: 'info.dark' }} />
                </Box>
                <Box>
                  <Typography variant="h4" color="info.main">
                    {analytics.environmental_impact.gallons_saved}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Gallons Saved
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {analytics.cost_savings.total_mileage_saved} miles saved
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box
                  sx={{
                    bgcolor: 'primary.light',
                    borderRadius: 1,
                    p: 1,
                    mr: 2,
                    display: 'flex',
                  }}
                >
                  <Park sx={{ color: 'primary.dark' }} />
                </Box>
                <Box>
                  <Typography variant="h4" color="primary.main">
                    {analytics.environmental_impact.co2_reduced_kg}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    kg CO₂ Reduced
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                = {analytics.environmental_impact.trees_equivalent} trees planted
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Box
                  sx={{
                    bgcolor: 'warning.light',
                    borderRadius: 1,
                    p: 1,
                    mr: 2,
                    display: 'flex',
                  }}
                >
                  <Timeline sx={{ color: 'warning.dark' }} />
                </Box>
                <Box>
                  <Typography variant="h4" color="warning.main">
                    {analytics.participation.total_rides}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Rides
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {analytics.participation.participation_rate}% participation rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Cost Savings Trend
            </Typography>
            <Box sx={{ height: 300, mt: 2 }}>
              <Line data={savingsTrendData} options={chartOptions} />
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Reliability Metrics
            </Typography>

            <Box sx={{ mt: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Speed sx={{ mr: 1, color: 'text.secondary' }} />
                <Typography variant="body2">On-Time Performance</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={analytics.reliability.on_time_percentage}
                  sx={{ flex: 1, height: 8, borderRadius: 1 }}
                />
                <Typography variant="body2" fontWeight="bold">
                  {analytics.reliability.on_time_percentage}%
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Cancellation Rate
              </Typography>
              <Typography variant="h4" color="success.main">
                {analytics.reliability.cancellation_rate}%
              </Typography>
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="body2" color="text.secondary">
                Average Delay
              </Typography>
              <Typography variant="h4" color="info.main">
                {analytics.reliability.average_delay_minutes} min
              </Typography>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Member Participation
            </Typography>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Member</TableCell>
                    <TableCell align="center">Rides Driven</TableCell>
                    <TableCell align="center">Rides Taken</TableCell>
                    <TableCell align="center">Consistency Score</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {analytics.participation.member_stats.map((member) => (
                    <TableRow key={member.member_id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {member.consistency_score >= 95 && (
                            <EmojiEvents color="warning" fontSize="small" />
                          )}
                          <Typography variant="body2">{member.member_name}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">{member.rides_driven}</TableCell>
                      <TableCell align="center">{member.rides_taken}</TableCell>
                      <TableCell align="center">
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            justifyContent: 'center',
                          }}
                        >
                          <LinearProgress
                            variant="determinate"
                            value={member.consistency_score}
                            sx={{ width: 100, height: 6, borderRadius: 1 }}
                          />
                          <Typography variant="body2">{member.consistency_score}%</Typography>
                        </Box>
                      </TableCell>
                      <TableCell align="center">
                        <Chip
                          label={
                            member.consistency_score >= 95
                              ? 'Excellent'
                              : member.consistency_score >= 85
                                ? 'Good'
                                : 'Average'
                          }
                          color={
                            member.consistency_score >= 95
                              ? 'success'
                              : member.consistency_score >= 85
                                ? 'info'
                                : 'default'
                          }
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CarpoolAnalyticsDashboard;
