import { Box, Typography, Alert } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';

interface FormFieldErrorProps {
  error?: string | string[];
  touched?: boolean;
  variant?: 'text' | 'alert';
}

export const FormFieldError = ({
  error,
  touched = true,
  variant = 'text',
}: FormFieldErrorProps) => {
  if (!error || !touched) return null;

  const errors = Array.isArray(error) ? error : [error];

  if (variant === 'alert') {
    return (
      <Alert severity="error" icon={<ErrorIcon fontSize="small" />} sx={{ mt: 1 }}>
        {errors.map((err, index) => (
          <Typography key={index} variant="caption" display="block">
            {err}
          </Typography>
        ))}
      </Alert>
    );
  }

  return (
    <Box sx={{ mt: 0.5 }}>
      {errors.map((err, index) => (
        <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <ErrorIcon sx={{ fontSize: 14, color: 'error.main' }} />
          <Typography variant="caption" color="error">
            {err}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export default FormFieldError;
