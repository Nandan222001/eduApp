import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import {
  AccessTime as TimeIcon,
  CloudUpload as UploadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Sync as SyncIcon,
} from '@mui/icons-material';

interface TimesheetEntry {
  id: string;
  date: string;
  hours: number;
  description: string;
}

interface TimesheetIntegrationProps {
  employmentId: number;
  currentHours?: number;
}

export default function TimesheetIntegration({ employmentId: _employmentId, currentHours = 0 }: TimesheetIntegrationProps) {
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    date: new Date().toISOString().split('T')[0],
    hours: 0,
    description: '',
  });

  const handleAddEntry = () => {
    const entry: TimesheetEntry = {
      id: Date.now().toString(),
      date: newEntry.date,
      hours: newEntry.hours,
      description: newEntry.description,
    };

    setEntries([...entries, entry]);
    setAddDialogOpen(false);
    setNewEntry({
      date: new Date().toISOString().split('T')[0],
      hours: 0,
      description: '',
    });
  };

  const handleDeleteEntry = (id: string) => {
    setEntries(entries.filter((e) => e.id !== id));
  };

  const getTotalHours = () => {
    return entries.reduce((sum, entry) => sum + entry.hours, 0);
  };

  const getCurrentWeekHours = () => {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    weekStart.setHours(0, 0, 0, 0);

    return entries
      .filter((entry) => new Date(entry.date) >= weekStart)
      .reduce((sum, entry) => sum + entry.hours, 0);
  };

  return (
    <Box>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6" fontWeight={600}>
              Hours Tracking
            </Typography>
            <Button variant="outlined" startIcon={<SyncIcon />} size="small">
              Sync with Timesheet App
            </Button>
          </Box>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    This Week
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {getCurrentWeekHours()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    hours
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Total Logged
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {getTotalHours()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    hours
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={4}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="body2" color="text.secondary">
                    Entries
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {entries.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    logged
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddDialogOpen(true)} fullWidth>
              Log Hours
            </Button>
            <Button variant="outlined" startIcon={<UploadIcon />} fullWidth>
              Import CSV
            </Button>
          </Box>

          {entries.length === 0 ? (
            <Alert severity="info">
              No hours logged yet. Click "Log Hours" to add your work hours.
            </Alert>
          ) : (
            <List>
              {entries.slice().reverse().map((entry) => (
                <ListItem
                  key={entry.id}
                  secondaryAction={
                    <IconButton edge="end" onClick={() => handleDeleteEntry(entry.id)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="body1" fontWeight={600}>
                          {entry.hours} hours
                        </Typography>
                        <Chip label={new Date(entry.date).toLocaleDateString()} size="small" />
                      </Box>
                    }
                    secondary={entry.description}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <Dialog open={addDialogOpen} onClose={() => setAddDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Log Work Hours</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={newEntry.date}
                onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Hours Worked"
                type="number"
                value={newEntry.hours}
                onChange={(e) => setNewEntry({ ...newEntry, hours: parseFloat(e.target.value) })}
                inputProps={{ step: 0.5, min: 0 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Description (Optional)"
                value={newEntry.description}
                onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                placeholder="What did you work on?"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setAddDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddEntry}>
            Log Hours
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
