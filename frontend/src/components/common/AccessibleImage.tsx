import { Box, BoxProps } from '@mui/material';
import { forwardRef, useState } from 'react';

export interface AccessibleImageProps extends Omit<BoxProps, 'component'> {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  loading?: 'eager' | 'lazy';
  onLoad?: () => void;
  onError?: () => void;
  decorative?: boolean;
  fallbackSrc?: string;
}

export const AccessibleImage = forwardRef<HTMLImageElement, AccessibleImageProps>(
  (
    {
      src,
      alt,
      width,
      height,
      loading = 'lazy',
      onLoad,
      onError,
      decorative = false,
      fallbackSrc,
      ...props
    },
    ref
  ) => {
    const [imgSrc, setImgSrc] = useState(src);
    const [hasError, setHasError] = useState(false);

    const handleError = () => {
      if (fallbackSrc && !hasError) {
        setImgSrc(fallbackSrc);
        setHasError(true);
      }
      onError?.();
    };

    return (
      <Box
        ref={ref}
        component="img"
        src={imgSrc}
        alt={decorative ? '' : alt}
        aria-hidden={decorative}
        role={decorative ? 'presentation' : undefined}
        width={width}
        height={height}
        loading={loading}
        onLoad={onLoad}
        onError={handleError}
        sx={{
          display: 'block',
          maxWidth: '100%',
          height: 'auto',
          ...props.sx,
        }}
        {...props}
      />
    );
  }
);

AccessibleImage.displayName = 'AccessibleImage';

export default AccessibleImage;
