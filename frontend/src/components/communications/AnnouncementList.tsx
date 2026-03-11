import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  MoreVert as MoreVertIcon,
  Campaign as CampaignIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { communicationsApi } from '@/api/communications';
import type { Announcement } from '@/types/communications';
import { formatDistanceToNow } from 'date-fns';

interface AnnouncementListProps {
  onCompose?: () => void;
}

export const AnnouncementList: React.FC<AnnouncementListProps> = ({ onCompose }) => {
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  const {
    data: announcements = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['announcements', tabValue === 0 ? true : undefined],
    queryFn: () => communicationsApi.getAnnouncements(tabValue === 0 ? true : undefined),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => communicationsApi.deleteAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      handleCloseMenu();
    },
  });

  const publishMutation = useMutation({
    mutationFn: (id: number) => communicationsApi.publishAnnouncement(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] });
      handleCloseMenu();
    },
  });

  const handleOpenMenu = (event: React.MouseEvent<HTMLElement>, announcement: Announcement) => {
    setAnchorEl(event.currentTarget);
    setSelectedAnnouncement(announcement);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedAnnouncement(null);
  };

  const handleDelete = () => {
    if (selectedAnnouncement) {
      deleteMutation.mutate(selectedAnnouncement.id);
    }
  };

  const handlePublish = () => {
    if (selectedAnnouncement) {
      publishMutation.mutate(selectedAnnouncement.id);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      default:
        return 'default';
    }
  };

  if (error) {
    return <Alert severity="error">Failed to load announcements</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h5">Announcements</Typography>
        {onCompose && (
          <Button variant="contained" startIcon={<CampaignIcon />} onClick={onCompose}>
            Create Announcement
          </Button>
        )}
      </Box>

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
        <Tab label="Published" />
        <Tab label="Drafts" />
        <Tab label="All" />
      </Tabs>

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress />
        </Box>
      ) : announcements.length === 0 ? (
        <Alert severity="info">No announcements found</Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {announcements.map((announcement) => (
            <Card key={announcement.id} variant="outlined">
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="start">
                  <Box flex={1}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <Typography variant="h6">{announcement.title}</Typography>
                      <Chip
                        label={announcement.priority}
                        size="small"
                        color={getPriorityColor(announcement.priority)}
                      />
                      {announcement.is_published ? (
                        <Chip
                          icon={<CheckCircleIcon />}
                          label="Published"
                          size="small"
                          color="success"
                        />
                      ) : (
                        <Chip label="Draft" size="small" variant="outlined" />
                      )}
                    </Box>

                    <Typography variant="body2" color="text.secondary" paragraph>
                      {announcement.content.substring(0, 200)}
                      {announcement.content.length > 200 && '...'}
                    </Typography>

                    <Box display="flex" gap={1} flexWrap="wrap" mb={1}>
                      <Chip
                        label={`Audience: ${announcement.audience_type}`}
                        size="small"
                        variant="outlined"
                      />
                      {announcement.channels.map((channel) => (
                        <Chip key={channel} label={channel} size="small" variant="outlined" />
                      ))}
                    </Box>

                    <Typography variant="caption" color="text.secondary">
                      {announcement.published_at
                        ? `Published ${formatDistanceToNow(new Date(announcement.published_at), { addSuffix: true })}`
                        : `Created ${formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}`}
                    </Typography>
                  </Box>

                  <IconButton onClick={(e) => handleOpenMenu(e, announcement)} size="small">
                    <MoreVertIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleCloseMenu}>
        {selectedAnnouncement && !selectedAnnouncement.is_published && (
          <MenuItem onClick={handlePublish}>Publish</MenuItem>
        )}
        {selectedAnnouncement && !selectedAnnouncement.is_published && (
          <MenuItem onClick={handleDelete}>Delete</MenuItem>
        )}
        <MenuItem onClick={handleCloseMenu}>Close</MenuItem>
      </Menu>
    </Box>
  );
};
