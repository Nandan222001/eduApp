import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  IconButton,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { MoreVert, PersonAdd, AdminPanelSettings, Person } from '@mui/icons-material';
import { GroupMember, GroupMemberRole } from '../../types/studyGroup';
import { formatDistanceToNow } from 'date-fns';

interface MemberManagementProps {
  members: GroupMember[];
  currentUserRole: GroupMemberRole;
  currentUserId: number;
  onUpdateRole?: (memberId: number, role: GroupMemberRole) => void;
  onRemoveMember?: (memberId: number) => void;
  onInviteMember?: (email: string) => void;
}

const MemberManagement: React.FC<MemberManagementProps> = ({
  members,
  currentUserRole,
  currentUserId,
  onUpdateRole,
  onRemoveMember,
  onInviteMember,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedMember, setSelectedMember] = useState<GroupMember | null>(null);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const canManageMembers =
    currentUserRole === GroupMemberRole.OWNER || currentUserRole === GroupMemberRole.ADMIN;

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, member: GroupMember) => {
    setAnchorEl(event.currentTarget);
    setSelectedMember(member);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedMember(null);
  };

  const handlePromoteToAdmin = () => {
    if (selectedMember && onUpdateRole) {
      onUpdateRole(selectedMember.id, GroupMemberRole.ADMIN);
    }
    handleMenuClose();
  };

  const handleDemoteToMember = () => {
    if (selectedMember && onUpdateRole) {
      onUpdateRole(selectedMember.id, GroupMemberRole.MEMBER);
    }
    handleMenuClose();
  };

  const handleRemoveMember = () => {
    if (selectedMember && onRemoveMember) {
      onRemoveMember(selectedMember.id);
    }
    handleMenuClose();
  };

  const handleInvite = () => {
    if (inviteEmail && onInviteMember) {
      onInviteMember(inviteEmail);
      setInviteEmail('');
      setInviteDialogOpen(false);
    }
  };

  const getRoleIcon = (role: GroupMemberRole) => {
    switch (role) {
      case GroupMemberRole.OWNER:
        return <AdminPanelSettings fontSize="small" color="error" />;
      case GroupMemberRole.ADMIN:
        return <AdminPanelSettings fontSize="small" color="primary" />;
      default:
        return <Person fontSize="small" />;
    }
  };

  const getRoleColor = (role: GroupMemberRole) => {
    switch (role) {
      case GroupMemberRole.OWNER:
        return 'error';
      case GroupMemberRole.ADMIN:
        return 'primary';
      default:
        return 'default';
    }
  };

  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder = { owner: 0, admin: 1, member: 2 };
    return roleOrder[a.role] - roleOrder[b.role];
  });

  return (
    <Paper sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Members ({members.length})</Typography>
        {canManageMembers && onInviteMember && (
          <Button
            variant="outlined"
            startIcon={<PersonAdd />}
            onClick={() => setInviteDialogOpen(true)}
          >
            Invite
          </Button>
        )}
      </Box>

      <List>
        {sortedMembers.map((member) => (
          <ListItem key={member.id} divider>
            <ListItemAvatar>
              <Avatar src={member.user_avatar} alt={member.user_name}>
                {member.user_name?.[0]}
              </Avatar>
            </ListItemAvatar>

            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body1">
                    {member.user_name}
                    {member.user_id === currentUserId && ' (You)'}
                  </Typography>
                  <Chip
                    icon={getRoleIcon(member.role)}
                    label={member.role}
                    size="small"
                    color={getRoleColor(member.role)}
                  />
                </Box>
              }
              secondary={
                <>
                  {member.user_email && (
                    <Typography variant="caption" display="block">
                      {member.user_email}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary">
                    Joined {formatDistanceToNow(new Date(member.joined_at), { addSuffix: true })}
                  </Typography>
                  {member.last_active_at && (
                    <Typography variant="caption" color="text.secondary" display="block">
                      Last active{' '}
                      {formatDistanceToNow(new Date(member.last_active_at), { addSuffix: true })}
                    </Typography>
                  )}
                </>
              }
            />

            {canManageMembers &&
              member.user_id !== currentUserId &&
              member.role !== GroupMemberRole.OWNER && (
                <ListItemSecondaryAction>
                  <IconButton onClick={(e) => handleMenuOpen(e, member)}>
                    <MoreVert />
                  </IconButton>
                </ListItemSecondaryAction>
              )}
          </ListItem>
        ))}
      </List>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {selectedMember && selectedMember.role === GroupMemberRole.MEMBER && onUpdateRole && (
          <MenuItem onClick={handlePromoteToAdmin}>
            <AdminPanelSettings fontSize="small" sx={{ mr: 1 }} />
            Promote to Admin
          </MenuItem>
        )}
        {selectedMember &&
          selectedMember.role === GroupMemberRole.ADMIN &&
          onUpdateRole &&
          currentUserRole === GroupMemberRole.OWNER && (
            <MenuItem onClick={handleDemoteToMember}>
              <Person fontSize="small" sx={{ mr: 1 }} />
              Demote to Member
            </MenuItem>
          )}
        {onRemoveMember && (
          <MenuItem onClick={handleRemoveMember} sx={{ color: 'error.main' }}>
            Remove from Group
          </MenuItem>
        )}
      </Menu>

      <Dialog
        open={inviteDialogOpen}
        onClose={() => setInviteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Invite Member</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Email Address"
            type="email"
            fullWidth
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            margin="normal"
            placeholder="Enter member's email address"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInviteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleInvite} variant="contained" disabled={!inviteEmail}>
            Send Invite
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default MemberManagement;
