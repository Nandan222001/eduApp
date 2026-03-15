import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Button,
  TextField,
  Divider,
  Alert,
  CircularProgress,
  useTheme,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Autocomplete,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  AttachMoney as MoneyIcon,
  Calculate as CalculateIcon,
  TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import collegeApi from '@/api/college';
import { College, FinancialAidEstimate } from '@/types/college';

export default function FinancialAidCalculator() {
  const theme = useTheme();
  const { user } = useAuth();
  const [colleges, setColleges] = useState<College[]>([]);
  const [selectedCollege, setSelectedCollege] = useState<College | null>(null);
  const [estimates, setEstimates] = useState<FinancialAidEstimate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    tuition: 0,
    room_board: 12000,
    books_supplies: 1200,
    personal_expenses: 2000,
    transportation: 1500,
    grants_scholarships: 0,
    work_study: 0,
    loans: 0,
    family_contribution: 0,
  });

  const [calculatedCost, setCalculatedCost] = useState({
    total_cost: 0,
    total_aid: 0,
    net_cost: 0,
  });

  const studentId = user?.id ? parseInt(user.id, 10) : 1;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [collegesData, estimatesData] = await Promise.all([
        collegeApi.searchColleges({}),
        collegeApi.getFinancialAidEstimates(studentId),
      ]);
      setColleges(collegesData);
      setEstimates(estimatesData);
      setError(null);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (selectedCollege) {
      setFormData((prev) => ({
        ...prev,
        tuition: selectedCollege.tuition_in_state || selectedCollege.tuition_out_state || 0,
        room_board: selectedCollege.room_board || 12000,
      }));
    }
  }, [selectedCollege]);

  const calculateCost = useCallback(() => {
    const totalCost =
      formData.tuition +
      formData.room_board +
      formData.books_supplies +
      formData.personal_expenses +
      formData.transportation;

    const totalAid =
      formData.grants_scholarships +
      formData.work_study +
      formData.loans +
      formData.family_contribution;

    const netCost = totalCost - totalAid;

    setCalculatedCost({
      total_cost: totalCost,
      total_aid: totalAid,
      net_cost: Math.max(0, netCost),
    });
  }, [formData]);

  useEffect(() => {
    calculateCost();
  }, [calculateCost]);

  const handleSaveEstimate = async () => {
    if (!selectedCollege) {
      setError('Please select a college');
      return;
    }

    try {
      await collegeApi.createFinancialAidEstimate(studentId, {
        college_id: selectedCollege.id,
        ...formData,
        total_cost: calculatedCost.total_cost,
        net_cost: calculatedCost.net_cost,
      });
      await loadData();
      setError(null);
    } catch (err) {
      setError('Failed to save estimate');
      console.error(err);
    }
  };

  if (loading && estimates.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Financial Aid Calculator
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Estimate the total cost of attendance after financial aid for each college
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Cost Calculator" avatar={<CalculateIcon />} />
            <CardContent>
              <Autocomplete
                options={colleges}
                getOptionLabel={(option) => option.name}
                value={selectedCollege}
                onChange={(_, value) => setSelectedCollege(value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select College"
                    placeholder="Type to search..."
                    sx={{ mb: 3 }}
                  />
                )}
              />

              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Cost of Attendance
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TextField
                fullWidth
                label="Tuition"
                type="number"
                value={formData.tuition}
                onChange={(e) => setFormData({ ...formData, tuition: Number(e.target.value) })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Room & Board"
                type="number"
                value={formData.room_board}
                onChange={(e) => setFormData({ ...formData, room_board: Number(e.target.value) })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Books & Supplies"
                type="number"
                value={formData.books_supplies}
                onChange={(e) =>
                  setFormData({ ...formData, books_supplies: Number(e.target.value) })
                }
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Personal Expenses"
                type="number"
                value={formData.personal_expenses}
                onChange={(e) =>
                  setFormData({ ...formData, personal_expenses: Number(e.target.value) })
                }
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Transportation"
                type="number"
                value={formData.transportation}
                onChange={(e) =>
                  setFormData({ ...formData, transportation: Number(e.target.value) })
                }
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                sx={{ mb: 3 }}
              />

              <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                Financial Aid & Resources
              </Typography>
              <Divider sx={{ mb: 2 }} />

              <TextField
                fullWidth
                label="Grants & Scholarships"
                type="number"
                value={formData.grants_scholarships}
                onChange={(e) =>
                  setFormData({ ...formData, grants_scholarships: Number(e.target.value) })
                }
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Work Study"
                type="number"
                value={formData.work_study}
                onChange={(e) => setFormData({ ...formData, work_study: Number(e.target.value) })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Student Loans"
                type="number"
                value={formData.loans}
                onChange={(e) => setFormData({ ...formData, loans: Number(e.target.value) })}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                sx={{ mb: 2 }}
              />

              <TextField
                fullWidth
                label="Family Contribution"
                type="number"
                value={formData.family_contribution}
                onChange={(e) =>
                  setFormData({ ...formData, family_contribution: Number(e.target.value) })
                }
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
                sx={{ mb: 2 }}
              />

              <Button
                fullWidth
                variant="contained"
                onClick={handleSaveEstimate}
                disabled={!selectedCollege}
              >
                Save Estimate
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardHeader title="Estimated Net Cost" avatar={<MoneyIcon />} />
            <CardContent>
              <Paper
                sx={{
                  p: 3,
                  mb: 3,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                  color: 'white',
                }}
              >
                <Typography variant="h3" fontWeight={700} textAlign="center" gutterBottom>
                  ${calculatedCost.net_cost.toLocaleString()}
                </Typography>
                <Typography variant="body2" textAlign="center" sx={{ opacity: 0.9 }}>
                  Estimated Annual Net Cost
                </Typography>
              </Paper>

              <List>
                <ListItem>
                  <ListItemText
                    primary="Total Cost of Attendance"
                    secondary={
                      <Typography variant="body2" component="span">
                        Tuition + Fees + Living Expenses
                      </Typography>
                    }
                  />
                  <Typography variant="h6" fontWeight={700}>
                    ${calculatedCost.total_cost.toLocaleString()}
                  </Typography>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Total Financial Aid"
                    secondary={
                      <Typography variant="body2" component="span">
                        Grants + Scholarships + Work Study + Loans
                      </Typography>
                    }
                  />
                  <Typography variant="h6" fontWeight={700} color="success.main">
                    -${calculatedCost.total_aid.toLocaleString()}
                  </Typography>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Net Cost (4 Years)"
                    secondary={
                      <Typography variant="body2" component="span">
                        Estimated total for 4 years
                      </Typography>
                    }
                  />
                  <Typography variant="h6" fontWeight={700} color="primary.main">
                    ${(calculatedCost.net_cost * 4).toLocaleString()}
                  </Typography>
                </ListItem>
              </List>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Cost Breakdown" avatar={<TrendingDownIcon />} />
            <CardContent>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Tuition</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    ${formData.tuition.toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Room & Board</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    ${formData.room_board.toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Books & Supplies</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    ${formData.books_supplies.toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Personal Expenses</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    ${formData.personal_expenses.toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Transportation</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    ${formData.transportation.toLocaleString()}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Aid Breakdown
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="success.main">
                    Grants & Scholarships
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="success.main">
                    ${formData.grants_scholarships.toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="success.main">
                    Work Study
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="success.main">
                    ${formData.work_study.toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="warning.main">
                    Student Loans
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="warning.main">
                    ${formData.loans.toLocaleString()}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Family Contribution</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    ${formData.family_contribution.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardHeader
              title="Saved Estimates"
              subheader="Compare costs across different colleges"
            />
            <CardContent>
              {estimates.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <MoneyIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary">
                    No saved estimates yet
                  </Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>College</TableCell>
                        <TableCell align="right">Total Cost</TableCell>
                        <TableCell align="right">Grants & Scholarships</TableCell>
                        <TableCell align="right">Loans</TableCell>
                        <TableCell align="right">Net Cost</TableCell>
                        <TableCell align="right">4-Year Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {estimates
                        .sort((a, b) => a.net_cost - b.net_cost)
                        .map((estimate) => (
                          <TableRow key={estimate.college_id}>
                            <TableCell>{estimate.college?.name || 'College'}</TableCell>
                            <TableCell align="right">
                              ${estimate.total_cost.toLocaleString()}
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" color="success.main">
                                ${estimate.grants_scholarships.toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" color="warning.main">
                                ${estimate.loans.toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={700}>
                                ${estimate.net_cost.toLocaleString()}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={700} color="primary.main">
                                ${(estimate.net_cost * 4).toLocaleString()}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
