import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Pagination,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon,
  Add as AddIcon,
  ExpandMore as ExpandMoreIcon,
} from '@mui/icons-material';
import { previousYearPapersAPI } from '@/api/previousYearPapers';
import { PreviousYearPaper, Board, PaperFilters } from '@/types/previousYearPapers';

const PaperListPage: React.FC = () => {
  const navigate = useNavigate();
  const [papers, setPapers] = useState<PreviousYearPaper[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<PaperFilters>({
    search: '',
  });

  const itemsPerPage = 12;

  useEffect(() => {
    loadPapers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  const loadPapers = async () => {
    setLoading(true);
    setError(null);

    try {
      const skip = (page - 1) * itemsPerPage;
      const response = await previousYearPapersAPI.listPapers({
        ...filters,
        skip,
        limit: itemsPerPage,
      });
      setPapers(response.items);
      setTotal(response.total);
    } catch (err) {
      setError(
        (err as { response?: { data?: { detail?: string } } }).response?.data?.detail ||
          'Failed to load papers'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (
    field: keyof PaperFilters,
    value: string | number | boolean | Board | undefined
  ) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ search: '' });
    setPage(1);
  };

  const handleViewPaper = (paperId: number) => {
    navigate(`/admin/papers/view/${paperId}`);
  };

  const handleUploadPaper = () => {
    navigate('/admin/papers/upload');
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Previous Year Papers</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleUploadPaper}
        >
          Upload Paper
        </Button>
      </Box>

      <Accordion sx={{ mb: 3 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <FilterIcon sx={{ mr: 1 }} />
          <Typography>Filters</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                placeholder="Search papers..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Board</InputLabel>
                <Select
                  value={filters.board || ''}
                  onChange={(e) => handleFilterChange('board', e.target.value || undefined)}
                  label="Board"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value={Board.CBSE}>CBSE</MenuItem>
                  <MenuItem value={Board.ICSE}>ICSE</MenuItem>
                  <MenuItem value={Board.STATE_BOARD}>State Board</MenuItem>
                  <MenuItem value={Board.IB}>IB</MenuItem>
                  <MenuItem value={Board.CAMBRIDGE}>Cambridge</MenuItem>
                  <MenuItem value={Board.OTHER}>Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                type="number"
                label="Year"
                value={filters.year || ''}
                onChange={(e) =>
                  handleFilterChange('year', e.target.value ? parseInt(e.target.value) : undefined)
                }
              />
            </Grid>

            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.is_active === undefined ? '' : filters.is_active.toString()}
                  onChange={(e) =>
                    handleFilterChange(
                      'is_active',
                      e.target.value === '' ? undefined : e.target.value === 'true'
                    )
                  }
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Button variant="outlined" onClick={handleClearFilters}>
                Clear Filters
              </Button>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
          }}
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Found {total} papers
          </Typography>

          <Grid container spacing={3}>
            {papers.map((paper) => (
              <Grid item xs={12} md={6} lg={4} key={paper.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {paper.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {paper.description}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                      <Chip label={paper.board.toUpperCase()} color="primary" size="small" />
                      <Chip label={`Year: ${paper.year}`} size="small" />
                      {paper.exam_month && <Chip label={paper.exam_month} size="small" />}
                      {paper.total_marks && (
                        <Chip label={`${paper.total_marks} Marks`} size="small" />
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Views: {paper.view_count}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Downloads: {paper.download_count}
                      </Typography>
                    </Box>
                    {paper.ocr_processed && (
                      <Chip label="OCR Processed" color="success" size="small" sx={{ mt: 1 }} />
                    )}
                  </CardContent>
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<ViewIcon />}
                      onClick={() => handleViewPaper(paper.id)}
                    >
                      View Paper
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {total > itemsPerPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={Math.ceil(total / itemsPerPage)}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default PaperListPage;
