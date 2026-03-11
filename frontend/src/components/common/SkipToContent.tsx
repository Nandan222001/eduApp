import { Box, Link } from '@mui/material';

interface SkipToContentProps {
  targetId?: string;
}

export const SkipToContent = ({ targetId = 'main-content' }: SkipToContentProps) => {
  const handleSkip = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        left: '-9999px',
        top: '0',
        zIndex: 9999,
        '&:focus-within': {
          left: '0',
          top: '0',
          width: 'auto',
          height: 'auto',
          overflow: 'visible',
        },
      }}
    >
      <Link
        href={`#${targetId}`}
        onClick={handleSkip}
        sx={{
          display: 'inline-block',
          padding: 2,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          textDecoration: 'none',
          fontWeight: 'bold',
          borderRadius: 1,
          boxShadow: 3,
          '&:focus': {
            outline: '3px solid',
            outlineColor: 'secondary.main',
            outlineOffset: '2px',
          },
        }}
      >
        Skip to main content
      </Link>
    </Box>
  );
};

export default SkipToContent;
