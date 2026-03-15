import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  IconButton,
  List,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  AccessTime as TimeIcon,
} from '@mui/icons-material';
import { Note } from '@/types/parentEducation';

interface NotesPanelProps {
  notes: Note[];
  onCreateNote: (content: string, timestamp?: number) => void;
  onUpdateNote: (noteId: number, content: string) => void;
  onDeleteNote: (noteId: number) => void;
  currentVideoTime?: number;
}

export const NotesPanel: React.FC<NotesPanelProps> = ({
  notes,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  currentVideoTime,
}) => {
  const theme = useTheme();
  const [noteContent, setNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState('');

  const handleCreateNote = () => {
    if (noteContent.trim()) {
      onCreateNote(noteContent, currentVideoTime);
      setNoteContent('');
    }
  };

  const handleStartEdit = (note: Note) => {
    setEditingNoteId(note.id);
    setEditContent(note.content);
  };

  const handleSaveEdit = () => {
    if (editingNoteId && editContent.trim()) {
      onUpdateNote(editingNoteId, editContent);
      setEditingNoteId(null);
      setEditContent('');
    }
  };

  const handleCancelEdit = () => {
    setEditingNoteId(null);
    setEditContent('');
  };

  const formatTimestamp = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box>
      {/* Note Input */}
      <Card sx={{ mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
        <CardContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            placeholder="Add a note..."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            sx={{ mb: 2 }}
          />
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateNote}
              disabled={!noteContent.trim()}
            >
              Save Note
            </Button>
            {currentVideoTime !== undefined && (
              <Typography variant="caption" color="text.secondary">
                @ {formatTimestamp(currentVideoTime)}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Notes List */}
      {notes.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No notes yet. Start taking notes to remember key points!
          </Typography>
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {notes.map((note) => (
            <Card key={note.id} sx={{ mb: 2 }}>
              <CardContent>
                {editingNoteId === note.id ? (
                  /* Edit Mode */
                  <Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      sx={{ mb: 1 }}
                    />
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveEdit}
                      >
                        Save
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<CancelIcon />}
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </Button>
                    </Box>
                  </Box>
                ) : (
                  /* View Mode */
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(note.created_at).toLocaleDateString()}
                        </Typography>
                        {note.timestamp_seconds !== undefined &&
                          note.timestamp_seconds !== null && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <TimeIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                              <Typography variant="caption" color="primary" fontWeight={600}>
                                {formatTimestamp(note.timestamp_seconds)}
                              </Typography>
                            </Box>
                          )}
                      </Box>
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleStartEdit(note)}
                          sx={{ mr: 0.5 }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            if (window.confirm('Delete this note?')) {
                              onDeleteNote(note.id);
                            }
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {note.content}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          ))}
        </List>
      )}
    </Box>
  );
};

export default NotesPanel;
