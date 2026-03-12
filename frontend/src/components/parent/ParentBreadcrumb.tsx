import { useEffect, useState } from 'react';
import { useLocation, Link as RouterLink } from 'react-router-dom';
import { Breadcrumbs, Link, Typography, Box, useTheme } from '@mui/material';
import { NavigateNext as NavigateNextIcon, Home as HomeIcon } from '@mui/icons-material';
import { BreadcrumbItem } from '@/types/navigation';

export default function ParentBreadcrumb() {
  const theme = useTheme();
  const location = useLocation();
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  useEffect(() => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const crumbs: BreadcrumbItem[] = [{ label: 'Home', path: '/parent' }];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      if (index > 0) {
        const label = segment
          .split('-')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ');

        crumbs.push({
          label,
          path: index < pathSegments.length - 1 ? currentPath : undefined,
        });
      }
    });

    setBreadcrumbs(crumbs);
  }, [location.pathname]);

  return (
    <Box
      sx={{
        px: 3,
        py: 2,
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.paper,
      }}
    >
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        aria-label="breadcrumb"
        sx={{
          '& .MuiBreadcrumbs-separator': {
            color: theme.palette.text.secondary,
          },
        }}
      >
        {breadcrumbs.map((crumb, index) => {
          const isLast = index === breadcrumbs.length - 1;

          if (isLast) {
            return (
              <Typography
                key={crumb.label}
                color="text.primary"
                fontWeight={600}
                fontSize="0.875rem"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                {index === 0 && <HomeIcon fontSize="small" />}
                {crumb.label}
              </Typography>
            );
          }

          return (
            <Link
              key={crumb.label}
              component={RouterLink}
              to={crumb.path || '#'}
              underline="hover"
              color="inherit"
              fontSize="0.875rem"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                color: theme.palette.text.secondary,
                '&:hover': {
                  color: theme.palette.primary.main,
                },
              }}
            >
              {index === 0 && <HomeIcon fontSize="small" />}
              {crumb.label}
            </Link>
          );
        })}
      </Breadcrumbs>
    </Box>
  );
}
