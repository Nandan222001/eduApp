import {
  Card,
  Box,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  showPagination?: boolean;
}

export const TableSkeleton = ({
  rows = 5,
  columns = 5,
  showHeader = true,
  showPagination = true,
}: TableSkeletonProps) => {
  return (
    <Card>
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Skeleton variant="text" width="30%" height={40} />
          <Skeleton variant="rectangular" width={120} height={36} sx={{ borderRadius: 1 }} />
        </Box>
        <TableContainer>
          <Table>
            {showHeader && (
              <TableHead>
                <TableRow>
                  {Array.from({ length: columns }).map((_, index) => (
                    <TableCell key={index}>
                      <Skeleton variant="text" width="80%" />
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
            )}
            <TableBody>
              {Array.from({ length: rows }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {Array.from({ length: columns }).map((_, colIndex) => (
                    <TableCell key={colIndex}>
                      <Skeleton variant="text" width="90%" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {showPagination && (
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}
          >
            <Skeleton variant="text" width={150} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Skeleton variant="rectangular" width={36} height={36} sx={{ borderRadius: 1 }} />
              <Skeleton variant="rectangular" width={36} height={36} sx={{ borderRadius: 1 }} />
            </Box>
          </Box>
        )}
      </Box>
    </Card>
  );
};

export default TableSkeleton;
