import { useState, useEffect } from 'react';
import { Stepper, Step, StepLabel, Box, Button, Paper } from '@mui/material';
import { TableEntity, ImportConfig, ImportValidationResult } from '@/types/dataManagement';
import FileUploadStep from './ImportWizardSteps/FileUploadStep';
import ColumnMappingStep from './ImportWizardSteps/ColumnMappingStep';
import ValidationStep from './ImportWizardSteps/ValidationStep';
import ConfirmationStep from './ImportWizardSteps/ConfirmationStep';

interface ImportWizardProps {
  entity: TableEntity;
  onComplete: (config: ImportConfig) => void;
  onCancel: () => void;
}

const steps = ['Upload File', 'Map Columns', 'Validate Data', 'Confirm Import'];

export default function ImportWizard({ entity, onComplete, onCancel }: ImportWizardProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});
  const [skipFirstRow, setSkipFirstRow] = useState(true);
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);

  useEffect(() => {
    if (activeStep === 0) {
      setFile(null);
      setDetectedColumns([]);
      setColumnMappings({});
      setValidationResult(null);
    }
  }, [activeStep]);

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleFileUpload = (uploadedFile: File, columns: string[]) => {
    setFile(uploadedFile);
    setDetectedColumns(columns);
    handleNext();
  };

  const handleColumnMapping = (mappings: Record<string, string>, skip: boolean) => {
    setColumnMappings(mappings);
    setSkipFirstRow(skip);
    handleNext();
  };

  const handleValidation = (result: ImportValidationResult) => {
    setValidationResult(result);
    handleNext();
  };

  const handleConfirm = () => {
    if (!file) return;

    const config: ImportConfig = {
      entity,
      file,
      columnMappings: Object.entries(columnMappings).map(([source, target]) => ({
        sourceColumn: source,
        targetColumn: target,
      })),
      skipFirstRow,
    };

    onComplete(config);
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return <FileUploadStep onUpload={handleFileUpload} />;
      case 1:
        return (
          <ColumnMappingStep
            entity={entity}
            detectedColumns={detectedColumns}
            columnMappings={columnMappings}
            skipFirstRow={skipFirstRow}
            onNext={handleColumnMapping}
          />
        );
      case 2:
        return (
          <ValidationStep
            entity={entity}
            file={file!}
            columnMappings={Object.entries(columnMappings).map(([source, target]) => ({
              sourceColumn: source,
              targetColumn: target,
            }))}
            skipFirstRow={skipFirstRow}
            onValidated={handleValidation}
          />
        );
      case 3:
        return (
          <ConfirmationStep
            entity={entity}
            file={file!}
            validationResult={validationResult!}
            onConfirm={handleConfirm}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Box>
      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Paper sx={{ p: 3, minHeight: 400 }}>{getStepContent(activeStep)}</Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Box>
          {activeStep > 0 && activeStep < 3 && (
            <Button onClick={handleBack} sx={{ mr: 1 }}>
              Back
            </Button>
          )}
        </Box>
      </Box>
    </Box>
  );
}
