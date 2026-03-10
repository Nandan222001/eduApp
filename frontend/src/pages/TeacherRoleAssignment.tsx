import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Card,
  CardContent,
  List,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  useTheme,
  alpha,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Security as SecurityIcon,
  AdminPanelSettings as AdminIcon,
} from '@mui/icons-material';

interface Role {
  id: number;
  name: string;
  description: string;
  permissions: string[];
}

interface AssignedRole {
  id: number;
  role_id: number;
  role_name: string;
  assigned_date: string;
  expires_date?: string;
}

const availableRoles: Role[] = [
  {
    id: 1,
    name: 'Teacher',
    description: 'Standard teaching role with access to classes and assignments',
    permissions: ['view_students', 'grade_assignments', 'manage_classes', 'view_attendance'],
  },
  {
    id: 2,
    name: 'Department Head',
    description: 'Head of department with additional administrative privileges',
    permissions: [
      'view_students',
      'grade_assignments',
      'manage_classes',
      'view_attendance',
      'manage_teachers',
      'approve_curriculum',
    ],
  },
  {
    id: 3,
    name: 'Class Coordinator',
    description: 'Coordinates activities for specific classes',
    permissions: [
      'view_students',
      'grade_assignments',
      'manage_classes',
      'view_attendance',
      'coordinate_events',
    ],
  },
  {
    id: 4,
    name: 'Exam Coordinator',
    description: 'Manages examination schedules and results',
    permissions: ['view_students', 'manage_exams', 'publish_results', 'generate_reports'],
  },
];

export default function TeacherRoleAssignment() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [loading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [assignedRoles, setAssignedRoles] = useState<AssignedRole[]>([
    {
      id: 1,
      role_id: 1,
      role_name: 'Teacher',
      assigned_date: '2024-01-01',
    },
  ]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<number | ''>('');
  const [expiryDate, setExpiryDate] = useState<string>('');

  const handleAssignRole = () => {
    if (!selectedRoleId) return;

    const role = availableRoles.find((r) => r.id === selectedRoleId);
    if (!role) return;

    const newAssignment: AssignedRole = {
      id: Date.now(),
      role_id: role.id,
      role_name: role.name,
      assigned_date: new Date().toISOString().split('T')[0],
      expires_date: expiryDate || undefined,
    };

    setAssignedRoles([...assignedRoles, newAssignment]);
    setSuccess(`Role "${role.name}" assigned successfully`);
    setDialogOpen(false);
    setSelectedRoleId('');
    setExpiryDate('');
  };

  const handleRemoveRole = (roleId: number) => {
    const role = assignedRoles.find((r) => r.id === roleId);
    setAssignedRoles(assignedRoles.filter((r) => r.id !== roleId));
    setSuccess(`Role "${role?.role_name}" removed successfully`);
  };

  const getSelectedRole = () => {
    return availableRoles.find((r) => r.id === selectedRoleId);
  };

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton onClick={() => navigate(`/admin/users/teachers/${id}`)}>
            <ArrowBackIcon />
          </IconButton>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Role Assignment
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage teacher roles and permissions
            </Typography>
          </Box>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          Assign Role
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: 3, border: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <SecurityIcon color="primary" />
          <Typography variant="h6" fontWeight={600}>
            Assigned Roles
          </Typography>
        </Box>

        {assignedRoles.length === 0 ? (
          <Box
            sx={{
              textAlign: 'center',
              py: 6,
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              borderRadius: 1,
            }}
          >
            <AdminIcon sx={{ fontSize: 64, color: theme.palette.text.secondary, mb: 2 }} />
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No roles assigned yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click &quot;Assign Role&quot; to add a role to this teacher
            </Typography>
          </Box>
        ) : (
          <List>
            {assignedRoles.map((role) => (
              <Card
                key={role.id}
                elevation={0}
                sx={{
                  mb: 2,
                  border: `1px solid ${theme.palette.divider}`,
                }}
              >
                <CardContent>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}
                  >
                    <Box sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h6" fontWeight={600}>
                          {role.role_name}
                        </Typography>
                        <Chip label="Active" size="small" color="success" />
                      </Box>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {availableRoles.find((r) => r.id === role.role_id)?.description}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                        <Typography variant="caption" color="text.secondary">
                          Assigned: {new Date(role.assigned_date).toLocaleDateString()}
                        </Typography>
                        {role.expires_date && (
                          <Typography variant="caption" color="text.secondary">
                            Expires: {new Date(role.expires_date).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                      <Divider sx={{ my: 2 }} />
                      <Box>
                        <Typography variant="subtitle2" gutterBottom>
                          Permissions:
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {availableRoles
                            .find((r) => r.id === role.role_id)
                            ?.permissions.map((permission) => (
                              <Chip
                                key={permission}
                                label={permission.replace(/_/g, ' ')}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                        </Box>
                      </Box>
                    </Box>
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveRole(role.id)}
                      sx={{ ml: 2 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </List>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Role</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Select Role</InputLabel>
              <Select
                value={selectedRoleId}
                onChange={(e) => setSelectedRoleId(e.target.value as number)}
                label="Select Role"
              >
                {availableRoles
                  .filter((role) => !assignedRoles.find((ar) => ar.role_id === role.id))
                  .map((role) => (
                    <MenuItem key={role.id} value={role.id}>
                      {role.name}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            {selectedRoleId && (
              <Card
                elevation={0}
                sx={{
                  mb: 3,
                  p: 2,
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }}
              >
                <Typography variant="subtitle2" gutterBottom>
                  {getSelectedRole()?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  {getSelectedRole()?.description}
                </Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  Permissions:
                </Typography>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {getSelectedRole()?.permissions.map((permission) => (
                    <Chip
                      key={permission}
                      label={permission.replace(/_/g, ' ')}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Card>
            )}

            <TextField
              label="Expiry Date (Optional)"
              type="date"
              fullWidth
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              helperText="Leave empty for no expiration"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAssignRole}
            disabled={!selectedRoleId || loading}
          >
            Assign Role
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
