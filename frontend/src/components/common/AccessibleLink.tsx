import { Link, LinkProps } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { forwardRef, ReactNode } from 'react';

export interface AccessibleLinkProps extends Omit<LinkProps, 'href'> {
  to?: string;
  href?: string;
  external?: boolean;
  children: ReactNode;
  ariaLabel?: string;
  download?: boolean;
}

export const AccessibleLink = forwardRef<HTMLAnchorElement, AccessibleLinkProps>(
  ({ to, href, external = false, children, ariaLabel, download = false, ...props }, ref) => {
    const isExternal = external || (href && (href.startsWith('http') || href.startsWith('mailto')));
    const linkUrl = to || href || '#';

    if (isExternal || download) {
      return (
        <Link
          ref={ref}
          href={linkUrl}
          target={isExternal && !download ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          aria-label={ariaLabel || (isExternal ? `${children} (opens in new tab)` : undefined)}
          download={download}
          sx={{
            textDecoration: 'underline',
            color: 'primary.main',
            '&:focus-visible': {
              outline: '3px solid',
              outlineColor: 'primary.main',
              outlineOffset: '2px',
              borderRadius: '4px',
            },
            '&:hover': {
              textDecoration: 'none',
            },
            ...props.sx,
          }}
          {...props}
        >
          {children}
        </Link>
      );
    }

    return (
      <Link
        ref={ref}
        component={RouterLink}
        to={linkUrl}
        aria-label={ariaLabel}
        sx={{
          textDecoration: 'underline',
          color: 'primary.main',
          '&:focus-visible': {
            outline: '3px solid',
            outlineColor: 'primary.main',
            outlineOffset: '2px',
            borderRadius: '4px',
          },
          '&:hover': {
            textDecoration: 'none',
          },
          ...props.sx,
        }}
        {...props}
      >
        {children}
      </Link>
    );
  }
);

AccessibleLink.displayName = 'AccessibleLink';

export default AccessibleLink;
