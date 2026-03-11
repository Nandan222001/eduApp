import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Stack,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  ExpandMore as ExpandMoreIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import { GoalType, GoalFormData } from '@/types/goals';

interface GoalCreationFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: GoalFormData) => void;
  isLoading?: boolean;
}

const steps = ['Basic Info', 'SMART Criteria', 'Milestones'];

const goalTypes: { value: GoalType; label: string; description: string }[] = [
  {
    value: 'performance',
    label: 'Performance',
    description: 'Academic or work performance goals',
  },
  { value: 'behavioral', label: 'Behavioral', description: 'Behavioral improvement goals' },
  { value: 'skill', label: 'Skill', description: 'Skill development goals' },
];

const smartGuide = {
  specific: 'What exactly do you want to accomplish? Be clear and detailed.',
  measurable: 'How will you measure progress? Define quantifiable metrics.',
  achievable: 'Is this goal realistic? What resources do you need?',
  relevant: 'Why is this goal important? How does it align with broader objectives?',
  timeBound: 'When will you achieve this? Set a clear deadline.',
};

export default function GoalCreationForm({
  open,
  onClose,
  onSubmit,
  isLoading,
}: GoalCreationFormProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    description: '',
    type: 'performance',
    specific: '',
    measurable: '',
    achievable: '',
    relevant: '',
    timeBound: '',
    startDate: new Date().toISOString().split('T')[0],
    targetDate: '',
    milestones: [],
  });

  const handleNext = () => {
    setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = () => {
    onSubmit(formData);
    handleClose();
  };

  const handleClose = () => {
    setActiveStep(0);
    setFormData({
      title: '',
      description: '',
      type: 'performance',
      specific: '',
      measurable: '',
      achievable: '',
      relevant: '',
      timeBound: '',
      startDate: new Date().toISOString().split('T')[0],
      targetDate: '',
      milestones: [],
    });
    onClose();
  };

  const addMilestone = () => {
    setFormData({
      ...formData,
      milestones: [
        ...formData.milestones,
        {
          title: '',
          description: '',
          targetDate: '',
          progress: 0,
        },
      ],
    });
  };

  const removeMilestone = (index: number) => {
    setFormData({
      ...formData,
      milestones: formData.milestones.filter((_, i) => i !== index),
    });
  };

  const updateMilestone = (index: number, field: string, value: string | number) => {
    const updatedMilestones = [...formData.milestones];
    updatedMilestones[index] = { ...updatedMilestones[index], [field]: value };
    setFormData({ ...formData, milestones: updatedMilestones });
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 0:
        return formData.title && formData.description && formData.type && formData.targetDate;
      case 1:
        return (
          formData.specific &&
          formData.measurable &&
          formData.achievable &&
          formData.relevant &&
          formData.timeBound
        );
      case 2:
        return true;
      default:
        return false;
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h5" fontWeight={600}>
            Create New Goal
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {activeStep === 0 && (
          <Stack spacing={3}>
            <TextField
              fullWidth
              label="Goal Title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
              placeholder="e.g., Improve Mathematics Score"
            />

            <TextField
              fullWidth
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              multiline
              rows={3}
              placeholder="Describe your goal in detail..."
            />

            <TextField
              fullWidth
              select
              label="Goal Type"
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as GoalType })}
              required
            >
              {goalTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  <Box>
                    <Typography variant="body1">{type.label}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {type.description}
                    </Typography>
                  </Box>
                </MenuItem>
              ))}
            </TextField>

            <Box display="flex" gap={2}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
              <TextField
                fullWidth
                type="date"
                label="Target Date"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
                inputProps={{ min: formData.startDate }}
              />
            </Box>
          </Stack>
        )}

        {activeStep === 1 && (
          <Stack spacing={3}>
            <Box sx={{ bgcolor: 'info.light', p: 2, borderRadius: 2 }}>
              <Typography variant="body2" color="info.dark" fontWeight={500}>
                <HelpIcon sx={{ fontSize: 18, verticalAlign: 'middle', mr: 1 }} />
                SMART Goal Template Guide
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Answer each question to create a well-defined goal
              </Typography>
            </Box>

            {Object.entries(smartGuide).map(([key, guide]) => (
              <Accordion key={key} defaultExpanded={key === 'specific'}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography fontWeight={600} textTransform="capitalize">
                    {key}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mb: 2, display: 'block' }}
                  >
                    {guide}
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={2}
                    value={formData[key as keyof typeof smartGuide]}
                    onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                    placeholder={`Enter ${key} criteria...`}
                    required
                  />
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        )}

        {activeStep === 2 && (
          <Stack spacing={3}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="h6">Milestones</Typography>
              <Button startIcon={<AddIcon />} onClick={addMilestone} variant="outlined">
                Add Milestone
              </Button>
            </Box>

            {formData.milestones.length === 0 ? (
              <Box
                sx={{
                  p: 4,
                  textAlign: 'center',
                  bgcolor: 'background.default',
                  borderRadius: 2,
                }}
              >
                <Typography color="text.secondary">
                  No milestones added yet. Break down your goal into smaller milestones.
                </Typography>
              </Box>
            ) : (
              formData.milestones.map((milestone, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 2,
                    border: 1,
                    borderColor: 'divider',
                    borderRadius: 2,
                  }}
                >
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Chip label={`Milestone ${index + 1}`} size="small" color="primary" />
                    <IconButton size="small" onClick={() => removeMilestone(index)} color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                  <Stack spacing={2}>
                    <TextField
                      fullWidth
                      label="Title"
                      value={milestone.title}
                      onChange={(e) => updateMilestone(index, 'title', e.target.value)}
                      required
                    />
                    <TextField
                      fullWidth
                      label="Description"
                      value={milestone.description}
                      onChange={(e) => updateMilestone(index, 'description', e.target.value)}
                      multiline
                      rows={2}
                    />
                    <TextField
                      fullWidth
                      type="date"
                      label="Target Date"
                      value={milestone.targetDate}
                      onChange={(e) => updateMilestone(index, 'targetDate', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                      required
                      inputProps={{
                        min: formData.startDate,
                        max: formData.targetDate,
                      }}
                    />
                  </Stack>
                </Box>
              ))
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        {activeStep > 0 && (
          <Button onClick={handleBack} disabled={isLoading}>
            Back
          </Button>
        )}
        {activeStep < steps.length - 1 ? (
          <Button onClick={handleNext} variant="contained" disabled={!isStepValid() || isLoading}>
            Next
          </Button>
        ) : (
          <Button onClick={handleSubmit} variant="contained" disabled={!isStepValid() || isLoading}>
            Create Goal
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
