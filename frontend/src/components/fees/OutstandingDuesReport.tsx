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
  TextField,
  MenuItem,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { feeApi } from '../../api/fees';
import { StudentOutstandingDues } from '../../types/fee';

const OutstandingDuesReport: React.FC = () => {
  const [gradeFilter, setGradeFilter] = React.useState<number | undefined>();

  const { data: duesData } = useQuery({
    queryKey: ['outstandingDues', gradeFilter],
    queryFn: () => feeApi.getOutstandingDues(gradeFilter),
  });

  const totalOutstanding =
    duesData?.reduce(
      (sum: number, item: StudentOutstandingDues) =>
        sum + parseFloat(String(item.outstanding_amount)),
      0
    ) || 0;
  const totalOverdue =
    duesData?.reduce(
      (sum: number, item: StudentOutstandingDues) => sum + parseFloat(String(item.overdue_amount)),
      0
    ) || 0;

  return (
    <Box>
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Outstanding
              </Typography>
              <Typography variant="h4">₹{totalOutstanding.toFixed(2)}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Overdue
              </Typography>
              <Typography variant="h4" color="error">
                ₹{totalOverdue.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Students with Dues
              </Typography>
              <Typography variant="h4">{duesData?.length || 0}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ mb: 3 }}>
        <TextField
          select
          label="Filter by Grade"
          value={gradeFilter || ''}
          onChange={(e) => setGradeFilter(e.target.value ? parseInt(e.target.value) : undefined)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">All Grades</MenuItem>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
            <MenuItem key={grade} value={grade}>
              Grade {grade}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student Name</TableCell>
              <TableCell>Grade</TableCell>
              <TableCell align="right">Total Fees</TableCell>
              <TableCell align="right">Amount Paid</TableCell>
              <TableCell align="right">Outstanding</TableCell>
              <TableCell align="right">Overdue</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {duesData?.map((student: StudentOutstandingDues) => (
              <TableRow key={student.student_id}>
                <TableCell>{student.student_name}</TableCell>
                <TableCell>{student.grade_name}</TableCell>
                <TableCell align="right">₹{parseFloat(student.total_fees).toFixed(2)}</TableCell>
                <TableCell align="right">₹{parseFloat(student.amount_paid).toFixed(2)}</TableCell>
                <TableCell align="right">
                  <Typography
                    color={student.outstanding_amount > 0 ? 'warning.main' : 'success.main'}
                  >
                    ₹{parseFloat(student.outstanding_amount).toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Typography color={student.overdue_amount > 0 ? 'error.main' : 'text.secondary'}>
                    ₹{parseFloat(student.overdue_amount).toFixed(2)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={
                      student.overdue_amount > 0
                        ? 'Overdue'
                        : student.outstanding_amount > 0
                          ? 'Pending'
                          : 'Paid'
                    }
                    color={
                      student.overdue_amount > 0
                        ? 'error'
                        : student.outstanding_amount > 0
                          ? 'warning'
                          : 'success'
                    }
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default OutstandingDuesReport;
