import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  ImageList,
  ImageListItem,
  ImageListItemBar,
  IconButton,
  Typography,
  Alert,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsApi } from '../../api/events';
import { EventPhoto } from '../../types/event';

interface PhotoGalleryProps {
  eventId: number | null;
}

const PhotoGallery: React.FC<PhotoGalleryProps> = ({ eventId }) => {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<EventPhoto | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const { data: photosData } = useQuery({
    queryKey: ['eventPhotos', eventId],
    queryFn: () => (eventId ? eventsApi.listPhotos(eventId) : Promise.resolve([])),
    enabled: !!eventId,
  });

  const { data: eventData } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => (eventId ? eventsApi.getEvent(eventId) : Promise.resolve(null)),
    enabled: !!eventId,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ eventId, formData }: { eventId: number; formData: FormData }) =>
      eventsApi.uploadPhoto(eventId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventPhotos'] });
      setUploadDialogOpen(false);
      setSelectedFile(null);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      eventId,
      photoId,
      data,
    }: {
      eventId: number;
      photoId: number;
      data: Partial<EventPhoto>;
    }) => eventsApi.updatePhoto(eventId, photoId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventPhotos'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ eventId, photoId }: { eventId: number; photoId: number }) =>
      eventsApi.deletePhoto(eventId, photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['eventPhotos'] });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleUploadSubmit = (formEvent: React.FormEvent<HTMLFormElement>) => {
    formEvent.preventDefault();
    if (!eventId || !selectedFile) return;

    const formElement = formEvent.currentTarget;
    const formData = new FormData();
    formData.append('photo', selectedFile);
    formData.append('title', (formElement.elements.namedItem('title') as HTMLInputElement).value);
    formData.append(
      'description',
      (formElement.elements.namedItem('description') as HTMLInputElement).value
    );
    formData.append(
      'display_order',
      (formElement.elements.namedItem('display_order') as HTMLInputElement).value
    );

    uploadMutation.mutate({ eventId, formData });
  };

  const handleToggleFeatured = (photoId: number, isFeatured: boolean) => {
    if (!eventId) return;
    updateMutation.mutate({
      eventId,
      photoId,
      data: { is_featured: !isFeatured },
    });
  };

  const handleDelete = (photoId: number) => {
    if (!eventId) return;
    if (confirm('Are you sure you want to delete this photo?')) {
      deleteMutation.mutate({ eventId, photoId });
    }
  };

  const handleViewPhoto = (photo: EventPhoto) => {
    setSelectedPhoto(photo);
    setViewDialogOpen(true);
  };

  if (!eventId) {
    return (
      <Alert severity="info">
        Please select an event from the calendar to view and manage photos
      </Alert>
    );
  }

  const featuredPhotos = photosData?.filter((p: EventPhoto) => p.is_featured) || [];
  const regularPhotos = photosData?.filter((p: EventPhoto) => !p.is_featured) || [];

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {eventData?.title} - Photo Gallery
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {photosData?.length || 0} photos uploaded
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setUploadDialogOpen(true)}
        >
          Upload Photo
        </Button>
      </Box>

      {featuredPhotos.length > 0 && (
        <>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ mt: 3, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <StarIcon color="primary" /> Featured Photos
          </Typography>
          <ImageList cols={3} gap={16} sx={{ mb: 4 }}>
            {featuredPhotos.map((photo: EventPhoto) => (
              <ImageListItem key={photo.id}>
                <img
                  src={photo.photo_url}
                  alt={photo.title || 'Event photo'}
                  loading="lazy"
                  style={{ cursor: 'pointer', height: 200, objectFit: 'cover' }}
                  onClick={() => handleViewPhoto(photo)}
                />
                <ImageListItemBar
                  title={photo.title}
                  subtitle={photo.description}
                  actionIcon={
                    <Box>
                      <IconButton
                        sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
                        onClick={() => handleToggleFeatured(photo.id, photo.is_featured)}
                      >
                        <StarIcon />
                      </IconButton>
                      <IconButton
                        sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
                        onClick={() => handleDelete(photo.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                />
              </ImageListItem>
            ))}
          </ImageList>
        </>
      )}

      {regularPhotos.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            All Photos
          </Typography>
          <ImageList cols={4} gap={16}>
            {regularPhotos.map((photo: EventPhoto) => (
              <ImageListItem key={photo.id}>
                <img
                  src={photo.photo_url}
                  alt={photo.title || 'Event photo'}
                  loading="lazy"
                  style={{ cursor: 'pointer', height: 200, objectFit: 'cover' }}
                  onClick={() => handleViewPhoto(photo)}
                />
                <ImageListItemBar
                  title={photo.title}
                  actionIcon={
                    <Box>
                      <IconButton
                        sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
                        onClick={() => handleToggleFeatured(photo.id, photo.is_featured)}
                      >
                        <StarBorderIcon />
                      </IconButton>
                      <IconButton
                        sx={{ color: 'rgba(255, 255, 255, 0.8)' }}
                        onClick={() => handleDelete(photo.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  }
                />
              </ImageListItem>
            ))}
          </ImageList>
        </>
      )}

      {photosData?.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No photos uploaded yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Click the upload button to add photos to this event
          </Typography>
        </Box>
      )}

      <Dialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleUploadSubmit}>
          <DialogTitle>Upload Photo</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Button
                  variant="outlined"
                  component="label"
                  fullWidth
                  startIcon={<UploadIcon />}
                  sx={{ py: 2 }}
                >
                  {selectedFile ? selectedFile.name : 'Select Photo'}
                  <input type="file" hidden accept="image/*" onChange={handleFileSelect} required />
                </Button>
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Title" name="title" />
              </Grid>
              <Grid item xs={12}>
                <TextField fullWidth label="Description" name="description" multiline rows={2} />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Display Order"
                  name="display_order"
                  type="number"
                  defaultValue={0}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={!selectedFile}>
              Upload
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={viewDialogOpen}
        onClose={() => setViewDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedPhoto && (
          <>
            <DialogTitle>
              {selectedPhoto.title}
              {selectedPhoto.is_featured && (
                <Chip
                  label="Featured"
                  color="primary"
                  size="small"
                  icon={<StarIcon />}
                  sx={{ ml: 2 }}
                />
              )}
            </DialogTitle>
            <DialogContent>
              <Card>
                <CardMedia
                  component="img"
                  image={selectedPhoto.photo_url}
                  alt={selectedPhoto.title}
                  sx={{ maxHeight: 500 }}
                />
                <CardContent>
                  <Typography variant="body1">{selectedPhoto.description}</Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 2, display: 'block' }}
                  >
                    Uploaded: {new Date(selectedPhoto.uploaded_at).toLocaleString()}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button
                    startIcon={selectedPhoto.is_featured ? <StarIcon /> : <StarBorderIcon />}
                    onClick={() => {
                      handleToggleFeatured(selectedPhoto.id, selectedPhoto.is_featured);
                      setViewDialogOpen(false);
                    }}
                  >
                    {selectedPhoto.is_featured ? 'Remove from Featured' : 'Mark as Featured'}
                  </Button>
                  <Button
                    color="error"
                    startIcon={<DeleteIcon />}
                    onClick={() => {
                      handleDelete(selectedPhoto.id);
                      setViewDialogOpen(false);
                    }}
                  >
                    Delete
                  </Button>
                </CardActions>
              </Card>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default PhotoGallery;
