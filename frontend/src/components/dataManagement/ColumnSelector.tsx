import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Checkbox,
  FormControlLabel,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  DragIndicator as DragIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
} from '@mui/icons-material';
import { ColumnDefinition } from '@/types/dataManagement';

interface ColumnSelectorProps {
  availableColumns: ColumnDefinition[];
  selectedColumns: string[];
  onChange: (columns: string[]) => void;
}

export default function ColumnSelector({
  availableColumns,
  selectedColumns,
  onChange,
}: ColumnSelectorProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleToggleColumn = (columnId: string) => {
    if (selectedColumns.includes(columnId)) {
      onChange(selectedColumns.filter((id) => id !== columnId));
    } else {
      onChange([...selectedColumns, columnId]);
    }
  };

  const handleSelectAll = () => {
    onChange(availableColumns.map((col) => col.id));
  };

  const handleDeselectAll = () => {
    onChange([]);
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      const newColumns = [...selectedColumns];
      [newColumns[index - 1], newColumns[index]] = [newColumns[index], newColumns[index - 1]];
      onChange(newColumns);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < selectedColumns.length - 1) {
      const newColumns = [...selectedColumns];
      [newColumns[index], newColumns[index + 1]] = [newColumns[index + 1], newColumns[index]];
      onChange(newColumns);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newColumns = [...selectedColumns];
    const draggedItem = newColumns[draggedIndex];
    newColumns.splice(draggedIndex, 1);
    newColumns.splice(index, 0, draggedItem);
    setDraggedIndex(index);
    onChange(newColumns);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <Box>
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Available Columns</Typography>
          <Box>
            <Button size="small" onClick={handleSelectAll} sx={{ mr: 1 }}>
              Select All
            </Button>
            <Button size="small" onClick={handleDeselectAll}>
              Deselect All
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            maxHeight: 300,
            overflow: 'auto',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            p: 1,
          }}
        >
          {availableColumns.map((column) => (
            <FormControlLabel
              key={column.id}
              control={
                <Checkbox
                  checked={selectedColumns.includes(column.id)}
                  onChange={() => handleToggleColumn(column.id)}
                />
              }
              label={
                <Box>
                  <Typography variant="body2">{column.label}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {column.type}
                    {column.required && ' • Required'}
                  </Typography>
                </Box>
              }
              sx={{ display: 'flex', width: '100%', mb: 0.5 }}
            />
          ))}
        </Box>
      </Paper>

      {selectedColumns.length > 0 && (
        <Paper sx={{ p: 2, mt: 2 }}>
          <Typography variant="h6" gutterBottom>
            Selected Columns ({selectedColumns.length})
          </Typography>
          <Typography variant="caption" color="text.secondary" gutterBottom display="block">
            Drag to reorder or use arrow buttons
          </Typography>

          <List sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, mt: 1 }}>
            {selectedColumns.map((columnId, index) => {
              const column = availableColumns.find((col) => col.id === columnId);
              if (!column) return null;

              return (
                <Box key={columnId}>
                  <ListItem
                    draggable
                    onDragStart={() => handleDragStart(index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDragEnd={handleDragEnd}
                    sx={{
                      cursor: 'grab',
                      bgcolor: draggedIndex === index ? 'action.hover' : 'transparent',
                      '&:hover': { bgcolor: 'action.hover' },
                    }}
                    secondaryAction={
                      <Box>
                        <IconButton
                          size="small"
                          onClick={() => handleMoveUp(index)}
                          disabled={index === 0}
                        >
                          <ArrowUpIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleMoveDown(index)}
                          disabled={index === selectedColumns.length - 1}
                        >
                          <ArrowDownIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    }
                  >
                    <DragIcon sx={{ mr: 1, color: 'text.secondary' }} />
                    <ListItemText
                      primary={column.label}
                      secondary={`${column.type}${column.required ? ' • Required' : ''}`}
                    />
                  </ListItem>
                  {index < selectedColumns.length - 1 && <Divider />}
                </Box>
              );
            })}
          </List>
        </Paper>
      )}
    </Box>
  );
}
