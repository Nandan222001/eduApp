import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Typography, Paper, Button, CircularProgress, Alert } from '@mui/material';
import { CloudUpload as UploadIcon } from '@mui/icons-material';
import dataManagementApi from '@/api/dataManagement';

interface FileUploadStepProps {
  onUpload: (file: File, columns: string[]) => void;
}

export default function FileUploadStep({ onUpload }: FileUploadStepProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    multiple: false,
    onDrop: async (acceptedFiles) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setUploadedFile(file);
      setUploading(true);
      setError(null);

      try {
        const columns = await dataManagementApi.detectColumns(file);
        onUpload(file, columns);
      } catch (err) {
        const error = err as { response?: { data?: { detail?: string } } };
        setError(error.response?.data?.detail || 'Failed to detect columns');
      } finally {
        setUploading(false);
      }
    },
  });

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Upload Import File
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Upload a CSV or Excel file containing the data you want to import
      </Typography>

      <Paper
        {...getRootProps()}
        sx={{
          mt: 3,
          p: 6,
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
          bgcolor: isDragActive ? 'action.hover' : 'background.paper',
          cursor: 'pointer',
          textAlign: 'center',
          transition: 'all 0.2s',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover',
          },
        }}
      >
        <input {...getInputProps()} />
        <UploadIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
        {uploading ? (
          <>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography>Analyzing file...</Typography>
          </>
        ) : uploadedFile ? (
          <>
            <Typography variant="h6" gutterBottom>
              {uploadedFile.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {(uploadedFile.size / 1024).toFixed(2)} KB
            </Typography>
            <Button variant="outlined" sx={{ mt: 2 }}>
              Choose Different File
            </Button>
          </>
        ) : (
          <>
            <Typography variant="h6" gutterBottom>
              {isDragActive ? 'Drop the file here' : 'Drag & drop a file here'}
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              or
            </Typography>
            <Button variant="contained" sx={{ mt: 1 }}>
              Browse Files
            </Button>
            <Typography variant="caption" display="block" sx={{ mt: 2 }} color="text.secondary">
              Supported formats: CSV, XLS, XLSX
            </Typography>
          </>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
