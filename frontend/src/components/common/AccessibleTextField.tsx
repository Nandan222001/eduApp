import { TextField, TextFieldProps } from '@mui/material';
import { forwardRef, useId } from 'react';
import { getAriaLabel } from '../../utils/accessibility';

export interface AccessibleTextFieldProps extends Omit<TextFieldProps, 'id'> {
  id?: string;
  describedBy?: string;
}

export const AccessibleTextField = forwardRef<HTMLDivElement, AccessibleTextFieldProps>(
  ({ id, label, required, error, helperText, describedBy, ...props }, ref) => {
    const autoId = useId();
    const fieldId = id || autoId;
    const errorId = error ? `${fieldId}-error` : undefined;
    const helperId = helperText ? `${fieldId}-helper` : undefined;

    const ariaDescribedBy = [describedBy, helperId, errorId].filter(Boolean).join(' ');

    return (
      <TextField
        ref={ref}
        id={fieldId}
        label={label}
        required={required}
        error={error}
        helperText={helperText}
        inputProps={{
          'aria-label': typeof label === 'string' ? getAriaLabel(label, required) : undefined,
          'aria-describedby': ariaDescribedBy || undefined,
          'aria-invalid': error ? 'true' : 'false',
          'aria-required': required ? 'true' : 'false',
          ...props.inputProps,
        }}
        FormHelperTextProps={{
          id: helperId,
          role: error ? 'alert' : undefined,
          'aria-live': error ? 'polite' : undefined,
        }}
        {...props}
      />
    );
  }
);

AccessibleTextField.displayName = 'AccessibleTextField';

export default AccessibleTextField;
