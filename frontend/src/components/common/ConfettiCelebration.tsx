import React, { useEffect, useState } from 'react';
import Confetti from 'react-confetti';

interface ConfettiCelebrationProps {
  active?: boolean;
  duration?: number;
  recycle?: boolean;
  numberOfPieces?: number;
  width?: number;
  height?: number;
  onComplete?: () => void;
}

const ConfettiCelebration: React.FC<ConfettiCelebrationProps> = ({
  active = true,
  duration = 5000,
  recycle = false,
  numberOfPieces = 500,
  width,
  height,
  onComplete,
}) => {
  const [isActive, setIsActive] = useState(active);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setIsActive(active);

    if (active && duration > 0) {
      const timer = setTimeout(() => {
        setIsActive(false);
        if (onComplete) {
          onComplete();
        }
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [active, duration, onComplete]);

  if (!isActive) {
    return null;
  }

  return (
    <Confetti
      width={width || windowSize.width}
      height={height || windowSize.height}
      recycle={recycle}
      numberOfPieces={numberOfPieces}
      gravity={0.3}
      colors={['#667eea', '#764ba2', '#f093fb', '#f5576c', '#fda085', '#f6d365']}
    />
  );
};

export default ConfettiCelebration;
