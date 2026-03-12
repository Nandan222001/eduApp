import { Card, CardProps } from '@mui/material';
import { forwardRef, ReactNode, KeyboardEvent } from 'react';

export interface AccessibleCardProps extends CardProps {
  children: ReactNode;
  clickable?: boolean;
  onCardClick?: () => void;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  interactive?: boolean;
}

export const AccessibleCard = forwardRef<HTMLDivElement, AccessibleCardProps>(
  (
    {
      children,
      clickable = false,
      onCardClick,
      ariaLabel,
      ariaDescribedBy,
      interactive = false,
      ...props
    },
    ref
  ) => {
    const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if ((event.key === 'Enter' || event.key === ' ') && onCardClick) {
        event.preventDefault();
        onCardClick();
      }
    };

    const cardProps: CardProps = {
      ...props,
      ref,
      onClick: clickable || interactive ? onCardClick : undefined,
      onKeyDown: clickable || interactive ? handleKeyDown : undefined,
      tabIndex: clickable || interactive ? 0 : undefined,
      role: clickable || interactive ? 'button' : props.role,
      'aria-label': ariaLabel,
      'aria-describedby': ariaDescribedBy,
      sx: {
        cursor: clickable || interactive ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover':
          clickable || interactive
            ? {
                transform: 'translateY(-2px)',
                boxShadow: 4,
              }
            : {},
        '&:focus-visible': {
          outline: '3px solid',
          outlineColor: 'primary.main',
          outlineOffset: '2px',
        },
        ...props.sx,
      },
    };

    return <Card {...cardProps}>{children}</Card>;
  }
);

AccessibleCard.displayName = 'AccessibleCard';

export default AccessibleCard;
