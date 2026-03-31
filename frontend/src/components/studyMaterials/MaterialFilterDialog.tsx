import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  TextField,
  IconButton,
  Autocomplete,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import { MaterialType, MaterialSearchFilters } from '../../api/studyMaterials';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

interface MaterialFilterDialogProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: Partial<MaterialSearchFilters>) => void;
  currentFilters: Partial<MaterialSearchFilters>;
  subjects?: Array<{ id: number; name: string }>;
  chapters?: Array<{ id: number; name: string }>;
  topics?: Array<{ id: number; name: string }>;
  grades?: Array<{ id: number; name: string }>;
  availableTags?: string[];
}

const MaterialFilterDialog: React.FC<MaterialFilterDialogProps> = ({
  open,
  onClose,
  onApply,
  currentFilters,
  subjects = [],
  chapters = [],
  topics = [],
  grades = [],
  availableTags = [],
}) => {
  const [filters, setFilters] = useState<Partial<MaterialSearchFilters>>(currentFilters);

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({});
    onApply({});
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Filter Materials
        <IconButton onClick={onClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Material Type</InputLabel>
            <Select
              value={filters.material_type || ''}
              onChange={(e) =>
                setFilters({ ...filters, material_type: e.target.value as MaterialType })
              }
              label="Material Type"
            >
              <MenuItem value="">
                <em>All Types</em>
              </MenuItem>
              {Object.values(MaterialType).map((type) => (
                <MenuItem key={type} value={type}>
                  {type.toUpperCase()}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Grade</InputLabel>
            <Select
              value={filters.grade_id || ''}
              onChange={(e) => setFilters({ ...filters, grade_id: e.target.value as number })}
              label="Grade"
            >
              <MenuItem value="">
                <em>All Grades</em>
              </MenuItem>
              {grades.map((grade) => (
                <MenuItem key={grade.id} value={grade.id}>
                  {grade.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Subject</InputLabel>
            <Select
              value={filters.subject_id || ''}
              onChange={(e) => setFilters({ ...filters, subject_id: e.target.value as number })}
              label="Subject"
            >
              <MenuItem value="">
                <em>All Subjects</em>
              </MenuItem>
              {subjects.map((subject) => (
                <MenuItem key={subject.id} value={subject.id}>
                  {subject.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Chapter</InputLabel>
            <Select
              value={filters.chapter_id || ''}
              onChange={(e) => setFilters({ ...filters, chapter_id: e.target.value as number })}
              label="Chapter"
              disabled={!filters.subject_id}
            >
              <MenuItem value="">
                <em>All Chapters</em>
              </MenuItem>
              {chapters.map((chapter) => (
                <MenuItem key={chapter.id} value={chapter.id}>
                  {chapter.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Topic</InputLabel>
            <Select
              value={filters.topic_id || ''}
              onChange={(e) => setFilters({ ...filters, topic_id: e.target.value as number })}
              label="Topic"
              disabled={!filters.chapter_id}
            >
              <MenuItem value="">
                <em>All Topics</em>
              </MenuItem>
              {topics.map((topic) => (
                <MenuItem key={topic.id} value={topic.id}>
                  {topic.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Autocomplete
            multiple
            options={availableTags}
            value={filters.tags || []}
            onChange={(_, newValue) => setFilters({ ...filters, tags: newValue })}
            renderInput={(params) => <TextField {...params} label="Tags" />}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...tagProps } = getTagProps({ index });
                return <Chip key={key} label={option} {...tagProps} />;
              })
            }
          />

          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Date From"
              value={filters.date_from ? new Date(filters.date_from) : null}
              onChange={(date) => setFilters({ ...filters, date_from: date?.toISOString() })}
              slotProps={{ textField: { fullWidth: true } }}
            />

            <DatePicker
              label="Date To"
              value={filters.date_to ? new Date(filters.date_to) : null}
              onChange={(date) => setFilters({ ...filters, date_to: date?.toISOString() })}
              slotProps={{ textField: { fullWidth: true } }}
            />
          </LocalizationProvider>

          <FormControl fullWidth>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={filters.sort_by || 'created_at'}
              onChange={(e) => setFilters({ ...filters, sort_by: e.target.value })}
              label="Sort By"
            >
              <MenuItem value="created_at">Upload Date</MenuItem>
              <MenuItem value="updated_at">Last Modified</MenuItem>
              <MenuItem value="title">Title</MenuItem>
              <MenuItem value="view_count">Views</MenuItem>
              <MenuItem value="download_count">Downloads</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Sort Order</InputLabel>
            <Select
              value={filters.sort_order || 'desc'}
              onChange={(e) => setFilters({ ...filters, sort_order: e.target.value })}
              label="Sort Order"
            >
              <MenuItem value="desc">Descending</MenuItem>
              <MenuItem value="asc">Ascending</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleReset}>Reset</Button>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleApply} variant="contained">
          Apply Filters
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MaterialFilterDialog;
