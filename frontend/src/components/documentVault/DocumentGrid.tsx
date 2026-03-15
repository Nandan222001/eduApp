import React from 'react';
import {
  Grid,
  Card,
  CardMedia,
  CardContent,
  CardActionArea,
  Typography,
  Chip,
  Box,
  Avatar,
} from '@mui/material';
import {
  PictureAsPdf,
  Image as ImageIcon,
  Description,
  Warning,
  CheckCircle,
  Schedule,
  Error,
} from '@mui/icons-material';
import { Document, DocumentStatus } from '@/types/documentVault';
import { format, differenceInDays } from 'date-fns';

interface DocumentGridProps {
  documents: Document[];
  onDocumentClick: (documentId: number) => void;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return <ImageIcon sx={{ fontSize: 60 }} />;
  if (mimeType === 'application/pdf') return <PictureAsPdf sx={{ fontSize: 60 }} />;
  return <Description sx={{ fontSize: 60 }} />;
};

const getStatusIcon = (status: DocumentStatus) => {
  switch (status) {
    case DocumentStatus.VERIFIED:
      return <CheckCircle color="success" />;
    case DocumentStatus.PENDING:
      return <Schedule color="warning" />;
    case DocumentStatus.REJECTED:
      return <Error color="error" />;
    case DocumentStatus.EXPIRED:
      return <Warning color="error" />;
    default:
      return null;
  }
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

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

export const DocumentGrid: React.FC<DocumentGridProps> = ({ documents, onDocumentClick }) => {
  const getExpiryWarning = (expiryDate?: string) => {
    if (!expiryDate) return null;
    const daysUntilExpiry = differenceInDays(new Date(expiryDate), new Date());
    if (daysUntilExpiry < 0) {
      return { message: 'Expired', color: 'error' as const, days: daysUntilExpiry };
    }
    if (daysUntilExpiry <= 30) {
      return {
        message: `Expires in ${daysUntilExpiry} days`,
        color: 'warning' as const,
        days: daysUntilExpiry,
      };
    }
    return null;
  };

  return (
    <Grid container spacing={2}>
      {documents.map((doc) => {
        const expiryWarning = getExpiryWarning(doc.expiry_date);

        return (
          <Grid item xs={12} sm={6} md={4} lg={3} key={doc.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                position: 'relative',
                border: expiryWarning?.color === 'error' ? '2px solid' : 'none',
                borderColor: expiryWarning?.color === 'error' ? 'error.main' : 'transparent',
              }}
            >
              <CardActionArea onClick={() => onDocumentClick(doc.id)} sx={{ flexGrow: 1 }}>
                <Box
                  sx={{
                    height: 200,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'grey.100',
                    position: 'relative',
                  }}
                >
                  {doc.thumbnail_url ? (
                    <CardMedia
                      component="img"
                      height="200"
                      image={doc.thumbnail_url}
                      alt={doc.title}
                      sx={{ objectFit: 'contain' }}
                    />
                  ) : (
                    <Avatar
                      sx={{
                        width: 80,
                        height: 80,
                        bgcolor: 'primary.main',
                      }}
                    >
                      {getFileIcon(doc.mime_type)}
                    </Avatar>
                  )}
                  <Chip
                    icon={getStatusIcon(doc.status)!}
                    label={doc.status}
                    size="small"
                    color={getStatusColor(doc.status)}
                    sx={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      textTransform: 'capitalize',
                    }}
                  />
                  {expiryWarning && (
                    <Chip
                      icon={<Warning />}
                      label={expiryWarning.message}
                      size="small"
                      color={expiryWarning.color}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                      }}
                    />
                  )}
                </Box>

                <CardContent>
                  <Typography variant="subtitle1" gutterBottom noWrap fontWeight={600}>
                    {doc.title}
                  </Typography>

                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {doc.child_name}
                  </Typography>

                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                    <Chip
                      label={doc.document_type.replace(/_/g, ' ')}
                      size="small"
                      variant="outlined"
                    />
                    {doc.tags.slice(0, 2).map((tag) => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                    {doc.tags.length > 2 && (
                      <Chip label={`+${doc.tags.length - 2}`} size="small" variant="outlined" />
                    )}
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mt: 1,
                    }}
                  >
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(doc.upload_date), 'MMM d, yyyy')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatFileSize(doc.file_size)}
                    </Typography>
                  </Box>

                  {doc.expiry_date && (
                    <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                      Expires: {format(new Date(doc.expiry_date), 'MMM d, yyyy')}
                    </Typography>
                  )}
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
};
