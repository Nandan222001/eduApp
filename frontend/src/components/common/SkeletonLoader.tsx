import { Box, Card, CardContent, Skeleton, Grid } from '@mui/material';

interface SkeletonLoaderProps {
  variant?: 'card' | 'table' | 'list' | 'form' | 'chart' | 'dashboard';
  count?: number;
}

export const SkeletonLoader = ({ variant = 'card', count = 1 }: SkeletonLoaderProps) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'card':
        return <CardSkeleton />;
      case 'table':
        return <TableSkeleton />;
      case 'list':
        return <ListSkeleton />;
      case 'form':
        return <FormSkeleton />;
      case 'chart':
        return <ChartSkeleton />;
      case 'dashboard':
        return <DashboardSkeleton />;
      default:
        return <CardSkeleton />;
    }
  };

  if (variant === 'dashboard') {
    return renderSkeleton();
  }

  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Box key={index} sx={{ mb: 2 }}>
          {renderSkeleton()}
        </Box>
      ))}
    </>
  );
};

const CardSkeleton = () => (
  <Card>
    <CardContent>
      <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" height={140} sx={{ mb: 2, borderRadius: 1 }} />
      <Skeleton variant="text" width="60%" />
      <Skeleton variant="text" width="80%" />
      <Skeleton variant="text" width="50%" />
      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={100} height={36} sx={{ borderRadius: 1 }} />
      </Box>
    </CardContent>
  </Card>
);

const TableSkeleton = () => (
  <Card>
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Skeleton variant="text" width="30%" height={40} />
        <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 1 }} />
      </Box>
      <Box sx={{ overflowX: 'auto' }}>
        <Box sx={{ minWidth: 650 }}>
          <Box
            sx={{ display: 'flex', gap: 2, mb: 2, pb: 1, borderBottom: 1, borderColor: 'divider' }}
          >
            {[1, 2, 3, 4, 5].map((col) => (
              <Box key={col} sx={{ flex: 1 }}>
                <Skeleton variant="text" width="80%" height={24} />
              </Box>
            ))}
          </Box>
          {Array.from({ length: 5 }).map((_, index) => (
            <Box
              key={index}
              sx={{ display: 'flex', gap: 2, py: 2, borderBottom: 1, borderColor: 'divider' }}
            >
              {[1, 2, 3, 4, 5].map((col) => (
                <Box key={col} sx={{ flex: 1 }}>
                  <Skeleton variant="text" width="90%" />
                </Box>
              ))}
            </Box>
          ))}
        </Box>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
        <Skeleton variant="text" width={150} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="rectangular" width={36} height={36} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={36} height={36} sx={{ borderRadius: 1 }} />
        </Box>
      </Box>
    </Box>
  </Card>
);

const ListSkeleton = () => (
  <Card>
    {Array.from({ length: 5 }).map((_, index) => (
      <Box
        key={index}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          p: 2,
          borderBottom: index < 4 ? 1 : 0,
          borderColor: 'divider',
        }}
      >
        <Skeleton variant="circular" width={48} height={48} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="40%" />
        </Box>
        <Skeleton variant="rectangular" width={80} height={32} sx={{ borderRadius: 1 }} />
      </Box>
    ))}
  </Card>
);

const FormSkeleton = () => (
  <Card>
    <CardContent>
      <Skeleton variant="text" width="40%" height={32} sx={{ mb: 3 }} />
      {Array.from({ length: 4 }).map((_, index) => (
        <Box key={index} sx={{ mb: 3 }}>
          <Skeleton variant="text" width="30%" height={20} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
        </Box>
      ))}
      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        <Skeleton variant="rectangular" width={120} height={42} sx={{ borderRadius: 1 }} />
        <Skeleton variant="rectangular" width={120} height={42} sx={{ borderRadius: 1 }} />
      </Box>
    </CardContent>
  </Card>
);

const ChartSkeleton = () => (
  <Card>
    <CardContent>
      <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
      <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1 }} />
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, mt: 2 }}>
        {[1, 2, 3, 4].map((item) => (
          <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Skeleton variant="circular" width={16} height={16} />
            <Skeleton variant="text" width={60} />
          </Box>
        ))}
      </Box>
    </CardContent>
  </Card>
);

const DashboardSkeleton = () => (
  <Box>
    <Box sx={{ mb: 3 }}>
      <Skeleton variant="text" width="30%" height={40} sx={{ mb: 1 }} />
      <Skeleton variant="text" width="50%" />
    </Box>
    <Grid container spacing={3}>
      {Array.from({ length: 4 }).map((_, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <Card>
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 2,
                }}
              >
                <Skeleton variant="text" width="50%" />
                <Skeleton variant="circular" width={40} height={40} />
              </Box>
              <Skeleton variant="text" width="70%" height={40} />
              <Skeleton variant="text" width="40%" />
            </CardContent>
          </Card>
        </Grid>
      ))}
      <Grid item xs={12} md={8}>
        <ChartSkeleton />
      </Grid>
      <Grid item xs={12} md={4}>
        <ListSkeleton />
      </Grid>
    </Grid>
  </Box>
);

export default SkeletonLoader;
