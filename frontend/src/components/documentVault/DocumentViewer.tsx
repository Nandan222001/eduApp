import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  Typography,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  Paper,
} from '@mui/material';
import { Close, GetApp, Share, Visibility, Delete } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { documentVaultApi } from '@/api/documentVault';
import { DocumentStatus } from '@/types/documentVault';
import { SharingModal } from './SharingModal';
import { AccessLogsPanel } from './AccessLogsPanel';

interface DocumentViewerProps {
  open: boolean;
  documentId: number;
  onClose: () => void;
  onUpdate: () => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
    </div>
  );
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  open,
  documentId,
  onClose,
  onUpdate,
}) => {
  const [currentTab, setCurrentTab] = useState(0);
  const [sharingModalOpen, setSharingModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const {
    data: document,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => documentVaultApi.getDocument(documentId),
    enabled: open,
  });

  const { data: accessLogs } = useQuery({
    queryKey: ['document-access-logs', documentId],
    queryFn: () => documentVaultApi.getAccessLogs(documentId),
    enabled: open && currentTab === 1,
  });

  const downloadMutation = useMutation({
    mutationFn: () => documentVaultApi.downloadDocument(documentId),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = document?.file_name || 'document';
      window.document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      window.document.body.removeChild(a);
      queryClient.invalidateQueries({ queryKey: ['document-access-logs', documentId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => documentVaultApi.deleteDocument(documentId),
    onSuccess: () => {
      onUpdate();
      onClose();
    },
  });

  const handleDownload = () => {
    downloadMutation.mutate();
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      deleteMutation.mutate();
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.VERIFIED:
        return 'success';
      case DocumentStatus.PENDING:
        return 'warning';
      case DocumentStatus.REJECTED:
      case DocumentStatus.EXPIRED:
        return 'error';
      default:
        return 'default';
    }
  };

  const renderContent = () => {
    if (!document) return null;

    if (document.mime_type.startsWith('image/')) {
      return (
        <Box sx={{ textAlign: 'center', bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
          <img
            src={document.file_url}
            alt={document.title}
            style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain' }}
          />
        </Box>
      );
    }

    if (document.mime_type === 'application/pdf') {
      return (
        <Box sx={{ height: '60vh', width: '100%', bgcolor: 'grey.100', borderRadius: 1 }}>
          <iframe
            src={document.file_url}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title={document.title}
          />
        </Box>
      );
    }

    return (
      <Alert severity="info">
        Preview not available for this file type. Please download to view.
      </Alert>
    );
  };

  if (!open) return null;

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">{document?.title || 'Loading...'}</Typography>
            <IconButton onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {isLoading && (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          )}

          {error && <Alert severity="error">Failed to load document. Please try again.</Alert>}

          {document && (
            <>
              <Tabs value={currentTab} onChange={(_, v) => setCurrentTab(v)} sx={{ mb: 2 }}>
                <Tab icon={<Visibility />} label="Preview" iconPosition="start" />
                <Tab label="Details" />
                <Tab label="Access Logs" />
              </Tabs>

              <TabPanel value={currentTab} index={0}>
                {renderContent()}
              </TabPanel>

              <TabPanel value={currentTab} index={1}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    <Chip
                      label={document.status}
                      color={getStatusColor(document.status)}
                      size="small"
                    />
                    <Chip
                      label={document.document_type.replace(/_/g, ' ')}
                      variant="outlined"
                      size="small"
                    />
                    {document.tags.map((tag) => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                  </Box>

                  {document.description && (
                    <>
                      <Typography variant="subtitle2" gutterBottom>
                        Description
                      </Typography>
                      <Typography variant="body2" color="text.secondary" paragraph>
                        {document.description}
                      </Typography>
                    </>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Typography variant="subtitle2" gutterBottom>
                    Document Information
                  </Typography>

                  <List dense>
                    <ListItem>
                      <ListItemText
                        primary="Child"
                        secondary={document.child_name}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="File Name"
                        secondary={document.file_name}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="File Size"
                        secondary={formatFileSize(document.file_size)}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemText
                        primary="Upload Date"
                        secondary={format(new Date(document.upload_date), 'PPP')}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                      />
                    </ListItem>
                    {document.expiry_date && (
                      <ListItem>
                        <ListItemText
                          primary="Expiry Date"
                          secondary={format(new Date(document.expiry_date), 'PPP')}
                          primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                        />
                      </ListItem>
                    )}
                    {document.verified_by && (
                      <>
                        <ListItem>
                          <ListItemText
                            primary="Verified By"
                            secondary={document.verified_by}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                          />
                        </ListItem>
                        <ListItem>
                          <ListItemText
                            primary="Verified Date"
                            secondary={
                              document.verified_date
                                ? format(new Date(document.verified_date), 'PPP')
                                : 'N/A'
                            }
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                          />
                        </ListItem>
                      </>
                    )}
                    {document.rejection_reason && (
                      <ListItem>
                        <ListItemText
                          primary="Rejection Reason"
                          secondary={document.rejection_reason}
                          primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                          secondaryTypographyProps={{ color: 'error' }}
                        />
                      </ListItem>
                    )}
                  </List>
                </Paper>
              </TabPanel>

              <TabPanel value={currentTab} index={2}>
                <AccessLogsPanel logs={accessLogs || []} />
              </TabPanel>
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={handleDelete} color="error" startIcon={<Delete />}>
            Delete
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={() => setSharingModalOpen(true)} startIcon={<Share />}>
            Share
          </Button>
          <Button
            onClick={handleDownload}
            variant="contained"
            startIcon={downloadMutation.isPending ? <CircularProgress size={20} /> : <GetApp />}
            disabled={downloadMutation.isPending}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>

      {document && (
        <SharingModal
          open={sharingModalOpen}
          onClose={() => setSharingModalOpen(false)}
          documentId={documentId}
          documentTitle={document.title}
        />
      )}
    </>
  );
};
