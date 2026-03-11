import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Avatar,
  Grid,
  Divider,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  ArrowBack as ArrowBackIcon,
  Badge as BadgeIcon,
} from '@mui/icons-material';
import studentsApi, { IDCardData } from '@/api/students';

export default function StudentIDCard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [idCardData, setIdCardData] = useState<IDCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetchIDCardData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await studentsApi.getIDCardData(parseInt(id));
        setIdCardData(data);
        setError(null);
      } catch (err: unknown) {
        const error = err as { response?: { data?: { detail?: string } } };
        setError(error.response?.data?.detail || 'Failed to load ID card data');
      } finally {
        setLoading(false);
      }
    };

    fetchIDCardData();
  }, [id]);

  const handleDownload = async () => {
    if (!id) return;
    try {
      setDownloading(true);
      const blob = await studentsApi.downloadIDCard(parseInt(id));
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `student_${id}_id_card.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to download ID card');
    } finally {
      setDownloading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !idCardData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{error || 'ID card data not found'}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/admin/students/${id}`)}
          >
            Back
          </Button>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
            Student ID Card
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<PrintIcon />} onClick={handlePrint}>
            Print
          </Button>
          <Button
            variant="contained"
            startIcon={downloading ? <CircularProgress size={20} /> : <DownloadIcon />}
            onClick={handleDownload}
            disabled={downloading}
          >
            {downloading ? 'Downloading...' : 'Download PDF'}
          </Button>
        </Box>
      </Box>

      <Grid container spacing={3} justifyContent="center">
        <Grid item xs={12} md={6}>
          <Card
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'url(/pattern.svg)',
                opacity: 0.1,
              },
            }}
          >
            <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                {idCardData.institution_logo && (
                  <Avatar
                    src={idCardData.institution_logo}
                    sx={{ width: 60, height: 60, mr: 2, bgcolor: 'white' }}
                  />
                )}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" fontWeight={700}>
                    {idCardData.institution_name}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    STUDENT ID CARD
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.3)', my: 3 }} />

              <Box sx={{ display: 'flex', gap: 3 }}>
                <Avatar
                  src={idCardData.photo_url}
                  alt={idCardData.student_name}
                  sx={{
                    width: 120,
                    height: 120,
                    border: '4px solid white',
                    boxShadow: 3,
                  }}
                >
                  <BadgeIcon sx={{ fontSize: 60 }} />
                </Avatar>

                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {idCardData.student_name}
                  </Typography>

                  <Box sx={{ mt: 2 }}>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      <strong>Admission No:</strong> {idCardData.admission_number}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      <strong>Class:</strong> {idCardData.class_section}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>
                      <strong>Valid Until:</strong>{' '}
                      {new Date(idCardData.valid_until).toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.3)', my: 3 }} />

              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <Box
                  sx={{
                    width: 100,
                    height: 100,
                    bgcolor: 'white',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="caption" color="text.secondary">
                    QR Code
                  </Typography>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Scan this QR code for student verification
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              ID Card Information
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Student Name
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {idCardData.student_name}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Admission Number
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {idCardData.admission_number}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Class / Section
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {idCardData.class_section}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Valid Until
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {new Date(idCardData.valid_until).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </Typography>
            </Box>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Institution
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {idCardData.institution_name}
              </Typography>
            </Box>

            <Alert severity="info" sx={{ mt: 3 }}>
              <Typography variant="body2">
                This ID card is valid for the current academic year. It must be carried at all times
                on school premises.
              </Typography>
            </Alert>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
