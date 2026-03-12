import { Container, Typography, Box } from '@mui/material';
import { RealtimeChatInterface } from '@/components/communications/RealtimeChatInterface';

export default function RealtimeChatDemo() {
  const handleSendMessage = async (message: string) => {
    console.log('Sending message:', message);
  };

  const participants = [
    { id: 1, name: 'John Doe' },
    { id: 2, name: 'Jane Smith' },
    { id: 3, name: 'Bob Johnson' },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Real-time Chat Demo
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        This page demonstrates the real-time chat functionality with typing indicators and online
        presence.
      </Typography>

      <Box sx={{ height: '600px' }}>
        <RealtimeChatInterface
          room="demo-room"
          title="Demo Chat Room"
          onSendMessage={handleSendMessage}
          participants={participants}
        />
      </Box>
    </Container>
  );
}
