# Certificate and ID Card Demo Documentation

This guide provides comprehensive information about the certificate and ID card features in demo mode, including all available types, templates, testing workflows, and dummy data structures.

## Table of Contents

1. [Certificate Types](#certificate-types)
2. [Certificate Templates](#certificate-templates)
3. [ID Card Templates](#id-card-templates)
4. [Testing Certificate Issuance Workflow](#testing-certificate-issuance-workflow)
5. [Testing ID Card Generation](#testing-id-card-generation)
6. [Previewing and Customizing Templates](#previewing-and-customizing-templates)
7. [Bulk ID Card Generation](#bulk-id-card-generation)
8. [Dummy Data Structures](#dummy-data-structures)
9. [Digital Credentials (Blockchain-Verified)](#digital-credentials-blockchain-verified)

---

## Certificate Types

The system supports 5 main types of certificates that can be issued to students:

### 1. Transfer Certificate (TC)
- **Type Code**: `transfer_certificate`
- **Purpose**: Issued when a student leaves the institution to transfer to another school
- **Common Fields**:
  - Student name, grade, admission number
  - Admission date and leaving date
  - Reason for leaving
  - Character assessment
  - Academic performance summary
- **Certificate Number Format**: `TC-YYYY-XXX` (e.g., TC-2024-001)

### 2. Character Certificate
- **Type Code**: `character_certificate`
- **Purpose**: Certifies the student's character and conduct during their time at the institution
- **Common Fields**:
  - Student name, grade
  - Duration of study
  - Conduct rating (Excellent, Good, Satisfactory)
  - Character assessment
  - Behavior remarks
- **Certificate Number Format**: `CC-YYYY-XXX` (e.g., CC-2024-001)

### 3. Bonafide Certificate
- **Type Code**: `bonafide_certificate`
- **Purpose**: Certifies that the student is a bona fide student of the institution (used for bank accounts, scholarships, etc.)
- **Common Fields**:
  - Student name, grade, section
  - Admission number
  - Academic year
  - Purpose of certificate
  - Current enrollment status
- **Certificate Number Format**: `BC-YYYY-XXX` (e.g., BC-2024-001)

### 4. Study Certificate
- **Type Code**: `study_certificate`
- **Purpose**: Certifies the student's enrollment and academic progress
- **Common Fields**:
  - Student name, grade
  - Academic year(s)
  - Subjects studied
  - Enrollment dates
  - Medium of instruction
- **Certificate Number Format**: `SC-YYYY-XXX` (e.g., SC-2024-001)

### 5. Course Completion Certificate
- **Type Code**: `completion_certificate`
- **Purpose**: Awarded upon successful completion of a specific course or program
- **Common Fields**:
  - Student name, grade
  - Course name
  - Completion date
  - Grade/Performance level
  - Skills acquired
  - Instructor/Issuer details
- **Certificate Number Format**: `COMP-YYYY-XXX` (e.g., COMP-2024-001)

---

## Certificate Templates

Each certificate type has a customizable HTML template. Demo templates are available in `demoCertificateTemplates`:

### Template Structure
```javascript
{
  id: 1,
  institution_id: 1,
  certificate_type: 'transfer_certificate',
  template_name: 'Standard Transfer Certificate',
  template_content: '<html>...</html>', // Full HTML template with variables
  is_active: true,
  created_at: '2023-01-15T10:00:00Z',
  updated_at: '2024-01-15T10:00:00Z'
}
```

### Available Template Variables
Templates support dynamic variable substitution:
- `{{student_name}}` - Full name of the student
- `{{grade}}` - Grade/Class of the student
- `{{admission_number}}` - Student's admission number
- `{{admission_date}}` - Date of admission
- `{{leaving_date}}` - Date of leaving (for TC)
- `{{certificate_number}}` - Unique certificate number
- `{{issue_date}}` - Date of certificate issuance
- `{{institution_name}}` - Name of the institution
- `{{principal_name}}` - Name of the principal
- `{{reason}}` - Reason (for specific certificate types)
- `{{purpose}}` - Purpose of certificate (for bonafide)
- `{{conduct}}` - Conduct rating (for character certificate)
- `{{course_name}}` - Course name (for completion certificate)

### Example Template Usage
```html
<div class="certificate">
  <h1>TRANSFER CERTIFICATE</h1>
  <p>Certificate No: {{certificate_number}}</p>
  <p>This is to certify that <strong>{{student_name}}</strong>, 
     admission number <strong>{{admission_number}}</strong>, 
     was a student of <strong>{{grade}}</strong> from 
     {{admission_date}} to {{leaving_date}}.</p>
  <p>Reason for leaving: {{reason}}</p>
</div>
```

---

## ID Card Templates

The system provides 3 ID card template variations with different designs and features:

### 1. Standard Student ID Card
- **Template ID**: 1
- **Design**: `standard`
- **Color Scheme**: Blue background (#1976d2), white text
- **Features**:
  - Student photo
  - Name, grade, section
  - Admission number
  - Blood group
  - Emergency contact
  - Barcode
- **Use Case**: Basic identification for daily school use

### 2. Premium Student ID Card
- **Template ID**: 2
- **Design**: `premium`
- **Color Scheme**: Green background (#2e7d32), white text
- **Features**:
  - All standard features
  - QR code for digital verification
  - Barcode
  - Enhanced design elements
  - Valid from/until dates
- **Use Case**: Enhanced security with dual verification (barcode + QR)

### 3. Minimal Student ID Card
- **Template ID**: 3
- **Design**: `minimal`
- **Color Scheme**: White background, black text
- **Features**:
  - Clean, minimalist design
  - Student photo
  - Essential information only
  - QR code only (no barcode)
- **Use Case**: Modern, professional look for senior students

### ID Card Template Structure
```javascript
{
  id: 1,
  institution_id: 1,
  template_name: 'Standard Student ID Card',
  template_design: 'standard',
  background_color: '#1976d2',
  text_color: '#ffffff',
  include_photo: true,
  include_barcode: true,
  include_qr_code: false,
  is_active: true
}
```

### ID Card Data Fields
```javascript
{
  card_number: 'ID-2024-1001',
  student_name: 'Alex Johnson',
  grade: '10th Grade',
  section: 'A',
  admission_number: 'STD2023001',
  photo_url: 'https://...',
  blood_group: 'O+',
  emergency_contact: '+1-555-0101',
  valid_from: '2023-04-01',
  valid_until: '2024-03-31',
  barcode_data: 'STD2023001',
  qr_code_data: 'https://school.edu/verify/STD2023001'
}
```

---

## Testing Certificate Issuance Workflow

### Step-by-Step Testing Guide

#### 1. Access Certificate Management
- Log in as **Institution Admin** (`admin@demo.com` / `Demo@123`)
- Navigate to **Administration** → **Certificates**
- View list of issued certificates

#### 2. Issue a New Certificate
```
1. Click "Issue Certificate" button
2. Select certificate type from dropdown
3. Search and select student
4. Fill in certificate-specific fields:
   - For Transfer Certificate: leaving date, reason
   - For Character Certificate: conduct rating
   - For Bonafide: purpose
   - For Study Certificate: academic year
   - For Completion: course name, completion date
5. Preview the certificate
6. Click "Issue Certificate"
```

#### 3. Verify Certificate Generation
- Certificate receives unique number
- System records issuer and timestamp
- Certificate appears in student's document list
- Certificate can be downloaded as PDF

#### 4. Test Demo Data
Use existing certificates from `demoCertificates`:
```javascript
// View Alex Johnson's Transfer Certificate
Student ID: 1001
Certificate Number: TC-2024-001
Type: transfer_certificate

// View Emma Wilson's Character Certificate
Student ID: 1005
Certificate Number: CC-2024-001
Type: character_certificate
```

#### 5. Preview and Download
- Click on any certificate in the list
- Preview opens in modal with full details
- Download button generates PDF
- Print option available for physical copies

---

## Testing ID Card Generation

### Individual ID Card Generation

#### Step 1: Access ID Card Management
- Log in as **Institution Admin**
- Navigate to **Administration** → **ID Cards**
- View existing ID cards

#### Step 2: Generate Single ID Card
```
1. Click "Generate ID Card"
2. Select student from list
3. Choose template (Standard/Premium/Minimal)
4. Preview card design
5. Customize colors if needed
6. Click "Generate"
```

#### Step 3: Verify ID Card
- Card number is auto-generated (ID-YYYY-XXXX)
- Photo is pulled from student profile
- Barcode/QR code generated automatically
- Valid dates set automatically

### Testing with Demo Data
```javascript
// Alex Johnson's ID Card (Standard Template)
Card Number: ID-2024-1001
Template: Standard (Blue)
Features: Photo, Barcode, Emergency Contact

// Emma Wilson's ID Card (Premium Template)
Card Number: ID-2024-1005
Template: Premium (Green)
Features: Photo, Barcode, QR Code
```

---

## Previewing and Customizing Templates

### Certificate Template Customization

#### 1. Access Template Editor
```
Admin Dashboard → Settings → Certificate Templates
```

#### 2. Edit Template
- Select template to edit
- Modify HTML content
- Use variable placeholders
- Preview with sample data
- Save changes

#### 3. Template Preview
```javascript
// Preview with sample student data
{
  student_name: "Sample Student",
  grade: "10th Grade",
  admission_number: "STD2024XXX",
  // ... other fields
}
```

### ID Card Template Customization

#### 1. Customize Colors
```
ID Card Settings → Select Template → Customize
- Background Color: Color picker
- Text Color: Color picker
- Border Style: Solid/Dashed/None
```

#### 2. Toggle Features
```
☑ Include Photo
☑ Include Barcode
☑ Include QR Code
☑ Include Blood Group
☑ Include Emergency Contact
```

#### 3. Preview Changes
- Real-time preview with actual student data
- Test print layout
- Save as new template variant

---

## Bulk ID Card Generation

### Batch Generation Process

#### Step 1: Select Students
```
ID Cards → Bulk Generation
- Select by Grade: "10th Grade"
- Select by Section: "Section A"
- Or upload CSV with student IDs
```

#### Step 2: Choose Template
```
Template Selection:
○ Standard Template (Blue)
○ Premium Template (Green)
○ Minimal Template (White)
```

#### Step 3: Configure Batch
```
Batch Settings:
- Valid From: [Date Picker]
- Valid Until: [Date Picker]
- Card Number Prefix: "ID-2024-"
- Starting Number: 1001
```

#### Step 4: Generate and Download
```
1. Click "Generate Batch"
2. System processes all selected students
3. Progress bar shows completion
4. Download options:
   - Individual PDFs (ZIP)
   - Combined PDF (all cards)
   - Print-ready format (multiple per page)
```

### Testing Bulk Generation
```
Test Scenario: Generate 10th Grade Section A ID Cards
- Students: 8 students (from demoClassRoster)
- Template: Premium
- Expected Output: 8 ID cards in ZIP file
```

---

## Dummy Data Structures

### Certificate Data Structure

```typescript
interface Certificate {
  id: number;
  institution_id: number;
  student_id: number;
  certificate_type: 'transfer_certificate' | 'character_certificate' | 
                   'bonafide_certificate' | 'study_certificate' | 
                   'completion_certificate';
  certificate_number: string;  // e.g., "TC-2024-001"
  issue_date: string;           // ISO date format
  data: {
    student_name: string;
    grade: string;
    // Type-specific fields
    admission_date?: string;
    leaving_date?: string;
    reason?: string;
    conduct?: string;
    character?: string;
    purpose?: string;
    course_name?: string;
    completion_date?: string;
    academic_year?: string;
  };
  issued_by: number;            // User ID of issuer
  created_at: string;
  updated_at: string;
}
```

### Certificate Template Structure

```typescript
interface CertificateTemplate {
  id: number;
  institution_id: number;
  certificate_type: string;
  template_name: string;
  template_content: string;     // HTML template with variables
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### ID Card Template Structure

```typescript
interface IDCardTemplate {
  id: number;
  institution_id: number;
  template_name: string;
  template_design: 'standard' | 'premium' | 'minimal';
  background_color: string;     // Hex color code
  text_color: string;           // Hex color code
  include_photo: boolean;
  include_barcode: boolean;
  include_qr_code: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### ID Card Data Structure

```typescript
interface IDCardData {
  id: number;
  student_id: number;
  institution_id: number;
  card_number: string;          // e.g., "ID-2024-1001"
  student_name: string;
  grade: string;
  section: string;
  admission_number: string;
  photo_url: string;
  blood_group: string;
  emergency_contact: string;
  valid_from: string;           // Date
  valid_until: string;          // Date
  barcode_data: string;         // Usually admission number
  qr_code_data: string;         // Verification URL
  template_id: number;
  issued_at: string;
}
```

### Demo Data Access

All dummy data is available in `frontend/src/data/dummyData.ts`:

```javascript
// Import demo data
import { 
  demoCertificates,
  demoCertificateTemplates,
  demoIDCardTemplates,
  demoIDCardData
} from '@/data/dummyData';

// Access specific certificate
const transferCert = demoCertificates.find(c => 
  c.certificate_type === 'transfer_certificate'
);

// Access ID card templates
const standardTemplate = demoIDCardTemplates.find(t => 
  t.template_design === 'standard'
);

// Access student's ID card
const alexIDCard = demoIDCardData.find(card => 
  card.student_id === 1001
);
```

---

## Digital Credentials (Blockchain-Verified)

In addition to traditional certificates and ID cards, the system supports blockchain-verified digital credentials for enhanced security and portability.

### Digital Credential Types

#### 1. Academic Certificates
- **Sub Type**: `academic`
- Blockchain-verified course completion certificates
- Example: "Mathematics Excellence Certificate" with 95% score
- Includes: Skills, grade, metadata, blockchain hash
- **Certificate Number Format**: `CERT-[SUBJECT]-YYYY-XXX`

#### 2. Skill-Based Certificates
- **Sub Type**: `skill_based`
- Certifies specific skills and competencies
- Example: "English Debate Champion"
- Includes: Skills acquired, competition details, position
- **Certificate Number Format**: `CERT-[SKILL]-YYYY-XXX`

#### 3. Digital Badges
- **Type**: `digital_badge`
- Micro-credentials for achievements
- Sub-types: skill_based, participation, achievement
- Example: "Coding Champion", "Science Fair Participant"
- **Badge Number Format**: `BADGE-[CODE]-YYYY-XXX`

### Digital Credential Structure

```typescript
interface Credential {
  id: number;
  institution_id: number;
  recipient_id: number;
  issuer_id: number;
  credential_type: 'certificate' | 'digital_badge';
  sub_type: 'academic' | 'skill_based' | 'participation' | 'achievement';
  title: string;
  description: string;
  certificate_number: string;
  skills: string[];              // Array of skills
  metadata: {
    course_name?: string;
    grade_obtained?: string;
    issuer_designation?: string;
    competition_name?: string;
    rank?: number;
    total_participants?: number;
    project_title?: string;
    award?: string;
  };
  blockchain_hash: string;       // Ethereum-style hash
  blockchain_credential_id: string;
  blockchain_status: 'verified' | 'pending' | 'failed';
  verification_url: string;      // Public verification URL
  qr_code_url: string;           // QR code image URL
  issued_at: string;
  expires_at?: string;           // Optional expiration
  status: 'active' | 'revoked' | 'expired';
  course_id?: number;
  grade?: string;
  score?: number;
  
  // Populated fields
  recipient_name: string;
  recipient_email: string;
  issuer_name: string;
  institution_name: string;
  verification_count: number;    // Times verified
  share_count: number;           // Times shared
  
  created_at: string;
  updated_at: string;
}
```

### Testing Digital Credentials

#### View Student's Credentials
```javascript
// Access Alex Johnson's credentials
import { demoCredentials } from '@/data/dummyData';

const alexCredentials = demoCredentials.filter(c => 
  c.recipient_id === 1001
);

// Available credentials:
// 1. Mathematics Excellence Certificate (95% score)
// 2. Physics Laboratory Excellence (93% score)
// 3. Coding Champion Badge (1st place)
// 4. Science Fair Participant Badge
// 5. English Debate Champion Certificate
```

#### Verify Credential
```javascript
// Each credential has a verification URL
const cert = demoCredentials[0];
console.log(cert.verification_url);
// https://verify.edusystem.com/cert/CERT-MATH-2024-001

// Blockchain verification
console.log(cert.blockchain_hash);
// 0x8f3b2a1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a
console.log(cert.blockchain_status);
// 'verified'
```

#### Share Credential
- Students can share credentials via:
  - LinkedIn
  - Email
  - Direct link
  - QR code
- Share count tracked for analytics

#### Test Workflow
```
1. Student Dashboard → Digital Credentials
2. View all earned certificates and badges
3. Click on credential to see details
4. Verify blockchain authenticity
5. Download PDF version
6. Share on social media
7. Scan QR code for mobile verification
```

---

## Demo User Credentials for Testing

### Institution Admin
- **Email**: `admin@demo.com`
- **Password**: `Demo@123`
- **Access**: Full certificate and ID card management

### Student (Alex Johnson)
- **Email**: `demo@example.com`
- **Password**: `Demo@123`
- **Access**: View own certificates and digital credentials

### Teacher (Dr. Emily Carter)
- **Email**: `teacher@demo.com`
- **Password**: `Demo@123`
- **Access**: Issue completion certificates for own courses

### Parent (Robert Williams)
- **Email**: `parent@demo.com`
- **Password**: `Demo@123`
- **Access**: View children's certificates

---

## API Endpoints (Demo Mode)

When running in demo mode, these API calls return mock data from `dummyData.ts`:

### Certificate Endpoints
- `GET /api/certificates` - List all certificates
- `GET /api/certificates/{id}` - Get specific certificate
- `POST /api/certificates` - Issue new certificate
- `GET /api/certificates/templates` - List certificate templates
- `PUT /api/certificates/templates/{id}` - Update template

### ID Card Endpoints
- `GET /api/idcards` - List all ID cards
- `GET /api/idcards/{id}` - Get specific ID card
- `POST /api/idcards` - Generate new ID card
- `POST /api/idcards/bulk` - Bulk generate ID cards
- `GET /api/idcards/templates` - List ID card templates

### Digital Credential Endpoints
- `GET /api/credentials` - List student's credentials
- `GET /api/credentials/{id}` - Get specific credential
- `GET /api/credentials/verify/{certificate_number}` - Verify credential
- `POST /api/credentials/share/{id}` - Share credential

---

## Common Testing Scenarios

### Scenario 1: Student Transfer
```
1. Admin issues Transfer Certificate
2. Student: Alex Johnson (STD2023001)
3. Leaving date: 2024-02-10
4. Reason: Parent transfer
5. Certificate generated: TC-2024-001
6. Parent can view and download
```

### Scenario 2: Annual ID Card Renewal
```
1. Select all active students
2. Choose Premium template
3. Valid period: 2024-04-01 to 2025-03-31
4. Bulk generate 1250 ID cards
5. Download as ZIP
6. Print in batches of 10 per page
```

### Scenario 3: Course Completion
```
1. Teacher issues completion certificate
2. Student: Alex Johnson
3. Course: Advanced Mathematics
4. Completion date: 2024-01-30
5. Grade: A+
6. Digital credential also created
7. Student can share on LinkedIn
```

### Scenario 4: Verify Digital Credential
```
1. Employer receives credential from candidate
2. Opens verification URL
3. Scans QR code
4. System displays:
   - Student name and photo
   - Institution details
   - Certificate details
   - Blockchain verification status
   - Issued date and issuer
5. Green checkmark confirms authenticity
```

---

## Troubleshooting

### Certificate Not Generating
- Check if template exists for certificate type
- Verify student data is complete
- Ensure admin has permission
- Check browser console for errors

### ID Card Missing Photo
- Verify student has profile photo uploaded
- Check photo URL is accessible
- Use fallback placeholder if needed

### QR Code Not Scanning
- Ensure QR code data is valid URL
- Check QR code image resolution
- Test with different QR code readers

### Blockchain Verification Failed
- Verify blockchain_hash format is correct
- Check verification_url is accessible
- Ensure blockchain_status is 'verified'

---

## Additional Resources

### File Locations
- Certificate data: `frontend/src/data/dummyData.ts` (lines 4136-4221)
- ID card data: `frontend/src/data/dummyData.ts` (lines 4223-4307)
- Digital credentials: `frontend/src/data/dummyData.ts` (lines 4309-4489)
- Certificate templates: `demoCertificateTemplates` array
- ID card templates: `demoIDCardTemplates` array

### Related Documentation
- See `frontend/src/data/DEMO_USERS.md` for user credentials
- Check type definitions in `frontend/src/types/credential.ts`
- View certificate components in `frontend/src/components/certificates/`

---

**Last Updated**: February 2024  
**Version**: 1.0.0  
**Maintained by**: Development Team
