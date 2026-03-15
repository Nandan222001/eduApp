import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Chip,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import { CloudUpload, AutoAwesome } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { useMutation, useQuery } from '@tanstack/react-query';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { documentVaultApi } from '@/api/documentVault';
import { parentsApi } from '@/api/parents';
import { DocumentType } from '@/types/documentVault';

interface DocumentUploaderProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const documentTypeOptions = [
  { value: DocumentType.IMMUNIZATION_RECORD, label: 'Immunization Record' },
  { value: DocumentType.MEDICAL_RECORD, label: 'Medical Record' },
  { value: DocumentType.BIRTH_CERTIFICATE, label: 'Birth Certificate' },
  { value: DocumentType.ID_CARD, label: 'ID Card' },
  { value: DocumentType.PERMISSION_SLIP, label: 'Permission Slip' },
  { value: DocumentType.EMERGENCY_CONTACT, label: 'Emergency Contact' },
  { value: DocumentType.INSURANCE_CARD, label: 'Insurance Card' },
  { value: DocumentType.REPORT_CARD, label: 'Report Card' },
  { value: DocumentType.IEP_DOCUMENT, label: 'IEP Document' },
  { value: DocumentType.ATTENDANCE_EXCUSE, label: 'Attendance Excuse' },
  { value: DocumentType.OTHER, label: 'Other' },
];

export const DocumentUploader: React.FC<DocumentUploaderProps> = ({ open, onClose, onSuccess }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [childId, setChildId] = useState<number | ''>('');
  const [documentType, setDocumentType] = useState<DocumentType | ''>('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expiryDate, setExpiryDate] = useState<Date | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [ocrSuggestions, setOcrSuggestions] = useState<{
    document_type?: DocumentType;
    confidence?: number;
  } | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);

  const { data: children } = useQuery({
    queryKey: ['parent-children'],
    queryFn: () => parentsApi.getChildren(),
    enabled: open,
  });

  const uploadMutation = useMutation({
    mutationFn: documentVaultApi.uploadDocument,
    onSuccess: () => {
      if (currentFileIndex < files.length - 1) {
        setCurrentFileIndex(currentFileIndex + 1);
        resetForm();
      } else {
        onSuccess();
        handleClose();
      }
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setFiles(acceptedFiles);
      if (acceptedFiles.length > 0) {
        setActiveStep(1);
        performOCR(acceptedFiles[0]);
      }
    },
    [performOCR]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
    },
    maxSize: 10485760,
  });

  const performOCR = async (file: File) => {
    setOcrLoading(true);
    try {
      const suggestions = await documentVaultApi.performOCR(file);
      setOcrSuggestions(suggestions);
      if (suggestions.document_type) {
        setDocumentType(suggestions.document_type);
      }
      if (!title && file.name) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
    } catch (error) {
      console.error('OCR failed:', error);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    setTags(tags.filter((tag) => tag !== tagToDelete));
  };

  const handleUpload = async () => {
    if (!childId || !documentType || !title || files.length === 0) return;

    await uploadMutation.mutateAsync({
      child_id: childId as number,
      document_type: documentType as DocumentType,
      title,
      description,
      expiry_date: expiryDate?.toISOString(),
      tags,
      file: files[currentFileIndex],
    });
  };

  const resetForm = () => {
    setDocumentType('');
    setTitle('');
    setDescription('');
    setExpiryDate(null);
    setTags([]);
    setOcrSuggestions(null);
  };

  const handleClose = () => {
    setActiveStep(0);
    setFiles([]);
    setCurrentFileIndex(0);
    resetForm();
    setChildId('');
    onClose();
  };

  const steps = ['Upload Files', 'Document Details', 'Review & Submit'];

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Upload Documents</DialogTitle>

      <DialogContent>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <Box
            {...getRootProps()}
            sx={{
              border: '2px dashed',
              borderColor: isDragActive ? 'primary.main' : 'grey.400',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              bgcolor: isDragActive ? 'action.hover' : 'background.paper',
              transition: 'all 0.3s',
              minHeight: 200,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <input {...getInputProps()} />
            <CloudUpload sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              or click to browse
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2 }}>
              Supports PDF and images (max 10MB per file)
            </Typography>
          </Box>
        )}

        {activeStep === 1 && files.length > 0 && (
          <Box>
            {ocrLoading && (
              <Alert severity="info" icon={<CircularProgress size={20} />} sx={{ mb: 2 }}>
                Analyzing document with OCR...
              </Alert>
            )}

            {ocrSuggestions && (
              <Alert
                severity="success"
                icon={<AutoAwesome />}
                sx={{ mb: 2 }}
                action={
                  <Button
                    size="small"
                    onClick={() => {
                      if (ocrSuggestions.document_type) {
                        setDocumentType(ocrSuggestions.document_type);
                      }
                    }}
                  >
                    Apply
                  </Button>
                }
              >
                OCR detected: {ocrSuggestions.document_type?.replace(/_/g, ' ')} (
                {Math.round(ocrSuggestions.confidence * 100)}% confidence)
              </Alert>
            )}

            <Typography variant="subtitle2" gutterBottom>
              File {currentFileIndex + 1} of {files.length}: {files[currentFileIndex].name}
            </Typography>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Child</InputLabel>
              <Select
                value={childId}
                onChange={(e) => setChildId(e.target.value as number)}
                label="Child"
              >
                {children?.map((child) => (
                  <MenuItem key={child.id} value={child.id}>
                    {child.first_name} {child.last_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                label="Document Type"
              >
                {documentTypeOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Document Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{ mt: 2 }}
              required
            />

            <TextField
              fullWidth
              label="Description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={3}
              sx={{ mt: 2 }}
            />

            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Expiry Date (optional)"
                value={expiryDate}
                onChange={(newValue) => setExpiryDate(newValue)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    sx: { mt: 2 },
                  },
                }}
              />
            </LocalizationProvider>

            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Add Tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                helperText="Press Enter to add tags"
              />
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 1 }}>
                {tags.map((tag) => (
                  <Chip key={tag} label={tag} onDelete={() => handleDeleteTag(tag)} size="small" />
                ))}
              </Box>
            </Box>
          </Box>
        )}

        {activeStep === 2 && (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Upload
            </Typography>
            <Typography variant="body2" paragraph>
              You are uploading {files.length} document(s).
            </Typography>
            <Alert severity="info">
              Click Submit to upload all documents. You can track the progress in the document
              vault.
            </Alert>
          </Box>
        )}

        {uploadMutation.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Upload failed. Please try again.
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose}>Cancel</Button>
        {activeStep > 0 && activeStep < 2 && (
          <Button onClick={() => setActiveStep(activeStep - 1)}>Back</Button>
        )}
        {activeStep === 1 && (
          <Button
            variant="contained"
            onClick={() => setActiveStep(2)}
            disabled={!childId || !documentType || !title}
          >
            Next
          </Button>
        )}
        {activeStep === 2 && (
          <Button
            variant="contained"
            onClick={handleUpload}
            disabled={uploadMutation.isPending}
            startIcon={uploadMutation.isPending ? <CircularProgress size={20} /> : <CloudUpload />}
          >
            {uploadMutation.isPending ? 'Uploading...' : 'Submit'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};
