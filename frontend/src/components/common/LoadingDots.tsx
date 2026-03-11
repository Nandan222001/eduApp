import { Box, keyframes } from '@mui/material';

const bounce = keyframes`
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
`;

interface LoadingDotsProps {
  size?: number;
  color?: string;
}

export const LoadingDots = ({ size = 8, color = 'primary.main' }: LoadingDotsProps) => {
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
      {[0, 1, 2].map((index) => (
        <Box
          key={index}
          sx={{
            width: size,
            height: size,
            borderRadius: '50%',
            bgcolor: color,
            animation: `${bounce} 1.4s infinite ease-in-out both`,
            animationDelay: `${index * 0.16}s`,
          }}
        />
      ))}
    </Box>
  );
};

export default LoadingDots;
