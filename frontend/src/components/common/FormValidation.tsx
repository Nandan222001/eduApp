import { TextField, TextFieldProps } from '@mui/material';
import { FormFieldError } from './FormFieldError';

interface ValidatedTextFieldProps extends Omit<TextFieldProps, 'error'> {
  fieldError?: string | string[];
  touched?: boolean;
  showErrorVariant?: 'text' | 'alert';
}

export const ValidatedTextField = ({
  fieldError,
  touched = true,
  showErrorVariant = 'text',
  helperText,
  ...props
}: ValidatedTextFieldProps) => {
  const hasError = Boolean(fieldError && touched);

  return (
    <>
      <TextField
        {...props}
        error={hasError}
        helperText={
          hasError && showErrorVariant === 'text'
            ? Array.isArray(fieldError)
              ? fieldError[0]
              : fieldError
            : helperText
        }
      />
      {hasError && showErrorVariant === 'alert' && (
        <FormFieldError error={fieldError} touched={touched} variant="alert" />
      )}
    </>
  );
};

export default ValidatedTextField;
