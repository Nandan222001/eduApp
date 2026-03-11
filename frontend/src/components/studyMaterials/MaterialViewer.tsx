import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  Close,
  GetApp,
  Share,
  Bookmark,
  BookmarkBorder,
  Star,
  StarBorder,
} from '@mui/icons-material';
import { StudyMaterial, MaterialType } from '../../api/studyMaterials';
import { format } from 'date-fns';

interface MaterialViewerProps {
  open: boolean;
  material: StudyMaterial | null;
  onClose: () => void;
  onDownload?: () => void;
  onShare?: () => void;
  onBookmark?: () => void;
  onFavorite?: () => void;
  fileUrl?: string;
}

const MaterialViewer: React.FC<MaterialViewerProps> = ({
  open,
  material,
  onClose,
  onDownload,
  onShare,
  onBookmark,
  onFavorite,
  fileUrl,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && material) {
      setLoading(true);
      setError(null);
      setTimeout(() => setLoading(false), 1000);
    }
  }, [open, material]);

  if (!material) return null;

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (error) {
      return <Alert severity="error">{error}</Alert>;
    }

    switch (material.material_type) {
      case MaterialType.PDF:
        return (
          <Box sx={{ height: '70vh', width: '100%' }}>
            <iframe
              src={fileUrl}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title={material.title}
            />
          </Box>
        );

      case MaterialType.VIDEO:
        return (
          <Box sx={{ width: '100%', bgcolor: 'black' }}>
            <video controls style={{ width: '100%', maxHeight: '70vh' }} src={fileUrl}>
              Your browser does not support the video tag.
            </video>
          </Box>
        );

      case MaterialType.AUDIO:
        return (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <audio controls style={{ width: '100%' }} src={fileUrl}>
              Your browser does not support the audio element.
            </audio>
          </Box>
        );

      case MaterialType.IMAGE:
        return (
          <Box sx={{ textAlign: 'center', p: 2 }}>
            <img
              src={fileUrl}
              alt={material.title}
              style={{ maxWidth: '100%', maxHeight: '70vh' }}
            />
          </Box>
        );

      default:
        return (
          <Alert severity="info">
            Preview not available for this file type. Please download to view.
          </Alert>
        );
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
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="div">
            {material.title}
          </Typography>
          <IconButton onClick={onClose}>
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {renderContent()}

        <Box sx={{ p: 2 }}>
          <Divider sx={{ mb: 2 }} />

          {material.description && (
            <Typography variant="body2" color="text.secondary" paragraph>
              {material.description}
            </Typography>
          )}

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
            {material.subject_name && (
              <Chip label={material.subject_name} color="primary" variant="outlined" />
            )}
            {material.chapter_name && <Chip label={material.chapter_name} variant="outlined" />}
            {material.topic_name && <Chip label={material.topic_name} variant="outlined" />}
            {material.tags?.map((tag) => (
              <Chip key={tag} label={tag} size="small" />
            ))}
          </Box>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary">
              <strong>Type:</strong> {material.material_type.toUpperCase()}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              <strong>Size:</strong> {formatFileSize(material.file_size)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              <strong>Uploaded:</strong> {format(new Date(material.created_at), 'MMM d, yyyy')}
            </Typography>
            {material.uploader_name && (
              <Typography variant="caption" color="text.secondary">
                <strong>By:</strong> {material.uploader_name}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              <strong>Views:</strong> {material.view_count}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              <strong>Downloads:</strong> {material.download_count}
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Box sx={{ display: 'flex', gap: 1, flexGrow: 1 }}>
          <IconButton onClick={onBookmark} color={material.is_bookmarked ? 'primary' : 'default'}>
            {material.is_bookmarked ? <Bookmark /> : <BookmarkBorder />}
          </IconButton>
          <IconButton onClick={onFavorite} color={material.is_favorite ? 'warning' : 'default'}>
            {material.is_favorite ? <Star /> : <StarBorder />}
          </IconButton>
        </Box>

        <Button onClick={onShare} startIcon={<Share />}>
          Share
        </Button>
        <Button onClick={onDownload} variant="contained" startIcon={<GetApp />}>
          Download
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MaterialViewer;
