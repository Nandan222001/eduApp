import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Button,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import { Save as SaveIcon, Language as LanguageIcon } from '@mui/icons-material';
import { useState } from 'react';
import { settingsApi } from '@/api/settings';
import { useToast } from '@/hooks/useToast';

const languages = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
];

export default function LanguageSelector() {
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: settingsApi.getProfile,
  });

  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

  const updateLanguageMutation = useMutation({
    mutationFn: (language: string) =>
      settingsApi.updateProfile({ language } as { language: string }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      showToast('Language updated successfully', 'success');
      setSelectedLanguage(null);
    },
    onError: () => {
      showToast('Failed to update language', 'error');
    },
  });

  const currentLanguage = selectedLanguage || profile?.language || 'en';

  const handleSave = () => {
    if (selectedLanguage) {
      updateLanguageMutation.mutate(selectedLanguage);
    }
  };

  const handleReset = () => {
    setSelectedLanguage(null);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  const isDirty = selectedLanguage !== null;

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Language Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Choose your preferred language for the interface
      </Typography>

      <Paper variant="outlined" sx={{ p: 3, maxWidth: 600 }}>
        <FormControl fullWidth>
          <InputLabel>Language</InputLabel>
          <Select
            value={currentLanguage}
            label="Language"
            onChange={(e) => setSelectedLanguage(e.target.value)}
            startAdornment={<LanguageIcon sx={{ mr: 1, color: 'action.active' }} />}
          >
            {languages.map((lang) => (
              <MenuItem key={lang.code} value={lang.code}>
                <Box>
                  <Typography variant="body1">{lang.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {lang.nativeName}
                  </Typography>
                </Box>
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Alert severity="info" sx={{ mt: 2 }}>
          Changing the language will update all interface text. Some content may still appear in the
          original language.
        </Alert>
      </Paper>

      {updateLanguageMutation.isError && (
        <Alert severity="error" sx={{ mt: 2, maxWidth: 600 }}>
          Failed to update language. Please try again.
        </Alert>
      )}

      <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
          disabled={!isDirty || updateLanguageMutation.isPending}
        >
          {updateLanguageMutation.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
        <Button variant="outlined" onClick={handleReset} disabled={!isDirty}>
          Reset
        </Button>
      </Box>
    </Box>
  );
}
