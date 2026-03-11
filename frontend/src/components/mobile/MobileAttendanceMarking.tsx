import {
  Box,
  Avatar,
  Typography,
  IconButton,
  Card,
  CardContent,
  Stack,
  useTheme,
  alpha,
  Badge,
} from '@mui/material';
import {
  CheckCircle as PresentIcon,
  Cancel as AbsentIcon,
  AccessTime as LateIcon,
  WatchLater as HalfDayIcon,
} from '@mui/icons-material';
import { AttendanceStatus, ClassRosterStudent } from '@/api/attendance';

interface MobileAttendanceMarkingProps {
  students: ClassRosterStudent[];
  onStatusChange: (studentId: number, status: AttendanceStatus) => void;
}

export default function MobileAttendanceMarking({
  students,
  onStatusChange,
}: MobileAttendanceMarkingProps) {
  const theme = useTheme();

  const getStatusIcon = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return <PresentIcon sx={{ fontSize: 20, color: theme.palette.success.main }} />;
      case AttendanceStatus.ABSENT:
        return <AbsentIcon sx={{ fontSize: 20, color: theme.palette.error.main }} />;
      case AttendanceStatus.LATE:
        return <LateIcon sx={{ fontSize: 20, color: theme.palette.warning.main }} />;
      case AttendanceStatus.HALF_DAY:
        return <HalfDayIcon sx={{ fontSize: 20, color: theme.palette.info.main }} />;
    }
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return theme.palette.success.main;
      case AttendanceStatus.ABSENT:
        return theme.palette.error.main;
      case AttendanceStatus.LATE:
        return theme.palette.warning.main;
      case AttendanceStatus.HALF_DAY:
        return theme.palette.info.main;
    }
  };

  const renderStatusButton = (
    student: ClassRosterStudent,
    status: AttendanceStatus,
    icon: React.ReactNode
  ) => {
    const isActive = student.status === status;
    const color = getStatusColor(status);

    return (
      <IconButton
        onClick={() => onStatusChange(student.id, status)}
        sx={{
          minWidth: 60,
          minHeight: 60,
          borderRadius: 2,
          bgcolor: isActive ? alpha(color, 0.15) : 'background.paper',
          border: `2px solid ${isActive ? color : theme.palette.divider}`,
          transition: 'all 0.2s ease',
          '&:active': {
            transform: 'scale(0.95)',
          },
          '&:hover': {
            bgcolor: isActive ? alpha(color, 0.25) : theme.palette.action.hover,
          },
        }}
      >
        {icon}
      </IconButton>
    );
  };

  return (
    <Stack spacing={2}>
      {students.map((student) => (
        <Card
          key={student.id}
          elevation={2}
          sx={{
            borderRadius: 3,
            border: `2px solid ${alpha(getStatusColor(student.status), 0.2)}`,
            bgcolor: alpha(getStatusColor(student.status), 0.03),
            touchAction: 'manipulation',
          }}
        >
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Badge
                badgeContent={getStatusIcon(student.status)}
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              >
                <Avatar
                  src={student.photo_url}
                  alt={`${student.first_name} ${student.last_name}`}
                  sx={{
                    width: 56,
                    height: 56,
                    mr: 2,
                    border: `3px solid ${getStatusColor(student.status)}`,
                  }}
                >
                  {student.first_name.charAt(0)}
                </Avatar>
              </Badge>

              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                  {student.first_name} {student.last_name}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {student.admission_number && `Adm: ${student.admission_number}`}
                  {student.roll_number && ` • Roll: ${student.roll_number}`}
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 1,
              }}
            >
              {renderStatusButton(
                student,
                AttendanceStatus.PRESENT,
                <PresentIcon sx={{ color: theme.palette.success.main }} />
              )}
              {renderStatusButton(
                student,
                AttendanceStatus.ABSENT,
                <AbsentIcon sx={{ color: theme.palette.error.main }} />
              )}
              {renderStatusButton(
                student,
                AttendanceStatus.LATE,
                <LateIcon sx={{ color: theme.palette.warning.main }} />
              )}
              {renderStatusButton(
                student,
                AttendanceStatus.HALF_DAY,
                <HalfDayIcon sx={{ color: theme.palette.info.main }} />
              )}
            </Box>
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
