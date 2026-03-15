import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Typography,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  LinearProgress,
  useTheme,
  alpha,
  Chip,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { OnboardingStep } from '@/types/onboarding';

interface DocumentUploadStepProps {
  step: OnboardingStep;
  onComplete: (data?: Record<string, unknown>) => void;
  data: Record<string, unknown>;
}

interface UploadedFile {
  file: File;
  preview: string;
  uploading: boolean;
  progress: number;
}

export default function DocumentUploadStep({ step, onComplete }: DocumentUploadStepProps) {
  const theme = useTheme();
  const [files, setFiles] = useState<UploadedFile[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      uploading: true,
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    newFiles.forEach((_, index) => {
      const interval = setInterval(() => {
        setFiles((prev) => {
          const updated = [...prev];
          const fileIndex = prev.length - newFiles.length + index;
          if (updated[fileIndex].progress < 100) {
            updated[fileIndex].progress += 10;
          } else {
            updated[fileIndex].uploading = false;
            clearInterval(interval);
          }
          return updated;
        });
      }, 200);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: step.config.acceptedFileTypes?.reduce(
      (acc, type) => {
        acc[type] = [];
        return acc;
      },
      {} as Record<string, string[]>
    ) || {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png'],
    },
    maxSize: step.config.maxFileSize || 5242880,
  });

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const allFilesUploaded = files.length > 0 && files.every((f) => !f.uploading);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        {step.title}
      </Typography>

      {step.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {step.description}
        </Typography>
      )}

      {step.config.documentDescription && (
        <Box
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 2,
            bgcolor: alpha(theme.palette.info.main, 0.1),
            border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
          }}
        >
          <Typography variant="body2">{step.config.documentDescription}</Typography>
        </Box>
      )}

      <Box
        {...getRootProps()}
        sx={{
          border: `2px dashed ${isDragActive ? theme.palette.primary.main : theme.palette.divider}`,
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          cursor: 'pointer',
          bgcolor: isDragActive ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
          transition: 'all 0.3s',
          mb: 3,
          '&:hover': {
            borderColor: theme.palette.primary.main,
            bgcolor: alpha(theme.palette.primary.main, 0.02),
          },
        }}
      >
        <input {...getInputProps()} />
        <UploadIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          or click to browse
        </Typography>
        <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
          {step.config.acceptedFileTypes?.map((type) => (
            <Chip key={type} label={type} size="small" />
          ))}
        </Box>
        {step.config.maxFileSize && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Max file size: {formatFileSize(step.config.maxFileSize)}
          </Typography>
        )}
      </Box>

      {files.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Uploaded Files ({files.length})
          </Typography>
          <List>
            {files.map((uploadedFile, index) => (
              <ListItem
                key={index}
                secondaryAction={
                  !uploadedFile.uploading && (
                    <IconButton edge="end" onClick={() => removeFile(index)}>
                      <DeleteIcon />
                    </IconButton>
                  )
                }
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemIcon>
                  {uploadedFile.uploading ? (
                    <UploadIcon color="primary" />
                  ) : (
                    <CheckCircleIcon color="success" />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={uploadedFile.file.name}
                  secondary={
                    uploadedFile.uploading ? (
                      <LinearProgress
                        variant="determinate"
                        value={uploadedFile.progress}
                        sx={{ mt: 1 }}
                      />
                    ) : (
                      formatFileSize(uploadedFile.file.size)
                    )
                  }
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={() => onComplete({ files: files.map((f) => f.file.name) })}
          disabled={step.required && !allFilesUploaded}
        >
          Continue
        </Button>
      </Box>
    </Box>
  );
}
