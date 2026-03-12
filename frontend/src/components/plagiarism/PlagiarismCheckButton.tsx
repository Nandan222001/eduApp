import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Security as SecurityIcon } from '@mui/icons-material';
import { plagiarismApi } from '../../api/plagiarismApi';

interface PlagiarismCheckButtonProps {
  assignmentId: number;
  onCheckStarted?: (checkId: number) => void;
}

export const PlagiarismCheckButton: React.FC<PlagiarismCheckButtonProps> = ({
  assignmentId,
  onCheckStarted,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [contentType, setContentType] = useState<'TEXT' | 'SOURCE_CODE' | 'MIXED'>('TEXT');
  const [comparisonScope, setComparisonScope] = useState<
    'WITHIN_BATCH' | 'CROSS_BATCH' | 'CROSS_INSTITUTION' | 'ALL'
  >('WITHIN_BATCH');
  const [enableCrossInstitution, setEnableCrossInstitution] = useState(false);
  const [enableCitationDetection, setEnableCitationDetection] = useState(true);
  const [enableCodeAnalysis, setEnableCodeAnalysis] = useState(true);
  const [minSimilarityThreshold, setMinSimilarityThreshold] = useState(0.7);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    setError(null);
  };

  const handleStartCheck = async () => {
    setLoading(true);
    setError(null);

    try {
      const checkData = {
        assignment_id: assignmentId,
        content_type: contentType,
        comparison_scope: comparisonScope,
        enable_cross_institution: enableCrossInstitution,
        anonymize_cross_institution: true,
        check_settings: {
          min_similarity_threshold: minSimilarityThreshold,
          min_segment_length: 50,
          enable_citation_detection: enableCitationDetection,
          enable_code_analysis: enableCodeAnalysis,
          ignore_common_phrases: true,
          max_comparisons: 1000,
        },
      };

      const check = await plagiarismApi.createCheck(checkData);

      if (onCheckStarted) {
        onCheckStarted(check.id);
      }

      handleClose();
    } catch (err) {
      const error = err as { response?: { data?: { detail?: string } } };
      setError(error.response?.data?.detail || 'Failed to start plagiarism check');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="contained"
        color="secondary"
        startIcon={<SecurityIcon />}
        onClick={handleOpen}
      >
        Run Plagiarism Check
      </Button>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Configure Plagiarism Check</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
            <FormLabel component="legend">Content Type</FormLabel>
            <RadioGroup
              value={contentType}
              onChange={(e) => setContentType(e.target.value as 'TEXT' | 'SOURCE_CODE' | 'MIXED')}
            >
              <FormControlLabel value="TEXT" control={<Radio />} label="Text Submissions" />
              <FormControlLabel value="SOURCE_CODE" control={<Radio />} label="Source Code" />
              <FormControlLabel value="MIXED" control={<Radio />} label="Mixed Content" />
            </RadioGroup>
          </FormControl>

          <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
            <FormLabel component="legend">Comparison Scope</FormLabel>
            <RadioGroup
              value={comparisonScope}
              onChange={(e) =>
                setComparisonScope(
                  e.target.value as 'WITHIN_BATCH' | 'CROSS_BATCH' | 'CROSS_INSTITUTION' | 'ALL'
                )
              }
            >
              <FormControlLabel
                value="WITHIN_BATCH"
                control={<Radio />}
                label="Within This Assignment Only"
              />
              <FormControlLabel
                value="CROSS_BATCH"
                control={<Radio />}
                label="Across All Assignments"
              />
              <FormControlLabel
                value="CROSS_INSTITUTION"
                control={<Radio />}
                label="Cross-Institution (Anonymized)"
                disabled={!enableCrossInstitution}
              />
              <FormControlLabel value="ALL" control={<Radio />} label="All Available Submissions" />
            </RadioGroup>
          </FormControl>

          <FormGroup sx={{ mb: 3 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={enableCitationDetection}
                  onChange={(e) => setEnableCitationDetection(e.target.checked)}
                />
              }
              label="Enable Citation Detection (Reduce False Positives)"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={enableCodeAnalysis}
                  onChange={(e) => setEnableCodeAnalysis(e.target.checked)}
                />
              }
              label="Enable AST-Based Code Analysis"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={enableCrossInstitution}
                  onChange={(e) => setEnableCrossInstitution(e.target.checked)}
                />
              }
              label="Allow Cross-Institution Comparison"
            />
          </FormGroup>

          <TextField
            fullWidth
            type="number"
            label="Minimum Similarity Threshold"
            value={minSimilarityThreshold}
            onChange={(e) => setMinSimilarityThreshold(parseFloat(e.target.value))}
            inputProps={{ min: 0, max: 1, step: 0.1 }}
            helperText="Matches below this threshold will be ignored (0.0 - 1.0)"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleStartCheck}
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            Start Check
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
