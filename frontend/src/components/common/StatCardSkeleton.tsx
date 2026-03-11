import { Grid, Card, CardContent, Box, Skeleton } from '@mui/material';

interface StatCardSkeletonProps {
  count?: number;
}

export const StatCardSkeleton = ({ count = 4 }: StatCardSkeletonProps) => {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: count }).map((_, index) => (
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
              <Skeleton variant="text" width="70%" height={40} sx={{ mb: 1 }} />
              <Skeleton variant="text" width="40%" />
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};

export default StatCardSkeleton;
