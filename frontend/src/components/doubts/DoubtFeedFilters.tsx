import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment,
  Chip,
  Stack,
} from '@mui/material';
import { Search, HelpOutline, TrendingUp, Schedule } from '@mui/icons-material';
import { DoubtStatus, DoubtSearchFilters } from '../../types/doubt';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

interface DoubtFeedFiltersProps {
  onFilterChange: (filters: Partial<DoubtSearchFilters>) => void;
}

interface Subject {
  id: number;
  name: string;
}

const DoubtFeedFilters: React.FC<DoubtFeedFiltersProps> = ({ onFilterChange }) => {
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'unanswered'>('recent');
  const [status, setStatus] = useState<DoubtStatus | 'all'>('all');
  const [subjectId, setSubjectId] = useState<number | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    loadSubjects();
  }, []);

  useEffect(() => {
    const newFilters: Partial<DoubtSearchFilters> = {
      sort_by: sortBy,
    };

    if (status !== 'all') {
      newFilters.status = status as DoubtStatus;
    }

    if (subjectId) {
      newFilters.subject_id = subjectId as number;
    }

    if (searchQuery.trim()) {
      newFilters.query = searchQuery.trim();
    }

    onFilterChange(newFilters);
  }, [sortBy, status, subjectId, searchQuery, onFilterChange]);

  const loadSubjects = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/v1/academic/subjects`);
      setSubjects(response.data);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    }
  };

  const handleClearFilters = () => {
    setSortBy('recent');
    setStatus('all');
    setSubjectId('');
    setSearchQuery('');
  };

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Stack spacing={2}>
        <TextField
          placeholder="Search doubts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
        />

        <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
          <ToggleButtonGroup
            value={sortBy}
            exclusive
            onChange={(_, value) => value && setSortBy(value)}
            size="small"
          >
            <ToggleButton value="recent">
              <Schedule fontSize="small" sx={{ mr: 0.5 }} />
              Recent
            </ToggleButton>
            <ToggleButton value="popular">
              <TrendingUp fontSize="small" sx={{ mr: 0.5 }} />
              Popular
            </ToggleButton>
            <ToggleButton value="unanswered">
              <HelpOutline fontSize="small" sx={{ mr: 0.5 }} />
              Unanswered
            </ToggleButton>
          </ToggleButtonGroup>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as DoubtStatus | 'all')}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value={DoubtStatus.UNANSWERED}>Unanswered</MenuItem>
              <MenuItem value={DoubtStatus.ANSWERED}>Answered</MenuItem>
              <MenuItem value={DoubtStatus.RESOLVED}>Resolved</MenuItem>
              <MenuItem value={DoubtStatus.CLOSED}>Closed</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Subject</InputLabel>
            <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value as number | '')}>
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

          {(status !== 'all' || subjectId || searchQuery) && (
            <Chip
              label="Clear Filters"
              onClick={handleClearFilters}
              onDelete={handleClearFilters}
            />
          )}
        </Box>
      </Stack>
    </Paper>
  );
};

export default DoubtFeedFilters;
