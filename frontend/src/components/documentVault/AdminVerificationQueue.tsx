import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  Chip,
  Alert,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
} from '@mui/material';
import { CheckCircle, Cancel, Visibility, Description } from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Document, DocumentStatus } from '@/types/documentVault';
import { documentVaultApi } from '@/api/documentVault';
import { format } from 'date-fns';

interface AdminVerificationQueueProps {
  documents: Document[];
}

export const AdminVerificationQueue: React.FC<AdminVerificationQueueProps> = ({ documents }) => {
  const [selectedDocument, setSelectedDocument] = useState<Document | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const queryClient = useQueryClient();

  const verifyMutation = useMutation({
    mutationFn: ({
      documentId,
      status,
      reason,
    }: {
      documentId: number;
      status: DocumentStatus;
      reason?: string;
    }) =>
      documentVaultApi.verifyDocument(documentId, {
        status,
        rejection_reason: reason,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setRejectDialogOpen(false);
      setSelectedDocument(null);
      setRejectionReason('');
    },
  });

  const handleApprove = (document: Document) => {
    verifyMutation.mutate({
      documentId: document.id,
      status: DocumentStatus.VERIFIED,
    });
  };

  const handleReject = () => {
    if (!selectedDocument || !rejectionReason.trim()) return;

    verifyMutation.mutate({
      documentId: selectedDocument.id,
      status: DocumentStatus.REJECTED,
      reason: rejectionReason,
    });
  };

  const handleRequestReupload = (document: Document) => {
    setSelectedDocument(document);
    setRejectDialogOpen(true);
  };

  const pendingDocuments = documents.filter((d) => d.status === DocumentStatus.PENDING);

  if (pendingDocuments.length === 0) {
    return <Alert severity="success">All documents have been verified. Great job!</Alert>;
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Verification Queue ({pendingDocuments.length} pending)
      </Typography>

      <Grid container spacing={2}>
        {pendingDocuments.map((document) => (
          <Grid item xs={12} md={6} key={document.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  {document.thumbnail_url ? (
                    <Avatar
                      src={document.thumbnail_url}
                      variant="rounded"
                      sx={{ width: 80, height: 80 }}
                    />
                  ) : (
                    <Avatar variant="rounded" sx={{ width: 80, height: 80 }}>
                      <Description fontSize="large" />
                    </Avatar>
                  )}

                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      {document.title}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {document.child_name}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      <Chip
                        label={document.document_type.replace(/_/g, ' ')}
                        size="small"
                        variant="outlined"
                      />
                      {document.tags.map((tag) => (
                        <Chip key={tag} label={tag} size="small" variant="outlined" />
                      ))}
                    </Box>
                  </Box>
                </Box>

                {document.description && (
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {document.description}
                  </Typography>
                )}

                <Typography variant="caption" color="text.secondary" display="block">
                  Uploaded: {format(new Date(document.upload_date), 'PPp')}
                </Typography>
                {document.expiry_date && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    Expires: {format(new Date(document.expiry_date), 'PPP')}
                  </Typography>
                )}
              </CardContent>

              <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                <Button
                  size="small"
                  startIcon={<Visibility />}
                  onClick={() => window.open(document.file_url, '_blank')}
                >
                  View
                </Button>

                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    color="error"
                    startIcon={<Cancel />}
                    onClick={() => handleRequestReupload(document)}
                    disabled={verifyMutation.isPending}
                  >
                    Reject
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle />}
                    onClick={() => handleApprove(document)}
                    disabled={verifyMutation.isPending}
                  >
                    Approve
                  </Button>
                </Box>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={rejectDialogOpen}
        onClose={() => setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Document</DialogTitle>
        <DialogContent>
          <Typography variant="body2" paragraph>
            Please provide a reason for rejecting this document. The parent will be notified and
            asked to reupload.
          </Typography>

          <TextField
            fullWidth
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            multiline
            rows={4}
            required
            placeholder="e.g., Document is unclear, expired, or incorrect type..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
            disabled={!rejectionReason.trim() || verifyMutation.isPending}
          >
            Reject & Request Reupload
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
