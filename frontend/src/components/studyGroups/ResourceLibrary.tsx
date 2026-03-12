import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  CloudUpload,
  InsertDriveFile,
  PictureAsPdf,
  Description,
  Image,
  VideoLibrary,
  GetApp,
  Delete,
} from '@mui/icons-material';
import { GroupResource } from '../../types/studyGroup';
import { formatDistanceToNow } from 'date-fns';

interface ResourceLibraryProps {
  resources: GroupResource[];
  canUpload: boolean;
  onUpload?: (title: string, description: string, file: File) => Promise<void>;
  onDownload?: (resourceId: number) => void;
  onDelete?: (resourceId: number) => void;
}

const ResourceLibrary: React.FC<ResourceLibraryProps> = ({
  resources,
  canUpload,
  onUpload,
  onDownload,
  onDelete,
}) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return <PictureAsPdf color="error" />;
    if (fileType.includes('image')) return <Image color="primary" />;
    if (fileType.includes('video')) return <VideoLibrary color="secondary" />;
    if (fileType.includes('document') || fileType.includes('word'))
      return <Description color="info" />;
    return <InsertDriveFile />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !title || !onUpload) return;

    setUploading(true);
    try {
      await onUpload(title, description, selectedFile);
      handleCloseDialog();
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleCloseDialog = () => {
    setUploadDialogOpen(false);
    setTitle('');
    setDescription('');
    setSelectedFile(null);
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6">Resource Library ({resources.length})</Typography>
        {canUpload && onUpload && (
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Upload
          </Button>
        )}
      </Box>

      {resources.length === 0 ? (
        <Box textAlign="center" py={4}>
          <InsertDriveFile sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography color="text.secondary">No resources uploaded yet</Typography>
        </Box>
      ) : (
        <List>
          {resources.map((resource) => (
            <ListItem key={resource.id} divider>
              <ListItemIcon>{getFileIcon(resource.file_type)}</ListItemIcon>

              <ListItemText
                primary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="body1">{resource.title}</Typography>
                    <Chip label={formatFileSize(resource.file_size)} size="small" />
                  </Box>
                }
                secondary={
                  <>
                    {resource.description && (
                      <Typography variant="body2" display="block">
                        {resource.description}
                      </Typography>
                    )}
                    <Typography variant="caption" color="text.secondary">
                      Uploaded by {resource.uploader_name} •{' '}
                      {formatDistanceToNow(new Date(resource.created_at), { addSuffix: true })} •{' '}
                      {resource.download_count} downloads
                    </Typography>
                  </>
                }
              />

              <ListItemSecondaryAction>
                <Box display="flex" gap={1}>
                  {onDownload && (
                    <IconButton onClick={() => onDownload(resource.id)}>
                      <GetApp />
                    </IconButton>
                  )}
                  {onDelete && (
                    <IconButton onClick={() => onDelete(resource.id)} color="error">
                      <Delete />
                    </IconButton>
                  )}
                </Box>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      )}

      <Dialog open={uploadDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Resource</DialogTitle>
        <DialogContent>
          <Button
            variant="outlined"
            component="label"
            fullWidth
            startIcon={<CloudUpload />}
            sx={{ my: 2 }}
          >
            {selectedFile ? selectedFile.name : 'Select File'}
            <input type="file" hidden onChange={handleFileSelect} />
          </Button>

          <TextField
            label="Title"
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            margin="normal"
            required
          />

          <TextField
            label="Description (Optional)"
            fullWidth
            multiline
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            margin="normal"
          />

          {uploading && <LinearProgress sx={{ mt: 2 }} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleUpload}
            variant="contained"
            disabled={!selectedFile || !title || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ResourceLibrary;
