import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Box,
  Chip,
  Avatar,
  IconButton,
  Tooltip,
  Stack,
} from '@mui/material';
import {
  ThumbUp,
  ThumbUpOutlined,
  ChatBubbleOutline,
  Visibility,
  CheckCircle,
  Bookmark,
  BookmarkBorder,
} from '@mui/icons-material';
import { DoubtPost, DoubtStatus } from '../../types/doubt';
import { formatDistanceToNow } from 'date-fns';

interface DoubtCardProps {
  doubt: DoubtPost;
  onView: () => void;
  onUpvote?: () => void;
  onBookmark?: () => void;
}

const DoubtCard: React.FC<DoubtCardProps> = ({ doubt, onView, onUpvote, onBookmark }) => {
  const getStatusColor = (status: DoubtStatus) => {
    switch (status) {
      case DoubtStatus.RESOLVED:
        return 'success';
      case DoubtStatus.ANSWERED:
        return 'info';
      case DoubtStatus.UNANSWERED:
        return 'warning';
      case DoubtStatus.CLOSED:
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: DoubtStatus) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        '&:hover': {
          boxShadow: 3,
        },
      }}
      onClick={onView}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
          <Chip
            label={getStatusLabel(doubt.status)}
            color={getStatusColor(doubt.status)}
            size="small"
            icon={doubt.status === DoubtStatus.RESOLVED ? <CheckCircle /> : undefined}
          />
          <Typography variant="caption" color="text.secondary">
            {formatDistanceToNow(new Date(doubt.created_at), { addSuffix: true })}
          </Typography>
        </Box>

        <Typography variant="h6" gutterBottom noWrap>
          {doubt.title}
        </Typography>

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
          {doubt.description}
        </Typography>

        <Stack direction="row" spacing={0.5} flexWrap="wrap" mb={1}>
          {doubt.subject_name && (
            <Chip label={doubt.subject_name} size="small" color="primary" variant="outlined" />
          )}
          {doubt.chapter_name && (
            <Chip label={doubt.chapter_name} size="small" variant="outlined" />
          )}
          {doubt.tags?.slice(0, 2).map((tag) => (
            <Chip key={tag} label={tag} size="small" />
          ))}
        </Stack>

        <Box display="flex" alignItems="center" gap={1} mt={2}>
          <Avatar src={doubt.user_avatar} alt={doubt.user_name} sx={{ width: 24, height: 24 }}>
            {doubt.user_name?.[0] || '?'}
          </Avatar>
          <Typography variant="caption" color="text.secondary">
            {doubt.is_anonymous ? 'Anonymous' : doubt.user_name}
          </Typography>
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', pt: 0, px: 2, pb: 1 }}>
        <Box display="flex" gap={2}>
          <Tooltip title="Upvotes">
            <Box
              display="flex"
              alignItems="center"
              gap={0.5}
              onClick={(e) => {
                e.stopPropagation();
                onUpvote?.();
              }}
            >
              {doubt.is_upvoted ? (
                <ThumbUp fontSize="small" color="primary" />
              ) : (
                <ThumbUpOutlined fontSize="small" color="action" />
              )}
              <Typography variant="caption">{doubt.upvote_count}</Typography>
            </Box>
          </Tooltip>

          <Tooltip title="Answers">
            <Box display="flex" alignItems="center" gap={0.5}>
              <ChatBubbleOutline fontSize="small" color="action" />
              <Typography variant="caption">{doubt.answer_count}</Typography>
            </Box>
          </Tooltip>

          <Tooltip title="Views">
            <Box display="flex" alignItems="center" gap={0.5}>
              <Visibility fontSize="small" color="action" />
              <Typography variant="caption">{doubt.view_count}</Typography>
            </Box>
          </Tooltip>
        </Box>

        <Tooltip title={doubt.is_bookmarked ? 'Remove Bookmark' : 'Bookmark'}>
          <IconButton
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              onBookmark?.();
            }}
          >
            {doubt.is_bookmarked ? <Bookmark color="primary" /> : <BookmarkBorder />}
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default DoubtCard;
