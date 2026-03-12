import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardIcon from '@mui/icons-material/Keyboard';
import { FocusableIconButton } from './FocusableIconButton';

interface KeyboardShortcut {
  keys: string[];
  description: string;
  context?: string;
}

const shortcuts: Record<string, KeyboardShortcut[]> = {
  Global: [
    { keys: ['Tab'], description: 'Move to next interactive element' },
    { keys: ['Shift', 'Tab'], description: 'Move to previous interactive element' },
    { keys: ['Enter'], description: 'Activate button or link' },
    { keys: ['Space'], description: 'Activate button or checkbox' },
    { keys: ['Escape'], description: 'Close dialog or menu' },
    { keys: ['?'], description: 'Show keyboard shortcuts' },
  ],
  Navigation: [
    { keys: ['Alt', 'S'], description: 'Focus on search bar' },
    { keys: ['Alt', 'N'], description: 'Open notifications' },
    { keys: ['Alt', 'A'], description: 'Open accessibility menu' },
  ],
  Lists: [
    { keys: ['↑'], description: 'Move to previous item' },
    { keys: ['↓'], description: 'Move to next item' },
    { keys: ['Home'], description: 'Move to first item' },
    { keys: ['End'], description: 'Move to last item' },
    { keys: ['Enter'], description: 'Select item' },
  ],
  Menus: [
    { keys: ['↑'], description: 'Previous menu item' },
    { keys: ['↓'], description: 'Next menu item' },
    { keys: ['Escape'], description: 'Close menu' },
    { keys: ['Enter'], description: 'Select menu item' },
  ],
  'Text Editing': [
    { keys: ['Ctrl', 'A'], description: 'Select all' },
    { keys: ['Ctrl', 'C'], description: 'Copy' },
    { keys: ['Ctrl', 'V'], description: 'Paste' },
    { keys: ['Ctrl', 'X'], description: 'Cut' },
    { keys: ['Ctrl', 'Z'], description: 'Undo' },
    { keys: ['Ctrl', 'Y'], description: 'Redo' },
  ],
};

export const KeyboardShortcutsDialog = () => {
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <FocusableIconButton label="Keyboard shortcuts" onClick={handleOpen}>
        <KeyboardIcon />
      </FocusableIconButton>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        aria-labelledby="shortcuts-dialog-title"
      >
        <DialogTitle id="shortcuts-dialog-title">
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6" component="span">
              Keyboard Shortcuts
            </Typography>
            <IconButton aria-label="Close dialog" onClick={handleClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {Object.entries(shortcuts).map(([category, categoryShortcuts]) => (
            <Box key={category} sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', fontWeight: 600 }}>
                {category}
              </Typography>
              <TableContainer
                component={Paper}
                elevation={0}
                sx={{ bgcolor: 'background.default' }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, width: '30%' }}>Keys</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {categoryShortcuts.map((shortcut, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {shortcut.keys.map((key, keyIndex) => (
                              <Box
                                key={keyIndex}
                                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                              >
                                <Chip
                                  label={key}
                                  size="small"
                                  sx={{
                                    fontWeight: 600,
                                    fontSize: '0.75rem',
                                    bgcolor: 'action.hover',
                                    fontFamily: 'monospace',
                                  }}
                                />
                                {keyIndex < shortcut.keys.length - 1 && (
                                  <Typography variant="caption" sx={{ mx: 0.5 }}>
                                    +
                                  </Typography>
                                )}
                              </Box>
                            ))}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{shortcut.description}</Typography>
                          {shortcut.context && (
                            <Typography variant="caption" color="text.secondary">
                              {shortcut.context}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              {category !== Object.keys(shortcuts)[Object.keys(shortcuts).length - 1] && (
                <Divider sx={{ mt: 2 }} />
              )}
            </Box>
          ))}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Note:</strong> Some shortcuts may vary depending on your browser and operating
              system. On Mac, use <Chip label="Cmd" size="small" /> instead of{' '}
              <Chip label="Ctrl" size="small" />.
            </Typography>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default KeyboardShortcutsDialog;
