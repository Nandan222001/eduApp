import React from 'react';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Box,
  Chip,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PdfIcon,
  VideoLibrary as VideoIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { CourseMaterial } from '@/types/parentEducation';

interface CourseMaterialsListProps {
  materials: CourseMaterial[];
  onDownload: (material: CourseMaterial) => void;
}

export const CourseMaterialsList: React.FC<CourseMaterialsListProps> = ({
  materials,
  onDownload,
}) => {
  const theme = useTheme();

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <PdfIcon color="error" />;
    if (fileType.includes('video')) return <VideoIcon color="primary" />;
    if (fileType.includes('image')) return <ImageIcon color="success" />;
    return <FileIcon color="action" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (materials.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <DescriptionIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
        <Typography variant="body2" color="text.secondary">
          No materials available for this lesson
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {materials.map((material) => (
        <ListItem
          key={material.id}
          sx={{
            border: 1,
            borderColor: 'divider',
            borderRadius: 1,
            mb: 1,
            transition: 'all 0.2s',
            '&:hover': {
              bgcolor: alpha(theme.palette.primary.main, 0.05),
              borderColor: 'primary.main',
            },
          }}
          secondaryAction={
            <IconButton
              edge="end"
              onClick={() => onDownload(material)}
              sx={{
                bgcolor: alpha(theme.palette.primary.main, 0.1),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                },
              }}
            >
              <DownloadIcon />
            </IconButton>
          }
        >
          <ListItemIcon>{getFileIcon(material.file_type)}</ListItemIcon>
          <ListItemText
            primary={
              <Typography variant="body1" fontWeight={600}>
                {material.title}
              </Typography>
            }
            secondary={
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
                {material.description && (
                  <Typography variant="caption" color="text.secondary">
                    {material.description}
                  </Typography>
                )}
                <Chip
                  label={material.file_type.split('/')[1]?.toUpperCase() || 'FILE'}
                  size="small"
                  sx={{ height: 18, fontSize: '0.65rem' }}
                />
                <Chip
                  label={formatFileSize(material.file_size_bytes)}
                  size="small"
                  variant="outlined"
                  sx={{ height: 18, fontSize: '0.65rem' }}
                />
              </Box>
            }
          />
        </ListItem>
      ))}
    </List>
  );
};

export default CourseMaterialsList;
