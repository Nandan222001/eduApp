import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Chip,
  Paper,
  Divider,
  FormControlLabel,
  Checkbox,
  Breadcrumbs,
  Link,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Description as PermitIcon,
  CheckCircle as ApprovedIcon,
  Cancel as DeniedIcon,
  HourglassEmpty as PendingIcon,
  Add as AddIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import employmentApi from '@/api/employment';
import { WorkPermit, WorkPermitCreate } from '@/types/employment';
import { useAuth } from '@/hooks/useAuth';

interface SignatureData {
  parent_name: string;
  signature: string;
  date: string;
}

export default function WorkPermitManager() {
  const theme = useTheme();
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [permits, setPermits] = useState<WorkPermit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [isDrawing, setIsDrawing] = useState(false);

  const [permitForm, setPermitForm] = useState({
    employer_name: '',
    max_hours_per_week: 20,
    issue_date: new Date().toISOString().split('T')[0],
    expiry_date: '',
    permit_number: '',
    restrictions: '',
    notes: '',
  });

  const [signatureData, setSignatureData] = useState<SignatureData>({
    parent_name: '',
    signature: '',
    date: new Date().toISOString().split('T')[0],
  });

  const [parentConsentGranted, setParentConsentGranted] = useState(false);

  const steps = ['Application Form', 'Parent Consent', 'School Authorization', 'Review & Submit'];

  useEffect(() => {
    if (user?.id) {
      fetchPermits();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchPermits = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await employmentApi.getStudentWorkPermits(parseInt(user.id));
      setPermits(data);
      setError(null);
    } catch (err) {
      setError('Failed to load work permits');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePermit = () => {
    setActiveStep(0);
    setCreateDialogOpen(true);
  };

  const handleNext = () => {
    if (activeStep === 1 && !parentConsentGranted) {
      setError('Parent consent is required to proceed');
      return;
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSignatureStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const handleSignatureMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleSignatureEnd = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      setSignatureData({ ...signatureData, signature: canvas.toDataURL() });
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setSignatureData({ ...signatureData, signature: '' });
  };

  const handleSubmitPermit = async () => {
    if (!user?.id || !user?.institution_id) return;

    try {
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

      const permitData: WorkPermitCreate = {
        institution_id: user.institution_id,
        student_id: parseInt(user.id),
        permit_type: 'state_specific',
        issue_date: permitForm.issue_date,
        expiry_date: permitForm.expiry_date || oneYearFromNow.toISOString().split('T')[0],
        employer_name: permitForm.employer_name,
        max_hours_per_week: permitForm.max_hours_per_week,
        parent_consent: parentConsentGranted,
        permit_number: permitForm.permit_number,
        restrictions: permitForm.restrictions,
        notes: permitForm.notes,
      };

      await employmentApi.createWorkPermit(permitData);
      setCreateDialogOpen(false);
      resetForm();
      fetchPermits();
      setError(null);
    } catch (err) {
      setError('Failed to create work permit');
      console.error(err);
    }
  };

  const resetForm = () => {
    setPermitForm({
      employer_name: '',
      max_hours_per_week: 20,
      issue_date: new Date().toISOString().split('T')[0],
      expiry_date: '',
      permit_number: '',
      restrictions: '',
      notes: '',
    });
    setSignatureData({
      parent_name: '',
      signature: '',
      date: new Date().toISOString().split('T')[0],
    });
    setParentConsentGranted(false);
    setActiveStep(0);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <ApprovedIcon sx={{ color: 'success.main' }} />;
      case 'denied':
        return <DeniedIcon sx={{ color: 'error.main' }} />;
      case 'expired':
        return <WarningIcon sx={{ color: 'warning.main' }} />;
      default:
        return <PendingIcon sx={{ color: 'info.main' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'denied':
        return 'error';
      case 'expired':
        return 'warning';
      default:
        return 'info';
    }
  };

  const getExpiryWarning = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry < 0) {
      return { severity: 'error' as const, message: 'Expired' };
    } else if (daysUntilExpiry <= 30) {
      return { severity: 'warning' as const, message: `Expires in ${daysUntilExpiry} days` };
    }
    return null;
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Work Permit Application
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Employer Name"
                  value={permitForm.employer_name}
                  onChange={(e) => setPermitForm({ ...permitForm, employer_name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Max Hours per Week"
                  type="number"
                  value={permitForm.max_hours_per_week}
                  onChange={(e) => setPermitForm({ ...permitForm, max_hours_per_week: parseInt(e.target.value) })}
                  required
                  inputProps={{ min: 1, max: 40 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Permit Number (Optional)"
                  value={permitForm.permit_number}
                  onChange={(e) => setPermitForm({ ...permitForm, permit_number: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Issue Date"
                  type="date"
                  value={permitForm.issue_date}
                  onChange={(e) => setPermitForm({ ...permitForm, issue_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Expiry Date"
                  type="date"
                  value={permitForm.expiry_date}
                  onChange={(e) => setPermitForm({ ...permitForm, expiry_date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Restrictions (Optional)"
                  multiline
                  rows={3}
                  value={permitForm.restrictions}
                  onChange={(e) => setPermitForm({ ...permitForm, restrictions: e.target.value })}
                  placeholder="Any restrictions on work hours, type of work, etc."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes (Optional)"
                  multiline
                  rows={3}
                  value={permitForm.notes}
                  onChange={(e) => setPermitForm({ ...permitForm, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Parent/Guardian Consent
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              A parent or legal guardian must provide consent for the student to obtain a work permit.
            </Alert>

            <TextField
              fullWidth
              label="Parent/Guardian Name"
              value={signatureData.parent_name}
              onChange={(e) => setSignatureData({ ...signatureData, parent_name: e.target.value })}
              sx={{ mb: 3 }}
              required
            />

            <Typography variant="subtitle2" gutterBottom>
              Digital Signature
            </Typography>
            <Paper
              variant="outlined"
              sx={{
                mb: 2,
                p: 2,
                textAlign: 'center',
                bgcolor: alpha(theme.palette.primary.main, 0.02),
              }}
            >
              <canvas
                ref={canvasRef}
                width={400}
                height={200}
                style={{
                  border: `2px dashed ${theme.palette.divider}`,
                  cursor: 'crosshair',
                  touchAction: 'none',
                }}
                onMouseDown={handleSignatureStart}
                onMouseMove={handleSignatureMove}
                onMouseUp={handleSignatureEnd}
                onMouseLeave={handleSignatureEnd}
                onTouchStart={handleSignatureStart}
                onTouchMove={handleSignatureMove}
                onTouchEnd={handleSignatureEnd}
              />
              <Button onClick={clearSignature} size="small" sx={{ mt: 1 }}>
                Clear Signature
              </Button>
            </Paper>

            <FormControlLabel
              control={
                <Checkbox
                  checked={parentConsentGranted}
                  onChange={(e) => setParentConsentGranted(e.target.checked)}
                />
              }
              label="I consent to my child applying for a work permit and understand the associated responsibilities."
            />
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              School Authorization Workflow
            </Typography>
            <Alert severity="info" sx={{ mb: 3 }}>
              Your application will be reviewed by a career counselor to ensure the job is age-appropriate and won&apos;t interfere with your academics.
            </Alert>

            <List>
              <ListItem>
                <ListItemText
                  primary="Verification of Academic Standing"
                  secondary="Counselor will verify you are in good academic standing"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Age Appropriateness Check"
                  secondary="Job duties will be reviewed for age-appropriate tasks"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Work Hours Review"
                  secondary="Work schedule will be checked against school hours and regulations"
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Final Approval"
                  secondary="Career counselor will approve or deny the permit"
                />
              </ListItem>
            </List>

            <Alert severity="warning">
              Processing typically takes 3-5 business days
            </Alert>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Your Application
            </Typography>

            <Paper variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Employer Information
              </Typography>
              <Typography variant="body1" gutterBottom>
                {permitForm.employer_name}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Work Details
              </Typography>
              <Typography variant="body2">
                Max Hours: {permitForm.max_hours_per_week} hours/week
              </Typography>
              <Typography variant="body2">
                Valid From: {new Date(permitForm.issue_date).toLocaleDateString()}
              </Typography>
              {permitForm.expiry_date && (
                <Typography variant="body2">
                  Expires: {new Date(permitForm.expiry_date).toLocaleDateString()}
                </Typography>
              )}

              {permitForm.restrictions && (
                <>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Restrictions
                  </Typography>
                  <Typography variant="body2">{permitForm.restrictions}</Typography>
                </>
              )}
            </Paper>

            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Parent Consent
              </Typography>
              <Typography variant="body2">
                {signatureData.parent_name || 'Not provided'}
              </Typography>
              <Typography variant="body2" color={parentConsentGranted ? 'success.main' : 'error.main'}>
                {parentConsentGranted ? '✓ Consent Granted' : '✗ Consent Not Granted'}
              </Typography>
            </Paper>

            <Alert severity="success" sx={{ mt: 2 }}>
              Once submitted, your application will be sent to the career counselor for review.
            </Alert>
          </Box>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link color="inherit" href="/" underline="hover">
            Home
          </Link>
          <Typography color="text.primary">Work Permit Manager</Typography>
        </Breadcrumbs>

        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h4" fontWeight={700}>
            Work Permit Manager
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreatePermit}>
            New Permit Application
          </Button>
        </Box>

        <Typography variant="body1" color="text.secondary">
          Manage your work permits and track approval status
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {permits.length === 0 ? (
          <Grid item xs={12}>
            <Paper sx={{ p: 6, textAlign: 'center' }}>
              <PermitIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No work permits yet
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Create your first work permit application to start working
              </Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreatePermit}>
                Create Permit Application
              </Button>
            </Paper>
          </Grid>
        ) : (
          permits.map((permit) => {
            const expiryWarning = getExpiryWarning(permit.expiry_date);
            return (
              <Grid item xs={12} md={6} lg={4} key={permit.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getStatusIcon(permit.school_authorization_status)}
                        <Chip
                          label={permit.school_authorization_status.toUpperCase()}
                          color={getStatusColor(permit.school_authorization_status) as 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning'}
                          size="small"
                        />
                      </Box>
                      {permit.parent_consent && (
                        <Chip label="Parent Consent ✓" color="success" size="small" variant="outlined" />
                      )}
                    </Box>

                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {permit.employer_name || 'General Work Permit'}
                    </Typography>

                    {permit.permit_number && (
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Permit #: {permit.permit_number}
                      </Typography>
                    )}

                    <Divider sx={{ my: 2 }} />

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Max Hours per Week
                      </Typography>
                      <Typography variant="body1" fontWeight={600}>
                        {permit.max_hours_per_week} hours
                      </Typography>
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Valid Period
                      </Typography>
                      <Typography variant="body2">
                        {new Date(permit.issue_date).toLocaleDateString()} -{' '}
                        {new Date(permit.expiry_date).toLocaleDateString()}
                      </Typography>
                    </Box>

                    {expiryWarning && (
                      <Alert severity={expiryWarning.severity} sx={{ mt: 2 }}>
                        {expiryWarning.message}
                      </Alert>
                    )}

                    {permit.restrictions && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Restrictions
                        </Typography>
                        <Typography variant="body2">{permit.restrictions}</Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })
        )}
      </Grid>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create Work Permit Application</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {renderStepContent(activeStep)}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Box sx={{ flex: '1 1 auto' }} />
          <Button disabled={activeStep === 0} onClick={handleBack}>
            Back
          </Button>
          {activeStep === steps.length - 1 ? (
            <Button variant="contained" onClick={handleSubmitPermit}>
              Submit Application
            </Button>
          ) : (
            <Button variant="contained" onClick={handleNext}>
              Next
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
