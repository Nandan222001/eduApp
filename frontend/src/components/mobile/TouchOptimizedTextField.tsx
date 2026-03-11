import { TextField, TextFieldProps } from '@mui/material';

interface TouchOptimizedTextFieldProps extends Omit<TextFieldProps, 'size'> {
  touchSize?: number;
}

export default function TouchOptimizedTextField({
  touchSize = 44,
  InputProps = {},
  InputLabelProps = {},
  ...props
}: TouchOptimizedTextFieldProps) {
  return (
    <TextField
      {...props}
      InputProps={{
        ...InputProps,
        sx: {
          minHeight: touchSize,
          fontSize: '16px',
          touchAction: 'manipulation',
          WebkitTapHighlightColor: 'transparent',
          '& input': {
            minHeight: touchSize - 16,
            padding: '12px 14px',
            fontSize: '16px',
          },
          '& textarea': {
            fontSize: '16px',
          },
          ...InputProps.sx,
        },
      }}
      InputLabelProps={{
        ...InputLabelProps,
        sx: {
          fontSize: '16px',
          ...InputLabelProps.sx,
        },
      }}
      sx={{
        '& .MuiInputBase-root': {
          touchAction: 'manipulation',
        },
        ...props.sx,
      }}
    />
  );
}
