import React, { useCallback, useState } from 'react';
import { Box, Paper, Typography, Chip } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';

interface FileUploadZoneProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  maxSizeMB?: number;
  acceptedTypes?: string[];
  disabled?: boolean;
}

export const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  files,
  onFilesChange,
  maxFiles = 10,
  maxSizeMB = 10,
  acceptedTypes = [],
  disabled = false,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>('');

  const validateFile = useCallback(
    (file: File): string | null => {
      if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
        return `File ${file.name} exceeds maximum size of ${maxSizeMB}MB`;
      }

      if (acceptedTypes.length > 0) {
        const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;
        if (!acceptedTypes.includes(fileExt)) {
          return `File type ${fileExt} is not allowed`;
        }
      }

      return null;
    },
    [maxSizeMB, acceptedTypes]
  );

  const handleFiles = useCallback(
    (newFiles: FileList | File[]) => {
      setError('');
      const fileArray = Array.from(newFiles);

      if (files.length + fileArray.length > maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        return;
      }

      const validFiles: File[] = [];
      for (const file of fileArray) {
        const validationError = validateFile(file);
        if (validationError) {
          setError(validationError);
          return;
        }
        validFiles.push(file);
      }

      onFilesChange([...files, ...validFiles]);
    },
    [files, maxFiles, onFilesChange, validateFile]
  );

  const handleDrag = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;

      if (e.type === 'dragenter' || e.type === 'dragover') {
        setDragActive(true);
      } else if (e.type === 'dragleave') {
        setDragActive(false);
      }
    },
    [disabled]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);
      if (disabled) return;

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [disabled, handleFiles]
  );

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
    setError('');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Box>
      <Paper
        variant="outlined"
        sx={{
          p: 3,
          border: dragActive ? '2px dashed #1976d2' : '2px dashed #ccc',
          bgcolor: disabled
            ? 'action.disabledBackground'
            : dragActive
              ? 'action.hover'
              : 'background.paper',
          textAlign: 'center',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          onChange={handleFileInput}
          style={{ display: 'none' }}
          id="file-upload-zone"
          disabled={disabled}
          accept={acceptedTypes.join(',')}
        />
        <label htmlFor="file-upload-zone">
          <Box sx={{ cursor: disabled ? 'not-allowed' : 'pointer' }}>
            <CloudUploadIcon
              sx={{
                fontSize: 48,
                color: disabled ? 'action.disabled' : 'primary.main',
                mb: 2,
              }}
            />
            <Typography variant="h6" gutterBottom>
              Drag and drop files here
            </Typography>
            <Typography variant="body2" color="textSecondary">
              or click to select files
            </Typography>
            <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
              Max {maxFiles} files, {maxSizeMB}MB each
              {acceptedTypes.length > 0 && ` • Allowed: ${acceptedTypes.join(', ')}`}
            </Typography>
          </Box>
        </label>
      </Paper>

      {error && (
        <Typography color="error" variant="caption" sx={{ display: 'block', mt: 1 }}>
          {error}
        </Typography>
      )}

      {files.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" gutterBottom>
            Selected Files ({files.length}/{maxFiles}):
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {files.map((file, index) => (
              <Chip
                key={index}
                icon={<AttachFileIcon />}
                label={`${file.name} (${formatFileSize(file.size)})`}
                onDelete={disabled ? undefined : () => removeFile(index)}
                deleteIcon={<DeleteIcon />}
                sx={{ maxWidth: '100%' }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};
