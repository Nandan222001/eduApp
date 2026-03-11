import { Tooltip, TooltipProps } from '@mui/material';
import { cloneElement, ReactElement, useState } from 'react';

export interface AccessibleTooltipProps extends Omit<TooltipProps, 'children'> {
  children: ReactElement;
  showOnFocus?: boolean;
}

export const AccessibleTooltip = ({
  children,
  title,
  showOnFocus = true,
  ...props
}: AccessibleTooltipProps) => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const childWithProps = cloneElement(children, {
    onFocus: (e: React.FocusEvent) => {
      if (showOnFocus) {
        handleOpen();
      }
      children.props.onFocus?.(e);
    },
    onBlur: (e: React.FocusEvent) => {
      handleClose();
      children.props.onBlur?.(e);
    },
    onMouseEnter: (e: React.MouseEvent) => {
      handleOpen();
      children.props.onMouseEnter?.(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      handleClose();
      children.props.onMouseLeave?.(e);
    },
    'aria-describedby': open ? 'tooltip' : undefined,
  });

  return (
    <Tooltip
      title={title}
      open={open}
      onClose={handleClose}
      arrow
      enterDelay={200}
      leaveDelay={0}
      PopperProps={{
        sx: {
          '& .MuiTooltip-tooltip': {
            fontSize: '0.875rem',
            maxWidth: 300,
            backgroundColor: 'grey.900',
            color: 'common.white',
          },
          '& .MuiTooltip-arrow': {
            color: 'grey.900',
          },
        },
      }}
      {...props}
    >
      {childWithProps}
    </Tooltip>
  );
};

export default AccessibleTooltip;
