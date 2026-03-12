import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Avatar,
  Typography,
  IconButton,
  Button,
  TextField,
  Divider,
  Chip,
  Stack,
  Menu,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  ThumbUp,
  ThumbUpOutlined,
  ThumbDown,
  ThumbDownOutlined,
  CheckCircle,
  CheckCircleOutline,
  MoreVert,
  Image as ImageIcon,
  Delete,
} from '@mui/icons-material';
import { DoubtAnswer } from '../../types/doubt';
import { formatDistanceToNow } from 'date-fns';

interface AnswerInterfaceProps {
  answer: DoubtAnswer;
  isQuestionOwner: boolean;
  onUpvote: () => void;
  onDownvote: () => void;
  onAccept?: () => void;
  onDelete?: () => void;
}

const AnswerInterface: React.FC<AnswerInterfaceProps> = ({
  answer,
  isQuestionOwner,
  onUpvote,
  onDownvote,
  onAccept,
  onDelete,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  return (
    <Card
      sx={{
        mb: 2,
        bgcolor: answer.is_accepted ? 'success.50' : 'background.paper',
        border: answer.is_accepted ? 2 : 1,
        borderColor: answer.is_accepted ? 'success.main' : 'divider',
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box display="flex" gap={1.5} alignItems="center">
            <Avatar src={answer.user_avatar} alt={answer.user_name} sx={{ width: 40, height: 40 }}>
              {answer.user_name?.[0] || '?'}
            </Avatar>
            <Box>
              <Typography variant="subtitle2">
                {answer.is_anonymous ? 'Anonymous' : answer.user_name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {answer.user_role && (
                  <Chip label={answer.user_role} size="small" sx={{ mr: 1, height: 18 }} />
                )}
                {formatDistanceToNow(new Date(answer.created_at), { addSuffix: true })}
              </Typography>
            </Box>
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            {answer.is_accepted && (
              <Chip icon={<CheckCircle />} label="Accepted Answer" color="success" size="small" />
            )}
            <IconButton size="small" onClick={handleMenuOpen}>
              <MoreVert />
            </IconButton>
          </Box>
        </Box>

        <Typography variant="body1" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
          {answer.content}
        </Typography>

        {answer.images && answer.images.length > 0 && (
          <Grid container spacing={1} sx={{ mb: 2 }}>
            {answer.images.map((image, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <img
                  src={image}
                  alt={`Answer image ${index + 1}`}
                  style={{
                    width: '100%',
                    maxHeight: 200,
                    objectFit: 'cover',
                    borderRadius: 8,
                  }}
                />
              </Grid>
            ))}
          </Grid>
        )}

        <Divider sx={{ my: 2 }} />

        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              startIcon={answer.is_upvoted ? <ThumbUp /> : <ThumbUpOutlined />}
              color={answer.is_upvoted ? 'primary' : 'inherit'}
              onClick={onUpvote}
            >
              {answer.upvote_count}
            </Button>

            <Button
              size="small"
              startIcon={answer.is_downvoted ? <ThumbDown /> : <ThumbDownOutlined />}
              color={answer.is_downvoted ? 'error' : 'inherit'}
              onClick={onDownvote}
            >
              {answer.downvote_count}
            </Button>
          </Stack>

          {isQuestionOwner && !answer.is_accepted && onAccept && (
            <Button
              size="small"
              startIcon={<CheckCircleOutline />}
              color="success"
              variant="outlined"
              onClick={onAccept}
            >
              Accept Answer
            </Button>
          )}
        </Box>
      </CardContent>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {onDelete && (
          <MenuItem
            onClick={() => {
              onDelete();
              handleMenuClose();
            }}
          >
            Delete
          </MenuItem>
        )}
      </Menu>
    </Card>
  );
};

interface AnswerComposerProps {
  onSubmit: (content: string, images: File[]) => Promise<void>;
}

export const AnswerComposer: React.FC<AnswerComposerProps> = ({ onSubmit }) => {
  const [content, setContent] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + images.length > 3) {
      return;
    }

    setImages([...images, ...files]);
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews([...imagePreviews, ...newPreviews]);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    const newPreviews = [...imagePreviews];
    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleSubmit = async () => {
    if (!content.trim()) return;

    setLoading(true);
    try {
      await onSubmit(content, images);
      setContent('');
      setImages([]);
      setImagePreviews([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Your Answer
        </Typography>

        <TextField
          fullWidth
          multiline
          rows={6}
          placeholder="Write your answer here..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          sx={{ mb: 2 }}
        />

        {imagePreviews.length > 0 && (
          <Grid container spacing={1} sx={{ mb: 2 }}>
            {imagePreviews.map((preview, index) => (
              <Grid item xs={6} sm={4} md={3} key={index}>
                <Box sx={{ position: 'relative' }}>
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    style={{
                      width: '100%',
                      height: 100,
                      objectFit: 'cover',
                      borderRadius: 4,
                    }}
                  />
                  <IconButton
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      bgcolor: 'background.paper',
                    }}
                    onClick={() => handleRemoveImage(index)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </Box>
              </Grid>
            ))}
          </Grid>
        )}

        <Box display="flex" justifyContent="space-between">
          <Button variant="outlined" component="label" startIcon={<ImageIcon />}>
            Add Images (Max 3)
            <input type="file" hidden accept="image/*" multiple onChange={handleImageSelect} />
          </Button>

          <Button variant="contained" onClick={handleSubmit} disabled={!content.trim() || loading}>
            {loading ? 'Posting...' : 'Post Answer'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AnswerInterface;
