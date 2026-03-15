import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tabs,
  Tab,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
  Divider,
  Chip,
  Paper,
  Alert,
  useTheme,
  alpha,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Add as AddIcon,
  WavingHand as WelcomeIcon,
  VideoLibrary as VideoIcon,
  Description as FormIcon,
  CloudUpload as UploadIcon,
  Draw as SignatureIcon,
  Quiz as QuizIcon,
  Explore as TourIcon,
  Settings as SettingsIcon,
  Delete as DeleteIcon,
  DragIndicator as DragIcon,
  Visibility as PreviewIcon,
  Save as SaveIcon,
  AccountCircle,
} from '@mui/icons-material';
import { UserRole, OnboardingStep, OnboardingFlow, StepType } from '@/types/onboarding';
import onboardingApi from '@/api/onboarding';
import StepConfigPanel from '../components/onboarding/designer/StepConfigPanel';
import ConditionalLogicBuilder from '../components/onboarding/designer/ConditionalLogicBuilder';
import FlowPreview from '../components/onboarding/designer/FlowPreview';
import OnboardingAnalytics from '../components/onboarding/designer/OnboardingAnalytics';

const stepTypeIcons: Record<StepType, React.ReactNode> = {
  welcome: <WelcomeIcon />,
  video: <VideoIcon />,
  form: <FormIcon />,
  document_upload: <UploadIcon />,
  signature: <SignatureIcon />,
  quiz: <QuizIcon />,
  platform_tour: <TourIcon />,
};

const stepTypeLabels: Record<StepType, string> = {
  welcome: 'Welcome Message',
  video: 'Video',
  form: 'Form',
  document_upload: 'Document Upload',
  signature: 'Signature',
  quiz: 'Quiz',
  platform_tour: 'Platform Tour',
};

export default function AdminOnboardingDesigner() {
  const theme = useTheme();
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [flows, setFlows] = useState<OnboardingFlow[]>([]);
  const [currentFlow, setCurrentFlow] = useState<OnboardingFlow | null>(null);
  const [selectedStep, setSelectedStep] = useState<OnboardingStep | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState(0);
  const [newFlowDialog, setNewFlowDialog] = useState(false);
  const [newFlowTitle, setNewFlowTitle] = useState('');
  const [newFlowDesc, setNewFlowDesc] = useState('');

  useEffect(() => {
    loadFlows();
  }, [selectedRole]);

  const loadFlows = async () => {
    try {
      const data = await onboardingApi.getFlowsByRole(selectedRole);
      setFlows(data);
      if (data.length > 0 && !currentFlow) {
        setCurrentFlow(data[0]);
      }
    } catch (err) {
      setError('Failed to load onboarding flows');
      console.error(err);
    }
  };

  const createNewFlow = async () => {
    try {
      const newFlow = await onboardingApi.createFlow({
        role: selectedRole,
        title: newFlowTitle,
        description: newFlowDesc,
        steps: [],
        isActive: false,
      });
      setFlows([...flows, newFlow]);
      setCurrentFlow(newFlow);
      setNewFlowDialog(false);
      setNewFlowTitle('');
      setNewFlowDesc('');
    } catch (err) {
      setError('Failed to create flow');
      console.error(err);
    }
  };

  const addStep = (type: StepType) => {
    if (!currentFlow) return;

    const newStep: OnboardingStep = {
      id: `step-${Date.now()}`,
      type,
      title: stepTypeLabels[type],
      order: currentFlow.steps.length,
      config: {},
      required: false,
    };

    const updatedFlow = {
      ...currentFlow,
      steps: [...currentFlow.steps, newStep],
    };

    setCurrentFlow(updatedFlow);
    setSelectedStep(newStep);
  };

  const updateStep = (stepId: string, updates: Partial<OnboardingStep>) => {
    if (!currentFlow) return;

    const updatedSteps = currentFlow.steps.map((step) =>
      step.id === stepId ? { ...step, ...updates } : step
    );

    setCurrentFlow({ ...currentFlow, steps: updatedSteps });

    if (selectedStep?.id === stepId) {
      setSelectedStep({ ...selectedStep, ...updates });
    }
  };

  const deleteStep = (stepId: string) => {
    if (!currentFlow) return;

    const updatedSteps = currentFlow.steps
      .filter((step) => step.id !== stepId)
      .map((step, index) => ({ ...step, order: index }));

    setCurrentFlow({ ...currentFlow, steps: updatedSteps });

    if (selectedStep?.id === stepId) {
      setSelectedStep(null);
    }
  };

  const moveStep = (stepId: string, direction: 'up' | 'down') => {
    if (!currentFlow) return;

    const stepIndex = currentFlow.steps.findIndex((s) => s.id === stepId);
    if (stepIndex === -1) return;

    const newIndex = direction === 'up' ? stepIndex - 1 : stepIndex + 1;
    if (newIndex < 0 || newIndex >= currentFlow.steps.length) return;

    const updatedSteps = [...currentFlow.steps];
    [updatedSteps[stepIndex], updatedSteps[newIndex]] = [
      updatedSteps[newIndex],
      updatedSteps[stepIndex],
    ];

    updatedSteps.forEach((step, index) => {
      step.order = index;
    });

    setCurrentFlow({ ...currentFlow, steps: updatedSteps });
  };

  const saveFlow = async () => {
    if (!currentFlow) return;

    try {
      setSaving(true);
      if (currentFlow.id) {
        await onboardingApi.updateFlow(currentFlow.id, currentFlow);
      } else {
        const saved = await onboardingApi.createFlow(currentFlow);
        setCurrentFlow(saved);
      }
      await loadFlows();
      setError(null);
    } catch (err) {
      setError('Failed to save flow');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const toggleFlowActive = async () => {
    if (!currentFlow) return;

    try {
      const updated = await onboardingApi.updateFlow(currentFlow.id, {
        isActive: !currentFlow.isActive,
      });
      setCurrentFlow(updated);
      await loadFlows();
    } catch (err) {
      setError('Failed to update flow status');
      console.error(err);
    }
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)' }}>
      <Drawer
        variant="persistent"
        anchor="left"
        open={true}
        sx={{
          width: 280,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            position: 'relative',
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" fontWeight={700} gutterBottom>
            Step Components
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
            Drag to add to flow
          </Typography>
        </Box>

        <Divider />

        <List sx={{ px: 2 }}>
          {(Object.keys(stepTypeIcons) as StepType[]).map((type) => (
            <ListItem
              key={type}
              sx={{
                mb: 1,
                p: 2,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: 2,
                cursor: 'grab',
                transition: 'all 0.2s',
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.05),
                  borderColor: theme.palette.primary.main,
                },
                '&:active': {
                  cursor: 'grabbing',
                },
              }}
              onClick={() => addStep(type)}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>{stepTypeIcons[type]}</ListItemIcon>
              <ListItemText
                primary={stepTypeLabels[type]}
                primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
              />
              <AddIcon fontSize="small" color="action" />
            </ListItem>
          ))}
        </List>
      </Drawer>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <Box
          sx={{
            p: 2,
            borderBottom: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            bgcolor: '#fff',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h5" fontWeight={700}>
              Onboarding Flow Designer
            </Typography>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={selectedRole}
                label="Role"
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                startAdornment={<AccountCircle sx={{ mr: 1, color: 'action.active' }} />}
              >
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="parent">Parent</MenuItem>
                <MenuItem value="teacher">Teacher</MenuItem>
              </Select>
            </FormControl>

            {currentFlow && (
              <Chip
                label={currentFlow.isActive ? 'Active' : 'Draft'}
                color={currentFlow.isActive ? 'success' : 'default'}
                size="small"
              />
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => setNewFlowDialog(true)}
            >
              New Flow
            </Button>
            <Button
              variant="outlined"
              startIcon={<PreviewIcon />}
              onClick={() => setPreviewMode(true)}
              disabled={!currentFlow || currentFlow.steps.length === 0}
            >
              Preview
            </Button>
            <Button
              variant="outlined"
              onClick={() => setShowAnalytics(true)}
              disabled={!currentFlow}
            >
              Analytics
            </Button>
            {currentFlow && (
              <FormControlLabel
                control={
                  <Switch
                    checked={currentFlow.isActive}
                    onChange={toggleFlowActive}
                    color="success"
                  />
                }
                label="Active"
              />
            )}
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={saveFlow}
              disabled={!currentFlow || saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
          {!currentFlow ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No flow selected
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setNewFlowDialog(true)}
                sx={{ mt: 2 }}
              >
                Create New Flow
              </Button>
            </Box>
          ) : (
            <Grid container spacing={3}>
              <Grid item xs={12} md={7}>
                <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                  <CardContent>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 3,
                      }}
                    >
                      <Typography variant="h6" fontWeight={700}>
                        {currentFlow.title}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {currentFlow.steps.length} steps
                      </Typography>
                    </Box>

                    {currentFlow.steps.length === 0 ? (
                      <Box sx={{ textAlign: 'center', py: 6 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          No steps added yet
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Select a component from the left panel to add
                        </Typography>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {currentFlow.steps.map((step, index) => (
                          <Paper
                            key={step.id}
                            elevation={0}
                            sx={{
                              p: 2,
                              border: `2px solid ${selectedStep?.id === step.id ? theme.palette.primary.main : theme.palette.divider}`,
                              borderRadius: 2,
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              bgcolor:
                                selectedStep?.id === step.id
                                  ? alpha(theme.palette.primary.main, 0.05)
                                  : 'transparent',
                              '&:hover': {
                                borderColor: theme.palette.primary.main,
                                bgcolor: alpha(theme.palette.primary.main, 0.02),
                              },
                            }}
                            onClick={() => setSelectedStep(step)}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 40,
                                  height: 40,
                                  borderRadius: 1,
                                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                                  color: theme.palette.primary.main,
                                }}
                              >
                                {stepTypeIcons[step.type]}
                              </Box>

                              <Box sx={{ flexGrow: 1 }}>
                                <Typography variant="body1" fontWeight={600}>
                                  {step.title}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {stepTypeLabels[step.type]}
                                </Typography>
                              </Box>

                              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                {step.required && (
                                  <Chip label="Required" size="small" color="error" />
                                )}
                                {step.conditionalRules && step.conditionalRules.length > 0 && (
                                  <Chip label="Conditional" size="small" color="info" />
                                )}
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    moveStep(step.id, 'up');
                                  }}
                                  disabled={index === 0}
                                >
                                  <DragIcon />
                                </IconButton>
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteStep(step.id);
                                  }}
                                  color="error"
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </Box>
                            </Box>
                          </Paper>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={5}>
                {selectedStep ? (
                  <Card
                    elevation={0}
                    sx={{
                      border: `1px solid ${theme.palette.divider}`,
                      position: 'sticky',
                      top: 16,
                    }}
                  >
                    <CardContent>
                      <Box sx={{ mb: 3 }}>
                        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
                          <Tab label="Configuration" />
                          <Tab label="Conditional Logic" />
                        </Tabs>
                      </Box>

                      {tab === 0 && (
                        <StepConfigPanel
                          step={selectedStep}
                          onUpdate={(updates) => updateStep(selectedStep.id, updates)}
                        />
                      )}

                      {tab === 1 && (
                        <ConditionalLogicBuilder
                          step={selectedStep}
                          allSteps={currentFlow.steps}
                          onUpdate={(rules) =>
                            updateStep(selectedStep.id, { conditionalRules: rules })
                          }
                        />
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
                    <CardContent>
                      <Box sx={{ textAlign: 'center', py: 6 }}>
                        <SettingsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="body2" color="text.secondary">
                          Select a step to configure
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                )}
              </Grid>
            </Grid>
          )}
        </Box>
      </Box>

      <Dialog open={newFlowDialog} onClose={() => setNewFlowDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Onboarding Flow</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Flow Title"
            value={newFlowTitle}
            onChange={(e) => setNewFlowTitle(e.target.value)}
            sx={{ mt: 2, mb: 2 }}
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            value={newFlowDesc}
            onChange={(e) => setNewFlowDesc(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewFlowDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={createNewFlow} disabled={!newFlowTitle}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {previewMode && currentFlow && (
        <FlowPreview flow={currentFlow} onClose={() => setPreviewMode(false)} />
      )}

      {showAnalytics && currentFlow && (
        <OnboardingAnalytics flowId={currentFlow.id} onClose={() => setShowAnalytics(false)} />
      )}
    </Box>
  );
}
