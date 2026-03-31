import { ReactNode } from 'react';
import { Card, CardHeader, CardContent, IconButton, Box, Menu, MenuItem } from '@mui/material';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DragIndicator as DragIcon,
  MoreVert as MoreVertIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { DashboardWidget } from '@/api/dashboardWidgets';

interface DraggableWidgetProps {
  widget: DashboardWidget;
  customizeMode: boolean;
  onToggleVisibility: (widgetId: number) => void;
  onEdit?: (widgetId: number, updates: Record<string, unknown>) => void;
  children: ReactNode;
}

export default function DraggableWidget({
  widget,
  customizeMode,
  onToggleVisibility,
  children,
}: DraggableWidgetProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
    disabled: !customizeMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleHide = () => {
    onToggleVisibility(widget.id);
    handleMenuClose();
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        elevation={customizeMode ? 3 : 1}
        sx={{
          height: '100%',
          border: customizeMode ? '2px dashed' : 'none',
          borderColor: 'primary.main',
          position: 'relative',
        }}
      >
        <CardHeader
          title={widget.title}
          action={
            <Box display="flex" alignItems="center" gap={0.5}>
              {customizeMode && (
                <IconButton size="small" {...attributes} {...listeners} sx={{ cursor: 'grab' }}>
                  <DragIcon />
                </IconButton>
              )}
              {customizeMode && (
                <>
                  <IconButton size="small" onClick={handleMenuOpen}>
                    <MoreVertIcon />
                  </IconButton>
                  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                    <MenuItem onClick={handleHide}>
                      <VisibilityOffIcon fontSize="small" sx={{ mr: 1 }} />
                      Hide Widget
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Box>
          }
          titleTypographyProps={{ variant: 'h6', fontSize: '1rem', fontWeight: 600 }}
          sx={{ pb: 1 }}
        />
        <CardContent sx={{ pt: 0 }}>{children}</CardContent>
      </Card>
    </div>
  );
}
