import React from 'react';
import {
  Box,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemText,
  Paper,
  Chip,
  Divider,
} from '@mui/material';
import {
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { timetableApi } from '../../api/timetable';
import { TimetableEntryWithDetails } from '../../types/timetable';

interface ConflictDetectionProps {
  timetableId: number | null;
}

const ConflictDetection: React.FC<ConflictDetectionProps> = ({ timetableId }) => {
  const { data: entriesData } = useQuery({
    queryKey: ['timetableEntries', timetableId],
    queryFn: () =>
      timetableId ? timetableApi.getTimetableEntries(timetableId) : Promise.resolve([]),
    enabled: !!timetableId,
  });

  const detectConflicts = () => {
    if (!entriesData) return [];

    interface ConflictItem {
      type: string;
      severity: string;
      message: string;
      entries: TimetableEntryWithDetails[];
    }
    const conflicts: ConflictItem[] = [];
    const teacherSchedule: { [key: string]: TimetableEntryWithDetails[] } = {};
    const roomSchedule: { [key: string]: TimetableEntryWithDetails[] } = {};

    entriesData.forEach((entry: TimetableEntryWithDetails) => {
      const timeSlotKey = `${entry.day_of_week}-${entry.period_number}`;

      if (entry.teacher_id) {
        const teacherKey = `${entry.teacher_id}-${timeSlotKey}`;
        if (!teacherSchedule[teacherKey]) {
          teacherSchedule[teacherKey] = [];
        }
        teacherSchedule[teacherKey].push(entry);

        if (teacherSchedule[teacherKey].length > 1) {
          conflicts.push({
            type: 'teacher',
            severity: 'error',
            message: `Teacher ${entry.teacher_name} has multiple classes at ${entry.day_of_week} Period ${entry.period_number}`,
            entries: teacherSchedule[teacherKey],
          });
        }
      }

      if (entry.room_number) {
        const roomKey = `${entry.room_number}-${timeSlotKey}`;
        if (!roomSchedule[roomKey]) {
          roomSchedule[roomKey] = [];
        }
        roomSchedule[roomKey].push(entry);

        if (roomSchedule[roomKey].length > 1) {
          conflicts.push({
            type: 'room',
            severity: 'warning',
            message: `Room ${entry.room_number} is double-booked at ${entry.day_of_week} Period ${entry.period_number}`,
            entries: roomSchedule[roomKey],
          });
        }
      }
    });

    const teacherWorkload: { [key: number]: number } = {};
    entriesData.forEach((entry: TimetableEntryWithDetails) => {
      if (entry.teacher_id && entry.period_type === 'lecture') {
        teacherWorkload[entry.teacher_id] = (teacherWorkload[entry.teacher_id] || 0) + 1;
      }
    });

    Object.entries(teacherWorkload).forEach(([teacherId, count]) => {
      if (count > 30) {
        const teacherName = entriesData.find(
          (e: TimetableEntryWithDetails) => e.teacher_id === parseInt(teacherId)
        )?.teacher_name;
        conflicts.push({
          type: 'workload',
          severity: 'warning',
          message: `Teacher ${teacherName} has ${count} periods per week (recommended max: 30)`,
          entries: [],
        });
      }
    });

    return conflicts;
  };

  const conflicts = detectConflicts();
  const errorConflicts = conflicts.filter((c) => c.severity === 'error');
  const warningConflicts = conflicts.filter((c) => c.severity === 'warning');

  if (!timetableId) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Conflict Detection
        </Typography>
        <Alert severity="info">Select a timetable to detect conflicts</Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>
        Conflict Detection
      </Typography>

      {conflicts.length === 0 ? (
        <Alert severity="success" icon={<CheckIcon />}>
          No conflicts detected! The timetable looks good.
        </Alert>
      ) : (
        <>
          <Box sx={{ mb: 2 }}>
            <Chip
              label={`${errorConflicts.length} Errors`}
              color="error"
              size="small"
              sx={{ mr: 1 }}
            />
            <Chip label={`${warningConflicts.length} Warnings`} color="warning" size="small" />
          </Box>

          <Divider sx={{ my: 2 }} />

          {errorConflicts.length > 0 && (
            <>
              <Typography
                variant="subtitle2"
                color="error"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <ErrorIcon fontSize="small" /> Critical Issues
              </Typography>
              <List dense>
                {errorConflicts.map((conflict, index) => (
                  <ListItem
                    key={`error-${index}`}
                    sx={{ bgcolor: 'error.lighter', mb: 1, borderRadius: 1 }}
                  >
                    <ListItemText
                      primary={conflict.message}
                      secondary={
                        conflict.entries.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            {conflict.entries.map((entry: TimetableEntryWithDetails, i: number) => (
                              <Chip
                                key={i}
                                label={entry.subject_name}
                                size="small"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ))}
                          </Box>
                        )
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}

          {warningConflicts.length > 0 && (
            <>
              <Typography
                variant="subtitle2"
                color="warning.dark"
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}
              >
                <WarningIcon fontSize="small" /> Warnings
              </Typography>
              <List dense>
                {warningConflicts.map((conflict, index) => (
                  <ListItem
                    key={`warning-${index}`}
                    sx={{ bgcolor: 'warning.lighter', mb: 1, borderRadius: 1 }}
                  >
                    <ListItemText
                      primary={conflict.message}
                      secondary={
                        conflict.entries.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            {conflict.entries.map((entry: TimetableEntryWithDetails, i: number) => (
                              <Chip
                                key={i}
                                label={entry.subject_name}
                                size="small"
                                sx={{ mr: 0.5, mb: 0.5 }}
                              />
                            ))}
                          </Box>
                        )
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </>
          )}
        </>
      )}

      <Divider sx={{ my: 2 }} />

      <Typography variant="subtitle2" gutterBottom>
        Statistics
      </Typography>
      <Box sx={{ mt: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Total Entries: {entriesData?.length || 0}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Unique Teachers:{' '}
          {
            new Set(
              entriesData?.map((e: TimetableEntryWithDetails) => e.teacher_id).filter(Boolean)
            ).size
          }
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Unique Rooms:{' '}
          {
            new Set(
              entriesData?.map((e: TimetableEntryWithDetails) => e.room_number).filter(Boolean)
            ).size
          }
        </Typography>
      </Box>
    </Paper>
  );
};

export default ConflictDetection;
