import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Stack,
  Chip,
  Avatar,
  IconButton,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Checkbox,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Close as CloseIcon,
  Groups as TeamIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { olympicsAPI, Team } from '@/api/olympics';

interface TeamFormationProps {
  competitionId: number;
  teamSize: number;
  currentTeam?: Team;
  onTeamCreated: (team: Team) => void;
  onTeamJoined: (team: Team) => void;
}

interface AvailableStudent {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  grade: string;
  section: string;
}

const mockStudents: AvailableStudent[] = [
  { id: 2, username: 'john_doe', first_name: 'John', last_name: 'Doe', grade: '10', section: 'A' },
  {
    id: 3,
    username: 'jane_smith',
    first_name: 'Jane',
    last_name: 'Smith',
    grade: '10',
    section: 'A',
  },
  {
    id: 4,
    username: 'mike_jones',
    first_name: 'Mike',
    last_name: 'Jones',
    grade: '10',
    section: 'B',
  },
  {
    id: 5,
    username: 'sarah_wilson',
    first_name: 'Sarah',
    last_name: 'Wilson',
    grade: '10',
    section: 'A',
  },
];

export default function TeamFormation({
  competitionId,
  teamSize,
  currentTeam,
  onTeamCreated,
  onTeamJoined,
}: TeamFormationProps) {
  const theme = useTheme();
  const [mode, setMode] = useState<'create' | 'join' | null>(null);
  const [teamName, setTeamName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showMemberDialog, setShowMemberDialog] = useState(false);

  const handleCreateTeam = async () => {
    if (!teamName.trim()) {
      setError('Team name is required');
      return;
    }

    if (selectedMembers.length + 1 !== teamSize) {
      setError(`Please select exactly ${teamSize - 1} members`);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const team = await olympicsAPI.createTeam(competitionId, teamName, selectedMembers);
      onTeamCreated(team);
      setMode(null);
      setTeamName('');
      setSelectedMembers([]);
    } catch (err) {
      setError('Failed to create team');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async () => {
    if (!teamCode.trim()) {
      setError('Team code is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const team = await olympicsAPI.joinTeam(teamCode);
      onTeamJoined(team);
      setMode(null);
      setTeamCode('');
    } catch (err) {
      setError('Invalid team code or team is full');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMemberSelection = (memberId: number) => {
    setSelectedMembers((prev) =>
      prev.includes(memberId) ? prev.filter((id) => id !== memberId) : [...prev, memberId]
    );
  };

  const copyTeamCode = () => {
    if (currentTeam?.team_code) {
      navigator.clipboard.writeText(currentTeam.team_code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  };

  if (currentTeam) {
    return (
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} mb={3}>
            <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 56, height: 56 }}>
              <TeamIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                {currentTeam.name}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body2" color="text.secondary">
                  Code: {currentTeam.team_code}
                </Typography>
                <IconButton size="small" onClick={copyTeamCode}>
                  {codeCopied ? (
                    <CheckIcon fontSize="small" color="success" />
                  ) : (
                    <CopyIcon fontSize="small" />
                  )}
                </IconButton>
              </Stack>
            </Box>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
            Team Members ({currentTeam.members_count}/{teamSize})
          </Typography>

          <Stack spacing={1}>
            {currentTeam.members?.map((member) => (
              <Box
                key={member.id}
                sx={{
                  p: 2,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.primary.main, 0.02),
                }}
              >
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Avatar>
                    {member.user?.first_name?.[0]}
                    {member.user?.last_name?.[0]}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" fontWeight="bold">
                      {member.user?.first_name} {member.user?.last_name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      @{member.user?.username}
                      {member.role === 'captain' && ' • Captain'}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="primary" fontWeight="bold">
                    {member.contribution_points} pts
                  </Typography>
                </Stack>
              </Box>
            ))}
          </Stack>

          <Box sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.info.main, 0.1), borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Share your team code with others to join your team!
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!mode) {
    return (
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={2} mb={3}>
            <TeamIcon sx={{ fontSize: 40, color: theme.palette.primary.main }} />
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Team Formation
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create or join a team to participate
              </Typography>
            </Box>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Stack spacing={2}>
            <Button
              variant="contained"
              size="large"
              startIcon={<AddIcon />}
              onClick={() => setMode('create')}
            >
              Create New Team
            </Button>

            <Button variant="outlined" size="large" onClick={() => setMode('join')}>
              Join Existing Team
            </Button>
          </Stack>

          <Box
            sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.warning.main, 0.1), borderRadius: 1 }}
          >
            <Typography variant="caption" color="text.secondary">
              Teams must have exactly {teamSize} members to participate
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (mode === 'create') {
    return (
      <Card>
        <CardContent>
          <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
            <Typography variant="h6" fontWeight="bold">
              Create New Team
            </Typography>
            <IconButton onClick={() => setMode(null)}>
              <CloseIcon />
            </IconButton>
          </Stack>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <Stack spacing={3}>
            <TextField
              label="Team Name"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              fullWidth
              required
            />

            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Select Team Members ({selectedMembers.length}/{teamSize - 1})
                </Typography>
                <Button size="small" onClick={() => setShowMemberDialog(true)}>
                  Add Members
                </Button>
              </Stack>

              {selectedMembers.length > 0 ? (
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {selectedMembers.map((id) => {
                    const student = mockStudents.find((s) => s.id === id);
                    return (
                      <Chip
                        key={id}
                        label={`${student?.first_name} ${student?.last_name}`}
                        onDelete={() => toggleMemberSelection(id)}
                        sx={{ mb: 1 }}
                      />
                    );
                  })}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No members selected
                </Typography>
              )}
            </Box>

            <Stack direction="row" spacing={2}>
              <Button variant="outlined" fullWidth onClick={() => setMode(null)}>
                Cancel
              </Button>
              <Button
                variant="contained"
                fullWidth
                onClick={handleCreateTeam}
                disabled={loading || selectedMembers.length + 1 !== teamSize}
              >
                Create Team
              </Button>
            </Stack>
          </Stack>

          <Dialog
            open={showMemberDialog}
            onClose={() => setShowMemberDialog(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Select Team Members</DialogTitle>
            <DialogContent>
              <List>
                {mockStudents.map((student) => (
                  <ListItem key={student.id}>
                    <ListItemAvatar>
                      <Avatar>
                        {student.first_name[0]}
                        {student.last_name[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${student.first_name} ${student.last_name}`}
                      secondary={`${student.grade}-${student.section} • @${student.username}`}
                    />
                    <ListItemSecondaryAction>
                      <Checkbox
                        checked={selectedMembers.includes(student.id)}
                        onChange={() => toggleMemberSelection(student.id)}
                        disabled={
                          !selectedMembers.includes(student.id) &&
                          selectedMembers.length >= teamSize - 1
                        }
                      />
                    </ListItemSecondaryAction>
                  </ListItem>
                ))}
              </List>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowMemberDialog(false)}>Done</Button>
            </DialogActions>
          </Dialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
          <Typography variant="h6" fontWeight="bold">
            Join Existing Team
          </Typography>
          <IconButton onClick={() => setMode(null)}>
            <CloseIcon />
          </IconButton>
        </Stack>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Stack spacing={3}>
          <TextField
            label="Team Code"
            value={teamCode}
            onChange={(e) => setTeamCode(e.target.value.toUpperCase())}
            fullWidth
            required
            placeholder="Enter 6-digit code"
          />

          <Box sx={{ p: 2, bgcolor: alpha(theme.palette.info.main, 0.1), borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Ask your team captain for the team code to join
            </Typography>
          </Box>

          <Stack direction="row" spacing={2}>
            <Button variant="outlined" fullWidth onClick={() => setMode(null)}>
              Cancel
            </Button>
            <Button variant="contained" fullWidth onClick={handleJoinTeam} disabled={loading}>
              Join Team
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
