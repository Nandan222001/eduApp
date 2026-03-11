import { useState } from 'react';
import { Box, Collapse, IconButton, Paper, Typography, useTheme } from '@mui/material';
import { ExpandMore as ExpandMoreIcon } from '@mui/icons-material';

interface CollapsibleSectionProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  elevation?: number;
}

export default function CollapsibleSection({
  title,
  subtitle,
  icon,
  children,
  defaultExpanded = false,
  elevation = 1,
}: CollapsibleSectionProps) {
  const theme = useTheme();
  const [expanded, setExpanded] = useState(defaultExpanded);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  return (
    <Paper
      elevation={elevation}
      sx={{
        overflow: 'hidden',
        borderRadius: 2,
        transition: 'all 0.3s ease',
      }}
    >
      <Box
        onClick={handleToggle}
        sx={{
          display: 'flex',
          alignItems: 'center',
          padding: 2,
          cursor: 'pointer',
          bgcolor: expanded ? theme.palette.action.hover : 'transparent',
          transition: 'background-color 0.3s ease',
          minHeight: 56,
          '&:active': {
            bgcolor: theme.palette.action.selected,
          },
        }}
      >
        {icon && (
          <Box
            sx={{
              mr: 2,
              display: 'flex',
              alignItems: 'center',
              color: 'primary.main',
            }}
          >
            {icon}
          </Box>
        )}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1rem' }}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              {subtitle}
            </Typography>
          )}
        </Box>

        <IconButton
          size="small"
          sx={{
            transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.3s ease',
          }}
        >
          <ExpandMoreIcon />
        </IconButton>
      </Box>

      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ p: 2, pt: 0 }}>{children}</Box>
      </Collapse>
    </Paper>
  );
}
