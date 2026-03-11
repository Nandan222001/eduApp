import { useState } from 'react';
import { Box, Typography, Grid, Card, CardContent, Divider, Stack } from '@mui/material';
import {
  AccessibleTextField,
  AccessibleButton,
  AccessibleModal,
  AccessibleTable,
  FocusableIconButton,
  ScreenReaderOnly,
  LiveRegion,
} from '../components/common';
import { useAnnounce } from '../hooks';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';

export default function AccessibilityDemo() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [liveMessage, setLiveMessage] = useState('');
  const announce = useAnnounce();

  const handleSubmit = () => {
    announce('Form submitted successfully', 'polite');
    setLiveMessage('Your information has been saved');
    setTimeout(() => setLiveMessage(''), 3000);
  };

  const columns = [
    { id: 'name', label: 'Name' },
    { id: 'role', label: 'Role' },
    { id: 'email', label: 'Email' },
    { id: 'actions', label: 'Actions' },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Accessibility Features Demo
      </Typography>

      <ScreenReaderOnly>
        <p>
          This page demonstrates the accessibility features implemented in the application. All
          components are keyboard navigable and screen reader friendly.
        </p>
      </ScreenReaderOnly>

      {liveMessage && <LiveRegion priority="polite">{liveMessage}</LiveRegion>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Accessible Form Inputs
              </Typography>
              <Stack spacing={2}>
                <AccessibleTextField
                  label="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  fullWidth
                  placeholder="Enter your full name"
                />
                <AccessibleTextField
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  fullWidth
                  placeholder="your.email@example.com"
                  helperText="We'll never share your email"
                />
                <AccessibleButton
                  label="Submit form"
                  variant="contained"
                  onClick={handleSubmit}
                  fullWidth
                >
                  Submit
                </AccessibleButton>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Accessible Icon Buttons
              </Typography>
              <Stack direction="row" spacing={2}>
                <FocusableIconButton
                  label="Add new item"
                  color="primary"
                  onClick={() => announce('Add button clicked', 'polite')}
                >
                  <AddIcon />
                </FocusableIconButton>
                <FocusableIconButton
                  label="Edit item"
                  color="info"
                  onClick={() => announce('Edit button clicked', 'polite')}
                >
                  <EditIcon />
                </FocusableIconButton>
                <FocusableIconButton
                  label="Delete item"
                  color="error"
                  onClick={() => announce('Delete button clicked', 'polite')}
                >
                  <DeleteIcon />
                </FocusableIconButton>
              </Stack>
            </CardContent>
          </Card>

          <Box mt={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Accessible Modal
                </Typography>
                <AccessibleButton
                  label="Open modal dialog"
                  variant="outlined"
                  onClick={() => setIsModalOpen(true)}
                >
                  Open Modal
                </AccessibleButton>
              </CardContent>
            </Card>
          </Box>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Accessible Data Table
              </Typography>
              <AccessibleTable
                caption="User management table showing team members"
                columns={columns}
              >
                <tr>
                  <td>John Doe</td>
                  <td>Administrator</td>
                  <td>john.doe@example.com</td>
                  <td>
                    <FocusableIconButton label="Edit John Doe" size="small">
                      <EditIcon fontSize="small" />
                    </FocusableIconButton>
                    <FocusableIconButton label="Delete John Doe" size="small">
                      <DeleteIcon fontSize="small" />
                    </FocusableIconButton>
                  </td>
                </tr>
                <tr>
                  <td>Jane Smith</td>
                  <td>Teacher</td>
                  <td>jane.smith@example.com</td>
                  <td>
                    <FocusableIconButton label="Edit Jane Smith" size="small">
                      <EditIcon fontSize="small" />
                    </FocusableIconButton>
                    <FocusableIconButton label="Delete Jane Smith" size="small">
                      <DeleteIcon fontSize="small" />
                    </FocusableIconButton>
                  </td>
                </tr>
              </AccessibleTable>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Keyboard Shortcuts
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" component="div">
                <ul>
                  <li>
                    <kbd>Tab</kbd> - Navigate to next element
                  </li>
                  <li>
                    <kbd>Shift + Tab</kbd> - Navigate to previous element
                  </li>
                  <li>
                    <kbd>Enter</kbd> - Activate button or link
                  </li>
                  <li>
                    <kbd>Escape</kbd> - Close modal or dialog
                  </li>
                  <li>
                    <kbd>Space</kbd> - Toggle checkbox or switch
                  </li>
                  <li>
                    <kbd>Arrow Keys</kbd> - Navigate within components
                  </li>
                </ul>
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <AccessibleModal
        open={isModalOpen}
        title="Accessible Modal Dialog"
        onClose={() => setIsModalOpen(false)}
        maxWidth="sm"
      >
        <Typography paragraph>
          This is an accessible modal dialog with focus trap enabled. Try navigating with the Tab
          key - focus will stay within the modal.
        </Typography>
        <Typography paragraph>Press Escape or click the close button to dismiss.</Typography>
        <Stack direction="row" spacing={2} justifyContent="flex-end" mt={2}>
          <AccessibleButton label="Cancel" onClick={() => setIsModalOpen(false)}>
            Cancel
          </AccessibleButton>
          <AccessibleButton
            label="Confirm action"
            variant="contained"
            onClick={() => {
              setIsModalOpen(false);
              announce('Modal action confirmed', 'polite');
            }}
          >
            Confirm
          </AccessibleButton>
        </Stack>
      </AccessibleModal>
    </Box>
  );
}
