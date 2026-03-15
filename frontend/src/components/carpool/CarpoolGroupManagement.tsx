import React, { useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Avatar,
  AvatarGroup,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import { Add, Edit, Delete, CalendarMonth, Chat, LocationOn, Contacts } from '@mui/icons-material';
import { CarpoolGroup } from '@/types/carpool';
import RotationScheduleCalendar from './RotationScheduleCalendar';
import GroupChatPanel from './GroupChatPanel';
import PickupPointManager from './PickupPointManager';
import MemberRoster from './MemberRoster';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 2 }}>{children}</Box>}
    </div>
  );
};

const mockGroups: CarpoolGroup[] = [
  {
    id: 1,
    name: 'Oakwood Elementary Morning Crew',
    description: 'Morning carpool for grades 3-5',
    created_by: 1,
    created_at: '2024-01-15',
    member_count: 4,
    active_members: [],
    rotation_schedule: [],
    pickup_points: [],
    group_settings: {
      max_members: 6,
      auto_rotate: true,
      notification_enabled: true,
      allow_guests: false,
    },
    statistics: {
      total_rides: 156,
      total_distance: 2340,
      co2_saved: 423,
      cost_saved: 1250,
    },
  },
];

const CarpoolGroupManagement: React.FC = () => {
  const [groups] = useState<CarpoolGroup[]>(mockGroups);
  const [selectedGroup, setSelectedGroup] = useState<CarpoolGroup | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [currentTab, setCurrentTab] = useState(0);

  const handleCreateGroup = () => {
    setCreateDialogOpen(false);
    setNewGroupName('');
    setNewGroupDescription('');
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6">My Carpool Groups</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialogOpen(true)}>
          Create Group
        </Button>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Your Groups
            </Typography>
            <List>
              {groups.map((group) => (
                <ListItem
                  key={group.id}
                  button
                  selected={selectedGroup?.id === group.id}
                  onClick={() => setSelectedGroup(group)}
                  sx={{
                    borderRadius: 1,
                    mb: 1,
                    '&.Mui-selected': {
                      bgcolor: 'primary.light',
                      color: 'primary.contrastText',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <AvatarGroup max={3}>
                      <Avatar sx={{ width: 32, height: 32 }}>S</Avatar>
                      <Avatar sx={{ width: 32, height: 32 }}>M</Avatar>
                      <Avatar sx={{ width: 32, height: 32 }}>J</Avatar>
                    </AvatarGroup>
                  </ListItemAvatar>
                  <ListItemText primary={group.name} secondary={`${group.member_count} members`} />
                </ListItem>
              ))}
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          {selectedGroup ? (
            <Paper>
              <Box sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {selectedGroup.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedGroup.description}
                    </Typography>
                  </Box>
                  <Box>
                    <IconButton size="small">
                      <Edit />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <Delete />
                    </IconButton>
                  </Box>
                </Box>

                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid item xs={6} sm={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                        <Typography variant="h5" color="primary">
                          {selectedGroup.statistics.total_rides}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Total Rides
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                        <Typography variant="h5" color="success.main">
                          ${selectedGroup.statistics.cost_saved}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Cost Saved
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                        <Typography variant="h5" color="info.main">
                          {selectedGroup.statistics.co2_saved}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          kg CO₂ Saved
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card variant="outlined">
                      <CardContent sx={{ textAlign: 'center', py: 1.5 }}>
                        <Typography variant="h5" color="warning.main">
                          {selectedGroup.member_count}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Members
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                <Divider />

                <Tabs value={currentTab} onChange={(_, val) => setCurrentTab(val)}>
                  <Tab icon={<Contacts />} label="Members" iconPosition="start" />
                  <Tab icon={<CalendarMonth />} label="Schedule" iconPosition="start" />
                  <Tab icon={<LocationOn />} label="Pickup Points" iconPosition="start" />
                  <Tab icon={<Chat />} label="Group Chat" iconPosition="start" />
                </Tabs>

                <TabPanel value={currentTab} index={0}>
                  <MemberRoster groupId={selectedGroup.id} />
                </TabPanel>

                <TabPanel value={currentTab} index={1}>
                  <RotationScheduleCalendar groupId={selectedGroup.id} />
                </TabPanel>

                <TabPanel value={currentTab} index={2}>
                  <PickupPointManager groupId={selectedGroup.id} />
                </TabPanel>

                <TabPanel value={currentTab} index={3}>
                  <GroupChatPanel groupId={selectedGroup.id} />
                </TabPanel>
              </Box>
            </Paper>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body1" color="text.secondary">
                Select a group to view details
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>

      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Carpool Group</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Group Name"
            fullWidth
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={newGroupDescription}
            onChange={(e) => setNewGroupDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateGroup} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CarpoolGroupManagement;
