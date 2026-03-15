import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  Button,
  FormHelperText,
  FormLabel,
} from '@mui/material';
import { OnboardingStep, FormField } from '@/types/onboarding';

interface FormStepProps {
  step: OnboardingStep;
  onComplete: (data?: Record<string, unknown>) => void;
  data: Record<string, unknown>;
}

export default function FormStep({ step, onComplete, data }: FormStepProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>(data || {});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (field: FormField, value: unknown): string | null => {
    if (field.required && !value) {
      return `${field.label} is required`;
    }

    if (field.validation) {
      const val = value as string;

      if (field.validation.pattern && val) {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(val)) {
          return `Invalid ${field.label.toLowerCase()} format`;
        }
      }

      if (field.validation.minLength && val && val.length < field.validation.minLength) {
        return `${field.label} must be at least ${field.validation.minLength} characters`;
      }

      if (field.validation.maxLength && val && val.length > field.validation.maxLength) {
        return `${field.label} must be at most ${field.validation.maxLength} characters`;
      }

      if (
        field.validation.min !== undefined &&
        typeof value === 'number' &&
        value < field.validation.min
      ) {
        return `${field.label} must be at least ${field.validation.min}`;
      }

      if (
        field.validation.max !== undefined &&
        typeof value === 'number' &&
        value > field.validation.max
      ) {
        return `${field.label} must be at most ${field.validation.max}`;
      }
    }

    return null;
  };

  const handleChange = (fieldId: string, value: unknown) => {
    setFormData({ ...formData, [fieldId]: value });
    setErrors({ ...errors, [fieldId]: '' });
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};

    step.config.formFields?.forEach((field) => {
      const error = validateField(field, formData[field.id]);
      if (error) {
        newErrors[field.id] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onComplete(formData);
  };

  const renderField = (field: FormField) => {
    const value = formData[field.id] || '';
    const error = errors[field.id];

    switch (field.type) {
      case 'select':
        return (
          <FormControl fullWidth error={!!error} key={field.id}>
            <InputLabel>{field.label}</InputLabel>
            <Select
              value={value}
              label={field.label}
              onChange={(e) => handleChange(field.id, e.target.value)}
              required={field.required}
            >
              {field.options?.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
            {error && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        );

      case 'checkbox':
        return (
          <FormControlLabel
            key={field.id}
            control={
              <Checkbox
                checked={!!value}
                onChange={(e) => handleChange(field.id, e.target.checked)}
              />
            }
            label={field.label}
          />
        );

      case 'radio':
        return (
          <FormControl key={field.id} error={!!error}>
            <FormLabel>{field.label}</FormLabel>
            <RadioGroup value={value} onChange={(e) => handleChange(field.id, e.target.value)}>
              {field.options?.map((option) => (
                <FormControlLabel key={option} value={option} control={<Radio />} label={option} />
              ))}
            </RadioGroup>
            {error && <FormHelperText>{error}</FormHelperText>}
          </FormControl>
        );

      case 'textarea':
        return (
          <TextField
            key={field.id}
            fullWidth
            multiline
            rows={4}
            label={field.label}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
            error={!!error}
            helperText={error}
          />
        );

      default:
        return (
          <TextField
            key={field.id}
            fullWidth
            type={field.type}
            label={field.label}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleChange(field.id, e.target.value)}
            required={field.required}
            error={!!error}
            helperText={error}
          />
        );
    }
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        {step.title}
      </Typography>

      {step.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {step.description}
        </Typography>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3 }}>
        {step.config.formFields?.map((field) => renderField(field))}
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={handleSubmit}>
          Continue
        </Button>
      </Box>
    </Box>
  );
}
