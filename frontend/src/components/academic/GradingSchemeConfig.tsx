import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Typography,
  Paper,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Grade as GradeIcon,
} from '@mui/icons-material';

interface GradeConfiguration {
  id: number;
  name: string;
  grade: string;
  min_percentage: number;
  max_percentage: number;
  grade_point: number;
  description?: string;
  is_passing: boolean;
  is_active: boolean;
}

export default function GradingSchemeConfig() {
  const [configurations] = useState<GradeConfiguration[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedConfig, setSelectedConfig] = useState<GradeConfiguration | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    min_percentage: '',
    max_percentage: '',
    grade_point: '',
    description: '',
    is_passing: true,
  });

  const handleOpenDialog = (config?: GradeConfiguration) => {
    if (config) {
      setFormData({
        name: config.name,
        grade: config.grade,
        min_percentage: config.min_percentage.toString(),
        max_percentage: config.max_percentage.toString(),
        grade_point: config.grade_point.toString(),
        description: config.description || '',
        is_passing: config.is_passing,
      });
      setSelectedConfig(config);
    } else {
      setFormData({
        name: '',
        grade: '',
        min_percentage: '',
        max_percentage: '',
        grade_point: '',
        description: '',
        is_passing: true,
      });
      setSelectedConfig(null);
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    setDialogOpen(false);
  };

  const getGradeColor = (grade: string) => {
    const colors: Record<string, string> = {
      'A+': 'success',
      A: 'success',
      'B+': 'primary',
      B: 'primary',
      'C+': 'warning',
      C: 'warning',
      D: 'error',
      F: 'error',
    };
    return colors[grade] || 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h6">Grading Scheme Configuration</Typography>
          <Typography variant="body2" color="text.secondary">
            Configure custom grade boundaries and grading scales
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add Grade Configuration
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Grade</strong>
              </TableCell>
              <TableCell>
                <strong>Name</strong>
              </TableCell>
              <TableCell>
                <strong>Percentage Range</strong>
              </TableCell>
              <TableCell>
                <strong>Grade Point</strong>
              </TableCell>
              <TableCell>
                <strong>Status</strong>
              </TableCell>
              <TableCell align="right">
                <strong>Actions</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {configurations.map((config) => (
              <TableRow key={config.id} hover>
                <TableCell>
                  <Chip
                    label={config.grade}
                    color={
                      getGradeColor(config.grade) as
                        | 'default'
                        | 'primary'
                        | 'success'
                        | 'error'
                        | 'warning'
                    }
                    size="small"
                  />
                </TableCell>
                <TableCell>{config.name}</TableCell>
                <TableCell>
                  {config.min_percentage}% - {config.max_percentage}%
                </TableCell>
                <TableCell>{config.grade_point}</TableCell>
                <TableCell>
                  <Box>
                    {config.is_passing ? (
                      <Chip label="Passing" color="success" size="small" sx={{ mr: 0.5 }} />
                    ) : (
                      <Chip label="Failing" color="error" size="small" sx={{ mr: 0.5 }} />
                    )}
                    {config.is_active && <Chip label="Active" color="primary" size="small" />}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleOpenDialog(config)} sx={{ mr: 1 }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {configurations.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                  <GradeIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    No grading scheme configured
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Click &apos;Add Grade Configuration&apos; to create grading boundaries
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Paper sx={{ p: 3, mt: 3, bgcolor: 'info.light' }}>
        <Typography variant="subtitle2" gutterBottom>
          Grading Scale Example
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Create grade configurations that define how percentage scores are converted to letter
          grades and grade points. Ensure that percentage ranges don&apos;t overlap and cover the
          entire 0-100% range.
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {[
            'A+: 90-100%',
            'A: 80-89%',
            'B+: 70-79%',
            'B: 60-69%',
            'C+: 50-59%',
            'C: 40-49%',
            'F: 0-39%',
          ].map((example) => (
            <Chip key={example} label={example} size="small" />
          ))}
        </Box>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedConfig ? 'Edit Grade Configuration' : 'Add Grade Configuration'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Grade"
                  value={formData.grade}
                  onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                  placeholder="e.g., A+, B, C"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Excellent"
                />
              </Grid>
            </Grid>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Min Percentage"
                  type="number"
                  value={formData.min_percentage}
                  onChange={(e) => setFormData({ ...formData, min_percentage: e.target.value })}
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Max Percentage"
                  type="number"
                  value={formData.max_percentage}
                  onChange={(e) => setFormData({ ...formData, max_percentage: e.target.value })}
                  inputProps={{ min: 0, max: 100, step: 0.01 }}
                />
              </Grid>
            </Grid>
            <TextField
              fullWidth
              label="Grade Point"
              type="number"
              value={formData.grade_point}
              onChange={(e) => setFormData({ ...formData, grade_point: e.target.value })}
              inputProps={{ min: 0, step: 0.01 }}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              multiline
              rows={2}
              sx={{ mb: 2 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.is_passing}
                  onChange={(e) => setFormData({ ...formData, is_passing: e.target.checked })}
                />
              }
              label="Passing Grade"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
