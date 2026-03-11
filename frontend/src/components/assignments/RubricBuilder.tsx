import React from 'react';
import {
  Box,
  Button,
  TextField,
  Paper,
  Typography,
  IconButton,
  Grid,
  Card,
  CardContent,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { RubricCriteria, RubricLevel } from '../../types/assignment';

interface RubricBuilderProps {
  criteria: RubricCriteria[];
  onChange: (criteria: RubricCriteria[]) => void;
  readOnly?: boolean;
}

export const RubricBuilder: React.FC<RubricBuilderProps> = ({
  criteria,
  onChange,
  readOnly = false,
}) => {
  const addCriteria = () => {
    const newCriteria: RubricCriteria = {
      name: '',
      description: '',
      max_points: 10,
      order: criteria.length,
      levels: [],
    };
    onChange([...criteria, newCriteria]);
  };

  const updateCriteria = (index: number, updates: Partial<RubricCriteria>) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], ...updates };
    onChange(updated);
  };

  const removeCriteria = (index: number) => {
    const updated = criteria.filter((_, i) => i !== index);
    onChange(updated);
  };

  const addLevel = (criteriaIndex: number) => {
    const newLevel: RubricLevel = {
      name: '',
      description: '',
      points: 0,
      order: criteria[criteriaIndex].levels.length,
    };
    const updated = [...criteria];
    updated[criteriaIndex].levels.push(newLevel);
    onChange(updated);
  };

  const updateLevel = (
    criteriaIndex: number,
    levelIndex: number,
    updates: Partial<RubricLevel>
  ) => {
    const updated = [...criteria];
    updated[criteriaIndex].levels[levelIndex] = {
      ...updated[criteriaIndex].levels[levelIndex],
      ...updates,
    };
    onChange(updated);
  };

  const removeLevel = (criteriaIndex: number, levelIndex: number) => {
    const updated = [...criteria];
    updated[criteriaIndex].levels = updated[criteriaIndex].levels.filter(
      (_, i) => i !== levelIndex
    );
    onChange(updated);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">Grading Rubric</Typography>
        {!readOnly && (
          <Button variant="outlined" startIcon={<AddIcon />} onClick={addCriteria}>
            Add Criteria
          </Button>
        )}
      </Box>

      {criteria.length === 0 && (
        <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'action.hover' }}>
          <Typography color="textSecondary">
            No rubric criteria defined. Click &quot;Add Criteria&quot; to start building your
            rubric.
          </Typography>
        </Paper>
      )}

      {criteria.map((criterion, criteriaIndex) => (
        <Card key={criteriaIndex} sx={{ mb: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
              {!readOnly && <DragIndicatorIcon sx={{ mr: 1, mt: 2, color: 'action.disabled' }} />}
              <Box sx={{ flex: 1 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={8}>
                    <TextField
                      fullWidth
                      label="Criteria Name"
                      value={criterion.name}
                      onChange={(e) => updateCriteria(criteriaIndex, { name: e.target.value })}
                      disabled={readOnly}
                      required
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Max Points"
                      value={criterion.max_points}
                      onChange={(e) =>
                        updateCriteria(criteriaIndex, {
                          max_points: Number(e.target.value),
                        })
                      }
                      disabled={readOnly}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={criterion.description}
                      onChange={(e) =>
                        updateCriteria(criteriaIndex, {
                          description: e.target.value,
                        })
                      }
                      disabled={readOnly}
                      multiline
                      rows={2}
                    />
                  </Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Typography variant="subtitle2">Performance Levels</Typography>
                    {!readOnly && (
                      <Button
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={() => addLevel(criteriaIndex)}
                      >
                        Add Level
                      </Button>
                    )}
                  </Box>

                  {criterion.levels.map((level, levelIndex) => (
                    <Box
                      key={levelIndex}
                      sx={{
                        display: 'flex',
                        gap: 1,
                        mb: 1,
                        p: 1,
                        bgcolor: 'action.hover',
                        borderRadius: 1,
                      }}
                    >
                      <TextField
                        label="Level Name"
                        value={level.name}
                        onChange={(e) =>
                          updateLevel(criteriaIndex, levelIndex, {
                            name: e.target.value,
                          })
                        }
                        disabled={readOnly}
                        size="small"
                        sx={{ width: 150 }}
                      />
                      <TextField
                        label="Points"
                        type="number"
                        value={level.points}
                        onChange={(e) =>
                          updateLevel(criteriaIndex, levelIndex, {
                            points: Number(e.target.value),
                          })
                        }
                        disabled={readOnly}
                        size="small"
                        sx={{ width: 100 }}
                      />
                      <TextField
                        label="Description"
                        value={level.description}
                        onChange={(e) =>
                          updateLevel(criteriaIndex, levelIndex, {
                            description: e.target.value,
                          })
                        }
                        disabled={readOnly}
                        size="small"
                        sx={{ flex: 1 }}
                      />
                      {!readOnly && (
                        <IconButton
                          size="small"
                          onClick={() => removeLevel(criteriaIndex, levelIndex)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                  ))}

                  {criterion.levels.length === 0 && (
                    <Typography
                      variant="caption"
                      color="textSecondary"
                      sx={{ display: 'block', mt: 1 }}
                    >
                      No performance levels defined for this criteria
                    </Typography>
                  )}
                </Box>
              </Box>
              {!readOnly && (
                <IconButton
                  onClick={() => removeCriteria(criteriaIndex)}
                  color="error"
                  sx={{ ml: 1 }}
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  );
};
