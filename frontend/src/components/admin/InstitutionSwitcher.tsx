import { useState } from 'react';
import {
  Box,
  Select,
  MenuItem,
  FormControl,
  Avatar,
  Typography,
  SelectChangeEvent,
  useTheme,
  alpha,
} from '@mui/material';
import { Business as BusinessIcon } from '@mui/icons-material';
import { useAuthStore } from '@/store/useAuthStore';
import { Institution } from '@/types/navigation';

const mockInstitutions: Institution[] = [
  { id: '1', name: 'Springfield High School', type: 'High School' },
  { id: '2', name: 'Riverside Academy', type: 'Academy' },
  { id: '3', name: 'Mountain View College', type: 'College' },
];

interface InstitutionSwitcherProps {
  compact?: boolean;
}

export default function InstitutionSwitcher({ compact = false }: InstitutionSwitcherProps) {
  const theme = useTheme();
  const { selectedInstitution, setSelectedInstitution, user } = useAuthStore();
  const [institutions] = useState<Institution[]>(mockInstitutions);

  const handleChange = (event: SelectChangeEvent<string>) => {
    setSelectedInstitution(event.target.value);
  };

  if (user?.role !== 'admin') {
    return null;
  }

  return (
    <FormControl
      fullWidth
      size="small"
      sx={{
        minWidth: compact ? 200 : 280,
      }}
    >
      <Select
        value={selectedInstitution || ''}
        onChange={handleChange}
        displayEmpty
        renderValue={(selected) => {
          const institution = institutions.find((inst) => inst.id === selected);
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                }}
              >
                <BusinessIcon fontSize="small" />
              </Avatar>
              <Box sx={{ display: compact ? 'none' : 'block' }}>
                <Typography variant="body2" fontWeight={600} lineHeight={1.2}>
                  {institution?.name || 'Select Institution'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {institution?.type || 'No institution selected'}
                </Typography>
              </Box>
            </Box>
          );
        }}
        sx={{
          '& .MuiOutlinedInput-notchedOutline': {
            border: 'none',
          },
          bgcolor: alpha(theme.palette.primary.main, 0.04),
          borderRadius: 2,
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.08),
          },
        }}
      >
        {institutions.map((institution) => (
          <MenuItem key={institution.id} value={institution.id}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: theme.palette.primary.main,
                }}
              >
                <BusinessIcon fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  {institution.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {institution.type}
                </Typography>
              </Box>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
