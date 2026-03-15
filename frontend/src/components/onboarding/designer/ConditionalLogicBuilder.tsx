import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Paper,
  Divider,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { OnboardingStep, ConditionalRule } from '@/types/onboarding';

interface ConditionalLogicBuilderProps {
  step: OnboardingStep;
  allSteps: OnboardingStep[];
  onUpdate: (rules: ConditionalRule[]) => void;
}

export default function ConditionalLogicBuilder({
  step,
  allSteps,
  onUpdate,
}: ConditionalLogicBuilderProps) {
  const [rules, setRules] = useState<ConditionalRule[]>(step.conditionalRules || []);

  const addRule = () => {
    const newRule: ConditionalRule = {
      id: `rule-${Date.now()}`,
      field: '',
      operator: 'equals',
      value: '',
      nextStepId: '',
    };
    const updated = [...rules, newRule];
    setRules(updated);
    onUpdate(updated);
  };

  const updateRule = (index: number, updates: Partial<ConditionalRule>) => {
    const updated = rules.map((r, i) => (i === index ? { ...r, ...updates } : r));
    setRules(updated);
    onUpdate(updated);
  };

  const removeRule = (index: number) => {
    const updated = rules.filter((_, i) => i !== index);
    setRules(updated);
    onUpdate(updated);
  };

  const availableSteps = allSteps.filter((s) => s.id !== step.id);

  return (
    <Box>
      <Typography variant="subtitle1" fontWeight={700} gutterBottom>
        Conditional Logic
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Define rules to show different steps based on user responses
      </Typography>

      <Divider sx={{ mb: 3 }} />

      {rules.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            No conditional rules defined
          </Typography>
          <Button startIcon={<AddIcon />} onClick={addRule} sx={{ mt: 2 }}>
            Add Rule
          </Button>
        </Box>
      ) : (
        <Box>
          {rules.map((rule, index) => (
            <Paper key={rule.id} elevation={0} sx={{ p: 2, mb: 2, border: '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="caption" fontWeight={600}>
                  Rule {index + 1}
                </Typography>
                <IconButton size="small" onClick={() => removeRule(index)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Field Name"
                  placeholder="e.g., grade, userType"
                  value={rule.field}
                  onChange={(e) => updateRule(index, { field: e.target.value })}
                />

                <FormControl fullWidth size="small">
                  <InputLabel>Operator</InputLabel>
                  <Select
                    value={rule.operator}
                    label="Operator"
                    onChange={(e) =>
                      updateRule(index, { operator: e.target.value as ConditionalRule['operator'] })
                    }
                  >
                    <MenuItem value="equals">Equals</MenuItem>
                    <MenuItem value="not_equals">Not Equals</MenuItem>
                    <MenuItem value="contains">Contains</MenuItem>
                    <MenuItem value="greater_than">Greater Than</MenuItem>
                    <MenuItem value="less_than">Less Than</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  size="small"
                  label="Value"
                  placeholder="e.g., 9, parent"
                  value={rule.value}
                  onChange={(e) => updateRule(index, { value: e.target.value })}
                />

                <FormControl fullWidth size="small">
                  <InputLabel>Next Step</InputLabel>
                  <Select
                    value={rule.nextStepId}
                    label="Next Step"
                    onChange={(e) => updateRule(index, { nextStepId: e.target.value })}
                  >
                    {availableSteps.map((s) => (
                      <MenuItem key={s.id} value={s.id}>
                        {s.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Box
                  sx={{
                    p: 1.5,
                    bgcolor: '#f5f5f5',
                    borderRadius: 1,
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                  }}
                >
                  <Typography variant="caption" display="block" gutterBottom>
                    Rule Preview:
                  </Typography>
                  If <strong>{rule.field || '[field]'}</strong> {rule.operator.replace('_', ' ')}{' '}
                  <strong>{rule.value || '[value]'}</strong>, go to{' '}
                  <strong>
                    {availableSteps.find((s) => s.id === rule.nextStepId)?.title || '[step]'}
                  </strong>
                </Box>
              </Box>
            </Paper>
          ))}

          <Button startIcon={<AddIcon />} onClick={addRule} fullWidth>
            Add Another Rule
          </Button>
        </Box>
      )}
    </Box>
  );
}
