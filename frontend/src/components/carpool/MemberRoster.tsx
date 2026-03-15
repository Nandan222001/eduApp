import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Divider,
} from '@mui/material';
import {
  Add,
  AdminPanelSettings,
  Phone,
  Email,
  Verified,
  DirectionsCar,
  MoreVert,
  Cancel,
} from '@mui/icons-material';
import { CarpoolMember } from '@/types/carpool';

interface MemberRosterProps {
  groupId: number;
}

const mockMembers: CarpoolMember[] = [
  {
    id: 1,
    user_id: 101,
    parent_name: 'Sarah Johnson',
    parent_photo_url: undefined,
    parent_phone: '(555) 123-4567',
    parent_email: 'sarah.j@email.com',
    children: [
      { id: 201, name: 'Emma Johnson', grade: 'Grade 3', age: 8 },
      { id: 202, name: 'Liam Johnson', grade: 'Grade 5', age: 10 },
    ],
    role: 'admin',
    joined_at: '2024-01-15',
    available_seats: 2,
    emergency_contact: {
      name: 'John Johnson',
      phone: '(555) 123-4568',
      relationship: 'Spouse',
    },
    verification_status: {
      driver_license_verified: true,
      background_check_verified: true,
      vehicle_insurance_verified: true,
    },
    preferences: {
      willing_to_drive: true,
      max_passengers: 4,
      pet_friendly: true,
    },
  },
  {
    id: 2,
    user_id: 102,
    parent_name: 'Michael Chen',
    parent_phone: '(555) 234-5678',
    parent_email: 'michael.c@email.com',
    children: [{ id: 203, name: 'Sophie Chen', grade: 'Grade 4', age: 9 }],
    role: 'member',
    joined_at: '2024-01-20',
    available_seats: 3,
    emergency_contact: {
      name: 'Lisa Chen',
      phone: '(555) 234-5679',
      relationship: 'Spouse',
    },
    verification_status: {
      driver_license_verified: true,
      background_check_verified: true,
      vehicle_insurance_verified: true,
    },
    preferences: {
      willing_to_drive: true,
      max_passengers: 5,
      pet_friendly: false,
    },
  },
];

const MemberRoster: React.FC<MemberRosterProps> = () => {
  const [members] = useState<CarpoolMember[]>(mockMembers);
  const [selectedMember, setSelectedMember] = useState<CarpoolMember | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const handleViewDetails = (member: CarpoolMember) => {
    setSelectedMember(member);
    setDetailsOpen(true);
  };

  const isFullyVerified = (member: CarpoolMember) => {
    return (
      member.verification_status.driver_license_verified &&
      member.verification_status.background_check_verified &&
      member.verification_status.vehicle_insurance_verified
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle1">Group Members</Typography>
        <Button
          variant="outlined"
          startIcon={<Add />}
          onClick={() => setInviteDialogOpen(true)}
          size="small"
        >
          Invite Member
        </Button>
      </Box>

      <List>
        {members.map((member) => (
          <Paper key={member.id} sx={{ mb: 1 }}>
            <ListItem>
              <ListItemAvatar>
                <Avatar sx={{ width: 48, height: 48 }}>{member.parent_name.charAt(0)}</Avatar>
              </ListItemAvatar>

              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2">{member.parent_name}</Typography>
                    {member.role === 'admin' && (
                      <Chip
                        icon={<AdminPanelSettings />}
                        label="Admin"
                        size="small"
                        color="primary"
                      />
                    )}
                    {isFullyVerified(member) && <Verified color="success" fontSize="small" />}
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                      <Phone fontSize="small" sx={{ fontSize: 14 }} />
                      <Typography variant="caption">{member.parent_phone}</Typography>
                      <Typography variant="caption" sx={{ mx: 1 }}>
                        •
                      </Typography>
                      <Email fontSize="small" sx={{ fontSize: 14 }} />
                      <Typography variant="caption">{member.parent_email}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                      {member.children.map((child) => (
                        <Chip
                          key={child.id}
                          label={`${child.name} (${child.grade})`}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>

                    {member.preferences.willing_to_drive && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                        <DirectionsCar fontSize="small" color="action" sx={{ fontSize: 14 }} />
                        <Typography variant="caption" color="text.secondary">
                          {member.available_seats} seats available
                        </Typography>
                      </Box>
                    )}
                  </Box>
                }
              />

              <IconButton edge="end" onClick={() => handleViewDetails(member)}>
                <MoreVert />
              </IconButton>
            </ListItem>
          </Paper>
        ))}
      </List>

      <Dialog open={detailsOpen} onClose={() => setDetailsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Member Details</DialogTitle>
        <DialogContent>
          {selectedMember && (
            <Box>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 1 }}>
                  {selectedMember.parent_name.charAt(0)}
                </Avatar>
                <Typography variant="h6">{selectedMember.parent_name}</Typography>
                {selectedMember.role === 'admin' && (
                  <Chip label="Group Admin" color="primary" size="small" sx={{ mt: 1 }} />
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Contact Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Phone: {selectedMember.parent_phone}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Email: {selectedMember.parent_email}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Children
                  </Typography>
                  {selectedMember.children.map((child) => (
                    <Box key={child.id} sx={{ mb: 1 }}>
                      <Typography variant="body2">
                        {child.name} - {child.grade} (Age {child.age})
                      </Typography>
                    </Box>
                  ))}
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Emergency Contact
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedMember.emergency_contact.name} (
                    {selectedMember.emergency_contact.relationship})
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {selectedMember.emergency_contact.phone}
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Verification Status
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {selectedMember.verification_status.driver_license_verified ? (
                        <Verified color="success" fontSize="small" />
                      ) : (
                        <Cancel color="error" fontSize="small" />
                      )}
                      <Typography variant="body2">Driver License</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {selectedMember.verification_status.background_check_verified ? (
                        <Verified color="success" fontSize="small" />
                      ) : (
                        <Cancel color="error" fontSize="small" />
                      )}
                      <Typography variant="body2">Background Check</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {selectedMember.verification_status.vehicle_insurance_verified ? (
                        <Verified color="success" fontSize="small" />
                      ) : (
                        <Cancel color="error" fontSize="small" />
                      )}
                      <Typography variant="body2">Vehicle Insurance</Typography>
                    </Box>
                  </Box>
                </Grid>

                {selectedMember.preferences.willing_to_drive && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      Driving Preferences
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Maximum Passengers: {selectedMember.preferences.max_passengers}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Pet Friendly: {selectedMember.preferences.pet_friendly ? 'Yes' : 'No'}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Invite Member to Group</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Send an invitation link to other parents to join your carpool group.
          </Typography>
          <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
            <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
              Invitation Link
            </Typography>
            <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
              https://app.school.com/carpool/invite/abc123xyz
            </Typography>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>Close</Button>
          <Button variant="contained">Copy Link</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MemberRoster;
