import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Card,
  CardContent,
  useTheme,
  alpha,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  PriorityHigh as PriorityHighIcon,
  AccessTime as AccessTimeIcon,
  TrendingUp as TrendingUpIcon,
  MenuBook as MenuBookIcon,
} from '@mui/icons-material';
import { FocusAreaRecommendation } from '@/api/aiPredictionDashboard';

interface FocusAreaRecommendationsProps {
  focusAreas: FocusAreaRecommendation[];
}

export default function FocusAreaRecommendations({ focusAreas }: FocusAreaRecommendationsProps) {
  const theme = useTheme();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return theme.palette.error.main;
      case 'high':
        return theme.palette.warning.main;
      case 'medium':
        return theme.palette.info.main;
      default:
        return theme.palette.grey[500];
    }
  };

  return (
    <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 3 }}>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Focus Area Recommendations
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Prioritized topics based on probability and expected impact
      </Typography>
      <Grid container spacing={2}>
        {focusAreas.map((area, index) => (
          <Grid item xs={12} md={6} key={area.topic_id || index}>
            <Card
              elevation={0}
              sx={{
                border: `2px solid ${getPriorityColor(area.priority)}`,
                height: '100%',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PriorityHighIcon sx={{ color: getPriorityColor(area.priority), fontSize: 24 }} />
                  <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>
                    {area.topic_name}
                  </Typography>
                  <Chip
                    label={area.priority.toUpperCase()}
                    size="small"
                    sx={{
                      bgcolor: alpha(getPriorityColor(area.priority), 0.1),
                      color: getPriorityColor(area.priority),
                      fontWeight: 700,
                    }}
                  />
                </Box>
                {area.chapter_name && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Chapter: {area.chapter_name}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {area.reason}
                </Typography>
                <Box
                  sx={{
                    p: 2,
                    bgcolor: alpha(theme.palette.success.main, 0.05),
                    borderRadius: 1,
                    mb: 2,
                  }}
                >
                  <Typography variant="body2" fontWeight={600} color="success.main">
                    {area.expected_impact}
                  </Typography>
                </Box>
                <Grid container spacing={2} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AccessTimeIcon fontSize="small" color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Study Time
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {area.study_hours_needed}h
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingUpIcon fontSize="small" color="action" />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Difficulty
                        </Typography>
                        <Typography variant="body2" fontWeight={600}>
                          {area.difficulty_level}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Resources
                </Typography>
                <List dense sx={{ py: 0 }}>
                  {area.resources.slice(0, 3).map((resource, idx) => (
                    <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <MenuBookIcon fontSize="small" color="action" />
                      </ListItemIcon>
                      <ListItemText
                        primary={resource}
                        primaryTypographyProps={{ variant: 'body2' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
}
