import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  PictureAsPdf,
  VideoLibrary,
  AudioFile,
  Image,
  Description,
  Slideshow,
  TableChart,
  Archive,
  InsertDriveFile,
  Visibility,
  GetApp,
  Bookmark,
  BookmarkBorder,
  Star,
  StarBorder,
  Share,
  MoreVert,
} from '@mui/icons-material';
import { StudyMaterial, MaterialType } from '../../api/studyMaterials';
import { format } from 'date-fns';

interface MaterialCardProps {
  material: StudyMaterial;
  onView?: () => void;
  onDownload?: () => void;
  onBookmark?: () => void;
  onFavorite?: () => void;
  onShare?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const MaterialCard: React.FC<MaterialCardProps> = ({
  material,
  onView,
  onDownload,
  onBookmark,
  onFavorite,
  onShare,
  onEdit,
  onDelete,
}) => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const getFileIcon = (type: MaterialType) => {
    switch (type) {
      case MaterialType.PDF:
        return <PictureAsPdf sx={{ fontSize: 48, color: '#d32f2f' }} />;
      case MaterialType.VIDEO:
        return <VideoLibrary sx={{ fontSize: 48, color: '#1976d2' }} />;
      case MaterialType.AUDIO:
        return <AudioFile sx={{ fontSize: 48, color: '#388e3c' }} />;
      case MaterialType.IMAGE:
        return <Image sx={{ fontSize: 48, color: '#f57c00' }} />;
      case MaterialType.DOCUMENT:
        return <Description sx={{ fontSize: 48, color: '#0288d1' }} />;
      case MaterialType.PRESENTATION:
        return <Slideshow sx={{ fontSize: 48, color: '#c62828' }} />;
      case MaterialType.SPREADSHEET:
        return <TableChart sx={{ fontSize: 48, color: '#2e7d32' }} />;
      case MaterialType.ARCHIVE:
        return <Archive sx={{ fontSize: 48, color: '#5d4037' }} />;
      default:
        return <InsertDriveFile sx={{ fontSize: 48, color: '#616161' }} />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardMedia
        sx={{
          height: 140,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'grey.100',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
        style={{
          backgroundImage: material.thumbnail_path ? `url(${material.thumbnail_path})` : 'none',
        }}
      >
        {!material.thumbnail_path && getFileIcon(material.material_type)}
      </CardMedia>

      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Typography gutterBottom variant="h6" component="div" noWrap>
          {material.title}
        </Typography>

        {material.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              mb: 1,
            }}
          >
            {material.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
          {material.subject_name && (
            <Chip label={material.subject_name} size="small" color="primary" variant="outlined" />
          )}
          {material.chapter_name && (
            <Chip label={material.chapter_name} size="small" variant="outlined" />
          )}
          {material.tags?.slice(0, 2).map((tag) => (
            <Chip key={tag} label={tag} size="small" />
          ))}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {formatFileSize(material.file_size)}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {format(new Date(material.created_at), 'MMM d, yyyy')}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
          <Tooltip title="Views">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Visibility fontSize="small" color="action" />
              <Typography variant="caption">{material.view_count}</Typography>
            </Box>
          </Tooltip>
          <Tooltip title="Downloads">
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <GetApp fontSize="small" color="action" />
              <Typography variant="caption">{material.download_count}</Typography>
            </Box>
          </Tooltip>
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', pt: 0 }}>
        <Box>
          <Tooltip title="View">
            <IconButton size="small" onClick={onView} color="primary">
              <Visibility />
            </IconButton>
          </Tooltip>
          <Tooltip title="Download">
            <IconButton size="small" onClick={onDownload}>
              <GetApp />
            </IconButton>
          </Tooltip>
        </Box>

        <Box>
          <Tooltip title={material.is_bookmarked ? 'Remove Bookmark' : 'Bookmark'}>
            <IconButton size="small" onClick={onBookmark}>
              {material.is_bookmarked ? <Bookmark color="primary" /> : <BookmarkBorder />}
            </IconButton>
          </Tooltip>
          <Tooltip title={material.is_favorite ? 'Remove from Favorites' : 'Add to Favorites'}>
            <IconButton size="small" onClick={onFavorite}>
              {material.is_favorite ? <Star color="warning" /> : <StarBorder />}
            </IconButton>
          </Tooltip>
          <Tooltip title="Share">
            <IconButton size="small" onClick={onShare}>
              <Share />
            </IconButton>
          </Tooltip>
          <IconButton size="small" onClick={handleMenuOpen}>
            <MoreVert />
          </IconButton>
        </Box>
      </CardActions>

      <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
        {onEdit && (
          <MenuItem
            onClick={() => {
              onEdit();
              handleMenuClose();
            }}
          >
            Edit
          </MenuItem>
        )}
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

export default MaterialCard;
