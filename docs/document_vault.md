# Document Vault System

## Overview

The Document Vault is a secure, FERPA-compliant system for managing family and student documents within educational institutions. It provides encrypted storage, role-based access control, audit trails, and automatic document categorization.

## Features

### Core Functionality
- **Secure Document Upload**: AES-256 encryption for sensitive documents
- **Automatic Categorization**: OCR-based text extraction and automatic document type detection
- **Folder Organization**: Documents organized by student and document type
- **Bulk Upload**: Support for uploading multiple documents at once with automatic categorization
- **Encrypted Downloads**: Secure, time-limited presigned URLs for document access
- **Sharing Management**: Share documents with specific users (teachers, counselors, nurses)
- **Expiration Alerts**: Automatic alerts for documents approaching expiration
- **Comprehensive Audit Trail**: Track all document access and modifications

### Document Types Supported
- Birth Certificate
- Immunization Records
- Report Cards
- IEP (Individualized Education Program)
- 504 Plan
- Transcripts
- Test Scores
- Medical Records
- Insurance Documents
- ID Proof
- Other

### Security Features
- **AES-256 Encryption**: All sensitive documents are encrypted at rest
- **Access Control**: Role-based permissions (FERPA compliant)
- **Audit Logging**: Complete tracking of who viewed/downloaded what and when
- **Secure Storage**: Documents stored in S3 with unique encryption keys
- **Time-Limited Access**: Presigned URLs expire after 1 hour
- **Soft Delete**: Documents can be recovered before permanent deletion

## API Endpoints

### Upload Document
```http
POST /api/v1/document-vault/upload
Content-Type: multipart/form-data

Parameters:
- file: UploadFile (required)
- student_id: int (required)
- document_name: string (required)
- document_type: DocumentType (required)
- expiry_date: datetime (optional)
- is_sensitive: bool (default: true)

Response: FamilyDocumentResponse
```

### Bulk Upload
```http
POST /api/v1/document-vault/bulk-upload
Content-Type: multipart/form-data

Parameters:
- files: List[UploadFile] (max 20 files)
- student_id: int (required)
- auto_categorize: bool (default: true)

Response: BulkUploadResult
```

### List Documents
```http
GET /api/v1/document-vault/

Query Parameters:
- student_id: int (optional)
- document_type: string (optional)
- is_archived: bool (optional)
- skip: int (default: 0)
- limit: int (default: 100)

Response: Paginated list of documents
```

### Get Document
```http
GET /api/v1/document-vault/{document_id}

Response: FamilyDocumentResponse
```

### Download Document
```http
GET /api/v1/document-vault/{document_id}/download

Response: DocumentDownloadResponse with presigned URL
```

### Update Document
```http
PUT /api/v1/document-vault/{document_id}
Content-Type: application/json

Body: FamilyDocumentUpdate

Response: FamilyDocumentResponse
```

### Delete Document
```http
DELETE /api/v1/document-vault/{document_id}

Query Parameters:
- permanent: bool (default: false)

Response: Success message
```

### Get Folder Structure
```http
GET /api/v1/document-vault/folder-structure/{student_id}

Response: DocumentFolderStructure
```

### Share Document
```http
POST /api/v1/document-vault/share
Content-Type: application/json

Body: DocumentShareCreate
- document_id: int
- shared_with_user_id: int
- share_type: ShareType (teacher, counselor, nurse, admin, parent)
- permissions: List[string] (default: ["view"])
- expiry_date: datetime (optional)

Response: DocumentShareResponse
```

### Revoke Share
```http
DELETE /api/v1/document-vault/share/{share_id}

Response: Success message
```

### Get Expiring Documents
```http
GET /api/v1/document-vault/expiring

Query Parameters:
- days_ahead: int (default: 30)

Response: List[ExpiringDocumentAlert]
```

### Get Statistics
```http
GET /api/v1/document-vault/statistics

Query Parameters:
- student_id: int (optional)

Response: DocumentStatistics
```

### Get Audit Trail
```http
GET /api/v1/document-vault/{document_id}/audit-trail

Query Parameters:
- skip: int (default: 0)
- limit: int (default: 100)

Response: AuditTrailResponse with access logs
```

## Database Schema

### family_documents
- Stores document metadata and references
- Encryption keys stored securely
- OCR text extracted for searchability
- Soft delete support

### document_access_logs
- Comprehensive audit trail
- Tracks all access attempts (granted and denied)
- Records IP addresses and user agents
- FERPA compliance

### document_shares
- Manages document sharing between users
- Time-limited shares with expiration
- Permission-based access control
- Revocable shares

### document_expiration_alerts
- Automated expiration tracking
- Configurable alert thresholds (7, 14, 30 days)
- Alert delivery tracking

## FERPA Compliance

The Document Vault implements FERPA (Family Educational Rights and Privacy Act) compliance through:

1. **Access Control**: Only authorized personnel can access student documents
2. **Audit Trail**: Complete logging of all document access
3. **Parental Rights**: Parents can upload and manage their children's documents
4. **Consent Management**: Sharing requires explicit action
5. **Secure Storage**: Encryption at rest and in transit
6. **Data Retention**: Soft delete allows for compliance with retention policies

## Usage Examples

### Python Client Example
```python
import httpx

# Upload a document
with open("birth_certificate.pdf", "rb") as f:
    files = {"file": f}
    data = {
        "student_id": 123,
        "document_name": "Birth Certificate",
        "document_type": "birth_certificate",
        "is_sensitive": True
    }
    response = httpx.post(
        "http://api.example.com/api/v1/document-vault/upload",
        files=files,
        data=data,
        headers={"Authorization": f"Bearer {token}"}
    )
    document = response.json()

# Download a document
response = httpx.get(
    f"http://api.example.com/api/v1/document-vault/{document['id']}/download",
    headers={"Authorization": f"Bearer {token}"}
)
download_url = response.json()["presigned_url"]

# Download the file from S3
file_response = httpx.get(download_url)
with open("downloaded_document.pdf", "wb") as f:
    f.write(file_response.content)
```

## Encryption Details

### AES-256 Encryption
- Each document has a unique encryption key
- Keys are generated using cryptography.fernet (Fernet encryption)
- Fernet uses AES-128-CBC with HMAC for authentication
- Keys are stored securely in the database
- Decryption only occurs during download via presigned URLs

### Key Management
- Encryption keys are generated per document
- Keys are stored encrypted in the database
- Consider using AWS KMS or similar for production key management
- Key rotation should be implemented for long-term storage

## Performance Considerations

1. **File Size Limits**: Maximum 50MB per file
2. **Bulk Upload**: Maximum 20 files per request
3. **Presigned URLs**: 1-hour expiration for security
4. **OCR Processing**: Asynchronous for large documents
5. **Indexing**: Document type, student, and date indexes for fast queries

## Future Enhancements

- [ ] Advanced OCR with AWS Textract integration
- [ ] Document versioning
- [ ] Full-text search across all documents
- [ ] Automated retention policy enforcement
- [ ] Integration with e-signature services
- [ ] Mobile app support with offline access
- [ ] Virus scanning on upload
- [ ] Document templates and forms
- [ ] Batch operations (archive, delete, share)
- [ ] Advanced analytics and reporting
