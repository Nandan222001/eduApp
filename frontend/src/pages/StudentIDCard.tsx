import { useState, useEffect, useRef } from 'react';
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
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Print as PrintIcon,
  ArrowBack as ArrowBackIcon,
  Badge as BadgeIcon,
  Flip as FlipIcon,
} from '@mui/icons-material';
import studentsApi from '@/api/students';
import { isDemoUser, demoIDCardsApi } from '@/api/demoDataApi';

interface IDCardData {
  student_id: number;
  student_name: string;
  admission_number: string;
  roll_number?: string;
  class_section: string;
  date_of_birth?: string;
  blood_group?: string;
  phone?: string;
  email?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  photo_url?: string;
  institution_name: string;
  institution_logo?: string;
  institution_address?: string;
  institution_phone?: string;
  institution_email?: string;
  valid_from?: string;
  valid_until: string;
  issue_date?: string;
  principal_name?: string;
  principal_signature?: string;
  qr_data?: string;
  barcode_data?: string;
}

interface IDCardTemplate {
  id: number;
  name: string;
  gradient: string;
  primaryColor: string;
  secondaryColor: string;
}

export default function StudentIDCard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [idCardData, setIdCardData] = useState<IDCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [view, setView] = useState<'front' | 'back'>('front');
  const [selectedTemplate, setSelectedTemplate] = useState<number>(1);
  const [templates, setTemplates] = useState<IDCardTemplate[]>([]);
  const cardRef = useRef<HTMLDivElement>(null);

  const isDemo = isDemoUser();

  useEffect(() => {
    const fetchIDCardData = async () => {
      if (!id) return;
      try {
        setLoading(true);
        let data: IDCardData;
        if (isDemo) {
          data = await demoIDCardsApi.getStudentIDCardData(parseInt(id));
          const templatesList = await demoIDCardsApi.getTemplates();
          setTemplates(templatesList);
        } else {
          data = await studentsApi.getIDCardData(parseInt(id));
        }
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
  }, [id, isDemo]);

  const handleDownload = async () => {
    if (!id) return;
    try {
      setDownloading(true);
      let blob: Blob;
      if (isDemo) {
        blob = await demoIDCardsApi.downloadIDCard(parseInt(id));
      } else {
        blob = await studentsApi.downloadIDCard(parseInt(id));
      }
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

  const handleTemplateChange = (event: { target: { value: unknown } }) => {
    setSelectedTemplate(event.target.value as number);
  };

  const currentTemplate = templates.find((t) => t.id === selectedTemplate) || templates[0];

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

  const cardStyle = currentTemplate
    ? {
        background: currentTemplate.gradient,
        color: 'white',
      }
    : {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
      };

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
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          {isDemo && templates.length > 0 && (
            <FormControl sx={{ minWidth: 200 }}>
              <InputLabel>Template</InputLabel>
              <Select value={selectedTemplate} onChange={handleTemplateChange} label="Template">
                {templates.map((template) => (
                  <MenuItem key={template.id} value={template.id}>
                    {template.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(_, newView) => newView && setView(newView)}
            size="small"
          >
            <ToggleButton value="front">
              <FlipIcon sx={{ mr: 1 }} />
              Front
            </ToggleButton>
            <ToggleButton value="back">
              <FlipIcon sx={{ mr: 1 }} />
              Back
            </ToggleButton>
          </ToggleButtonGroup>
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
            ref={cardRef}
            sx={{
              ...cardStyle,
              position: 'relative',
              overflow: 'hidden',
              minHeight: 500,
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
              '@media print': {
                pageBreakAfter: 'always',
              },
            }}
          >
            <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
              {view === 'front' ? (
                <>
                  {/* Front Side */}
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
                        {idCardData.roll_number && (
                          <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                            <strong>Roll No:</strong> {idCardData.roll_number}
                          </Typography>
                        )}
                        <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                          <strong>Class:</strong> {idCardData.class_section}
                        </Typography>
                        {idCardData.blood_group && (
                          <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                            <strong>Blood Group:</strong> {idCardData.blood_group}
                          </Typography>
                        )}
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
                        p: 1,
                      }}
                    >
                      {idCardData.qr_data ? (
                        <Box
                          component="img"
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                            idCardData.qr_data
                          )}`}
                          alt="QR Code"
                          sx={{ width: '100%', height: '100%' }}
                        />
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          QR Code
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Scan this QR code for student verification
                      </Typography>
                    </Box>
                  </Box>
                </>
              ) : (
                <>
                  {/* Back Side */}
                  <Box sx={{ textAlign: 'center', mb: 3 }}>
                    <Typography variant="h6" fontWeight={700}>
                      Important Information
                    </Typography>
                  </Box>

                  <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.3)', my: 3 }} />

                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ mb: 2, opacity: 0.95 }}>
                      <strong>Institution Address:</strong>
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1, opacity: 0.9 }}>
                      {idCardData.institution_address || idCardData.address}
                    </Typography>
                    {idCardData.institution_phone && (
                      <Typography variant="body2" sx={{ mb: 1, opacity: 0.9 }}>
                        <strong>Phone:</strong> {idCardData.institution_phone}
                      </Typography>
                    )}
                    {idCardData.institution_email && (
                      <Typography variant="body2" sx={{ mb: 1, opacity: 0.9 }}>
                        <strong>Email:</strong> {idCardData.institution_email}
                      </Typography>
                    )}
                  </Box>

                  <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.3)', my: 3 }} />

                  {idCardData.emergency_contact_name && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="body2" sx={{ mb: 2, opacity: 0.95 }}>
                        <strong>Emergency Contact:</strong>
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 1, opacity: 0.9 }}>
                        {idCardData.emergency_contact_name}
                      </Typography>
                      {idCardData.emergency_contact_phone && (
                        <Typography variant="body2" sx={{ mb: 1, opacity: 0.9 }}>
                          {idCardData.emergency_contact_phone}
                        </Typography>
                      )}
                    </Box>
                  )}

                  <Divider sx={{ bgcolor: 'rgba(255, 255, 255, 0.3)', my: 3 }} />

                  {idCardData.barcode_data && (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        mb: 3,
                      }}
                    >
                      <Box
                        sx={{
                          bgcolor: 'white',
                          borderRadius: 1,
                          p: 2,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                        }}
                      >
                        <Box
                          component="img"
                          src={`https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(
                            idCardData.barcode_data
                          )}&code=Code128&translate-esc=on&unit=Fit&dpi=96&imagetype=Gif&rotation=0&color=%23000000&bgcolor=%23ffffff&qunit=Mm&quiet=0`}
                          alt="Barcode"
                          sx={{ maxWidth: '100%', height: 'auto' }}
                        />
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                          {idCardData.barcode_data}
                        </Typography>
                      </Box>
                    </Box>
                  )}

                  <Box sx={{ textAlign: 'center', mt: 3 }}>
                    <Typography variant="caption" sx={{ opacity: 0.8, display: 'block', mb: 1 }}>
                      This card is property of {idCardData.institution_name}
                    </Typography>
                    <Typography variant="caption" sx={{ opacity: 0.8, display: 'block' }}>
                      If found, please return to the above address
                    </Typography>
                  </Box>

                  {idCardData.principal_name && (
                    <Box sx={{ mt: 3, textAlign: 'right' }}>
                      {idCardData.principal_signature && (
                        <Box
                          component="img"
                          src={idCardData.principal_signature}
                          alt="Signature"
                          sx={{ maxWidth: 150, height: 50, mb: 1 }}
                        />
                      )}
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>
                        {idCardData.principal_name}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.8 }}>
                        Principal
                      </Typography>
                    </Box>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box
              sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
            >
              <Typography variant="h6" gutterBottom>
                ID Card Information
              </Typography>
              <Chip
                label={`Viewing ${view === 'front' ? 'Front' : 'Back'}`}
                color="primary"
                size="small"
              />
            </Box>
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
            {idCardData.roll_number && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Roll Number
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {idCardData.roll_number}
                </Typography>
              </Box>
            )}
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Class / Section
              </Typography>
              <Typography variant="body1" fontWeight={600}>
                {idCardData.class_section}
              </Typography>
            </Box>
            {idCardData.date_of_birth && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Date of Birth
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {new Date(idCardData.date_of_birth).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Typography>
              </Box>
            )}
            {idCardData.blood_group && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Blood Group
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {idCardData.blood_group}
                </Typography>
              </Box>
            )}
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
            {idCardData.issue_date && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Issue Date
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {new Date(idCardData.issue_date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </Typography>
              </Box>
            )}
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
                on school premises. Use the toggle above to switch between front and back views.
                {isDemo &&
                  templates.length > 0 &&
                  ' Select different templates to preview various designs.'}
              </Typography>
            </Alert>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
