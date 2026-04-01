import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
  Paper,
  Stack,
  Chip,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  Radio,
  RadioGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  alpha,
} from '@mui/material';
import {
  Add as AddIcon,
  Save as SaveIcon,
  PlayArrow as PlayArrowIcon,
  Schedule as ScheduleIcon,
  Share as ShareIcon,
  GetApp as DownloadIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as FileCopyIcon,
  TrendingUp as TrendingUpIcon,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  ShowChart as ShowChartIcon,
  ScatterPlot as ScatterPlotIcon,
  TableChart as TableChartIcon,
  People as PeopleIcon,
  Link as LinkIcon,
  Code as CodeIcon,
  Assessment as AssessmentIcon,
  History as HistoryIcon,
  DataUsage as DataUsageIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  PieLabelRenderProps,
} from 'recharts';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

interface QueryField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  category: string;
}

interface QueryCondition {
  id: string;
  field: string;
  operator: string;
  value: string | number | boolean | null;
}

interface QueryBuilder {
  conditions: QueryCondition[];
  groupBy: string[];
  orderBy: { field: string; direction: 'asc' | 'desc' }[];
  limit?: number;
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  query: QueryBuilder;
  visualization: VisualizationConfig;
  icon: React.ReactNode;
}

interface VisualizationConfig {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap' | 'table' | 'area';
  xAxis?: string;
  yAxis?: string[];
  colors?: string[];
  showLegend?: boolean;
  showGrid?: boolean;
  title?: string;
}

interface ChartDataPoint {
  [key: string]: string | number;
}

interface Report {
  id: string;
  name: string;
  description: string;
  query: QueryBuilder;
  visualization: VisualizationConfig;
  schedule?: ScheduleConfig;
  shared?: ShareConfig;
  createdAt: string;
  updatedAt: string;
  version: number;
  versions?: ReportVersion[];
}

interface ScheduleConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  cronExpression?: string;
  time: string;
  timezone: string;
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv';
}

interface ShareConfig {
  enabled: boolean;
  publicLink?: string;
  embedCode?: string;
  allowedUsers?: string[];
}

interface ReportVersion {
  version: number;
  createdAt: string;
  createdBy: string;
  changes: string;
}

interface DataQualityIssue {
  id: string;
  institutionId: number;
  institutionName: string;
  issueType: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  field: string;
  description: string;
  affectedRecords: number;
  detectedAt: string;
}

const QUERY_FIELDS: QueryField[] = [
  { id: 'institution_name', name: 'Institution Name', type: 'string', category: 'Institution' },
  { id: 'institution_created_at', name: 'Created Date', type: 'date', category: 'Institution' },
  { id: 'subscription_plan', name: 'Subscription Plan', type: 'string', category: 'Subscription' },
  { id: 'subscription_status', name: 'Status', type: 'string', category: 'Subscription' },
  { id: 'monthly_revenue', name: 'Monthly Revenue', type: 'number', category: 'Revenue' },
  { id: 'total_users', name: 'Total Users', type: 'number', category: 'Users' },
  { id: 'active_users', name: 'Active Users', type: 'number', category: 'Users' },
  { id: 'students_count', name: 'Students', type: 'number', category: 'Users' },
  { id: 'teachers_count', name: 'Teachers', type: 'number', category: 'Users' },
  { id: 'feature_usage', name: 'Feature Usage', type: 'number', category: 'Features' },
  { id: 'support_tickets', name: 'Support Tickets', type: 'number', category: 'Support' },
  { id: 'response_time', name: 'Avg Response Time', type: 'number', category: 'Support' },
];

const OPERATORS = {
  string: ['equals', 'not equals', 'contains', 'starts with', 'ends with'],
  number: ['equals', 'not equals', 'greater than', 'less than', 'between'],
  date: ['equals', 'before', 'after', 'between'],
  boolean: ['is true', 'is false'],
};

const REPORT_TEMPLATES: ReportTemplate[] = [
  {
    id: 'monthly-revenue',
    name: 'Monthly Revenue',
    description: 'Track revenue trends across all institutions',
    category: 'Revenue',
    icon: <TrendingUpIcon />,
    query: {
      conditions: [],
      groupBy: ['month', 'subscription_plan'],
      orderBy: [{ field: 'month', direction: 'desc' }],
    },
    visualization: {
      type: 'area',
      xAxis: 'month',
      yAxis: ['revenue'],
      showLegend: true,
      showGrid: true,
      title: 'Monthly Revenue Trend',
    },
  },
  {
    id: 'user-growth',
    name: 'User Growth',
    description: 'Monitor user acquisition and retention',
    category: 'Users',
    icon: <PeopleIcon />,
    query: {
      conditions: [],
      groupBy: ['month'],
      orderBy: [{ field: 'month', direction: 'desc' }],
    },
    visualization: {
      type: 'line',
      xAxis: 'month',
      yAxis: ['new_users', 'total_users', 'active_users'],
      showLegend: true,
      showGrid: true,
      title: 'User Growth Metrics',
    },
  },
  {
    id: 'feature-adoption',
    name: 'Feature Adoption',
    description: 'Analyze feature usage patterns',
    category: 'Features',
    icon: <AssessmentIcon />,
    query: {
      conditions: [],
      groupBy: ['feature_name'],
      orderBy: [{ field: 'usage_count', direction: 'desc' }],
    },
    visualization: {
      type: 'bar',
      xAxis: 'feature_name',
      yAxis: ['usage_count', 'unique_users'],
      showLegend: true,
      showGrid: true,
      title: 'Feature Adoption Rates',
    },
  },
  {
    id: 'support-metrics',
    name: 'Support Metrics',
    description: 'Track support ticket trends and resolution times',
    category: 'Support',
    icon: <DataUsageIcon />,
    query: {
      conditions: [],
      groupBy: ['month', 'priority'],
      orderBy: [{ field: 'month', direction: 'desc' }],
    },
    visualization: {
      type: 'bar',
      xAxis: 'month',
      yAxis: ['ticket_count', 'avg_resolution_time'],
      showLegend: true,
      showGrid: true,
      title: 'Support Ticket Metrics',
    },
  },
  {
    id: 'subscription-distribution',
    name: 'Subscription Distribution',
    description: 'View distribution of subscription plans',
    category: 'Subscription',
    icon: <PieChartIcon />,
    query: {
      conditions: [],
      groupBy: ['subscription_plan'],
      orderBy: [{ field: 'count', direction: 'desc' }],
    },
    visualization: {
      type: 'pie',
      showLegend: true,
      title: 'Subscription Plan Distribution',
    },
  },
  {
    id: 'institution-performance',
    name: 'Institution Performance',
    description: 'Compare key metrics across institutions',
    category: 'Institution',
    icon: <ScatterPlotIcon />,
    query: {
      conditions: [],
      groupBy: ['institution_name'],
      orderBy: [{ field: 'performance_score', direction: 'desc' }],
      limit: 50,
    },
    visualization: {
      type: 'scatter',
      xAxis: 'active_users',
      yAxis: ['revenue'],
      showLegend: true,
      showGrid: true,
      title: 'Institution Performance Matrix',
    },
  },
];

export default function AdvancedReports() {
  const theme = useTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [builderOpen, setBuilderOpen] = useState(false);
  const [builderStep, setBuilderStep] = useState(0);
  const [queryBuilder, setQueryBuilder] = useState<QueryBuilder>({
    conditions: [],
    groupBy: [],
    orderBy: [],
  });
  const [visualization, setVisualization] = useState<VisualizationConfig>({
    type: 'bar',
    showLegend: true,
    showGrid: true,
  });
  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleConfig, setScheduleConfig] = useState<ScheduleConfig>({
    enabled: false,
    frequency: 'weekly',
    time: '09:00',
    timezone: 'UTC',
    recipients: [],
    format: 'pdf',
  });
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareConfig, setShareConfig] = useState<ShareConfig>({
    enabled: false,
  });
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel' | 'csv' | 'json'>('pdf');
  const [versionDialogOpen, setVersionDialogOpen] = useState(false);
  const [dataQualityOpen, setDataQualityOpen] = useState(false);
  const [dataQualityIssues, setDataQualityIssues] = useState<DataQualityIssue[]>([]);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [templateFilter, setTemplateFilter] = useState<string>('all');
  const [previewData, setPreviewData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    loadReports();
    loadDataQualityIssues();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    setTimeout(() => {
      const mockReports: Report[] = [
        {
          id: '1',
          name: 'Q4 Revenue Analysis',
          description: 'Quarterly revenue breakdown by institution',
          query: REPORT_TEMPLATES[0].query,
          visualization: REPORT_TEMPLATES[0].visualization,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-20T14:30:00Z',
          version: 3,
        },
        {
          id: '2',
          name: 'Weekly User Engagement',
          description: 'Active user metrics and engagement rates',
          query: REPORT_TEMPLATES[1].query,
          visualization: REPORT_TEMPLATES[1].visualization,
          schedule: {
            enabled: true,
            frequency: 'weekly',
            time: '09:00',
            timezone: 'UTC',
            recipients: ['admin@example.com'],
            format: 'pdf',
          },
          createdAt: '2024-01-10T08:00:00Z',
          updatedAt: '2024-01-10T08:00:00Z',
          version: 1,
        },
      ];
      setReports(mockReports);
      setLoading(false);
    }, 500);
  };

  const loadDataQualityIssues = () => {
    const mockIssues: DataQualityIssue[] = [
      {
        id: '1',
        institutionId: 123,
        institutionName: 'Springfield High School',
        issueType: 'missing_data',
        severity: 'high',
        field: 'student_email',
        description: 'Missing email addresses for students',
        affectedRecords: 45,
        detectedAt: '2024-01-20T10:00:00Z',
      },
      {
        id: '2',
        institutionId: 124,
        institutionName: 'Riverside Academy',
        issueType: 'duplicate_data',
        severity: 'medium',
        field: 'student_id',
        description: 'Duplicate student IDs found',
        affectedRecords: 12,
        detectedAt: '2024-01-19T15:30:00Z',
      },
      {
        id: '3',
        institutionId: 125,
        institutionName: 'Oakwood Institute',
        issueType: 'inconsistent_format',
        severity: 'low',
        field: 'phone_number',
        description: 'Inconsistent phone number formats',
        affectedRecords: 78,
        detectedAt: '2024-01-18T09:00:00Z',
      },
    ];
    setDataQualityIssues(mockIssues);
  };

  const handleCreateFromTemplate = (template: ReportTemplate) => {
    setQueryBuilder(template.query);
    setVisualization(template.visualization);
    setReportName(template.name);
    setReportDescription(template.description);
    setBuilderOpen(true);
    setBuilderStep(2);
  };

  const handleAddCondition = () => {
    setQueryBuilder({
      ...queryBuilder,
      conditions: [
        ...queryBuilder.conditions,
        {
          id: Date.now().toString(),
          field: QUERY_FIELDS[0].id,
          operator: 'equals',
          value: '',
        },
      ],
    });
  };

  const handleUpdateCondition = (id: string, updates: Partial<QueryCondition>) => {
    setQueryBuilder({
      ...queryBuilder,
      conditions: queryBuilder.conditions.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    });
  };

  const handleRemoveCondition = (id: string) => {
    setQueryBuilder({
      ...queryBuilder,
      conditions: queryBuilder.conditions.filter((c) => c.id !== id),
    });
  };

  const handleSaveReport = () => {
    const newReport: Report = {
      id: Date.now().toString(),
      name: reportName,
      description: reportDescription,
      query: queryBuilder,
      visualization,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };
    setReports([...reports, newReport]);
    setBuilderOpen(false);
    resetBuilder();
  };

  const resetBuilder = () => {
    setQueryBuilder({ conditions: [], groupBy: [], orderBy: [] });
    setVisualization({ type: 'bar', showLegend: true, showGrid: true });
    setReportName('');
    setReportDescription('');
    setBuilderStep(0);
  };

  const handleRunReport = (report: Report) => {
    setLoading(true);
    setTimeout(() => {
      const mockData = generateMockData(report.visualization.type);
      setPreviewData(mockData);
      setSelectedReport(report);
      setLoading(false);
    }, 1000);
  };

  const generateMockData = (type: string): ChartDataPoint[] => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    switch (type) {
      case 'bar':
      case 'line':
      case 'area':
        return months.map((month) => ({
          month,
          revenue: Math.floor(Math.random() * 50000) + 30000,
          users: Math.floor(Math.random() * 1000) + 500,
          new_users: Math.floor(Math.random() * 200) + 50,
        }));
      case 'pie':
        return [
          { name: 'Basic', value: 30 },
          { name: 'Standard', value: 45 },
          { name: 'Premium', value: 25 },
        ];
      case 'scatter':
        return Array.from({ length: 20 }, (_, i) => ({
          active_users: Math.floor(Math.random() * 500) + 100,
          revenue: Math.floor(Math.random() * 30000) + 5000,
          name: `Institution ${i + 1}`,
        }));
      default:
        return [];
    }
  };

  const handleExport = async (format: 'pdf' | 'excel' | 'csv' | 'json') => {
    setLoading(true);
    setTimeout(() => {
      alert(`Report exported as ${format.toUpperCase()}`);
      setLoading(false);
      setExportDialogOpen(false);
    }, 1500);
  };

  const handleScheduleSave = () => {
    if (selectedReport) {
      const updatedReport = { ...selectedReport, schedule: scheduleConfig };
      setReports(reports.map((r) => (r.id === selectedReport.id ? updatedReport : r)));
      setScheduleDialogOpen(false);
    }
  };

  const handleShareSave = () => {
    if (selectedReport) {
      const shareUrl = `https://reports.example.com/share/${selectedReport.id}`;
      const embedCode = `<iframe src="${shareUrl}" width="100%" height="600"></iframe>`;
      const updatedShare = { ...shareConfig, publicLink: shareUrl, embedCode };
      const updatedReport = { ...selectedReport, shared: updatedShare };
      setReports(reports.map((r) => (r.id === selectedReport.id ? updatedReport : r)));
      setShareConfig(updatedShare);
      setShareDialogOpen(false);
    }
  };

  const handleAddRecipient = () => {
    if (recipientEmail && !scheduleConfig.recipients.includes(recipientEmail)) {
      setScheduleConfig({
        ...scheduleConfig,
        recipients: [...scheduleConfig.recipients, recipientEmail],
      });
      setRecipientEmail('');
    }
  };

  const renderVisualization = (report: Report, data: ChartDataPoint[]) => {
    const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    switch (report.visualization.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={report.visualization.xAxis || 'month'} />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              {report.visualization.yAxis?.map((key, idx) => (
                <Bar key={key} dataKey={key} fill={colors[idx % colors.length]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={report.visualization.xAxis || 'month'} />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              {report.visualization.yAxis?.map((key, idx) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[idx % colors.length]}
                  strokeWidth={2}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={report.visualization.xAxis || 'month'} />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              {report.visualization.yAxis?.map((key, idx) => (
                <Area
                  key={key}
                  type="monotone"
                  dataKey={key}
                  fill={colors[idx % colors.length]}
                  stroke={colors[idx % colors.length]}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: PieLabelRenderProps) => `${props.name}: ${props.value}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((_entry: ChartDataPoint, index: number) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              <CartesianGrid />
              <XAxis dataKey={report.visualization.xAxis || 'active_users'} name="Active Users" />
              <YAxis dataKey={report.visualization.yAxis?.[0] || 'revenue'} name="Revenue" />
              <RechartsTooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter name="Institutions" data={data} fill="#8884d8" />
            </ScatterChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  {Object.keys(data[0] || {}).map((key) => (
                    <TableCell key={key}>{key}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row, idx) => (
                  <TableRow key={idx}>
                    {Object.values(row).map((value: string | number, i) => (
                      <TableCell key={i}>{value}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        );
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return theme.palette.error.main;
      case 'high':
        return theme.palette.warning.main;
      case 'medium':
        return theme.palette.info.main;
      case 'low':
        return theme.palette.success.main;
      default:
        return theme.palette.grey[500];
    }
  };

  const filteredTemplates =
    templateFilter === 'all'
      ? REPORT_TEMPLATES
      : REPORT_TEMPLATES.filter((t) => t.category === templateFilter);

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Advanced Reports
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Build, schedule, and share comprehensive reports
          </Typography>
        </Box>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<DataUsageIcon />}
            onClick={() => setDataQualityOpen(true)}
          >
            Data Quality
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => {
              resetBuilder();
              setBuilderOpen(true);
            }}
          >
            Create Report
          </Button>
        </Stack>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab label="My Reports" icon={<AssessmentIcon />} iconPosition="start" />
          <Tab label="Templates" icon={<FileCopyIcon />} iconPosition="start" />
          <Tab label="Scheduled" icon={<ScheduleIcon />} iconPosition="start" />
        </Tabs>
      </Paper>

      <TabPanel value={activeTab} index={0}>
        <Grid container spacing={3}>
          {reports.map((report) => (
            <Grid item xs={12} md={6} lg={4} key={report.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  '&:hover': { boxShadow: 4 },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="h6" fontWeight={600}>
                      {report.name}
                    </Typography>
                    {report.schedule?.enabled && (
                      <Chip
                        icon={<ScheduleIcon />}
                        label="Scheduled"
                        size="small"
                        color="primary"
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {report.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                    <Chip icon={<BarChartIcon />} label={report.visualization.type} size="small" />
                    <Chip
                      icon={<HistoryIcon />}
                      label={`v${report.version}`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Updated {new Date(report.updatedAt).toLocaleDateString()}
                  </Typography>
                </CardContent>
                <Divider />
                <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    startIcon={<PlayArrowIcon />}
                    onClick={() => handleRunReport(report)}
                  >
                    Run
                  </Button>
                  <Button
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => {
                      setSelectedReport(report);
                      setReportName(report.name);
                      setReportDescription(report.description);
                      setQueryBuilder(report.query);
                      setVisualization(report.visualization);
                      setBuilderOpen(true);
                    }}
                  >
                    Edit
                  </Button>
                  <IconButton size="small" onClick={() => setSelectedReport(report)}>
                    <ShareIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small">
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Box sx={{ mb: 3 }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Category</InputLabel>
            <Select
              value={templateFilter}
              onChange={(e) => setTemplateFilter(e.target.value)}
              label="Category"
            >
              <MenuItem value="all">All Categories</MenuItem>
              <MenuItem value="Revenue">Revenue</MenuItem>
              <MenuItem value="Users">Users</MenuItem>
              <MenuItem value="Features">Features</MenuItem>
              <MenuItem value="Support">Support</MenuItem>
              <MenuItem value="Subscription">Subscription</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Grid container spacing={3}>
          {filteredTemplates.map((template) => (
            <Grid item xs={12} md={6} lg={4} key={template.id}>
              <Card
                sx={{
                  height: '100%',
                  '&:hover': { boxShadow: 4, cursor: 'pointer' },
                }}
                onClick={() => handleCreateFromTemplate(template)}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Avatar sx={{ bgcolor: alpha(theme.palette.primary.main, 0.1) }}>
                      {template.icon}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>
                        {template.name}
                      </Typography>
                      <Chip label={template.category} size="small" />
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {template.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <Grid container spacing={3}>
          {reports
            .filter((r) => r.schedule?.enabled)
            .map((report) => (
              <Grid item xs={12} key={report.id}>
                <Card>
                  <CardContent>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} md={4}>
                        <Typography variant="h6" fontWeight={600}>
                          {report.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {report.description}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Schedule
                        </Typography>
                        <Typography variant="body1" fontWeight={600}>
                          {report.schedule?.frequency} at {report.schedule?.time}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} md={3}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Recipients
                        </Typography>
                        <Stack direction="row" spacing={1}>
                          {report.schedule?.recipients.map((email, idx) => (
                            <Chip key={idx} label={email} size="small" />
                          ))}
                        </Stack>
                      </Grid>
                      <Grid item xs={12} md={2}>
                        <Button
                          fullWidth
                          variant="outlined"
                          startIcon={<EditIcon />}
                          onClick={() => {
                            setSelectedReport(report);
                            setScheduleConfig(report.schedule!);
                            setScheduleDialogOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>
            ))}
        </Grid>
      </TabPanel>

      {selectedReport && previewData.length > 0 && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
          >
            <Box>
              <Typography variant="h5" fontWeight={700}>
                {selectedReport.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {selectedReport.description}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<ScheduleIcon />}
                onClick={() => {
                  setScheduleConfig(
                    selectedReport.schedule || {
                      enabled: false,
                      frequency: 'weekly',
                      time: '09:00',
                      timezone: 'UTC',
                      recipients: [],
                      format: 'pdf',
                    }
                  );
                  setScheduleDialogOpen(true);
                }}
              >
                Schedule
              </Button>
              <Button
                variant="outlined"
                startIcon={<ShareIcon />}
                onClick={() => {
                  setShareConfig(selectedReport.shared || { enabled: false });
                  setShareDialogOpen(true);
                }}
              >
                Share
              </Button>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={() => setExportDialogOpen(true)}
              >
                Export
              </Button>
              <Button
                variant="outlined"
                startIcon={<HistoryIcon />}
                onClick={() => setVersionDialogOpen(true)}
              >
                Versions
              </Button>
            </Stack>
          </Box>
          {renderVisualization(selectedReport, previewData)}
        </Paper>
      )}

      <Dialog open={builderOpen} onClose={() => setBuilderOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" fontWeight={700}>
              Report Builder
            </Typography>
            <IconButton onClick={() => setBuilderOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={builderStep} sx={{ mb: 4 }}>
            <Step>
              <StepLabel>Basic Info</StepLabel>
            </Step>
            <Step>
              <StepLabel>Query Builder</StepLabel>
            </Step>
            <Step>
              <StepLabel>Visualization</StepLabel>
            </Step>
          </Stepper>

          {builderStep === 0 && (
            <Stack spacing={3}>
              <TextField
                label="Report Name"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                fullWidth
                required
              />
              <TextField
                label="Description"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                fullWidth
                multiline
                rows={3}
              />
            </Stack>
          )}

          {builderStep === 1 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h6" fontWeight={600}>
                  Query Conditions
                </Typography>
                <Button startIcon={<AddIcon />} onClick={handleAddCondition}>
                  Add Condition
                </Button>
              </Box>
              <Stack spacing={2}>
                {queryBuilder.conditions.map((condition) => {
                  const field = QUERY_FIELDS.find((f) => f.id === condition.field);
                  const operators = field ? OPERATORS[field.type] : [];
                  return (
                    <Paper key={condition.id} sx={{ p: 2 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} md={3}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Field</InputLabel>
                            <Select
                              value={condition.field}
                              onChange={(e) =>
                                handleUpdateCondition(condition.id, { field: e.target.value })
                              }
                              label="Field"
                            >
                              {QUERY_FIELDS.map((f) => (
                                <MenuItem key={f.id} value={f.id}>
                                  {f.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={3}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Operator</InputLabel>
                            <Select
                              value={condition.operator}
                              onChange={(e) =>
                                handleUpdateCondition(condition.id, { operator: e.target.value })
                              }
                              label="Operator"
                            >
                              {operators.map((op) => (
                                <MenuItem key={op} value={op}>
                                  {op}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        <Grid item xs={12} md={5}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Value"
                            value={condition.value}
                            onChange={(e) =>
                              handleUpdateCondition(condition.id, { value: e.target.value })
                            }
                          />
                        </Grid>
                        <Grid item xs={12} md={1}>
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveCondition(condition.id)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Paper>
                  );
                })}
              </Stack>
            </Box>
          )}

          {builderStep === 2 && (
            <Stack spacing={3}>
              <FormControl fullWidth>
                <InputLabel>Visualization Type</InputLabel>
                <Select
                  value={visualization.type}
                  onChange={(e) =>
                    setVisualization({
                      ...visualization,
                      type: e.target.value as VisualizationConfig['type'],
                    })
                  }
                  label="Visualization Type"
                >
                  <MenuItem value="bar">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BarChartIcon /> Bar Chart
                    </Box>
                  </MenuItem>
                  <MenuItem value="line">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ShowChartIcon /> Line Chart
                    </Box>
                  </MenuItem>
                  <MenuItem value="area">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ShowChartIcon /> Area Chart
                    </Box>
                  </MenuItem>
                  <MenuItem value="pie">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PieChartIcon /> Pie Chart
                    </Box>
                  </MenuItem>
                  <MenuItem value="scatter">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ScatterPlotIcon /> Scatter Plot
                    </Box>
                  </MenuItem>
                  <MenuItem value="table">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TableChartIcon /> Table
                    </Box>
                  </MenuItem>
                </Select>
              </FormControl>

              {visualization.type !== 'pie' && (
                <>
                  <TextField
                    label="X-Axis Field"
                    value={visualization.xAxis || ''}
                    onChange={(e) => setVisualization({ ...visualization, xAxis: e.target.value })}
                    fullWidth
                  />
                  <TextField
                    label="Y-Axis Fields (comma-separated)"
                    value={visualization.yAxis?.join(', ') || ''}
                    onChange={(e) =>
                      setVisualization({
                        ...visualization,
                        yAxis: e.target.value.split(',').map((s) => s.trim()),
                      })
                    }
                    fullWidth
                  />
                </>
              )}

              <TextField
                label="Chart Title"
                value={visualization.title || ''}
                onChange={(e) => setVisualization({ ...visualization, title: e.target.value })}
                fullWidth
              />

              <Stack direction="row" spacing={2}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={visualization.showLegend}
                      onChange={(e) =>
                        setVisualization({ ...visualization, showLegend: e.target.checked })
                      }
                    />
                  }
                  label="Show Legend"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={visualization.showGrid}
                      onChange={(e) =>
                        setVisualization({ ...visualization, showGrid: e.target.checked })
                      }
                    />
                  }
                  label="Show Grid"
                />
              </Stack>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 2 }}>
          {builderStep > 0 && (
            <Button startIcon={<ArrowBackIcon />} onClick={() => setBuilderStep(builderStep - 1)}>
              Back
            </Button>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={() => setBuilderOpen(false)}>Cancel</Button>
          {builderStep < 2 ? (
            <Button
              variant="contained"
              endIcon={<ArrowForwardIcon />}
              onClick={() => setBuilderStep(builderStep + 1)}
              disabled={builderStep === 0 && !reportName}
            >
              Next
            </Button>
          ) : (
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveReport}
              disabled={!reportName}
            >
              Save Report
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={scheduleDialogOpen}
        onClose={() => setScheduleDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Schedule Report</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={scheduleConfig.enabled}
                  onChange={(e) =>
                    setScheduleConfig({ ...scheduleConfig, enabled: e.target.checked })
                  }
                />
              }
              label="Enable Scheduling"
            />

            {scheduleConfig.enabled && (
              <>
                <FormControl fullWidth>
                  <InputLabel>Frequency</InputLabel>
                  <Select
                    value={scheduleConfig.frequency}
                    onChange={(e) =>
                      setScheduleConfig({
                        ...scheduleConfig,
                        frequency: e.target.value as ScheduleConfig['frequency'],
                      })
                    }
                    label="Frequency"
                  >
                    <MenuItem value="daily">Daily</MenuItem>
                    <MenuItem value="weekly">Weekly</MenuItem>
                    <MenuItem value="monthly">Monthly</MenuItem>
                    <MenuItem value="custom">Custom (Cron)</MenuItem>
                  </Select>
                </FormControl>

                {scheduleConfig.frequency === 'custom' && (
                  <TextField
                    label="Cron Expression"
                    value={scheduleConfig.cronExpression || ''}
                    onChange={(e) =>
                      setScheduleConfig({ ...scheduleConfig, cronExpression: e.target.value })
                    }
                    placeholder="0 9 * * 1"
                    helperText="Format: minute hour day month weekday"
                    fullWidth
                  />
                )}

                <TextField
                  label="Time"
                  type="time"
                  value={scheduleConfig.time}
                  onChange={(e) => setScheduleConfig({ ...scheduleConfig, time: e.target.value })}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                />

                <FormControl fullWidth>
                  <InputLabel>Export Format</InputLabel>
                  <Select
                    value={scheduleConfig.format}
                    onChange={(e) =>
                      setScheduleConfig({
                        ...scheduleConfig,
                        format: e.target.value as ScheduleConfig['format'],
                      })
                    }
                    label="Export Format"
                  >
                    <MenuItem value="pdf">PDF</MenuItem>
                    <MenuItem value="excel">Excel</MenuItem>
                    <MenuItem value="csv">CSV</MenuItem>
                  </Select>
                </FormControl>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Recipients
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                    <TextField
                      size="small"
                      placeholder="email@example.com"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      fullWidth
                    />
                    <Button variant="outlined" onClick={handleAddRecipient}>
                      Add
                    </Button>
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap">
                    {scheduleConfig.recipients.map((email, idx) => (
                      <Chip
                        key={idx}
                        label={email}
                        onDelete={() =>
                          setScheduleConfig({
                            ...scheduleConfig,
                            recipients: scheduleConfig.recipients.filter((_, i) => i !== idx),
                          })
                        }
                      />
                    ))}
                  </Stack>
                </Box>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setScheduleDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleScheduleSave}>
            Save Schedule
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={shareDialogOpen}
        onClose={() => setShareDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Share Report</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ mt: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={shareConfig.enabled}
                  onChange={(e) => setShareConfig({ ...shareConfig, enabled: e.target.checked })}
                />
              }
              label="Enable Public Sharing"
            />

            {shareConfig.enabled && shareConfig.publicLink && (
              <>
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Public Link
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <LinkIcon fontSize="small" />
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {shareConfig.publicLink}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => navigator.clipboard.writeText(shareConfig.publicLink!)}
                      >
                        <FileCopyIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Paper>
                </Box>

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Embed Code
                  </Typography>
                  <Paper sx={{ p: 2, bgcolor: 'grey.100' }}>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <CodeIcon fontSize="small" />
                      <Typography
                        variant="body2"
                        sx={{ flexGrow: 1, fontFamily: 'monospace', fontSize: '0.75rem' }}
                      >
                        {shareConfig.embedCode}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => navigator.clipboard.writeText(shareConfig.embedCode!)}
                      >
                        <FileCopyIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Paper>
                </Box>
              </>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
          <Button variant="contained" onClick={handleShareSave}>
            {shareConfig.publicLink ? 'Update' : 'Generate'} Share Links
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={exportDialogOpen}
        onClose={() => setExportDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Export Report</DialogTitle>
        <DialogContent>
          <RadioGroup
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value as typeof exportFormat)}
          >
            <FormControlLabel value="pdf" control={<Radio />} label="PDF Document" />
            <FormControlLabel value="excel" control={<Radio />} label="Excel Spreadsheet" />
            <FormControlLabel value="csv" control={<Radio />} label="CSV File" />
            <FormControlLabel value="json" control={<Radio />} label="JSON Data" />
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setExportDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => handleExport(exportFormat)}
          >
            Export
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={versionDialogOpen}
        onClose={() => setVersionDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Report Version History</DialogTitle>
        <DialogContent>
          <List>
            {[
              {
                version: 3,
                createdAt: '2024-01-20T14:30:00Z',
                createdBy: 'John Doe',
                changes: 'Updated visualization settings',
              },
              {
                version: 2,
                createdAt: '2024-01-18T10:15:00Z',
                createdBy: 'Jane Smith',
                changes: 'Added new query conditions',
              },
              {
                version: 1,
                createdAt: '2024-01-15T10:00:00Z',
                createdBy: 'John Doe',
                changes: 'Initial version',
              },
            ].map((v) => (
              <ListItem
                key={v.version}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1,
                  mb: 1,
                }}
              >
                <ListItemIcon>
                  <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
                    <Typography variant="caption">{v.version}</Typography>
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body1" fontWeight={600}>
                        Version {v.version}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(v.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography variant="body2">{v.changes}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        By {v.createdBy}
                      </Typography>
                    </>
                  }
                />
                <Button size="small" variant="outlined">
                  Restore
                </Button>
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVersionDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={dataQualityOpen}
        onClose={() => setDataQualityOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" fontWeight={700}>
              Data Quality Dashboard
            </Typography>
            <IconButton onClick={() => setDataQualityOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Issues
                  </Typography>
                  <Typography variant="h3" fontWeight={700}>
                    {dataQualityIssues.length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ bgcolor: alpha(theme.palette.error.main, 0.05) }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Critical
                  </Typography>
                  <Typography variant="h3" fontWeight={700} color="error">
                    {dataQualityIssues.filter((i) => i.severity === 'critical').length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ bgcolor: alpha(theme.palette.warning.main, 0.05) }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    High
                  </Typography>
                  <Typography variant="h3" fontWeight={700} color="warning.main">
                    {dataQualityIssues.filter((i) => i.severity === 'high').length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ bgcolor: alpha(theme.palette.info.main, 0.05) }}>
                <CardContent>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Medium/Low
                  </Typography>
                  <Typography variant="h3" fontWeight={700} color="info.main">
                    {dataQualityIssues.filter((i) => ['medium', 'low'].includes(i.severity)).length}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Institution</TableCell>
                  <TableCell>Issue Type</TableCell>
                  <TableCell>Field</TableCell>
                  <TableCell>Severity</TableCell>
                  <TableCell align="right">Affected Records</TableCell>
                  <TableCell>Detected</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dataQualityIssues.map((issue) => (
                  <TableRow key={issue.id}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        {issue.institutionName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        ID: {issue.institutionId}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{issue.issueType.replace('_', ' ')}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={issue.field} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={issue.severity}
                        size="small"
                        sx={{
                          bgcolor: alpha(getSeverityColor(issue.severity), 0.1),
                          color: getSeverityColor(issue.severity),
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>
                        {issue.affectedRecords}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(issue.detectedAt).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </DialogContent>
      </Dialog>

      {loading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: alpha(theme.palette.background.default, 0.8),
            zIndex: 9999,
          }}
        >
          <CircularProgress size={60} />
        </Box>
      )}
    </Box>
  );
}
