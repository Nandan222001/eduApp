import React from 'react';
import {
  FormControl,
  Select,
  MenuItem,
  ListItemText,
  ListItemIcon,
  Box,
  Typography,
} from '@mui/material';
import {
  HighQuality as HighQualityIcon,
  Hd as HdIcon,
  Sd as SdIcon,
  AutoMode as AutoModeIcon,
} from '@mui/icons-material';

interface StreamQualitySelectorProps {
  value: string;
  onChange: (quality: string) => void;
  availableQualities?: string[];
  darkMode?: boolean;
}

export const StreamQualitySelector: React.FC<StreamQualitySelectorProps> = ({
  value,
  onChange,
  availableQualities = ['auto', '1080p', '720p', '480p', '360p'],
  darkMode = false,
}) => {
  const getQualityIcon = (quality: string) => {
    switch (quality) {
      case 'auto':
        return <AutoModeIcon fontSize="small" />;
      case '1080p':
        return <HighQualityIcon fontSize="small" />;
      case '720p':
        return <HdIcon fontSize="small" />;
      default:
        return <SdIcon fontSize="small" />;
    }
  };

  const getQualityLabel = (quality: string) => {
    const labels: Record<string, string> = {
      auto: 'Auto',
      '1080p': '1080p Full HD',
      '720p': '720p HD',
      '480p': '480p SD',
      '360p': '360p',
    };
    return labels[quality] || quality;
  };

  const getQualityDescription = (quality: string) => {
    const descriptions: Record<string, string> = {
      auto: 'Adapts to your connection',
      '1080p': 'Best quality',
      '720p': 'High quality',
      '480p': 'Standard quality',
      '360p': 'Data saver',
    };
    return descriptions[quality] || '';
  };

  return (
    <FormControl size="small" sx={{ minWidth: 120 }}>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        renderValue={(selected) => (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {getQualityIcon(selected)}
            <Typography variant="body2">{selected === 'auto' ? 'Auto' : selected}</Typography>
          </Box>
        )}
        sx={{
          color: darkMode ? 'white' : 'inherit',
          '.MuiOutlinedInput-notchedOutline': {
            borderColor: darkMode ? 'rgba(255, 255, 255, 0.23)' : undefined,
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: darkMode ? 'rgba(255, 255, 255, 0.4)' : undefined,
          },
          '.MuiSvgIcon-root': { color: darkMode ? 'white' : undefined },
        }}
      >
        {availableQualities.map((quality) => (
          <MenuItem key={quality} value={quality}>
            <ListItemIcon>{getQualityIcon(quality)}</ListItemIcon>
            <ListItemText
              primary={getQualityLabel(quality)}
              secondary={getQualityDescription(quality)}
            />
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

export default StreamQualitySelector;
