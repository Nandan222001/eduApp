import { useState } from 'react';
import {
  Box,
  Container,
  Paper,
  Tabs,
  Tab,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Person as PersonIcon,
  Lock as LockIcon,
  Notifications as NotificationsIcon,
  Palette as PaletteIcon,
  Language as LanguageIcon,
  Public as TimezoneIcon,
  Security as PrivacyIcon,
  Devices as DevicesIcon,
  DeleteForever as DeleteIcon,
} from '@mui/icons-material';
import {
  ProfileEditor,
  PasswordChange,
  NotificationPreferencesManager,
  ThemeCustomization,
  LanguageSelector,
  TimezoneConfiguration,
  PrivacySettings,
  ConnectedDevicesList,
  AccountDeletionForm,
} from '@/components/settings';
import { useAuth } from '@/hooks/useAuth';
import { isDemoUser } from '@/api/demoDataApi';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
    >
      {value === index && <Box sx={{ p: { xs: 2, md: 3 } }}>{children}</Box>}
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState(0);
  const theme = useTheme();
  const { user } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const _isDemo = isDemoUser(user?.email);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const tabs = [
    { label: 'Profile', icon: <PersonIcon />, component: <ProfileEditor /> },
    { label: 'Password', icon: <LockIcon />, component: <PasswordChange /> },
    {
      label: 'Notifications',
      icon: <NotificationsIcon />,
      component: <NotificationPreferencesManager />,
    },
    { label: 'Theme', icon: <PaletteIcon />, component: <ThemeCustomization /> },
    { label: 'Language', icon: <LanguageIcon />, component: <LanguageSelector /> },
    { label: 'Timezone', icon: <TimezoneIcon />, component: <TimezoneConfiguration /> },
    { label: 'Privacy', icon: <PrivacyIcon />, component: <PrivacySettings /> },
    { label: 'Devices', icon: <DevicesIcon />, component: <ConnectedDevicesList /> },
    { label: 'Account', icon: <DeleteIcon />, component: <AccountDeletionForm /> },
  ];

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Manage your account settings and preferences
      </Typography>

      <Paper elevation={0} sx={{ bgcolor: 'background.paper', borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant={isMobile ? 'scrollable' : 'standard'}
            scrollButtons={isMobile ? 'auto' : false}
            allowScrollButtonsMobile
            aria-label="settings tabs"
          >
            {tabs.map((tab, index) => (
              <Tab
                key={index}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
                id={`settings-tab-${index}`}
                aria-controls={`settings-tabpanel-${index}`}
                sx={{
                  minHeight: 64,
                  textTransform: 'none',
                  fontSize: '0.95rem',
                }}
              />
            ))}
          </Tabs>
        </Box>

        {tabs.map((tab, index) => (
          <TabPanel key={index} value={activeTab} index={index}>
            {tab.component}
          </TabPanel>
        ))}
      </Paper>
    </Container>
  );
}
