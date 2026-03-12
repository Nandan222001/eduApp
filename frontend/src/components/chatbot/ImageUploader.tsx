import React, { useCallback } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import { Image as ImageIcon, Close } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';

interface ImageUploaderProps {
  onImageSelect: (file: File) => void;
  selectedImage?: File | null;
  onClearImage?: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImageSelect,
  selectedImage,
  onClearImage,
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onImageSelect(acceptedFiles[0]);
      }
    },
    [onImageSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    },
    maxFiles: 1,
    multiple: false,
  });

  if (selectedImage) {
    return (
      <Box
        sx={{
          position: 'relative',
          p: 1,
          border: 1,
          borderColor: 'primary.main',
          borderRadius: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <ImageIcon color="primary" />
        <Typography
          variant="caption"
          sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}
        >
          {selectedImage.name}
        </Typography>
        <IconButton size="small" onClick={onClearImage}>
          <Close fontSize="small" />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box
      {...getRootProps()}
      sx={{
        border: 2,
        borderStyle: 'dashed',
        borderColor: isDragActive ? 'primary.main' : 'divider',
        borderRadius: 1,
        p: 2,
        textAlign: 'center',
        cursor: 'pointer',
        bgcolor: isDragActive ? 'action.hover' : 'transparent',
        transition: 'all 0.2s',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: 'action.hover',
        },
      }}
    >
      <input {...getInputProps()} />
      <ImageIcon color="action" sx={{ fontSize: 32, mb: 1 }} />
      <Typography variant="caption" display="block">
        {isDragActive ? 'Drop image here' : 'Click or drag image for homework help'}
      </Typography>
    </Box>
  );
};
