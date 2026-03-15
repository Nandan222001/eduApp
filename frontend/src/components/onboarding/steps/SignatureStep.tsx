import { useRef, useState } from 'react';
import { Box, Typography, Button, Paper, useTheme, alpha, IconButton } from '@mui/material';
import { Clear as ClearIcon, CheckCircle as CheckCircleIcon } from '@mui/icons-material';
import { OnboardingStep } from '@/types/onboarding';

interface SignatureStepProps {
  step: OnboardingStep;
  onComplete: (data?: Record<string, unknown>) => void;
  data: Record<string, unknown>;
}

export default function SignatureStep({ step, onComplete }: SignatureStepProps) {
  const theme = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    setHasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const signatureData = canvas.toDataURL('image/png');
    onComplete({ signature: signatureData });
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} gutterBottom>
        {step.title}
      </Typography>

      {step.description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          {step.description}
        </Typography>
      )}

      {step.config.signatureLabel && (
        <Typography variant="body1" sx={{ mb: 2 }}>
          {step.config.signatureLabel}
        </Typography>
      )}

      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 3,
          border: `2px solid ${theme.palette.divider}`,
          borderRadius: 2,
          position: 'relative',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            Sign below
          </Typography>
          <IconButton onClick={clearSignature} size="small" disabled={!hasSignature}>
            <ClearIcon />
          </IconButton>
        </Box>

        <Box
          sx={{
            position: 'relative',
            border: `1px dashed ${theme.palette.divider}`,
            borderRadius: 1,
            bgcolor: '#fff',
            cursor: 'crosshair',
          }}
        >
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            style={{ display: 'block', width: '100%', height: 'auto' }}
          />
          {!hasSignature && (
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                pointerEvents: 'none',
                textAlign: 'center',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Sign here with your mouse or finger
              </Typography>
            </Box>
          )}
        </Box>

        {hasSignature && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mt: 2,
              p: 1.5,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.success.main, 0.1),
            }}
          >
            <CheckCircleIcon sx={{ color: theme.palette.success.main, fontSize: 20 }} />
            <Typography variant="body2" color="success.main" fontWeight={600}>
              Signature captured
            </Typography>
          </Box>
        )}
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="contained"
          onClick={saveSignature}
          disabled={step.config.signatureRequired && !hasSignature}
        >
          Continue
        </Button>
      </Box>
    </Box>
  );
}
