import { Tabs, TabsProps, Tab, Box } from '@mui/material';
import { ReactElement, SyntheticEvent, ReactNode } from 'react';

export interface AccessibleTabsProps extends TabsProps {
  tabs: Array<{
    label: string;
    icon?: ReactElement;
    disabled?: boolean;
    ariaLabel?: string;
  }>;
  value: number;
  onChange: (event: SyntheticEvent, newValue: number) => void;
  ariaLabel: string;
}

export const AccessibleTabs = ({
  tabs,
  value,
  onChange,
  ariaLabel,
  ...props
}: AccessibleTabsProps) => {
  return (
    <Tabs
      value={value}
      onChange={onChange}
      aria-label={ariaLabel}
      sx={{
        borderBottom: 1,
        borderColor: 'divider',
        '& .MuiTab-root': {
          minHeight: 48,
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '1rem',
          '&:focus-visible': {
            outline: '3px solid',
            outlineColor: 'primary.main',
            outlineOffset: '2px',
          },
        },
        ...props.sx,
      }}
      {...props}
    >
      {tabs.map((tab, index) => (
        <Tab
          key={index}
          label={tab.label}
          icon={tab.icon}
          disabled={tab.disabled}
          aria-label={tab.ariaLabel || tab.label}
          aria-selected={value === index}
          id={`tab-${index}`}
          aria-controls={`tabpanel-${index}`}
          sx={{
            '&.Mui-selected': {
              fontWeight: 600,
            },
          }}
        />
      ))}
    </Tabs>
  );
};

interface TabPanelProps {
  children?: ReactNode;
  index: number;
  value: number;
  ariaLabel?: string;
}

export const TabPanel = ({ children, value, index, ariaLabel, ...props }: TabPanelProps) => {
  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      aria-label={ariaLabel}
      {...props}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </Box>
  );
};

export default AccessibleTabs;
