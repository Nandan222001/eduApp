import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  IconButton,
  Divider,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { OnboardingStep, FormField, QuizQuestion, TourHighlight } from '@/types/onboarding';

interface StepConfigPanelProps {
  step: OnboardingStep;
  onUpdate: (updates: Partial<OnboardingStep>) => void;
}

export default function StepConfigPanel({ step, onUpdate }: StepConfigPanelProps) {
  const [localStep, setLocalStep] = useState(step);

  useEffect(() => {
    setLocalStep(step);
  }, [step]);

  const handleChange = (field: string, value: unknown) => {
    const updated = { ...localStep, [field]: value };
    setLocalStep(updated);
    onUpdate({ [field]: value });
  };

  const handleConfigChange = (field: string, value: unknown) => {
    const updatedConfig = { ...localStep.config, [field]: value };
    setLocalStep({ ...localStep, config: updatedConfig });
    onUpdate({ config: updatedConfig });
  };

  const renderFormFieldsConfig = () => {
    const fields = localStep.config.formFields || [];

    const addField = () => {
      const newField: FormField = {
        id: `field-${Date.now()}`,
        type: 'text',
        label: 'New Field',
        required: false,
      };
      handleConfigChange('formFields', [...fields, newField]);
    };

    const updateField = (index: number, updates: Partial<FormField>) => {
      const updated = fields.map((f, i) => (i === index ? { ...f, ...updates } : f));
      handleConfigChange('formFields', updated);
    };

    const removeField = (index: number) => {
      handleConfigChange(
        'formFields',
        fields.filter((_, i) => i !== index)
      );
    };

    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            Form Fields
          </Typography>
          <Button startIcon={<AddIcon />} size="small" onClick={addField}>
            Add Field
          </Button>
        </Box>

        {fields.map((field, index) => (
          <Box key={field.id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" fontWeight={600}>
                Field {index + 1}
              </Typography>
              <IconButton size="small" onClick={() => removeField(index)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
            <TextField
              fullWidth
              size="small"
              label="Label"
              value={field.label}
              onChange={(e) => updateField(index, { label: e.target.value })}
              sx={{ mb: 1 }}
            />
            <TextField
              fullWidth
              select
              size="small"
              label="Type"
              value={field.type}
              onChange={(e) => updateField(index, { type: e.target.value as FormField['type'] })}
              SelectProps={{ native: true }}
              sx={{ mb: 1 }}
            >
              <option value="text">Text</option>
              <option value="email">Email</option>
              <option value="tel">Phone</option>
              <option value="number">Number</option>
              <option value="date">Date</option>
              <option value="textarea">Textarea</option>
              <option value="select">Select</option>
              <option value="checkbox">Checkbox</option>
              <option value="radio">Radio</option>
            </TextField>
            <FormControlLabel
              control={
                <Switch
                  checked={field.required}
                  onChange={(e) => updateField(index, { required: e.target.checked })}
                />
              }
              label="Required"
            />
          </Box>
        ))}
      </Box>
    );
  };

  const renderQuizConfig = () => {
    const questions = localStep.config.questions || [];

    const addQuestion = () => {
      const newQuestion: QuizQuestion = {
        id: `q-${Date.now()}`,
        question: 'New Question',
        type: 'multiple_choice',
        options: ['Option 1', 'Option 2', 'Option 3'],
        correctAnswer: 0,
      };
      handleConfigChange('questions', [...questions, newQuestion]);
    };

    const removeQuestion = (index: number) => {
      handleConfigChange(
        'questions',
        questions.filter((_, i) => i !== index)
      );
    };

    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            Quiz Questions
          </Typography>
          <Button startIcon={<AddIcon />} size="small" onClick={addQuestion}>
            Add Question
          </Button>
        </Box>

        <TextField
          fullWidth
          size="small"
          type="number"
          label="Passing Score (%)"
          value={localStep.config.passingScore || 70}
          onChange={(e) => handleConfigChange('passingScore', Number(e.target.value))}
          sx={{ mb: 2 }}
        />

        {questions.map((q, index) => (
          <Box key={q.id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" fontWeight={600}>
                Question {index + 1}
              </Typography>
              <IconButton size="small" onClick={() => removeQuestion(index)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
            <TextField fullWidth size="small" label="Question" value={q.question} sx={{ mb: 1 }} />
          </Box>
        ))}
      </Box>
    );
  };

  const renderTourConfig = () => {
    const highlights = localStep.config.tourHighlights || [];

    const addHighlight = () => {
      const newHighlight: TourHighlight = {
        id: `h-${Date.now()}`,
        selector: '.element',
        title: 'New Highlight',
        description: 'Description',
        position: 'bottom',
      };
      handleConfigChange('tourHighlights', [...highlights, newHighlight]);
    };

    const removeHighlight = (index: number) => {
      handleConfigChange(
        'tourHighlights',
        highlights.filter((_, i) => i !== index)
      );
    };

    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            Tour Highlights
          </Typography>
          <Button startIcon={<AddIcon />} size="small" onClick={addHighlight}>
            Add Highlight
          </Button>
        </Box>

        {highlights.map((h, index) => (
          <Box key={h.id} sx={{ mb: 2, p: 2, border: '1px solid #e0e0e0', borderRadius: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="caption" fontWeight={600}>
                Highlight {index + 1}
              </Typography>
              <IconButton size="small" onClick={() => removeHighlight(index)}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Box>
            <TextField fullWidth size="small" label="Title" value={h.title} sx={{ mb: 1 }} />
            <TextField
              fullWidth
              size="small"
              multiline
              rows={2}
              label="Description"
              value={h.description}
              sx={{ mb: 1 }}
            />
            <TextField fullWidth size="small" label="CSS Selector" value={h.selector} />
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
        Step Configuration
      </Typography>

      <Divider sx={{ my: 2 }} />

      <TextField
        fullWidth
        label="Step Title"
        value={localStep.title}
        onChange={(e) => handleChange('title', e.target.value)}
        sx={{ mb: 2 }}
      />

      <TextField
        fullWidth
        multiline
        rows={2}
        label="Description"
        value={localStep.description || ''}
        onChange={(e) => handleChange('description', e.target.value)}
        sx={{ mb: 2 }}
      />

      <FormControlLabel
        control={
          <Switch
            checked={localStep.required}
            onChange={(e) => handleChange('required', e.target.checked)}
          />
        }
        label="Required Step"
        sx={{ mb: 2 }}
      />

      <Divider sx={{ my: 2 }} />

      {step.type === 'welcome' && (
        <TextField
          fullWidth
          multiline
          rows={4}
          label="Welcome Message"
          value={localStep.config.message || ''}
          onChange={(e) => handleConfigChange('message', e.target.value)}
        />
      )}

      {step.type === 'video' && (
        <Box>
          <TextField
            fullWidth
            label="Video Title"
            value={localStep.config.videoTitle || ''}
            onChange={(e) => handleConfigChange('videoTitle', e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Video URL"
            value={localStep.config.videoUrl || ''}
            onChange={(e) => handleConfigChange('videoUrl', e.target.value)}
          />
        </Box>
      )}

      {step.type === 'form' && renderFormFieldsConfig()}

      {step.type === 'document_upload' && (
        <Box>
          <TextField
            fullWidth
            multiline
            rows={2}
            label="Upload Instructions"
            value={localStep.config.documentDescription || ''}
            onChange={(e) => handleConfigChange('documentDescription', e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Accepted File Types (comma-separated)"
            value={(localStep.config.acceptedFileTypes || []).join(', ')}
            onChange={(e) =>
              handleConfigChange(
                'acceptedFileTypes',
                e.target.value.split(',').map((s) => s.trim())
              )
            }
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            type="number"
            label="Max File Size (bytes)"
            value={localStep.config.maxFileSize || 5242880}
            onChange={(e) => handleConfigChange('maxFileSize', Number(e.target.value))}
          />
        </Box>
      )}

      {step.type === 'signature' && (
        <Box>
          <TextField
            fullWidth
            label="Signature Label"
            value={localStep.config.signatureLabel || ''}
            onChange={(e) => handleConfigChange('signatureLabel', e.target.value)}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={localStep.config.signatureRequired || false}
                onChange={(e) => handleConfigChange('signatureRequired', e.target.checked)}
              />
            }
            label="Signature Required"
          />
        </Box>
      )}

      {step.type === 'quiz' && renderQuizConfig()}

      {step.type === 'platform_tour' && renderTourConfig()}
    </Box>
  );
}
