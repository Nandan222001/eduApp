import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import { Search, Pending, CheckCircle, Cancel, Dashboard } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { documentVaultApi } from '@/api/documentVault';
import { DocumentStatus, DocumentType } from '@/types/documentVault';
import { AdminVerificationQueue } from '@/components/documentVault/AdminVerificationQueue';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index } = props;
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const AdminDocumentVerification: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<DocumentType | ''>('');

  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useQuery({
    queryKey: ['document-vault-stats'],
    queryFn: () => documentVaultApi.getVaultStats(),
  });

  const {
    data: allDocuments,
    isLoading: documentsLoading,
    refetch: _refetchDocuments,
  } = useQuery({
    queryKey: ['all-documents', { search_query: searchQuery, document_type: filterType }],
    queryFn: () =>
      documentVaultApi.getDocuments({
        search_query: searchQuery || undefined,
        document_type: filterType || undefined,
      }),
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const getFilteredDocuments = () => {
    if (!allDocuments) return [];

    switch (currentTab) {
      case 0:
        return allDocuments.filter((d) => d.status === DocumentStatus.PENDING);
      case 1:
        return allDocuments.filter((d) => d.status === DocumentStatus.VERIFIED);
      case 2:
        return allDocuments.filter((d) => d.status === DocumentStatus.REJECTED);
      default:
        return allDocuments;
    }
  };

  const filteredDocuments = getFilteredDocuments();

  if (statsLoading) {
    return (
      <Container maxWidth="xl">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (statsError) {
    return (
      <Container maxWidth="xl">
        <Box sx={{ py: 3 }}>
          <Alert severity="error">Failed to load document vault data.</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box sx={{ py: 3 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" gutterBottom>
            Document Verification
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Review and verify documents submitted by parents
          </Typography>
        </Box>

        {stats && (
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main">
                  {stats.pending_verification}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Verification
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {allDocuments?.filter((d) => d.status === DocumentStatus.VERIFIED).length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Verified
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="error.main">
                  {allDocuments?.filter((d) => d.status === DocumentStatus.REJECTED).length || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Rejected
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Paper sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main">
                  {stats.total_documents}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Documents
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        )}

        <Paper sx={{ mb: 3, p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Document Type</InputLabel>
                <Select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as DocumentType | '')}
                  label="Document Type"
                >
                  <MenuItem value="">All Types</MenuItem>
                  {Object.values(DocumentType).map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.replace(/_/g, ' ')}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <Chip
                icon={<Dashboard />}
                label={`${filteredDocuments.length} documents`}
                color="primary"
                variant="outlined"
              />
            </Grid>
          </Grid>
        </Paper>

        <Paper>
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab
              icon={<Pending />}
              label={`Pending (${allDocuments?.filter((d) => d.status === DocumentStatus.PENDING).length || 0})`}
              iconPosition="start"
            />
            <Tab
              icon={<CheckCircle />}
              label={`Verified (${allDocuments?.filter((d) => d.status === DocumentStatus.VERIFIED).length || 0})`}
              iconPosition="start"
            />
            <Tab
              icon={<Cancel />}
              label={`Rejected (${allDocuments?.filter((d) => d.status === DocumentStatus.REJECTED).length || 0})`}
              iconPosition="start"
            />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {documentsLoading ? (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TabPanel value={currentTab} index={0}>
                  <AdminVerificationQueue documents={filteredDocuments} />
                </TabPanel>

                <TabPanel value={currentTab} index={1}>
                  {filteredDocuments.length === 0 ? (
                    <Alert severity="info">No verified documents yet.</Alert>
                  ) : (
                    <AdminVerificationQueue documents={filteredDocuments} />
                  )}
                </TabPanel>

                <TabPanel value={currentTab} index={2}>
                  {filteredDocuments.length === 0 ? (
                    <Alert severity="info">No rejected documents.</Alert>
                  ) : (
                    <AdminVerificationQueue documents={filteredDocuments} />
                  )}
                </TabPanel>
              </>
            )}
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default AdminDocumentVerification;
