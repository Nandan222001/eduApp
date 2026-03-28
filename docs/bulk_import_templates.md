# Bulk Import CSV Templates

This document describes the CSV format for bulk importing teachers and students into the system.

## Teacher Import Template

### Required Columns
- `first_name`: Teacher's first name (required)
- `last_name`: Teacher's last name (required)
- `email`: Teacher's email address (required, must be unique)

### Optional Columns
- `employee_id`: Unique employee identifier
- `phone`: Contact phone number
- `date_of_birth`: Date in YYYY-MM-DD format
- `gender`: Gender (e.g., Male, Female, Other)
- `address`: Full address
- `qualification`: Educational qualification
- `specialization`: Subject specialization
- `joining_date`: Date of joining in YYYY-MM-DD format

### Example CSV

```csv
employee_id,first_name,last_name,email,phone,date_of_birth,gender,address,qualification,specialization,joining_date
T001,John,Doe,john.doe@school.com,+1234567890,1985-05-15,Male,"123 Main St, City",M.Ed.,Mathematics,2020-08-01
T002,Jane,Smith,jane.smith@school.com,+1234567891,1990-03-20,Female,"456 Oak Ave, City",M.Sc.,Physics,2021-01-15
T003,Robert,Johnson,robert.j@school.com,+1234567892,1988-11-30,Male,"789 Pine Rd, City",B.Ed.,English,2019-07-10
```

## Student Import Template

### Required Columns
- `first_name`: Student's first name (required)
- `last_name`: Student's last name (required)

### Optional Columns
- `admission_number`: Unique admission identifier
- `roll_number`: Roll number
- `email`: Student's email address (must be unique if provided)
- `phone`: Student's contact phone number
- `date_of_birth`: Date in YYYY-MM-DD format
- `gender`: Gender (e.g., Male, Female, Other)
- `blood_group`: Blood group (e.g., A+, B-, O+)
- `address`: Full address
- `parent_name`: Parent or guardian name
- `parent_email`: Parent or guardian email
- `parent_phone`: Parent or guardian phone
- `admission_date`: Date of admission in YYYY-MM-DD format
- `grade_name`: Name of the grade (e.g., "Grade 10", "Class 5")
- `section_name`: Name of the section (e.g., "A", "B", "Alpha")

### Example CSV

```csv
admission_number,roll_number,first_name,last_name,email,phone,date_of_birth,gender,blood_group,address,parent_name,parent_email,parent_phone,admission_date,grade_name,section_name
S001,1,Alice,Williams,alice.w@student.com,+1234567893,2010-04-12,Female,A+,"321 Elm St, City",Mary Williams,mary.w@parent.com,+1234567894,2023-06-15,Grade 5,A
S002,2,Bob,Brown,bob.b@student.com,+1234567895,2010-07-22,Male,B+,"654 Maple Dr, City",Tom Brown,tom.b@parent.com,+1234567896,2023-06-15,Grade 5,A
S003,3,Charlie,Davis,charlie.d@student.com,+1234567897,2009-01-08,Male,O+,"987 Cedar Ln, City",Sarah Davis,sarah.d@parent.com,+1234567898,2023-06-15,Grade 6,B
```

## Import Process

1. **Prepare CSV File**: Create a CSV file following the template format above
2. **API Endpoint**: 
   - Teachers: `POST /api/v1/teachers/bulk-import`
   - Students: `POST /api/v1/students/bulk-import`
3. **Upload**: Send the CSV file as multipart/form-data with the key `file`
4. **Response**: The API will return a summary with:
   - `total`: Total number of rows processed
   - `success`: Number of successful imports
   - `failed`: Number of failed imports
   - `errors`: Array of error details for failed rows

## Validation Rules

### Teachers
- Email must be unique within the institution
- Employee ID must be unique within the institution (if provided)
- Date fields must be in YYYY-MM-DD format
- Email format must be valid

### Students
- Email must be unique within the institution (if provided)
- Admission number must be unique within the institution (if provided)
- Date fields must be in YYYY-MM-DD format
- If grade_name and section_name are provided, they must exist in the system
- Email format must be valid (if provided)

## Error Handling

If a row fails validation or import:
- The error will be recorded in the response
- Other valid rows will continue to be processed
- The row number and error details will be provided
- Duplicates or validation errors will not stop the entire import

## Best Practices

1. **Test with Small Files**: Start with a small CSV file to verify format
2. **Clean Data**: Remove any special characters or formatting issues
3. **Verify Prerequisites**: Ensure grades and sections exist before importing students
4. **Backup**: Keep original data before performing bulk operations
5. **Review Errors**: Check the error list in the response and fix issues
6. **Re-import**: Failed rows can be corrected and re-imported separately
