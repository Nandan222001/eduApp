# Data Management - Quick Start Guide

## Getting Started

### Access Data Management Features

1. Log in as an **Admin** user
2. Navigate to **Data Management** in the sidebar
3. Choose either **Export Data** or **Import Data**

## Export Data

### Basic Export

1. **Go to Export Page**: Click "Data Management" > "Export Data"
2. **Select Entity**: Choose what to export (Students, Teachers, etc.)
3. **Choose Format**: Select CSV, Excel, or PDF
4. **Select Columns**: Check the columns you want to include
5. **Preview**: Click "Preview" to see sample data
6. **Export**: Click "Confirm & Export" to download

### Advanced Export with Filters

1. Follow steps 1-3 from Basic Export
2. **Set Date Range**: Choose start and end dates to filter records
3. **Reorder Columns**: Drag columns or use arrow buttons to reorder
4. **Preview & Export**: Review and download

### Schedule Recurring Exports

1. Go to Export page
2. Click **"Schedule"** button in the sidebar
3. Configure:
   - Name for the export
   - Entity to export
   - Format (CSV/Excel/PDF)
   - Frequency (Daily/Weekly/Monthly)
   - Time of day
   - Email address for delivery
4. Click **"Save"**

## Import Data

### Basic Import Workflow

1. **Go to Import Page**: Click "Data Management" > "Import Data"
2. **Select Entity**: Choose what you're importing (Students, Teachers, etc.)
3. **Start Wizard**: Click "Start Import Wizard"
4. **Upload File**: Drag & drop or browse for your CSV/Excel file
5. **Map Columns**: Review auto-detected mappings and adjust if needed
6. **Validate**: Review validation results and fix any errors
7. **Confirm**: Review summary and click "Confirm & Import"

### Detailed Steps

#### Step 1: File Upload
- Supported formats: CSV, XLS, XLSX
- Drag & drop or click to browse
- File is automatically analyzed for column detection

#### Step 2: Column Mapping
- Auto-detection matches similar column names
- Map each source column to a target field
- Required fields are clearly marked
- Can skip columns you don't want to import

#### Step 3: Validation
- System validates all data
- Errors must be fixed before importing
- Warnings can be ignored but should be reviewed
- Preview shows sample of valid data
- Can re-validate after fixing issues in source file

#### Step 4: Confirmation
- Review import summary
- See total rows, valid rows, and any warnings
- Understand rollback options
- Click to execute import

### After Import

1. **View Results**: Dialog shows import statistics
2. **Check History**: Go to "Import History" tab
3. **Download Errors**: If there were failures, download error report
4. **Rollback if Needed**: Use rollback button within 24 hours

## Common Tasks

### Export Student List

```
1. Navigate to: Data Management > Export Data
2. Select Entity: Students
3. Format: CSV or Excel
4. Columns: first_name, last_name, email, grade, section
5. Click: Preview → Confirm & Export
```

### Import New Students

```
1. Prepare CSV with columns: first_name, last_name, email, admission_number, grade
2. Navigate to: Data Management > Import Data
3. Select Entity: Students
4. Upload your CSV file
5. Verify column mappings
6. Review validation results
7. Confirm and import
```

### Export Attendance for Date Range

```
1. Navigate to: Data Management > Export Data
2. Select Entity: Attendance
3. Set Start Date: 2024-01-01
4. Set End Date: 2024-01-31
5. Select desired columns
6. Preview and Export
```

### Rollback an Import

```
1. Navigate to: Data Management > Import Data
2. Click: Import History tab
3. Find the import to rollback
4. Click: Rollback icon (undo button)
5. Confirm the rollback
```

## Tips & Best Practices

### Export Tips

- **CSV for Large Datasets**: CSV files handle large amounts of data better
- **Select Only Needed Columns**: Faster exports and smaller files
- **Use Date Filters**: Reduce file size by filtering date ranges
- **Schedule Regular Exports**: Set up weekly/monthly exports for backups
- **Preview First**: Always preview before exporting large datasets

### Import Tips

- **Validate Your Data First**: Check your file before importing
- **Use Templates**: Export existing data to get the correct format
- **Start Small**: Test with a few rows before importing thousands
- **Required Fields**: Ensure all required fields have data
- **Backup First**: Export existing data before bulk imports
- **Use Rollback**: Available for 24 hours after import

### Column Mapping Tips

- **Auto-Detection**: Let the system auto-detect when possible
- **Exact Names**: Name your columns exactly as system fields for auto-mapping
- **Required Fields**: All required fields must be mapped
- **Skip Unnecessary**: You don't need to map every column

### Error Handling

- **Download Error Report**: Get CSV of all validation errors
- **Fix in Bulk**: Fix errors in your source file and re-import
- **Check Duplicates**: Look for duplicate email/ID errors
- **Data Types**: Ensure dates, numbers are in correct format

## Keyboard Shortcuts

- **Drag & Drop**: Hold and drag columns to reorder
- **Tab**: Navigate between form fields
- **Enter**: Submit forms and dialogs
- **Esc**: Close dialogs and modals

## Troubleshooting

### Export Issues

**Problem**: Export preview shows no data
- **Solution**: Check date range filters, remove or adjust dates

**Problem**: Column order is wrong
- **Solution**: Use drag-and-drop or arrow buttons to reorder

**Problem**: Export takes too long
- **Solution**: Reduce columns, add date filters, or use CSV format

### Import Issues

**Problem**: File upload fails
- **Solution**: Check file format (CSV/Excel only), file size, and encoding

**Problem**: Column mapping shows wrong matches
- **Solution**: Manually adjust mappings, ensure header row is correct

**Problem**: Validation shows many errors
- **Solution**: Download error report, fix in source file, re-upload

**Problem**: Can't find import in history
- **Solution**: Check Import History tab, look for your recent imports

**Problem**: Rollback button is disabled
- **Solution**: Can only rollback within 24 hours of import

## File Format Requirements

### CSV Files
- UTF-8 encoding
- Comma-separated values
- First row should contain column headers
- Dates in YYYY-MM-DD format
- No special characters in headers

### Excel Files
- .xls or .xlsx format
- Data in first sheet
- First row contains headers
- No formulas, only values
- Dates in standard format

## Support

For additional help:
- Check the DATA_MANAGEMENT_IMPLEMENTATION.md for detailed documentation
- Review validation error messages carefully
- Download and review error reports
- Contact your system administrator

## Quick Reference

### Export Formats
- **CSV**: Best for large datasets, universal compatibility
- **Excel**: Formatted tables, easy to edit
- **PDF**: Read-only reports, professional presentation

### Common Entities
- **Students**: Student records and profiles
- **Teachers**: Teacher information and assignments
- **Attendance**: Daily attendance records
- **Examinations**: Exam and test records
- **Assignments**: Assignment and submission data
- **Grades**: Grade and marking records

### Import Statuses
- **Completed**: Import successful
- **Failed**: Import failed with errors
- **Rolled Back**: Import was reversed

### Validation Severities
- **Error**: Must be fixed before import
- **Warning**: Can proceed but should review
