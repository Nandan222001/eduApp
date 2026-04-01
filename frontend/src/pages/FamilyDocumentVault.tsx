import React, { useState, useCallback } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  IconButton,
  Breadcrumbs,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  CircularProgress,
  Menu,
  ListItemIcon,
  ListItemText,
  Divider,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  CloudUpload,
  Folder,
  InsertDriveFile,
  MoreVert,
  Download,
  Share,
  Delete,
  Edit,
  Visibility,
  NavigateNext,
  CreateNewFolder,
  Security,
  History,
  VerifiedUser,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDropzone } from 'react-dropzone';
import { format } from 'date-fns';

interface Document {
  id: number;
  title: string;
  description?: string;
  document_type: string;
  file_name: string;
  file_size: number;
  file_type: string;
  encrypted_file_url: string;
  ocr_text?: string;
  extracted_metadata?: Record<string, unknown>;
  tags?: string[];
  status: string;
  is_verified: boolean;
  issue_date?: string;
  expiry_date?: string;
  created_at: string;
  updated_at: string;
}

interface Folder {
  id: number;
  name: string;
  description?: string;
  color?: string;
  icon?: string;
  parent_folder_id?: number;
  created_at: string;
  updated_at: string;
}

const DOCUMENT_TYPES = [
  { value: 'birth_certificate', label: 'Birth Certificate', icon: '👶' },
  { value: 'immunization_record', label: 'Immunization Record', icon: '💉' },
  { value: 'iep', label: 'IEP', icon: '📋' },
  { value: 'transcript', label: 'Transcript', icon: '📄' },
  { value: 'report_card', label: 'Report Card', icon: '📊' },
  { value: 'medical_record', label: 'Medical Record', icon: '🏥' },
  { value: 'passport', label: 'Passport', icon: '🛂' },
  { value: 'id_card', label: 'ID Card', icon: '🪪' },
  { value: 'proof_of_residence', label: 'Proof of Residence', icon: '🏠' },
  { value: 'other', label: 'Other', icon: '📎' },
];

export const FamilyDocumentVault: React.FC = () => {
  const queryClient = useQueryClient();
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [folderPath, setFolderPath] = useState<Folder[]>([]);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    document_type: '',
    student_id: null as number | null,
    tags: [] as string[],
    issue_date: '',
    expiry_date: '',
  });

  // Folder form state
  const [folderForm, setFolderForm] = useState({
    name: '',
    description: '',
    color: '#1976d2',
    icon: 'folder',
  });

  // Fetch documents
  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['family-documents', currentFolderId],
    queryFn: async () => {
      // API call to fetch documents
      return [] as Document[];
    },
  });

  // Fetch folders
  const { data: folders, isLoading: foldersLoading } = useQuery({
    queryKey: ['document-folders', currentFolderId],
    queryFn: async () => {
      // API call to fetch folders
      return [] as Folder[];
    },
  });

  // File upload with drag & drop
  const onDrop = useCallback((acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      // Process file upload
      const reader = new FileReader();
      reader.onload = () => {
        // Trigger OCR categorization
        performOCRCategorization(file);
      };
      reader.readAsArrayBuffer(file);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
  });

  const performOCRCategorization = async (file: File) => {
    // Simulate OCR processing
    console.log('Performing OCR on:', file.name);
    // Auto-detect document type based on OCR results
    // Open upload dialog with pre-filled information
    setUploadDialogOpen(true);
  };

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (_data: FormData) => {
      // API call to upload document with AES-256 encryption
      return {};
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['family-documents'] });
      setUploadDialogOpen(false);
      resetUploadForm();
    },
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (_data: typeof folderForm) => {
      // API call to create folder
      return {};
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-folders'] });
      setFolderDialogOpen(false);
      resetFolderForm();
    },
  });

  const resetUploadForm = () => {
    setUploadForm({
      title: '',
      description: '',
      document_type: '',
      student_id: null,
      tags: [],
      issue_date: '',
      expiry_date: '',
    });
  };

  const resetFolderForm = () => {
    setFolderForm({
      name: '',
      description: '',
      color: '#1976d2',
      icon: 'folder',
    });
  };

  const handleFolderClick = (folder: Folder) => {
    setCurrentFolderId(folder.id);
    setFolderPath([...folderPath, folder]);
  };

  const handleBreadcrumbClick = (index: number) => {
    if (index === -1) {
      setCurrentFolderId(null);
      setFolderPath([]);
    } else {
      const folder = folderPath[index];
      setCurrentFolderId(folder.id);
      setFolderPath(folderPath.slice(0, index + 1));
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, doc: Document) => {
    setAnchorEl(event.currentTarget);
    setSelectedDocument(doc);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedDocument(null);
  };

  const handleDownload = (doc: Document) => {
    // Decrypt and download document
    console.log('Downloading:', doc.title);
    handleMenuClose();
  };

  const handleShare = (_doc: Document) => {
    setShareDialogOpen(true);
    handleMenuClose();
  };

  const handleDelete = (_doc: Document) => {
    if (confirm(`Are you sure you want to delete this document?`)) {
      // Delete document
      console.log('Deleting document');
    }
    handleMenuClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getDocumentIcon = (type: string) => {
    const docType = DOCUMENT_TYPES.find((t) => t.value === type);
    return docType?.icon || '📄';
  };

  if (documentsLoading || foldersLoading) {
    return (
      <Container maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
              Family Document Vault
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Securely store and manage your family&apos;s important documents with FERPA-compliant
              AES-256 encryption
            </Typography>
          </Box>
          <Box>
            <Button
              variant="outlined"
              startIcon={<CreateNewFolder />}
              onClick={() => setFolderDialogOpen(true)}
              sx={{ mr: 1 }}
            >
              New Folder
            </Button>
            <Button
              variant="contained"
              startIcon={<CloudUpload />}
              onClick={() => setUploadDialogOpen(true)}
            >
              Upload Document
            </Button>
          </Box>
        </Box>

        {/* Breadcrumb Navigation */}
        <Breadcrumbs separator={<NavigateNext fontSize="small" />} sx={{ mb: 3 }}>
          <Link
            component="button"
            underline="hover"
            color="inherit"
            onClick={() => handleBreadcrumbClick(-1)}
          >
            <Folder sx={{ mr: 0.5, fontSize: 20, verticalAlign: 'middle' }} />
            My Documents
          </Link>
          {folderPath.map((folder, index) => (
            <Link
              key={folder.id}
              component="button"
              underline="hover"
              color={index === folderPath.length - 1 ? 'text.primary' : 'inherit'}
              onClick={() => handleBreadcrumbClick(index)}
            >
              {folder.name}
            </Link>
          ))}
        </Breadcrumbs>

        {/* Tabs */}
        <Tabs value={selectedTab} onChange={(_e, v) => setSelectedTab(v)} sx={{ mb: 3 }}>
          <Tab label="All Documents" />
          <Tab label="Recent" />
          <Tab label="Shared with Me" />
          <Tab label="Expiring Soon" />
        </Tabs>

        {/* Drag & Drop Upload Area */}
        <Paper
          {...getRootProps()}
          sx={{
            p: 4,
            mb: 3,
            textAlign: 'center',
            border: '2px dashed',
            borderColor: isDragActive ? 'primary.main' : 'grey.300',
            bgcolor: isDragActive ? 'action.hover' : 'background.paper',
            cursor: 'pointer',
          }}
        >
          <input {...getInputProps()} />
          <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            {isDragActive ? 'Drop files here' : 'Drag & drop files here or click to upload'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Supports PDF, images, and documents. OCR will automatically categorize your documents.
          </Typography>
        </Paper>

        {/* Folders Grid */}
        {folders && folders.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Folders
            </Typography>
            <Grid container spacing={2}>
              {folders.map((folder) => (
                <Grid item xs={12} sm={6} md={3} key={folder.id}>
                  <Card
                    sx={{ cursor: 'pointer', '&:hover': { boxShadow: 3 } }}
                    onClick={() => handleFolderClick(folder)}
                  >
                    <CardContent>
                      <Folder sx={{ fontSize: 48, color: folder.color || 'primary.main', mb: 1 }} />
                      <Typography variant="h6" noWrap>
                        {folder.name}
                      </Typography>
                      {folder.description && (
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {folder.description}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Documents Table */}
        <Paper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Document</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Size</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Uploaded</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents && documents.length > 0 ? (
                  documents.map((doc) => (
                    <TableRow key={doc.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ mr: 2, bgcolor: 'primary.light' }}>
                            {getDocumentIcon(doc.document_type)}
                          </Avatar>
                          <Box>
                            <Typography variant="body1">{doc.title}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {doc.file_name}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={DOCUMENT_TYPES.find((t) => t.value === doc.document_type)?.label}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{formatFileSize(doc.file_size)}</TableCell>
                      <TableCell>
                        {doc.is_verified ? (
                          <Chip
                            icon={<VerifiedUser />}
                            label="Verified"
                            size="small"
                            color="success"
                          />
                        ) : (
                          <Chip label={doc.status} size="small" />
                        )}
                      </TableCell>
                      <TableCell>{format(new Date(doc.created_at), 'MMM dd, yyyy')}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="View">
                          <IconButton size="small">
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Download">
                          <IconButton size="small" onClick={() => handleDownload(doc)}>
                            <Download />
                          </IconButton>
                        </Tooltip>
                        <IconButton size="small" onClick={(e) => handleMenuOpen(e, doc)}>
                          <MoreVert />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Box sx={{ py: 4 }}>
                        <InsertDriveFile sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                          No documents found
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Upload your first document to get started
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>

        {/* Context Menu */}
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={() => selectedDocument && handleShare(selectedDocument)}>
            <ListItemIcon>
              <Share fontSize="small" />
            </ListItemIcon>
            <ListItemText>Share</ListItemText>
          </MenuItem>
          <MenuItem>
            <ListItemIcon>
              <Edit fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit Details</ListItemText>
          </MenuItem>
          <MenuItem>
            <ListItemIcon>
              <History fontSize="small" />
            </ListItemIcon>
            <ListItemText>Access History</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem onClick={() => selectedDocument && handleDelete(selectedDocument)}>
            <ListItemIcon>
              <Delete fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Delete</ListItemText>
          </MenuItem>
        </Menu>

        {/* Upload Dialog */}
        <Dialog
          open={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Upload Document</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Title"
              value={uploadForm.title}
              onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
              margin="normal"
              multiline
              rows={3}
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Document Type</InputLabel>
              <Select
                value={uploadForm.document_type}
                onChange={(e) => setUploadForm({ ...uploadForm, document_type: e.target.value })}
                label="Document Type"
              >
                {DOCUMENT_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Issue Date"
              type="date"
              value={uploadForm.issue_date}
              onChange={(e) => setUploadForm({ ...uploadForm, issue_date: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              fullWidth
              label="Expiry Date"
              type="date"
              value={uploadForm.expiry_date}
              onChange={(e) => setUploadForm({ ...uploadForm, expiry_date: e.target.value })}
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <Alert severity="info" sx={{ mt: 2 }}>
              <Security sx={{ mr: 1, verticalAlign: 'middle' }} />
              Documents are encrypted with AES-256 and comply with FERPA regulations
            </Alert>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => uploadMutation.mutate(new FormData())}>
              Upload
            </Button>
          </DialogActions>
        </Dialog>

        {/* Create Folder Dialog */}
        <Dialog
          open={folderDialogOpen}
          onClose={() => setFolderDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Create New Folder</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Folder Name"
              value={folderForm.name}
              onChange={(e) => setFolderForm({ ...folderForm, name: e.target.value })}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              value={folderForm.description}
              onChange={(e) => setFolderForm({ ...folderForm, description: e.target.value })}
              margin="normal"
              multiline
              rows={2}
            />
            <TextField
              fullWidth
              label="Color"
              type="color"
              value={folderForm.color}
              onChange={(e) => setFolderForm({ ...folderForm, color: e.target.value })}
              margin="normal"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setFolderDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => createFolderMutation.mutate(folderForm)}>
              Create
            </Button>
          </DialogActions>
        </Dialog>

        {/* Share Dialog */}
        <Dialog
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>Share Document</DialogTitle>
          <DialogContent>
            <Alert severity="info" sx={{ mb: 2 }}>
              Share documents with teachers, administrators, or other authorized personnel with
              role-based permissions
            </Alert>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              margin="normal"
              helperText="Enter the email of the person you want to share with"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Permission Level</InputLabel>
              <Select label="Permission Level" defaultValue="view">
                <MenuItem value="view">View Only</MenuItem>
                <MenuItem value="download">View & Download</MenuItem>
                <MenuItem value="edit">View, Download & Edit</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Expiry Date (Optional)"
              type="date"
              margin="normal"
              InputLabelProps={{ shrink: true }}
              helperText="Set an expiry date for temporary access"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
            <Button variant="contained">Share</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default FamilyDocumentVault;
