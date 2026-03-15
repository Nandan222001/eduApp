import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  IconButton,
  Paper,
  Rating,
  useTheme,
  alpha,
  Autocomplete,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  School as SchoolIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  People as PeopleIcon,
  Close as CloseIcon,
  Star as StarIcon,
} from '@mui/icons-material';
import { useAuth } from '@/hooks/useAuth';
import collegeApi from '@/api/college';
import { College } from '@/types/college';

export default function CollegeComparison() {
  const theme = useTheme();
  useAuth();
  const [colleges, setColleges] = useState<College[]>([]);
  const [allColleges, setAllColleges] = useState<College[]>([]);
  const [personalFitScores, setPersonalFitScores] = useState<{ [key: number]: number }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadColleges();
  }, []);

  const loadColleges = async () => {
    try {
      setLoading(true);
      const data = await collegeApi.searchColleges({});
      setAllColleges(data);
    } catch (err) {
      setError('Failed to load colleges');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addCollege = (college: College) => {
    if (!colleges.find((c) => c.id === college.id)) {
      setColleges([...colleges, college]);
    }
  };

  const removeCollege = (collegeId: number) => {
    setColleges(colleges.filter((c) => c.id !== collegeId));
  };

  const updateFitScore = (collegeId: number, score: number) => {
    setPersonalFitScores({ ...personalFitScores, [collegeId]: score });
  };

  if (loading && allColleges.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" fontWeight={700}>
          College Comparison Tool
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Autocomplete
            options={allColleges}
            getOptionLabel={(option) => option.name}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Search and add colleges to compare"
                placeholder="Type college name..."
              />
            )}
            onChange={(_, value) => {
              if (value) addCollege(value);
            }}
          />
        </CardContent>
      </Card>

      {colleges.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <SchoolIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No colleges selected for comparison
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use the search box above to add colleges to compare side-by-side
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, minWidth: 200 }}>Feature</TableCell>
                    {colleges.map((college) => (
                      <TableCell key={college.id} align="center" sx={{ minWidth: 200 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          <Avatar
                            src={college.logo_url}
                            sx={{ width: 56, height: 56, bgcolor: theme.palette.primary.main }}
                          >
                            <SchoolIcon />
                          </Avatar>
                          <Typography variant="subtitle2" fontWeight={700} textAlign="center">
                            {college.name}
                          </Typography>
                          <IconButton size="small" onClick={() => removeCollege(college.id)}>
                            <CloseIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <StarIcon fontSize="small" color="action" />
                        Personal Fit Score
                      </Box>
                    </TableCell>
                    {colleges.map((college) => (
                      <TableCell key={college.id} align="center">
                        <Rating
                          value={personalFitScores[college.id] || 0}
                          onChange={(_, value) => updateFitScore(college.id, value || 0)}
                          precision={0.5}
                        />
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationIcon fontSize="small" color="action" />
                        Location
                      </Box>
                    </TableCell>
                    {colleges.map((college) => (
                      <TableCell key={college.id} align="center">
                        <Typography variant="body2">
                          {college.city}, {college.state}
                        </Typography>
                        <Chip label={college.campus_setting} size="small" sx={{ mt: 0.5 }} />
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <PeopleIcon fontSize="small" color="action" />
                        Size
                      </Box>
                    </TableCell>
                    {colleges.map((college) => (
                      <TableCell key={college.id} align="center">
                        <Chip
                          label={college.size}
                          size="small"
                          color={
                            college.size === 'large'
                              ? 'primary'
                              : college.size === 'medium'
                                ? 'secondary'
                                : 'default'
                          }
                        />
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                    {colleges.map((college) => (
                      <TableCell key={college.id} align="center">
                        <Chip label={college.type} size="small" variant="outlined" />
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                    <TableCell sx={{ fontWeight: 600 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <TrendingUpIcon fontSize="small" color="action" />
                        Acceptance Rate
                      </Box>
                    </TableCell>
                    {colleges.map((college) => (
                      <TableCell key={college.id} align="center">
                        <Typography variant="h6" fontWeight={700}>
                          {college.acceptance_rate}%
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>National Ranking</TableCell>
                    {colleges.map((college) => (
                      <TableCell key={college.id} align="center">
                        {college.ranking_national ? `#${college.ranking_national}` : 'N/A'}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow sx={{ bgcolor: alpha(theme.palette.success.main, 0.05) }}>
                    <TableCell sx={{ fontWeight: 600 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <MoneyIcon fontSize="small" color="action" />
                        Tuition (In-State)
                      </Box>
                    </TableCell>
                    {colleges.map((college) => (
                      <TableCell key={college.id} align="center">
                        <Typography variant="h6" fontWeight={700}>
                          ${college.tuition_in_state?.toLocaleString() || 'N/A'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          per year
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Tuition (Out-of-State)</TableCell>
                    {colleges.map((college) => (
                      <TableCell key={college.id} align="center">
                        <Typography variant="body1" fontWeight={600}>
                          ${college.tuition_out_state?.toLocaleString() || 'N/A'}
                        </Typography>
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Room & Board</TableCell>
                    {colleges.map((college) => (
                      <TableCell key={college.id} align="center">
                        ${college.room_board?.toLocaleString() || 'N/A'}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Application Fee</TableCell>
                    {colleges.map((college) => (
                      <TableCell key={college.id} align="center">
                        ${college.application_fee}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow sx={{ bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                    <TableCell sx={{ fontWeight: 600 }}>Average SAT</TableCell>
                    {colleges.map((college) => (
                      <TableCell key={college.id} align="center">
                        {college.sat_avg || 'N/A'}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Average ACT</TableCell>
                    {colleges.map((college) => (
                      <TableCell key={college.id} align="center">
                        {college.act_avg || 'N/A'}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Average GPA</TableCell>
                    {colleges.map((college) => (
                      <TableCell key={college.id} align="center">
                        {college.gpa_avg || 'N/A'}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Student-Faculty Ratio</TableCell>
                    {colleges.map((college) => (
                      <TableCell key={college.id} align="center">
                        {college.student_faculty_ratio
                          ? `${college.student_faculty_ratio}:1`
                          : 'N/A'}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Graduation Rate</TableCell>
                    {colleges.map((college) => (
                      <TableCell key={college.id} align="center">
                        {college.graduation_rate ? `${college.graduation_rate}%` : 'N/A'}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Employment Rate</TableCell>
                    {colleges.map((college) => (
                      <TableCell key={college.id} align="center">
                        {college.employment_rate ? `${college.employment_rate}%` : 'N/A'}
                      </TableCell>
                    ))}
                  </TableRow>

                  <TableRow>
                    <TableCell sx={{ fontWeight: 600 }}>Notable Programs</TableCell>
                    {colleges.map((college) => (
                      <TableCell key={college.id} align="center">
                        <Box
                          sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 0.5,
                            justifyContent: 'center',
                          }}
                        >
                          {college.notable_programs?.slice(0, 3).map((program, idx) => (
                            <Chip key={idx} label={program} size="small" />
                          ))}
                        </Box>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
