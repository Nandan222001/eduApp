import React, { useState, useCallback } from 'react';
import {
  Container,
  Grid,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  TextField,
  InputAdornment,
  Alert,
  CircularProgress,
  Chip,
  Badge,
} from '@mui/material';
import {
  CloudUpload,
  Search,
  Notifications,
  Assignment,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { documentVaultApi } from '@/api/documentVault';
import { DocumentSearchFilters, DocumentType, RequestStatus } from '@/types/documentVault';
import { FolderTreeNavigation } from '@/components/documentVault/FolderTreeNavigation';
import { DocumentGrid } from '@/components/documentVault/DocumentGrid';
import { DocumentUploader } from '@/components/documentVault/DocumentUploader';
import { DocumentViewer } from '@/components/documentVault/DocumentViewer';
import { DocumentRequestPanel } from '@/components/documentVault/DocumentRequestPanel';
import { ExpiryReminders } from '@/components/documentVault/ExpiryReminders';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const FamilyDocumentVault: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<DocumentSearchFilters>({});
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
  const [selectedChildId, setSelectedChildId] = useState<number | undefined>(undefined);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | undefined>(
    undefined
  );

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['document-vault-stats'],
    queryFn: () => documentVaultApi.getVaultStats(),
  });

  const { data: folders, isLoading: foldersLoading } = useQuery({
    queryKey: ['document-folders'],
    queryFn: () => documentVaultApi.getFolders(),
  });

  const {
    data: documents,
    isLoading: documentsLoading,
    refetch: refetchDocuments,
  } = useQuery({
    queryKey: ['documents', filters],
    queryFn: () => documentVaultApi.getDocuments(filters),
  });

  const {
    data: requests,
    isLoading: requestsLoading,
    refetch: refetchRequests,
  } = useQuery({
    queryKey: ['document-requests'],
    queryFn: () => documentVaultApi.getDocumentRequests(),
  });

  const { data: reminders, isLoading: remindersLoading } = useQuery({
    queryKey: ['expiry-reminders'],
    queryFn: () => documentVaultApi.getExpiryReminders(),
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleSearch = useCallback(() => {
    setFilters((prev) => ({
      ...prev,
      search_query: searchQuery || undefined,
    }));
  }, [searchQuery]);

  const handleFolderSelect = useCallback((childId: number, documentType?: DocumentType) => {
    setSelectedChildId(childId);
    setSelectedDocumentType(documentType);
    setFilters({
      child_id: childId,
      document_type: documentType,
    });
  }, []);

  const handleDocumentClick = useCallback((documentId: number) => {
    setSelectedDocumentId(documentId);
    setViewerOpen(true);
  }, []);

  const handleUploadSuccess = useCallback(() => {
    setUploadDialogOpen(false);
    refetchDocuments();
    refetchRequests();
  }, [refetchDocuments, refetchRequests]);

  const handleRequestFulfilled = useCallback(() => {
    refetchDocuments();
    refetchRequests();
  }, [refetchDocuments, refetchRequests]);

  const pendingRequestsCount =
    requests?.filter((r) => r.status === RequestStatus.REQUESTED).length || 0;
  const expiringSoonCount = stats?.expiring_soon || 0;

  if (statsLoading || foldersLoading) {
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
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Family Document Vault
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Securely store and manage all your family&apos;s important documents
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<CloudUpload />}
            onClick={() => setUploadDialogOpen(true)}
            size="large"
          >
            Upload Documents
          </Button>
        </Box>

        {stats && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary">
                  {stats.total_documents}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Documents
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {stats.pending_verification}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Verification
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="error.main">
                  {stats.expiring_soon}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Expiring Soon
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="info.main">
                  {stats.pending_requests}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Requests
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {stats.storage_used_mb.toFixed(1)}
                  <Typography component="span" variant="body1">
                    MB
                  </Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Storage Used
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        )}

        <Paper sx={{ mb: 3 }}>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab icon={<DashboardIcon />} label="All Documents" iconPosition="start" />
            <Tab
              icon={
                <Badge badgeContent={pendingRequestsCount} color="error">
                  <Assignment />
                </Badge>
              }
              label="Requests"
              iconPosition="start"
            />
            <Tab
              icon={
                <Badge badgeContent={expiringSoonCount} color="warning">
                  <Notifications />
                </Badge>
              }
              label="Reminders"
              iconPosition="start"
            />
          </Tabs>
        </Paper>

        <TabPanel value={currentTab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Paper sx={{ p: 2, height: '100%' }}>
                {folders && (
                  <FolderTreeNavigation
                    folders={folders}
                    selectedChildId={selectedChildId}
                    selectedDocumentType={selectedDocumentType}
                    onFolderSelect={handleFolderSelect}
                  />
                )}
              </Paper>
            </Grid>

            <Grid item xs={12} md={9}>
              <Box sx={{ mb: 3 }}>
                <TextField
                  fullWidth
                  placeholder="Search documents by name, type, or OCR text..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search />
                      </InputAdornment>
                    ),
                    endAdornment: searchQuery && (
                      <InputAdornment position="end">
                        <Button onClick={handleSearch}>Search</Button>
                      </InputAdornment>
                    ),
                  }}
                />
                {(selectedChildId || selectedDocumentType) && (
                  <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {selectedChildId && (
                      <Chip
                        label={`Child: ${folders?.find((f) => f.child_id === selectedChildId)?.child_name}`}
                        onDelete={() => {
                          setSelectedChildId(undefined);
                          setFilters((prev) => ({ ...prev, child_id: undefined }));
                        }}
                      />
                    )}
                    {selectedDocumentType && (
                      <Chip
                        label={`Type: ${selectedDocumentType.replace(/_/g, ' ')}`}
                        onDelete={() => {
                          setSelectedDocumentType(undefined);
                          setFilters((prev) => ({ ...prev, document_type: undefined }));
                        }}
                      />
                    )}
                    {(selectedChildId || selectedDocumentType) && (
                      <Chip
                        label="Clear All"
                        color="error"
                        variant="outlined"
                        onClick={() => {
                          setSelectedChildId(undefined);
                          setSelectedDocumentType(undefined);
                          setFilters({});
                        }}
                      />
                    )}
                  </Box>
                )}
              </Box>

              {documentsLoading ? (
                <Box display="flex" justifyContent="center" py={4}>
                  <CircularProgress />
                </Box>
              ) : documents && documents.length > 0 ? (
                <DocumentGrid documents={documents} onDocumentClick={handleDocumentClick} />
              ) : (
                <Alert severity="info">
                  No documents found. Upload your first document to get started!
                </Alert>
              )}
            </Grid>
          </Grid>
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          {requestsLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : requests ? (
            <DocumentRequestPanel
              requests={requests}
              onRequestFulfilled={handleRequestFulfilled}
              onUploadForRequest={() => {
                setUploadDialogOpen(true);
              }}
            />
          ) : (
            <Alert severity="info">No document requests at this time.</Alert>
          )}
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          {remindersLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : reminders && reminders.length > 0 ? (
            <ExpiryReminders reminders={reminders} onDocumentClick={handleDocumentClick} />
          ) : (
            <Alert severity="success">All documents are up to date!</Alert>
          )}
        </TabPanel>

        <DocumentUploader
          open={uploadDialogOpen}
          onClose={() => setUploadDialogOpen(false)}
          onSuccess={handleUploadSuccess}
        />

        {selectedDocumentId && (
          <DocumentViewer
            open={viewerOpen}
            documentId={selectedDocumentId}
            onClose={() => {
              setViewerOpen(false);
              setSelectedDocumentId(null);
            }}
            onUpdate={refetchDocuments}
          />
        )}
      </Box>
    </Container>
  );
};

export default FamilyDocumentVault;
