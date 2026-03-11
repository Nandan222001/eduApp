import { Typography, Paper, useTheme } from '@mui/material';
import { StudyTimeAllocation } from '@/api/aiPredictionDashboard';

interface StudyTimeAllocationChartProps {
  allocation: StudyTimeAllocation[];
}

export default function StudyTimeAllocationChart({ allocation }: StudyTimeAllocationChartProps) {
  const theme = useTheme();

  return (
    <Paper elevation={0} sx={{ border: `1px solid ${theme.palette.divider}`, p: 3 }}>
      <Typography variant="h6" fontWeight={700} gutterBottom>
        Study Time Allocation
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Recommended distribution of study hours
      </Typography>
      <div style={{ width: '100%', height: 300 }}>
        {/* Recharts not installed - placeholder for donut chart */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '20px',
          }}
        >
          {allocation.map((entry, index) => (
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
              <div>
                <Typography variant="body2" fontWeight={600}>
                  {entry.category}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {entry.description}
                </Typography>
              </div>
              <Typography variant="body2" fontWeight={600}>
                {entry.hours.toFixed(1)}h ({entry.percentage.toFixed(1)}%)
              </Typography>
            </div>
          ))}
        </div>
      </div>
    </Paper>
  );
}
