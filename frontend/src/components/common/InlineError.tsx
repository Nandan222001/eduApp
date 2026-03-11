import { Box, Typography } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';

interface InlineErrorProps {
  message: string;
  sx?: object;
}

export const InlineError = ({ message, sx }: InlineErrorProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 1.5,
        bgcolor: 'error.lighter',
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'error.light',
        ...sx,
      }}
    >
      <ErrorIcon sx={{ fontSize: 20, color: 'error.main' }} />
      <Typography variant="body2" color="error.main">
        {message}
      </Typography>
    </Box>
  );
};

export default InlineError;
