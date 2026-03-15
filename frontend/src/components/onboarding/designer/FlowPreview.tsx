import { Dialog, DialogContent, Box, IconButton, Typography } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import { OnboardingFlow } from '@/types/onboarding';
import OnboardingWizard from '../OnboardingWizard';

interface FlowPreviewProps {
  flow: OnboardingFlow;
  onClose: () => void;
}

export default function FlowPreview({ flow, onClose }: FlowPreviewProps) {
  return (
    <Dialog open={true} maxWidth="lg" fullWidth onClose={onClose}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid #e0e0e0',
        }}
      >
        <Typography variant="h6" fontWeight={700}>
          Preview Mode
        </Typography>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </Box>
      <DialogContent sx={{ p: 0, minHeight: '70vh' }}>
        <OnboardingWizard flow={flow} userId="preview-user" onComplete={onClose} onExit={onClose} />
      </DialogContent>
    </Dialog>
  );
}
