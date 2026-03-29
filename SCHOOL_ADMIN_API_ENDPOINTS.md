# School Admin API Endpoints

## Base URL
All endpoints are prefixed with `/api/v1/school-admin`

## Certificate Management Endpoints

### Issue Certificate
- **POST** `/certificates/issue?student_id={student_id}`
- **Request Body:**
  ```json
  {
    "certificate_type": "transfer_certificate",
    "template_id": 1,
    "remarks": "Optional remarks",
    "data": {
      "field1": "value1",
      "field2": "value2"
    }
  }
  ```
- **Response:** IssuedCertificateResponse
- **Description:** Issues a certificate to a student with specified type and data

### List Certificate Templates
- **GET** `/certificates/templates?certificate_type={type}`
- **Query Parameters:**
  - `certificate_type` (optional): Filter by certificate type
- **Response:** List of CertificateTemplateResponse
- **Description:** Lists available certificate templates, optionally filtered by type

### Create Certificate Template
- **POST** `/certificates/templates`
- **Request Body:**
  ```json
  {
    "institution_id": 1,
    "template_name": "Transfer Certificate Template",
    "certificate_type": "transfer_certificate",
    "template_config": {},
    "is_default": false,
    "is_active": true
  }
  ```
- **Response:** CertificateTemplateResponse
- **Description:** Creates a custom certificate template

### Download Certificate
- **GET** `/certificates/{id}/download`
- **Response:** PDF file stream
- **Description:** Downloads a certificate as a PDF file

### List Student Certificates
- **GET** `/certificates/student/{student_id}`
- **Response:** List of IssuedCertificateResponse
- **Description:** Lists all certificates issued for a specific student

### Generate Bulk ID Cards
- **POST** `/certificates/bulk-id-cards`
- **Request Body:**
  ```json
  {
    "section_id": 1,
    "grade_id": null,
    "template_id": 1,
    "valid_until": "2025-12-31"
  }
  ```
- **Response:** Bulk generation result
- **Description:** Generates ID cards for all students in a section or grade

## Staff Management Endpoints

### List Staff
- **GET** `/staff?skip={skip}&limit={limit}&department={dept}&status={status}&is_active={bool}&search={term}`
- **Query Parameters:**
  - `skip`: Pagination offset (default: 0)
  - `limit`: Items per page (default: 100, max: 100)
  - `department`: Filter by department
  - `status`: Filter by status
  - `is_active`: Filter by active status
  - `search`: Search by name, email, or employee ID
- **Response:** Paginated list of StaffMemberResponse
- **Description:** Lists staff members with filtering and search

### Get Staff Statistics
- **GET** `/staff/statistics`
- **Response:** StaffStatistics
- **Description:** Returns statistics about staff distribution by department and status

### Get Staff Member
- **GET** `/staff/{id}`
- **Response:** StaffMemberResponse
- **Description:** Gets details of a specific staff member

### Create Staff Member
- **POST** `/staff`
- **Request Body:**
  ```json
  {
    "institution_id": 1,
    "employee_id": "EMP001",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone": "1234567890",
    "designation": "Teacher",
    "department": "teaching",
    "date_of_birth": "1990-01-01",
    "gender": "male",
    "joining_date": "2020-01-01",
    "basic_salary": 50000.00
  }
  ```
- **Response:** StaffMemberResponse
- **Description:** Creates a new staff member

### Update Staff Member
- **PUT** `/staff/{id}`
- **Request Body:** StaffMemberUpdate (partial update)
- **Response:** StaffMemberResponse
- **Description:** Updates staff member details

### Delete Staff Member
- **DELETE** `/staff/{id}`
- **Response:** 204 No Content
- **Description:** Deletes a staff member

### Bulk Import Staff
- **POST** `/staff/bulk-import`
- **Request:** CSV file upload
- **Response:** Bulk import result with success/failure counts
- **Description:** Imports staff members from a CSV file

## Payroll Endpoints

### List Payroll
- **GET** `/staff/payroll?skip={skip}&limit={limit}&month={month}&year={year}`
- **Query Parameters:**
  - `skip`: Pagination offset
  - `limit`: Items per page
  - `month`: Filter by month (1-12)
  - `year`: Filter by year
- **Response:** Paginated list of StaffPayrollResponse
- **Description:** Lists payroll records with filtering

### Generate Monthly Payroll
- **POST** `/staff/payroll/generate`
- **Request Body:**
  ```json
  {
    "month": 1,
    "year": 2024,
    "staff_ids": [1, 2, 3]
  }
  ```
- **Response:** Generation result with success/failure counts
- **Description:** Generates monthly payroll for active staff members

### Update Payroll
- **PUT** `/staff/payroll/{id}`
- **Request Body:**
  ```json
  {
    "basic_salary": 55000.00,
    "hra": 5500.00,
    "da": 2750.00,
    "payment_status": "paid"
  }
  ```
- **Response:** StaffPayrollResponse
- **Description:** Updates individual payroll record

### Bulk Process Payroll
- **POST** `/staff/payroll/bulk-process`
- **Request Body:**
  ```json
  {
    "payroll_ids": [1, 2, 3],
    "payment_date": "2024-01-31",
    "transaction_reference": "TXN123456"
  }
  ```
- **Response:** Processing result
- **Description:** Marks multiple payroll records as paid

### Get Payroll Report
- **GET** `/staff/payroll/report?month={month}&year={year}`
- **Query Parameters:**
  - `month`: Month (1-12)
  - `year`: Year
- **Response:** Payroll summary report
- **Description:** Generates summary report for monthly payroll

## SMS Management Endpoints

### List SMS Templates
- **GET** `/sms/templates?template_type={type}`
- **Query Parameters:**
  - `template_type`: Filter by template type
- **Response:** List of SMSTemplateResponse
- **Description:** Lists SMS templates

### Create SMS Template
- **POST** `/sms/templates`
- **Request Body:**
  ```json
  {
    "institution_id": 1,
    "template_name": "Fee Reminder",
    "template_type": "fee_reminder",
    "message_body": "Dear {{parent_name}}, your fee payment is due.",
    "is_active": true
  }
  ```
- **Response:** SMSTemplateResponse
- **Description:** Creates a new SMS template

### Get SMS Template
- **GET** `/sms/templates/{id}`
- **Response:** SMSTemplateResponse
- **Description:** Gets a specific SMS template

### Update SMS Template
- **PUT** `/sms/templates/{id}`
- **Request Body:** SMSTemplateUpdate (partial update)
- **Response:** SMSTemplateResponse
- **Description:** Updates SMS template

### Delete SMS Template
- **DELETE** `/sms/templates/{id}`
- **Response:** 204 No Content
- **Description:** Deletes SMS template

### Send SMS
- **POST** `/sms/send`
- **Request Body:**
  ```json
  {
    "template_id": 1,
    "recipient_type": "parent",
    "recipient_ids": [1, 2, 3],
    "variables": {
      "parent_name": "Mr. Smith"
    }
  }
  ```
- **Response:** Send result
- **Description:** Sends SMS to specific recipients with template variable substitution

### Send Bulk SMS
- **POST** `/sms/send-bulk?template_id={id}&grade_id={grade}&section_id={section}`
- **Query Parameters:**
  - `template_id`: Template to use
  - `grade_id`: Send to all students in grade
  - `section_id`: Send to all students in section
  - `variables`: Template variables (optional)
- **Response:** Bulk send result
- **Description:** Sends SMS to all parents in a grade or section

## Enquiry Management Endpoints

### List Enquiries
- **GET** `/enquiries?skip={skip}&limit={limit}&source={source}&status={status}&assigned_to={id}&from_date={date}&to_date={date}&search={term}`
- **Query Parameters:**
  - `skip`: Pagination offset
  - `limit`: Items per page
  - `source`: Filter by source
  - `status`: Filter by status
  - `assigned_to`: Filter by assigned staff ID
  - `from_date`: Filter by start date
  - `to_date`: Filter by end date
  - `search`: Search term
- **Response:** Paginated list of EnquiryRecordResponse
- **Description:** Lists enquiry records with filtering

### Get Enquiry Statistics
- **GET** `/enquiries/statistics`
- **Response:** EnquiryStatistics
- **Description:** Returns enquiry funnel statistics and conversion rate

### Get Enquiry
- **GET** `/enquiries/{id}`
- **Response:** EnquiryRecordResponse
- **Description:** Gets a specific enquiry record

### Create Enquiry
- **POST** `/enquiries`
- **Request Body:**
  ```json
  {
    "institution_id": 1,
    "enquiry_date": "2024-01-15",
    "student_name": "Jane Doe",
    "parent_name": "John Doe",
    "parent_phone": "1234567890",
    "parent_email": "john@example.com",
    "enquiry_for_grade": "Grade 5",
    "source": "website",
    "notes": "Interested in admission",
    "assigned_to": 1,
    "follow_up_date": "2024-01-20"
  }
  ```
- **Response:** EnquiryRecordResponse
- **Description:** Creates a new enquiry record

### Update Enquiry
- **PUT** `/enquiries/{id}`
- **Request Body:** EnquiryRecordUpdate (partial update)
- **Response:** EnquiryRecordResponse
- **Description:** Updates enquiry details

### Delete Enquiry
- **DELETE** `/enquiries/{id}`
- **Response:** 204 No Content
- **Description:** Deletes an enquiry record

### Update Enquiry Status
- **PUT** `/enquiries/{id}/status?new_status={status}`
- **Query Parameters:**
  - `new_status`: New status value
- **Response:** EnquiryRecordResponse
- **Description:** Updates the status of an enquiry

### Send Enquiry Follow-up SMS
- **POST** `/enquiries/{id}/send-sms?template_id={id}`
- **Query Parameters:**
  - `template_id`: SMS template to use
  - `variables`: Template variables (optional)
- **Response:** Send result
- **Description:** Sends follow-up SMS to enquiry parent

## Student Promotion Enhancement

### Promote Students with Criteria
- **PUT** `/students/promote?minimum_attendance_percentage={pct}&minimum_pass_percentage={pct}&subject_wise_pass_required={bool}`
- **Request Body:**
  ```json
  {
    "student_ids": [1, 2, 3],
    "target_grade_id": 6,
    "target_section_id": 10,
    "effective_date": "2024-04-01"
  }
  ```
- **Query Parameters:**
  - `minimum_attendance_percentage`: Minimum attendance % required (0-100)
  - `minimum_pass_percentage`: Minimum pass % required (0-100)
  - `subject_wise_pass_required`: Whether subject-wise passing is required
- **Response:** Promotion result with detailed report
- **Description:** Promotes students with eligibility criteria validation and generates promotion report

## Features Implemented

### Certificate Management
- Issue certificates with multiple types (transfer, leaving, bonafide, etc.)
- Custom certificate templates
- PDF generation and download
- Student certificate history
- Bulk ID card generation for sections/grades

### Staff Management
- Full CRUD operations for staff members
- Department and status-based filtering
- Employee search functionality
- Bulk CSV import
- Staff statistics dashboard

### Payroll Management
- Monthly payroll generation with automatic calculations
- Individual payroll updates
- Bulk payment processing
- Monthly payroll summary reports
- Payment tracking with transaction references

### SMS Management
- Template-based SMS system
- Variable substitution in messages
- Individual and bulk SMS sending
- Grade/section-wise parent notifications
- SMS tracking for enquiries

### Enquiry Management
- Full CRUD for enquiry records
- Multi-criteria filtering and search
- Status workflow management
- Staff assignment
- Follow-up SMS integration
- Funnel statistics and conversion tracking

### Student Promotion Enhancement
- Criteria-based promotion validation
- Attendance percentage checking
- Academic performance validation
- Subject-wise pass requirement
- Detailed promotion report generation
- Failed promotion reason tracking
