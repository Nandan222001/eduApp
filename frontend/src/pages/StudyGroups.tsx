import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Avatar,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import { Add, Search, People, Lock, Public, Group } from '@mui/icons-material';
import { GroupCreationForm } from '../components/studyGroups';
import studyGroupsApi from '../api/studyGroups';
import { StudyGroup, GroupSearchFilters, GroupStats } from '../types/studyGroup';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface Subject {
  id: number;
  name: string;
}

const StudyGroups: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [stats, setStats] = useState<GroupStats | null>(null);
  const [filters, setFilters] = useState<GroupSearchFilters>({
    page: 1,
    page_size: 12,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectId, setSubjectId] = useState<number | ''>('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [creationFormOpen, setCreationFormOpen] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    loadGroups();
    loadStats();
    loadSubjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  useEffect(() => {
    if (tabValue === 0) {
      setFilters((prev) => ({ ...prev, my_groups: false, page: 1 }));
    } else if (tabValue === 1) {
      setFilters((prev) => ({ ...prev, my_groups: true, page: 1 }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabValue]);

  const loadGroups = async () => {
    try {
      const response = await studyGroupsApi.searchGroups(filters);
      setGroups(response.groups);
      setTotalPages(response.total_pages);
    } catch (error) {
      showSnackbar('Failed to load groups', 'error');
    }
  };

  const loadStats = async () => {
    try {
      const data = await studyGroupsApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/academic/subjects`);
      setSubjects(response.data);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  };

  const handleSearch = () => {
    const newFilters: GroupSearchFilters = { ...filters, page: 1 };
    if (searchQuery.trim()) {
      newFilters.query = searchQuery.trim();
    } else {
      delete newFilters.query;
    }
    if (subjectId) {
      newFilters.subject_id = subjectId as number;
    } else {
      delete newFilters.subject_id;
    }
    setFilters(newFilters);
  };

  const handleJoinGroup = async (groupId: number) => {
    try {
      await studyGroupsApi.joinGroup(groupId);
      showSnackbar('Joined group successfully', 'success');
      loadGroups();
      loadStats();
    } catch (error) {
      showSnackbar('Failed to join group', 'error');
    }
  };

  const handleViewGroup = (groupId: number) => {
    window.location.href = `/study-groups/${groupId}`;
  };

  const handlePageChange = (_: React.ChangeEvent<unknown>, page: number) => {
    setFilters({ ...filters, page });
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Study Groups
        </Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => setCreationFormOpen(true)}>
          Create Group
        </Button>
      </Box>

      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Group color="primary" />
                  <Typography color="text.secondary" variant="body2">
                    Total Groups
                  </Typography>
                </Box>
                <Typography variant="h4">{stats.total_groups}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <People color="success" />
                  <Typography color="text.secondary" variant="body2">
                    My Groups
                  </Typography>
                </Box>
                <Typography variant="h4">{stats.my_groups}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <People color="info" />
                  <Typography color="text.secondary" variant="body2">
                    Total Members
                  </Typography>
                </Box>
                <Typography variant="h4">{stats.total_members}</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Group color="warning" />
                  <Typography color="text.secondary" variant="body2">
                    Active Today
                  </Typography>
                </Box>
                <Typography variant="h4">{stats.active_today}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Tabs value={tabValue} onChange={(_, val) => setTabValue(val)} sx={{ mb: 2 }}>
        <Tab label="All Groups" />
        <Tab label="My Groups" />
      </Tabs>

      <Divider sx={{ mb: 2 }} />

      <Box display="flex" gap={2} mb={3}>
        <TextField
          placeholder="Search groups..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          size="small"
          sx={{ flex: 1 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Subject</InputLabel>
          <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value as number | '')}>
            <MenuItem value="">
              <em>All Subjects</em>
            </MenuItem>
            {subjects.map((subject) => (
              <MenuItem key={subject.id} value={subject.id}>
                {subject.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button variant="contained" onClick={handleSearch}>
          Search
        </Button>
      </Box>

      <Grid container spacing={3}>
        {groups.map((group) => (
          <Grid item xs={12} sm={6} md={4} key={group.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                '&:hover': { boxShadow: 4 },
              }}
              onClick={() => handleViewGroup(group.id)}
            >
              {group.cover_image_url && (
                <CardMedia
                  component="img"
                  height="140"
                  image={group.cover_image_url}
                  alt={group.name}
                />
              )}

              <CardContent sx={{ flexGrow: 1 }}>
                <Box display="flex" gap={1} alignItems="center" mb={1}>
                  <Avatar src={group.avatar_url} alt={group.name}>
                    {group.name[0]}
                  </Avatar>
                  <Box flex={1}>
                    <Typography variant="h6" noWrap>
                      {group.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      by {group.creator_name}
                    </Typography>
                  </Box>
                  {group.is_public ? (
                    <Public fontSize="small" color="success" />
                  ) : (
                    <Lock fontSize="small" color="action" />
                  )}
                </Box>

                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    mb: 1.5,
                  }}
                >
                  {group.description || 'No description'}
                </Typography>

                <Box display="flex" gap={0.5} flexWrap="wrap" mb={1}>
                  {group.subject_name && (
                    <Chip
                      label={group.subject_name}
                      size="small"
                      color="primary"
                      variant="outlined"
                    />
                  )}
                  {group.chapter_name && (
                    <Chip label={group.chapter_name} size="small" variant="outlined" />
                  )}
                </Box>

                <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <People fontSize="small" color="action" />
                    <Typography variant="caption">
                      {group.member_count} {group.max_members ? `/ ${group.max_members}` : ''}{' '}
                      members
                    </Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {group.resource_count} resources
                  </Typography>
                </Box>
              </CardContent>

              <CardActions>
                {group.is_member ? (
                  <Button size="small" fullWidth variant="outlined">
                    View Group
                  </Button>
                ) : (
                  <Button
                    size="small"
                    fullWidth
                    variant="contained"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinGroup(group.id);
                    }}
                  >
                    Join Group
                  </Button>
                )}
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {groups.length === 0 && (
        <Box textAlign="center" py={8}>
          <Group sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No study groups found
          </Typography>
          <Typography color="text.secondary" mb={2}>
            Create your first study group to start collaborating!
          </Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => setCreationFormOpen(true)}>
            Create Group
          </Button>
        </Box>
      )}

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={filters.page || 1}
            onChange={handlePageChange}
            color="primary"
            size="large"
          />
        </Box>
      )}

      <GroupCreationForm
        open={creationFormOpen}
        onClose={() => setCreationFormOpen(false)}
        onSuccess={() => {
          loadGroups();
          loadStats();
          showSnackbar('Group created successfully', 'success');
        }}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default StudyGroups;
