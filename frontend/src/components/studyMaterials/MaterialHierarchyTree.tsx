import React, { useState } from 'react';
import {
  Box,
  Typography,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  ExpandMore,
  ChevronRight,
  Subject as SubjectIcon,
  MenuBook,
  Topic,
  Folder,
} from '@mui/icons-material';
import { MaterialHierarchyNode } from '../../api/studyMaterials';

interface MaterialHierarchyTreeProps {
  nodes: MaterialHierarchyNode[];
  onNodeSelect?: (node: MaterialHierarchyNode) => void;
  selectedNodeId?: number;
}

const MaterialHierarchyTree: React.FC<MaterialHierarchyTreeProps> = ({
  nodes,
  onNodeSelect,
  selectedNodeId,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const toggleNode = (nodeKey: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeKey)) {
      newExpanded.delete(nodeKey);
    } else {
      newExpanded.add(nodeKey);
    }
    setExpandedNodes(newExpanded);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'subject':
        return <SubjectIcon />;
      case 'chapter':
        return <MenuBook />;
      case 'topic':
        return <Topic />;
      default:
        return <Folder />;
    }
  };

  const renderNode = (node: MaterialHierarchyNode, level: number = 0) => {
    const nodeKey = `${node.type}-${node.id}`;
    const isExpanded = expandedNodes.has(nodeKey);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNodeId === node.id;

    return (
      <Box key={nodeKey}>
        <ListItem
          disablePadding
          sx={{
            pl: level * 2,
            bgcolor: isSelected ? 'action.selected' : 'transparent',
          }}
        >
          <ListItemButton
            onClick={() => {
              if (hasChildren) {
                toggleNode(nodeKey);
              }
              if (onNodeSelect) {
                onNodeSelect(node);
              }
            }}
          >
            {hasChildren && (
              <IconButton size="small" sx={{ mr: 1 }}>
                {isExpanded ? <ExpandMore /> : <ChevronRight />}
              </IconButton>
            )}
            {!hasChildren && <Box sx={{ width: 40 }} />}
            <ListItemIcon sx={{ minWidth: 40 }}>{getIcon(node.type)}</ListItemIcon>
            <ListItemText
              primary={node.name}
              primaryTypographyProps={{
                fontWeight: level === 0 ? 600 : 400,
                fontSize: level === 0 ? '1rem' : '0.9rem',
              }}
            />
            <Chip
              label={node.material_count}
              size="small"
              color={node.material_count > 0 ? 'primary' : 'default'}
              sx={{ minWidth: 40 }}
            />
          </ListItemButton>
        </ListItem>

        {hasChildren && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {node.children!.map((child) => renderNode(child, level + 1))}
            </List>
          </Collapse>
        )}
      </Box>
    );
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ p: 2, pb: 1 }}>
        Browse by Subject
      </Typography>
      <List>{nodes.map((node) => renderNode(node))}</List>
    </Box>
  );
};

export default MaterialHierarchyTree;
