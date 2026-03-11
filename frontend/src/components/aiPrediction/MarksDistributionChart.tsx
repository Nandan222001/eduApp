import { Typography, Paper, useTheme } from '@mui/material';
import { MarksDistribution } from '@/api/aiPredictionDashboard';

interface MarksDistributionChartProps {
  distribution: MarksDistribution[];
}

export default function MarksDistributionChart({ distribution }: MarksDistributionChartProps) {
  const theme = useTheme();

  return (
    <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 3 }}>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Expected Marks Distribution
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Distribution of expected marks by probability categories
      </Typography>
      <div style={{ width: '100%', height: 300 }}>
        {/* Recharts not installed - placeholder for pie chart */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '20px',
          }}
        >
          {distribution.map((entry, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px',
                backgroundColor: entry.color + '20',
                borderLeft: `4px solid ${entry.color}`,
                borderRadius: '4px',
              }}
            >
              <Typography variant="body2">{entry.category}</Typography>
              <Typography variant="body2" fontWeight={600}>
                {entry.marks.toFixed(2)} marks ({entry.percentage.toFixed(1)}%)
              </Typography>
            </div>
          ))}
        </div>
      </div>
    </Paper>
  );
}
