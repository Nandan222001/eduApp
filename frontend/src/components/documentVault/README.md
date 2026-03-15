# Family Document Vault

A comprehensive document management system for parents to securely store, share, and manage their children's important documents.

## Features

### 1. Folder Tree Navigation

- Organized by child and document type
- Shows document counts per category
- Last updated timestamps
- Hierarchical view with expand/collapse

### 2. Document Grid View

- Thumbnail previews for images and PDFs
- Document status badges (Verified, Pending, Rejected, Expired)
- Expiry warnings with countdown
- Document type and tags
- Upload date and file size
- Click to view full document

### 3. Drag & Drop Bulk Uploader

- Multi-file upload support
- OCR analysis with automatic categorization
- Document type suggestions based on content
- Child selector
- Title, description, and tags
- Expiry date picker
- Step-by-step wizard interface

### 4. Document Viewer

- PDF renderer for PDF files
- Image gallery for photos
- Tabbed interface:
  - Preview tab with full document view
  - Details tab with metadata
  - Access logs tab with audit trail
- Document sharing functionality
- Download with access logging
- Edit and delete options

### 5. Sharing Modal

- Role-based recipient selector (Teachers, Counselors, Nurses, Admins)
- Filter recipients by role
- Share expiry date picker
- Optional message to recipients
- View current shares with access statistics
- Revoke share functionality
- Track access count and last accessed date

### 6. Document Request System

- School staff can request specific documents from parents
- Request status tracking (Requested, Uploaded, Verified, Rejected)
- Due dates with urgency indicators
- Parent can upload directly in response to request
- Request history view
- Notes and feedback system

### 7. Expiry Reminders

- Visual alerts for expiring documents
- Countdown to expiry date
- Urgency levels (Expired, Urgent, Action Needed, Upcoming)
- Color-coded warnings
- Quick access to expiring documents
- Filter by urgency

### 8. Search Functionality

- Full-text search across document titles
- OCR text matching for document content
- Tag-based search
- Filter by child, document type, and status
- Real-time search results

### 9. Admin Verification Workflow

- Queue of pending documents
- Quick approve/reject buttons
- Document preview before verification
- Rejection with reason
- Request re-upload functionality
- Batch verification support
- Statistics dashboard

### 10. Access Logging

- Track all document views, downloads, and shares
- User identification with role
- Timestamp tracking
- IP address logging
- Audit trail for compliance

## Document Types

- Immunization Records
- Medical Records
- Birth Certificates
- ID Cards
- Permission Slips
- Emergency Contact Forms
- Insurance Cards
- Report Cards
- IEP Documents
- Attendance Excuses
- Other

## Security Features

- Role-based access control
- Share expiry dates
- Access logging and auditing
- Document verification workflow
- Secure file storage
- Encrypted transfers

## Usage

### For Parents

1. **Upload Documents**
   - Click "Upload Documents" button
   - Drag and drop files or browse
   - OCR will analyze and suggest document type
   - Fill in details and submit

2. **View Documents**
   - Navigate folder tree to find documents
   - Click document card to view
   - Download or share as needed

3. **Respond to Requests**
   - Check "Requests" tab
   - Upload requested documents
   - Track request status

4. **Monitor Expiry Dates**
   - Check "Reminders" tab
   - See which documents need renewal
   - Upload updated documents

### For School Staff

1. **Request Documents**
   - Create document request for specific child
   - Set due date and description
   - Track parent responses

2. **Verify Documents**
   - Review pending documents
   - Approve or reject with reason
   - Request re-upload if needed

3. **Access Shared Documents**
   - View documents shared by parents
   - Download for records
   - All access is logged

## Components

- `FolderTreeNavigation` - Hierarchical folder navigation
- `DocumentGrid` - Grid view of documents with cards
- `DocumentUploader` - Multi-step upload wizard
- `DocumentViewer` - Full document viewer with tabs
- `SharingModal` - Share document with recipients
- `AccessLogsPanel` - Display access audit logs
- `DocumentRequestPanel` - Manage document requests
- `ExpiryReminders` - Show expiring documents
- `AdminVerificationQueue` - Admin verification workflow

## API Integration

All components integrate with the `documentVaultApi` which supports:

- Real API calls for production
- Demo mode with mock data for testing
- Automatic switching based on user type

## Demo Mode

Demo data includes:

- 2 children with various documents
- Mix of document types and statuses
- Sample requests and shares
- Access logs and reminders
- OCR suggestions
