import React from 'react';
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
  Divider,
  Avatar,
} from '@mui/material';
import { Assignment, CloudUpload, CheckCircle, Warning, Error, Person } from '@mui/icons-material';
import { DocumentRequest, RequestStatus, RecipientRole } from '@/types/documentVault';
import { format, formatDistanceToNow } from 'date-fns';

interface DocumentRequestPanelProps {
  requests: DocumentRequest[];
  onRequestFulfilled?: () => void;
  onUploadForRequest: (request: DocumentRequest) => void;
}

const statusIcons = {
  [RequestStatus.REQUESTED]: <Warning />,
  [RequestStatus.UPLOADED]: <CloudUpload />,
  [RequestStatus.VERIFIED]: <CheckCircle />,
  [RequestStatus.REJECTED]: <Error />,
};

const statusColors = {
  [RequestStatus.REQUESTED]: 'warning' as const,
  [RequestStatus.UPLOADED]: 'info' as const,
  [RequestStatus.VERIFIED]: 'success' as const,
  [RequestStatus.REJECTED]: 'error' as const,
};

const roleLabels: Record<RecipientRole, string> = {
  [RecipientRole.TEACHER]: 'Teacher',
  [RecipientRole.COUNSELOR]: 'Counselor',
  [RecipientRole.NURSE]: 'Nurse',
  [RecipientRole.ADMIN]: 'Admin',
};

export const DocumentRequestPanel: React.FC<DocumentRequestPanelProps> = ({
  requests,
  onUploadForRequest,
}) => {
  const pendingRequests = requests.filter((r) => r.status === RequestStatus.REQUESTED);
  const otherRequests = requests.filter((r) => r.status !== RequestStatus.REQUESTED);

  if (requests.length === 0) {
    return (
      <Alert severity="info">
        No document requests at this time. The school will notify you when documents are needed.
      </Alert>
    );
  }

  return (
    <Box>
      {pendingRequests.length > 0 && (
        <>
          <Typography
            variant="h6"
            gutterBottom
            sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <Warning color="warning" />
            Pending Requests ({pendingRequests.length})
          </Typography>

          <Grid container spacing={2} sx={{ mb: 4 }}>
            {pendingRequests.map((request) => (
              <Grid item xs={12} md={6} lg={4} key={request.id}>
                <Card
                  sx={{
                    height: '100%',
                    border: '2px solid',
                    borderColor: 'warning.main',
                  }}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Avatar sx={{ bgcolor: 'warning.main' }}>
                        <Assignment />
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {request.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          for {request.child_name}
                        </Typography>
                      </Box>
                    </Box>

                    <Typography variant="body2" color="text.secondary" paragraph>
                      {request.description}
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                      <Chip
                        label={request.document_type.replace(/_/g, ' ')}
                        size="small"
                        variant="outlined"
                      />
                      <Chip
                        label={roleLabels[request.requested_by_role]}
                        size="small"
                        variant="outlined"
                        icon={<Person />}
                      />
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Typography variant="caption" color="text.secondary" display="block">
                      Requested by: {request.requested_by}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Requested:{' '}
                      {formatDistanceToNow(new Date(request.requested_date), { addSuffix: true })}
                    </Typography>
                    {request.due_date && (
                      <Typography variant="caption" color="error" display="block" fontWeight={600}>
                        Due: {format(new Date(request.due_date), 'PPP')}
                      </Typography>
                    )}
                  </CardContent>

                  <CardActions>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<CloudUpload />}
                      onClick={() => onUploadForRequest(request)}
                    >
                      Upload Document
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {otherRequests.length > 0 && (
        <>
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Request History
          </Typography>

          <Grid container spacing={2}>
            {otherRequests.map((request) => (
              <Grid item xs={12} md={6} lg={4} key={request.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <Chip
                        icon={statusIcons[request.status]}
                        label={request.status}
                        color={statusColors[request.status]}
                        size="small"
                      />
                    </Box>

                    <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                      {request.title}
                    </Typography>

                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {request.child_name}
                    </Typography>

                    <Typography variant="caption" color="text.secondary" display="block">
                      Requested: {format(new Date(request.requested_date), 'PPP')}
                    </Typography>

                    {request.response_date && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        Responded: {format(new Date(request.response_date), 'PPP')}
                      </Typography>
                    )}

                    {request.notes && (
                      <Alert severity="info" sx={{ mt: 1 }}>
                        {request.notes}
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}
    </Box>
  );
};
