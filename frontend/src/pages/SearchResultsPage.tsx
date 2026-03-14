import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Card,
  CardContent,
  Avatar,
  Chip,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  alpha,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  School as StudentIcon,
  Person as TeacherIcon,
  Assignment as AssignmentIcon,
  Description as PaperIcon,
  Announcement as AnnouncementIcon,
  ArrowForward as ArrowForwardIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import {
  searchApi,
  SearchResults,
  SearchFilterOptions,
  StudentSearchResult,
  TeacherSearchResult,
  AssignmentSearchResult,
  PaperSearchResult,
  AnnouncementSearchResult,
} from '@/api/search';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';
import { isDemoUser, demoSearchApi } from '@/api/demoDataApi';

const categoryInfo = {
  students: { icon: StudentIcon, label: 'Students', color: '#1976d2' },
  teachers: { icon: TeacherIcon, label: 'Teachers', color: '#2e7d32' },
  assignments: { icon: AssignmentIcon, label: 'Assignments', color: '#ed6c02' },
  papers: { icon: PaperIcon, label: 'Papers', color: '#9c27b0' },
  announcements: { icon: AnnouncementIcon, label: 'Announcements', color: '#d32f2f' },
};

export default function SearchResultsPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [filterOptions, setFilterOptions] = useState<SearchFilterOptions | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const isDemo = isDemoUser(user?.email);

  const [filters, setFilters] = useState({
    grade_id: '',
    subject_id: '',
    section_id: '',
    status: '',
    board: '',
    year: '',
    is_active: '',
  });

  useEffect(() => {
    const loadFilterOptions = async () => {
      if (isDemo) {
        return;
      }
      try {
        const options = await searchApi.getFilterOptions();
        setFilterOptions(options);
      } catch (error) {
        console.error('Failed to load filter options:', error);
      }
    };
    loadFilterOptions();
  }, [isDemo]);

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) {
      setQuery(q);
      performSearch(q);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      if (isDemo) {
        const searchTypes = activeTab === 'all' ? undefined : [activeTab];
        const demoResults = await demoSearchApi.search({
          query: searchQuery,
          types: searchTypes,
          limit: 50,
        });

        const mappedResults: SearchResults = {
          query: searchQuery,
          total_results: demoResults.total,
          search_time_ms: 10,
          students: demoResults.students as unknown as StudentSearchResult[],
          teachers: demoResults.teachers as unknown as TeacherSearchResult[],
          assignments: demoResults.assignments as unknown as AssignmentSearchResult[],
          papers: [],
          announcements: demoResults.announcements as unknown as AnnouncementSearchResult[],
        };
        setResults(mappedResults);
      } else {
        const searchTypes = activeTab === 'all' ? undefined : [activeTab];
        const activeFilters = Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        );

        const searchResults = await searchApi.globalSearch({
          query: searchQuery,
          search_types: searchTypes,
          filters: Object.keys(activeFilters).length > 0 ? activeFilters : undefined,
          limit: 50,
        });
        setResults(searchResults);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams({ q: query });
  };

  const handleTabChange = (_: React.SyntheticEvent, newValue: string) => {
    setActiveTab(newValue);
    if (query) {
      performSearch(query);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    if (query) {
      performSearch(query);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      grade_id: '',
      subject_id: '',
      section_id: '',
      status: '',
      board: '',
      year: '',
      is_active: '',
    });
  };

  const getCategoryCount = (category: string) => {
    if (!results) return 0;
    const categoryData = results[category as keyof SearchResults];
    if (Array.isArray(categoryData)) {
      return categoryData.length;
    }
    return 0;
  };

  const renderStudentCard = (student: StudentSearchResult) => (
    <Card
      key={student.id}
      sx={{
        mb: 2,
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: theme.shadows[4],
          transform: 'translateY(-2px)',
        },
      }}
      onClick={() => navigate(`/admin/students/${student.id}`)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar src={student.photo_url} sx={{ width: 56, height: 56 }}>
            <StudentIcon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">
              {student.first_name} {student.last_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {student.admission_number && `${student.admission_number} • `}
              {student.grade_name} {student.section_name}
            </Typography>
            {student.email && (
              <Typography variant="caption" color="text.secondary">
                {student.email}
              </Typography>
            )}
          </Box>
          <Chip
            label={student.status}
            size="small"
            color={student.status === 'active' ? 'success' : 'default'}
          />
          <ArrowForwardIcon color="action" />
        </Box>
      </CardContent>
    </Card>
  );

  const renderTeacherCard = (teacher: TeacherSearchResult) => (
    <Card
      key={teacher.id}
      sx={{
        mb: 2,
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: theme.shadows[4],
          transform: 'translateY(-2px)',
        },
      }}
      onClick={() => navigate(`/admin/users/teachers/${teacher.id}`)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: categoryInfo.teachers.color }}>
            <TeacherIcon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">
              {teacher.first_name} {teacher.last_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {teacher.employee_id && `${teacher.employee_id} • `}
              {teacher.specialization || 'Teacher'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {teacher.email}
            </Typography>
          </Box>
          <Chip
            label={teacher.is_active ? 'Active' : 'Inactive'}
            size="small"
            color={teacher.is_active ? 'success' : 'default'}
          />
          <ArrowForwardIcon color="action" />
        </Box>
      </CardContent>
    </Card>
  );

  const renderAssignmentCard = (assignment: AssignmentSearchResult) => (
    <Card
      key={assignment.id}
      sx={{
        mb: 2,
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: theme.shadows[4],
          transform: 'translateY(-2px)',
        },
      }}
      onClick={() => navigate(`/admin/assignments/${assignment.id}`)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: categoryInfo.assignments.color }}>
            <AssignmentIcon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">{assignment.title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {assignment.subject_name} • {assignment.grade_name} {assignment.section_name}
            </Typography>
            {assignment.description && (
              <Typography variant="body2" color="text.secondary" noWrap>
                {assignment.description}
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              {assignment.due_date && (
                <Chip
                  icon={<CalendarIcon />}
                  label={format(new Date(assignment.due_date), 'MMM dd, yyyy')}
                  size="small"
                  variant="outlined"
                />
              )}
              <Chip label={`${assignment.max_marks} marks`} size="small" variant="outlined" />
              <Chip
                label={assignment.status}
                size="small"
                color={assignment.status === 'published' ? 'success' : 'default'}
              />
            </Box>
          </Box>
          <ArrowForwardIcon color="action" />
        </Box>
      </CardContent>
    </Card>
  );

  const renderPaperCard = (paper: PaperSearchResult) => (
    <Card
      key={paper.id}
      sx={{
        mb: 2,
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: theme.shadows[4],
          transform: 'translateY(-2px)',
        },
      }}
      onClick={() => navigate(`/admin/papers/view/${paper.id}`)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: categoryInfo.papers.color }}>
            <PaperIcon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">{paper.title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {paper.board.toUpperCase()} {paper.year} • {paper.subject_name}
            </Typography>
            {paper.description && (
              <Typography variant="body2" color="text.secondary" noWrap>
                {paper.description}
              </Typography>
            )}
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              <Chip label={paper.grade_name} size="small" variant="outlined" />
              {paper.exam_month && (
                <Chip label={paper.exam_month} size="small" variant="outlined" />
              )}
              <Chip label={`${paper.view_count} views`} size="small" variant="outlined" />
            </Box>
          </Box>
          <ArrowForwardIcon color="action" />
        </Box>
      </CardContent>
    </Card>
  );

  const renderAnnouncementCard = (announcement: AnnouncementSearchResult) => (
    <Card
      key={announcement.id}
      sx={{
        mb: 2,
        cursor: 'pointer',
        transition: 'all 0.2s',
        '&:hover': {
          boxShadow: theme.shadows[4],
          transform: 'translateY(-2px)',
        },
      }}
      onClick={() => navigate(`/admin/communication/announcements/${announcement.id}`)}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
          <Avatar sx={{ width: 56, height: 56, bgcolor: categoryInfo.announcements.color }}>
            <AnnouncementIcon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">{announcement.title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {announcement.creator_name && `By ${announcement.creator_name} • `}
              {announcement.audience_type}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {announcement.content}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Chip
                label={announcement.priority}
                size="small"
                color={announcement.priority === 'urgent' ? 'error' : 'default'}
              />
              <Chip
                label={announcement.is_published ? 'Published' : 'Draft'}
                size="small"
                color={announcement.is_published ? 'success' : 'default'}
              />
            </Box>
          </Box>
          <ArrowForwardIcon color="action" />
        </Box>
      </CardContent>
    </Card>
  );

  const renderResults = () => {
    if (!results) return null;

    const renderCategory = <T,>(
      category: string,
      items: T[],
      renderFn: (item: T) => JSX.Element
    ) => {
      if (activeTab !== 'all' && activeTab !== category) return null;
      if (items.length === 0) return null;

      const info = categoryInfo[category as keyof typeof categoryInfo];
      const IconComponent = info.icon;

      return (
        <Box key={category} sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: alpha(info.color, 0.1),
                color: info.color,
              }}
            >
              <IconComponent fontSize="small" />
            </Avatar>
            <Typography variant="h6">{info.label}</Typography>
            <Chip label={items.length} size="small" />
          </Box>
          {items.map(renderFn)}
        </Box>
      );
    };

    return (
      <>
        {renderCategory('students', results.students, renderStudentCard)}
        {renderCategory('teachers', results.teachers, renderTeacherCard)}
        {renderCategory('assignments', results.assignments, renderAssignmentCard)}
        {renderCategory('papers', results.papers, renderPaperCard)}
        {renderCategory('announcements', results.announcements, renderAnnouncementCard)}
      </>
    );
  };

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Search
        </Typography>
        <Paper
          component="form"
          onSubmit={handleSearchSubmit}
          sx={{
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <TextField
            fullWidth
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for students, teachers, assignments, papers, announcements..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button
            variant="contained"
            type="submit"
            disabled={loading || !query.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : <SearchIcon />}
          >
            Search
          </Button>
          <IconButton onClick={() => setShowFilters(!showFilters)}>
            <FilterIcon color={showFilters ? 'primary' : 'inherit'} />
          </IconButton>
        </Paper>

        {showFilters && filterOptions && (
          <Paper sx={{ p: 2, mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Filters
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Grade</InputLabel>
                  <Select
                    value={filters.grade_id}
                    label="Grade"
                    onChange={(e) => handleFilterChange('grade_id', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    {filterOptions.grades.map((grade) => (
                      <MenuItem key={grade.id} value={grade.id}>
                        {grade.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Subject</InputLabel>
                  <Select
                    value={filters.subject_id}
                    label="Subject"
                    onChange={(e) => handleFilterChange('subject_id', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    {filterOptions.subjects.map((subject) => (
                      <MenuItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Board</InputLabel>
                  <Select
                    value={filters.board}
                    label="Board"
                    onChange={(e) => handleFilterChange('board', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    {filterOptions.boards.map((board) => (
                      <MenuItem key={board} value={board}>
                        {board.toUpperCase()}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filters.status}
                    label="Status"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="">All</MenuItem>
                    {filterOptions.statuses.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
              <Button variant="contained" size="small" onClick={handleApplyFilters}>
                Apply Filters
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<ClearIcon />}
                onClick={handleClearFilters}
              >
                Clear
              </Button>
            </Box>
          </Paper>
        )}
      </Box>

      {results && (
        <Box sx={{ mb: 3 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Typography variant="h6">
              {results.total_results} results for &quot;{results.query}&quot;
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Search completed in {results.search_time_ms}ms
            </Typography>
          </Box>

          <Tabs value={activeTab} onChange={handleTabChange}>
            <Tab label={`All (${results.total_results})`} value="all" />
            <Tab label={`Students (${getCategoryCount('students')})`} value="students" />
            <Tab label={`Teachers (${getCategoryCount('teachers')})`} value="teachers" />
            <Tab label={`Assignments (${getCategoryCount('assignments')})`} value="assignments" />
            <Tab label={`Papers (${getCategoryCount('papers')})`} value="papers" />
            <Tab
              label={`Announcements (${getCategoryCount('announcements')})`}
              value="announcements"
            />
          </Tabs>
        </Box>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : results && results.total_results === 0 ? (
        <Paper sx={{ p: 8, textAlign: 'center' }}>
          <SearchIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No results found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search query or filters
          </Typography>
        </Paper>
      ) : (
        <Box>{renderResults()}</Box>
      )}
    </Container>
  );
}
