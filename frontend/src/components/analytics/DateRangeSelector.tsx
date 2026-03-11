import { useState } from 'react';
import {
  Box,
  ToggleButtonGroup,
  ToggleButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { CalendarMonth as CalendarIcon } from '@mui/icons-material';
import { subDays, subMonths, subYears } from 'date-fns';

export type DateRangePreset = '7days' | '30days' | '3months' | '6months' | '1year' | 'custom';

interface DateRangeSelectorProps {
  value: DateRangePreset;
  onChange: (preset: DateRangePreset, startDate?: Date, endDate?: Date) => void;
  showCustom?: boolean;
}

export default function DateRangeSelector({
  value,
  onChange,
  showCustom = true,
}: DateRangeSelectorProps) {
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date | null>(subMonths(new Date(), 1));
  const [customEndDate, setCustomEndDate] = useState<Date | null>(new Date());

  const handleChange = (_: React.MouseEvent<HTMLElement>, newValue: DateRangePreset | null) => {
    if (!newValue) return;

    if (newValue === 'custom') {
      setCustomDialogOpen(true);
    } else {
      onChange(newValue);
    }
  };

  const handleCustomApply = () => {
    if (customStartDate && customEndDate) {
      onChange('custom', customStartDate, customEndDate);
      setCustomDialogOpen(false);
    }
  };

  const presets: Array<{ value: DateRangePreset; label: string }> = [
    { value: '7days', label: '7 Days' },
    { value: '30days', label: '30 Days' },
    { value: '3months', label: '3 Months' },
    { value: '6months', label: '6 Months' },
    { value: '1year', label: '1 Year' },
  ];

  if (showCustom) {
    presets.push({ value: 'custom', label: 'Custom' });
  }

  return (
    <>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={handleChange}
        size="small"
        aria-label="date range"
      >
        {presets.map((preset) => (
          <ToggleButton key={preset.value} value={preset.value}>
            {preset.value === 'custom' && <CalendarIcon sx={{ mr: 0.5, fontSize: 18 }} />}
            {preset.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      <Dialog open={customDialogOpen} onClose={() => setCustomDialogOpen(false)} maxWidth="xs">
        <DialogTitle>Select Custom Date Range</DialogTitle>
        <DialogContent>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
              <DatePicker
                label="Start Date"
                value={customStartDate}
                onChange={setCustomStartDate}
                maxDate={customEndDate || new Date()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
              <DatePicker
                label="End Date"
                value={customEndDate}
                onChange={setCustomEndDate}
                minDate={customStartDate || undefined}
                maxDate={new Date()}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </Box>
          </LocalizationProvider>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCustomDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCustomApply}
            variant="contained"
            disabled={!customStartDate || !customEndDate}
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export const getDateRangeFromPreset = (preset: DateRangePreset): { start: Date; end: Date } => {
  const end = new Date();
  let start: Date;

  switch (preset) {
    case '7days':
      start = subDays(end, 7);
      break;
    case '30days':
      start = subDays(end, 30);
      break;
    case '3months':
      start = subMonths(end, 3);
      break;
    case '6months':
      start = subMonths(end, 6);
      break;
    case '1year':
      start = subYears(end, 1);
      break;
    default:
      start = subMonths(end, 1);
  }

  return { start, end };
};
