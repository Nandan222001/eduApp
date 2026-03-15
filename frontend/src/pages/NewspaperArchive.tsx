import { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  Container,
  TextField,
  InputAdornment,
  Paper,
  Stack,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  useTheme,
  IconButton,
  Pagination,
} from '@mui/material';
import {
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
  Article as ArticleIcon,
  Download as DownloadIcon,
  Visibility as ViewIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';

interface ArchivedEdition {
  id: number;
  title: string;
  coverImage: string;
  publishDate: string;
  description: string;
  articleCount: number;
  theme: string;
  downloads: number;
  views: number;
  year: number;
  month: string;
}

const mockArchive: ArchivedEdition[] = [
  {
    id: 1,
    title: 'March 2024 - Spring Awakening',
    coverImage: 'https://via.placeholder.com/400x600/1976d2/ffffff?text=March+2024',
    publishDate: '2024-03-15',
    description: 'Spring sports, new beginnings, and student achievements',
    articleCount: 15,
    theme: 'Spring',
    downloads: 245,
    views: 1520,
    year: 2024,
    month: 'March',
  },
  {
    id: 2,
    title: 'February 2024 - Winter Reflections',
    coverImage: 'https://via.placeholder.com/400x600/0d47a1/ffffff?text=February+2024',
    publishDate: '2024-02-15',
    description: 'Winter sports highlights and academic excellence',
    articleCount: 18,
    theme: 'Winter',
    downloads: 312,
    views: 1890,
    year: 2024,
    month: 'February',
  },
  {
    id: 3,
    title: 'January 2024 - New Year New Goals',
    coverImage: 'https://via.placeholder.com/400x600/2e7d32/ffffff?text=January+2024',
    publishDate: '2024-01-15',
    description: 'New year resolutions, winter break stories, and upcoming events',
    articleCount: 12,
    theme: 'New Year',
    downloads: 289,
    views: 1650,
    year: 2024,
    month: 'January',
  },
  {
    id: 4,
    title: 'December 2023 - Year End Special',
    coverImage: 'https://via.placeholder.com/400x600/6a1b9a/ffffff?text=December+2023',
    publishDate: '2023-12-15',
    description: 'Year in review, holiday celebrations, and winter showcase',
    articleCount: 20,
    theme: 'Holidays',
    downloads: 456,
    views: 2340,
    year: 2023,
    month: 'December',
  },
  {
    id: 5,
    title: 'November 2023 - Gratitude Edition',
    coverImage: 'https://via.placeholder.com/400x600/d32f2f/ffffff?text=November+2023',
    publishDate: '2023-11-15',
    description: 'Thanksgiving traditions, fall sports championships, and community service',
    articleCount: 14,
    theme: 'Thanksgiving',
    downloads: 198,
    views: 1420,
    year: 2023,
    month: 'November',
  },
  {
    id: 6,
    title: 'October 2023 - Fall Festival',
    coverImage: 'https://via.placeholder.com/400x600/ed6c02/ffffff?text=October+2023',
    publishDate: '2023-10-15',
    description: 'Homecoming week, fall activities, and student spotlights',
    articleCount: 16,
    theme: 'Fall',
    downloads: 267,
    views: 1780,
    year: 2023,
    month: 'October',
  },
];

export default function NewspaperArchive() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterYear, setFilterYear] = useState<string>('all');
  const [filterTheme, setFilterTheme] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('date-desc');
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  const years = Array.from(new Set(mockArchive.map((e) => e.year))).sort((a, b) => b - a);
  const themes = Array.from(new Set(mockArchive.map((e) => e.theme)));

  const filteredArchive = mockArchive.filter((edition) => {
    const matchesSearch =
      searchQuery === '' ||
      edition.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      edition.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      edition.theme.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesYear = filterYear === 'all' || edition.year.toString() === filterYear;
    const matchesTheme = filterTheme === 'all' || edition.theme === filterTheme;

    return matchesSearch && matchesYear && matchesTheme;
  });

  const sortedArchive = [...filteredArchive].sort((a, b) => {
    switch (sortBy) {
      case 'date-desc':
        return new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime();
      case 'date-asc':
        return new Date(a.publishDate).getTime() - new Date(b.publishDate).getTime();
      case 'views-desc':
        return b.views - a.views;
      case 'downloads-desc':
        return b.downloads - a.downloads;
      default:
        return 0;
    }
  });

  const paginatedArchive = sortedArchive.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.ceil(sortedArchive.length / itemsPerPage);

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilterYear('all');
    setFilterTheme('all');
    setSortBy('date-desc');
    setPage(1);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom fontWeight={700}>
          Newspaper Archive
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Browse past editions of our student newspaper
        </Typography>
      </Box>

      <Paper
        elevation={0}
        sx={{ p: 3, mb: 4, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search editions..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Year</InputLabel>
              <Select
                value={filterYear}
                label="Year"
                onChange={(e) => {
                  setFilterYear(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="all">All Years</MenuItem>
                {years.map((year) => (
                  <MenuItem key={year} value={year.toString()}>
                    {year}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Theme</InputLabel>
              <Select
                value={filterTheme}
                label="Theme"
                onChange={(e) => {
                  setFilterTheme(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="all">All Themes</MenuItem>
                {themes.map((theme) => (
                  <MenuItem key={theme} value={theme}>
                    {theme}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select value={sortBy} label="Sort By" onChange={(e) => setSortBy(e.target.value)}>
                <MenuItem value="date-desc">Newest First</MenuItem>
                <MenuItem value="date-asc">Oldest First</MenuItem>
                <MenuItem value="views-desc">Most Viewed</MenuItem>
                <MenuItem value="downloads-desc">Most Downloaded</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
            >
              Clear Filters
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          {sortedArchive.length} edition{sortedArchive.length !== 1 ? 's' : ''} found
        </Typography>
      </Box>

      {paginatedArchive.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 8,
            textAlign: 'center',
            border: `1px solid ${theme.palette.divider}`,
            borderRadius: 2,
          }}
        >
          <ArticleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No editions found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search or filter criteria
          </Typography>
        </Paper>
      ) : (
        <>
          <Grid container spacing={3}>
            {paginatedArchive.map((edition) => (
              <Grid item xs={12} sm={6} md={4} key={edition.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'translateY(-4px)' },
                  }}
                >
                  <CardMedia
                    component="img"
                    height="300"
                    image={edition.coverImage}
                    alt={edition.title}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Chip label={edition.theme} size="small" color="primary" sx={{ mb: 1 }} />
                    <Typography variant="h6" gutterBottom fontWeight={600}>
                      {edition.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {edition.description}
                    </Typography>
                    <Stack spacing={1}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(edition.publishDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <ArticleIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {edition.articleCount} articles
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 2 }}>
                        <Chip
                          icon={<ViewIcon />}
                          label={`${edition.views} views`}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          icon={<DownloadIcon />}
                          label={`${edition.downloads}`}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Stack>
                  </CardContent>
                  <CardActions sx={{ p: 2, pt: 0 }}>
                    <Button size="small" startIcon={<ViewIcon />} fullWidth variant="outlined">
                      View Edition
                    </Button>
                    <IconButton size="small">
                      <DownloadIcon />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => setPage(value)}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
}
