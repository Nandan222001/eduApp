import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  Box,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput,
  SelectChangeEvent,
  useTheme,
  CircularProgress,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  PictureAsPdf as PdfIcon,
  TableChart as ExcelIcon,
  Refresh as GenerateIcon,
} from '@mui/icons-material';
import { CustomReportFilter, CustomReportData } from '@/types/analytics';

interface CustomReportBuilderProps {
  onGenerate: (filters: CustomReportFilter) => Promise<CustomReportData>;
  onExportPDF: (data: CustomReportData) => void;
  onExportExcel: (data: CustomReportData) => void;
  availableGrades?: Array<{ id: number; name: string }>;
  availableSections?: Array<{ id: number; name: string }>;
  availableSubjects?: Array<{ id: number; name: string }>;
}

const metricOptions = [
  'Performance',
  'Attendance',
  'Assignments',
  'Exams',
  'Behavior',
  'Engagement',
];

export default function CustomReportBuilder({
  onGenerate,
  onExportPDF,
  onExportExcel,
  availableGrades = [],
  availableSections = [],
  availableSubjects = [],
}: CustomReportBuilderProps) {
  const theme = useTheme();
  const [filters, setFilters] = useState<CustomReportFilter>({});
  const [reportData, setReportData] = useState<CustomReportData | null>(null);
  const [loading, setLoading] = useState(false);

  const handleDateChange = (field: 'startDate' | 'endDate', value: Date | null) => {
    if (value) {
      setFilters({ ...filters, [field]: value.toISOString() });
    }
  };

  const handleMultiSelectChange = (
    field: keyof CustomReportFilter,
    event: SelectChangeEvent<number[]>
  ) => {
    const value = event.target.value;
    setFilters({
      ...filters,
      [field]: typeof value === 'string' ? value.split(',').map(Number) : value,
    });
  };

  const handleMetricChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    setFilters({
      ...filters,
      metricTypes: typeof value === 'string' ? value.split(',') : value,
    });
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const data = await onGenerate(filters);
      setReportData(data);
    } catch (error) {
      console.error('Failed to generate report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card elevation={0} sx={{ border: `1px solid ${theme.palette.divider}` }}>
      <CardHeader
        title="Custom Report Builder"
        subheader="Generate custom analytics reports with filters"
      />
      <CardContent>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <DatePicker
                label="Start Date"
                value={filters.startDate ? new Date(filters.startDate) : null}
                onChange={(value) => handleDateChange('startDate', value)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <DatePicker
                label="End Date"
                value={filters.endDate ? new Date(filters.endDate) : null}
                onChange={(value) => handleDateChange('endDate', value)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </Grid>

            {availableGrades.length > 0 && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Grades</InputLabel>
                  <Select
                    multiple
                    value={filters.gradeIds || []}
                    onChange={(e) => handleMultiSelectChange('gradeIds', e)}
                    input={<OutlinedInput label="Grades" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((id) => (
                          <Chip
                            key={id}
                            label={availableGrades.find((g) => g.id === id)?.name}
                            size="small"
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {availableGrades.map((grade) => (
                      <MenuItem key={grade.id} value={grade.id}>
                        {grade.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {availableSections.length > 0 && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Sections</InputLabel>
                  <Select
                    multiple
                    value={filters.sectionIds || []}
                    onChange={(e) => handleMultiSelectChange('sectionIds', e)}
                    input={<OutlinedInput label="Sections" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((id) => (
                          <Chip
                            key={id}
                            label={availableSections.find((s) => s.id === id)?.name}
                            size="small"
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {availableSections.map((section) => (
                      <MenuItem key={section.id} value={section.id}>
                        {section.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            {availableSubjects.length > 0 && (
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Subjects</InputLabel>
                  <Select
                    multiple
                    value={filters.subjectIds || []}
                    onChange={(e) => handleMultiSelectChange('subjectIds', e)}
                    input={<OutlinedInput label="Subjects" />}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((id) => (
                          <Chip
                            key={id}
                            label={availableSubjects.find((s) => s.id === id)?.name}
                            size="small"
                          />
                        ))}
                      </Box>
                    )}
                  >
                    {availableSubjects.map((subject) => (
                      <MenuItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            )}

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Metrics</InputLabel>
                <Select
                  multiple
                  value={filters.metricTypes || []}
                  onChange={handleMetricChange}
                  input={<OutlinedInput label="Metrics" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {metricOptions.map((metric) => (
                    <MenuItem key={metric} value={metric}>
                      {metric}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Group By</InputLabel>
                <Select
                  value={filters.groupBy || ''}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      groupBy: e.target.value as CustomReportFilter['groupBy'],
                    })
                  }
                  label="Group By"
                >
                  <MenuItem value="">None</MenuItem>
                  <MenuItem value="grade">Grade</MenuItem>
                  <MenuItem value="section">Section</MenuItem>
                  <MenuItem value="subject">Subject</MenuItem>
                  <MenuItem value="month">Month</MenuItem>
                  <MenuItem value="week">Week</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <GenerateIcon />}
                  onClick={handleGenerate}
                  disabled={loading}
                  fullWidth
                >
                  {loading ? 'Generating...' : 'Generate Report'}
                </Button>
                {reportData && (
                  <>
                    <Button
                      variant="outlined"
                      startIcon={<PdfIcon />}
                      onClick={() => onExportPDF(reportData)}
                      sx={{ minWidth: 150 }}
                    >
                      Export PDF
                    </Button>
                    <Button
                      variant="outlined"
                      startIcon={<ExcelIcon />}
                      onClick={() => onExportExcel(reportData)}
                      sx={{ minWidth: 150 }}
                    >
                      Export Excel
                    </Button>
                  </>
                )}
              </Box>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </CardContent>
    </Card>
  );
}
