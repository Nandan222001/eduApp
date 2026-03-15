import React, { useState } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  Chip,
  IconButton,
} from '@mui/material';
import {
  ExpandMore,
  ChevronRight,
  Person,
  Folder,
  Description,
  HealthAndSafety,
  CardMembership,
  Event,
  ContactEmergency,
  LocalHospital,
  Assessment,
  Accessible,
  CheckCircle,
} from '@mui/icons-material';
import { DocumentFolder, DocumentType } from '@/types/documentVault';

interface FolderTreeNavigationProps {
  folders: DocumentFolder[];
  selectedChildId?: number;
  selectedDocumentType?: DocumentType;
  onFolderSelect: (childId: number, documentType?: DocumentType) => void;
}

const documentTypeIcons: Record<DocumentType, React.ReactElement> = {
  [DocumentType.IMMUNIZATION_RECORD]: <HealthAndSafety />,
  [DocumentType.MEDICAL_RECORD]: <LocalHospital />,
  [DocumentType.BIRTH_CERTIFICATE]: <CardMembership />,
  [DocumentType.ID_CARD]: <CardMembership />,
  [DocumentType.PERMISSION_SLIP]: <CheckCircle />,
  [DocumentType.EMERGENCY_CONTACT]: <ContactEmergency />,
  [DocumentType.INSURANCE_CARD]: <CardMembership />,
  [DocumentType.REPORT_CARD]: <Assessment />,
  [DocumentType.IEP_DOCUMENT]: <Accessible />,
  [DocumentType.ATTENDANCE_EXCUSE]: <Event />,
  [DocumentType.OTHER]: <Description />,
};

const formatDocumentType = (type: DocumentType): string => {
  return type
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const FolderTreeNavigation: React.FC<FolderTreeNavigationProps> = ({
  folders,
  selectedChildId,
  selectedDocumentType,
  onFolderSelect,
}) => {
  const [expandedChildren, setExpandedChildren] = useState<Set<number>>(new Set());

  const toggleChild = (childId: number) => {
    const newExpanded = new Set(expandedChildren);
    if (newExpanded.has(childId)) {
      newExpanded.delete(childId);
    } else {
      newExpanded.add(childId);
    }
    setExpandedChildren(newExpanded);
  };

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Folder />
        Document Folders
      </Typography>

      <List>
        {folders.map((folder) => {
          const isExpanded = expandedChildren.has(folder.child_id);
          const isChildSelected = selectedChildId === folder.child_id;

          return (
            <Box key={folder.child_id}>
              <ListItem disablePadding>
                <ListItemButton
                  selected={isChildSelected && !selectedDocumentType}
                  onClick={() => {
                    toggleChild(folder.child_id);
                    onFolderSelect(folder.child_id);
                  }}
                >
                  <IconButton size="small" sx={{ mr: 0.5 }}>
                    {isExpanded ? <ExpandMore /> : <ChevronRight />}
                  </IconButton>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    <Person color={isChildSelected ? 'primary' : 'inherit'} />
                  </ListItemIcon>
                  <ListItemText
                    primary={folder.child_name}
                    primaryTypographyProps={{
                      fontWeight: isChildSelected ? 600 : 400,
                    }}
                  />
                  <Chip
                    label={folder.total_documents}
                    size="small"
                    color={folder.total_documents > 0 ? 'primary' : 'default'}
                  />
                </ListItemButton>
              </ListItem>

              <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {folder.document_types.map((docType) => {
                    const isTypeSelected = isChildSelected && selectedDocumentType === docType.type;

                    return (
                      <ListItem key={docType.type} disablePadding sx={{ pl: 4 }}>
                        <ListItemButton
                          selected={isTypeSelected}
                          onClick={() => onFolderSelect(folder.child_id, docType.type)}
                        >
                          <ListItemIcon sx={{ minWidth: 40 }}>
                            {documentTypeIcons[docType.type]}
                          </ListItemIcon>
                          <ListItemText
                            primary={formatDocumentType(docType.type)}
                            secondary={
                              docType.last_updated
                                ? `Updated ${new Date(docType.last_updated).toLocaleDateString()}`
                                : null
                            }
                            primaryTypographyProps={{
                              fontSize: '0.9rem',
                              fontWeight: isTypeSelected ? 600 : 400,
                            }}
                            secondaryTypographyProps={{
                              fontSize: '0.75rem',
                            }}
                          />
                          <Chip label={docType.count} size="small" />
                        </ListItemButton>
                      </ListItem>
                    );
                  })}
                </List>
              </Collapse>
            </Box>
          );
        })}
      </List>
    </Box>
  );
};
