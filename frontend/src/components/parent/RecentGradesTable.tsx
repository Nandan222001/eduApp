import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  Alert,
} from '@mui/material';
import { format, parseISO } from 'date-fns';
import type { RecentGrade } from '@/types/parent';

interface RecentGradesTableProps {
  grades: RecentGrade[];
}

export const RecentGradesTable: React.FC<RecentGradesTableProps> = ({ grades }) => {
  const getGradeColor = (grade?: string) => {
    if (!grade) return 'default';
    if (['A+', 'A'].includes(grade)) return 'success';
    if (['B+', 'B'].includes(grade)) return 'primary';
    if (['C+', 'C'].includes(grade)) return 'warning';
    return 'error';
  };

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return 'success.main';
    if (percentage >= 75) return 'primary.main';
    if (percentage >= 60) return 'warning.main';
    return 'error.main';
  };

  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Recent Grades
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Subject-wise scores from recent exams
        </Typography>

        {grades.length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No grades available yet
          </Alert>
        ) : (
          <TableContainer sx={{ mt: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>Subject</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Exam</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Score</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>%</strong>
                  </TableCell>
                  <TableCell align="center">
                    <strong>Grade</strong>
                  </TableCell>
                  <TableCell>
                    <strong>Date</strong>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {grades.map((grade, index) => (
                  <TableRow key={index} hover>
                    <TableCell>{grade.subject_name}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2">{grade.exam_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {grade.exam_type}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      {grade.marks_obtained.toFixed(1)} / {grade.total_marks.toFixed(1)}
                    </TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="body2"
                        fontWeight="bold"
                        color={getPercentageColor(grade.percentage)}
                      >
                        {grade.percentage.toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      {grade.grade && (
                        <Chip label={grade.grade} color={getGradeColor(grade.grade)} size="small" />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(parseISO(grade.exam_date), 'MMM d, yyyy')}
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
  );
};
