# Document Vault - Quick Start Guide

## Setup

### 1. Install Dependencies

The required dependencies are already in `pyproject.toml`:
- `cryptography` (via python-jose)
- `boto3` (AWS S3)
- `PyPDF2` (OCR)

No additional packages needed!

### 2. Configure Environment

Add to your `.env`:
```bash
# Document Vault Configuration
DOCUMENT_VAULT_MAX_FILE_SIZE=52428800          # 50MB
DOCUMENT_VAULT_PRESIGNED_URL_EXPIRY=3600       # 1 hour
DOCUMENT_VAULT_RETENTION_YEARS=7               # FERPA requirement

# AWS S3 (Required for file storage)
AWS_ACCESS_KEY_ID=your_key_id
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your_bucket_name
```

### 3. Run Migration

```bash
alembic upgrade head
```

This creates:
- `family_documents`
- `document_access_logs`
- `document_shares`
- `document_expiration_alerts`

### 4. Test the API

The router is automatically registered at `/api/v1/document-vault`

## Common Use Cases

### Use Case 1: Parent Uploads Birth Certificate

```python
# Frontend/Client Code
import httpx

token = "user_jwt_token"

# Upload document
with open("birth_certificate.pdf", "rb") as f:
    files = {"file": f}
    data = {
        "student_id": 123,
        "document_name": "Birth Certificate - John Doe",
        "document_type": "birth_certificate",
        "is_sensitive": True
    }
    
    response = httpx.post(
        "http://localhost:8000/api/v1/document-vault/upload",
        files=files,
        data=data,
        headers={"Authorization": f"Bearer {token}"}
    )
    
    document = response.json()
    print(f"Document uploaded: {document['id']}")
```

### Use Case 2: Teacher Views Student IEP

```python
# Teacher requests document
response = httpx.get(
    f"http://localhost:8000/api/v1/document-vault/{document_id}",
    headers={"Authorization": f"Bearer {teacher_token}"}
)

# If teacher has access, get download URL
if response.status_code == 200:
    download_response = httpx.get(
        f"http://localhost:8000/api/v1/document-vault/{document_id}/download",
        headers={"Authorization": f"Bearer {teacher_token}"}
    )
    
    presigned_url = download_response.json()["presigned_url"]
    
    # Download from S3
    file_content = httpx.get(presigned_url).content
```

### Use Case 3: Admin Shares Medical Record with Nurse

```python
# Admin creates share
share_data = {
    "document_id": 456,
    "shared_with_user_id": nurse_user_id,
    "share_type": "nurse",
    "permissions": ["view", "download"],
    "expiry_date": "2024-12-31T23:59:59Z"
}

response = httpx.post(
    "http://localhost:8000/api/v1/document-vault/share",
    json=share_data,
    headers={"Authorization": f"Bearer {admin_token}"}
)

share = response.json()
print(f"Document shared with nurse until {share['expiry_date']}")
```

### Use Case 4: Bulk Upload Report Cards

```python
# Upload multiple documents at once
import os

files = []
for filename in os.listdir("report_cards/"):
    if filename.endswith(".pdf"):
        files.append(("files", open(f"report_cards/{filename}", "rb")))

response = httpx.post(
    "http://localhost:8000/api/v1/document-vault/bulk-upload?student_id=123&auto_categorize=true",
    files=files,
    headers={"Authorization": f"Bearer {token}"}
)

result = response.json()
print(f"Uploaded {result['successful_uploads']} documents")
print(f"Failed: {result['failed_uploads']}")
```

### Use Case 5: Get Expiring Documents Dashboard

```python
# Get documents expiring in next 30 days
response = httpx.get(
    "http://localhost:8000/api/v1/document-vault/expiring?days_ahead=30",
    headers={"Authorization": f"Bearer {admin_token}"}
)

expiring = response.json()
for alert in expiring:
    print(f"{alert['document_name']} expires in {alert['days_until_expiry']} days")
```

### Use Case 6: Folder Organization View

```python
# Get student's documents organized by type
response = httpx.get(
    f"http://localhost:8000/api/v1/document-vault/folder-structure/{student_id}",
    headers={"Authorization": f"Bearer {token}"}
)

structure = response.json()
print(f"Student: {structure['student_name']}")
print(f"Total documents: {structure['total_documents']}")
print(f"Total size: {structure['total_size_bytes'] / 1024 / 1024:.2f} MB")

for doc_type, documents in structure['folders'].items():
    print(f"\n{doc_type}: {len(documents)} documents")
    for doc in documents:
        print(f"  - {doc['document_name']} ({doc['created_at']})")
```

### Use Case 7: FERPA Audit Trail

```python
# Get complete access history for compliance
response = httpx.get(
    f"http://localhost:8000/api/v1/document-vault/{document_id}/audit-trail",
    headers={"Authorization": f"Bearer {admin_token}"}
)

audit = response.json()
print(f"Document: {audit['document_name']}")
print(f"Total accesses: {audit['total_accesses']}")

for log in audit['access_logs']:
    status = "✓" if log['access_granted'] else "✗"
    print(f"{status} {log['created_at']}: {log['user_name']} ({log['user_role']}) - {log['action_type']}")
```

## Access Control Matrix

| Role | Upload | View Own | View All | Share | Delete | Audit |
|------|--------|----------|----------|-------|--------|-------|
| Parent | ✓ (own student) | ✓ | ✗ | ✗ | ✓ (own) | ✗ |
| Student | ✗ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Teacher | ✗ | ✓ (shared) | ✗ | ✗ | ✗ | ✗ |
| Counselor | ✗ | ✓ (shared) | ✗ | ✗ | ✗ | ✗ |
| Nurse | ✗ | ✓ (shared) | ✗ | ✗ | ✗ | ✗ |
| Admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

## Document Type Auto-Detection

The system automatically categorizes documents based on filename:

| Keywords | Detected Type |
|----------|--------------|
| birth, certificate | Birth Certificate |
| immunization, vaccine, vaccination | Immunization Record |
| report, card, grade | Report Card |
| iep | IEP |
| 504 | 504 Plan |
| transcript | Transcript |
| test, score, sat, act | Test Scores |
| medical, health | Medical Records |
| insurance | Insurance |
| id, passport, license | ID Proof |
| (other) | Other |

## Background Tasks

### Setup Celery Beat Schedule

Add to your `celery_app.py`:

```python
from celery.schedules import crontab

celery_app.conf.beat_schedule = {
    'check-expiring-documents': {
        'task': 'src.tasks.document_vault_tasks.check_expiring_documents',
        'schedule': crontab(hour=9, minute=0),  # Daily at 9 AM
    },
    'cleanup-expired-shares': {
        'task': 'src.tasks.document_vault_tasks.cleanup_expired_shares',
        'schedule': crontab(minute='*/60'),  # Every hour
    },
    'archive-old-documents': {
        'task': 'src.tasks.document_vault_tasks.archive_old_documents',
        'schedule': crontab(day_of_week=0, hour=2, minute=0),  # Sunday 2 AM
    },
}
```

## Security Best Practices

### 1. Encryption Keys
- ✓ Unique key per document
- ✓ Never expose via API
- ✓ Store securely in database
- ⚠ Consider AWS KMS for production

### 2. File Upload Validation
```python
# Already implemented
- Max file size: 50MB (configurable)
- Allowed types: PDF, JPEG, PNG, DOCX
- Virus scanning: TODO
```

### 3. Access Logging
- ✓ Every access logged
- ✓ IP addresses tracked
- ✓ Both granted and denied
- ✓ FERPA compliant

### 4. Presigned URLs
- ✓ Time-limited (1 hour default)
- ✓ No credentials in URL
- ✓ Automatic expiration
- ✓ One-time use recommended

## Troubleshooting

### Issue: File upload fails with 413
**Solution**: Increase `DOCUMENT_VAULT_MAX_FILE_SIZE` in `.env`

### Issue: Can't access document
**Check**:
1. User has permission (uploader, admin, or share exists)
2. Document not deleted (`is_deleted=False`)
3. Share not expired

### Issue: OCR not extracting text
**Causes**:
- Scanned images (need real OCR service like Textract)
- Corrupted PDF
- Password-protected PDF

### Issue: Background tasks not running
**Solution**: Start Celery worker and beat:
```bash
celery -A src.celery_app worker -l info
celery -A src.celery_app beat -l info
```

## Performance Tips

1. **Indexing**: All key columns are indexed (student_id, document_type, expiry_date)
2. **Pagination**: Use `skip` and `limit` for large lists
3. **Caching**: Consider caching folder structures for frequently accessed students
4. **S3 Optimization**: Use CloudFront CDN for frequent downloads
5. **OCR**: Run asynchronously for large documents

## Next Steps

1. Review full API documentation: `docs/document_vault.md`
2. Explore FERPA compliance: `src/utils/ferpa_compliance.py`
3. Customize retention policies in config
4. Set up monitoring for expiring documents
5. Configure automated backups for document metadata

## Support

- Code: `src/api/v1/document_vault.py`
- Service: `src/services/document_vault_service.py`
- Models: `src/models/document_vault.py`
- Tests: `tests/test_document_vault.py`
