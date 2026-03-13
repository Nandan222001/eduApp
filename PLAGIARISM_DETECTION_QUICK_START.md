# Plagiarism Detection - Quick Start Guide

## Quick Setup

### 1. Run Database Migration

```bash
alembic upgrade head
```

This creates all necessary plagiarism detection tables.

### 2. Configure Privacy Settings (Admin)

```bash
curl -X POST http://localhost:8000/api/v1/plagiarism/privacy-consent \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "institution_id": 1,
    "allow_cross_institution_comparison": false,
    "allow_anonymized_sharing": true,
    "data_retention_days": 365
  }'
```

### 3. Run Your First Plagiarism Check

#### Via API

```python
import requests

# Start plagiarism check
response = requests.post(
    'http://localhost:8000/api/v1/plagiarism/checks',
    headers={'Authorization': f'Bearer {token}'},
    json={
        'assignment_id': 123,
        'content_type': 'TEXT',
        'comparison_scope': 'WITHIN_BATCH',
        'enable_cross_institution': False,
        'check_settings': {
            'min_similarity_threshold': 0.7,
            'enable_citation_detection': True,
            'enable_code_analysis': False
        }
    }
)
check = response.json()
print(f"Check started: {check['id']}")
```

#### Via Frontend

1. Navigate to assignment page
2. Click "Run Plagiarism Check" button
3. Configure settings in dialog
4. Click "Start Check"
5. View results in dashboard

## Common Use Cases

### Use Case 1: Check Text Assignment

```python
from src.services.plagiarism_detection_service import PlagiarismDetectionService
from src.schemas.plagiarism import PlagiarismCheckCreate

service = PlagiarismDetectionService(db)

check_data = PlagiarismCheckCreate(
    assignment_id=assignment_id,
    content_type='TEXT',
    comparison_scope='WITHIN_BATCH',
    enable_cross_institution=False,
    check_settings={
        'min_similarity_threshold': 0.7,
        'enable_citation_detection': True,
        'ignore_common_phrases': True
    }
)

check = service.create_plagiarism_check(institution_id, check_data)
result = service.run_plagiarism_check(check.id)
```

### Use Case 2: Check Programming Assignment

```python
check_data = PlagiarismCheckCreate(
    assignment_id=assignment_id,
    content_type='SOURCE_CODE',
    comparison_scope='CROSS_BATCH',
    enable_cross_institution=False,
    check_settings={
        'min_similarity_threshold': 0.8,
        'enable_code_analysis': True,
        'enable_citation_detection': False
    }
)

check = service.create_plagiarism_check(institution_id, check_data)
result = service.run_plagiarism_check(check.id)
```

### Use Case 3: Review Results

```python
# Get high similarity results
results = service.get_plagiarism_results(check_id, min_similarity=0.8)

for result in results:
    print(f"Submission {result.submission_id}")
    print(f"Similarity: {result.similarity_score * 100:.1f}%")
    print(f"Segments: {result.matched_segments_count}")
    
# Review a result
service.review_result(
    result_id=results[0].id,
    teacher_id=teacher_id,
    decision='CONFIRMED_PLAGIARISM',
    notes='Multiple exact matches without citations'
)
```

### Use Case 4: Generate Report

```python
report = service.generate_plagiarism_report(assignment_id)

print(f"Total Submissions: {report['total_submissions']}")
print(f"Average Similarity: {report['average_similarity']:.2%}")
print(f"High Risk Cases: {report['high_similarity_count']}")
print(f"Flagged Pairs: {len(report['flagged_pairs'])}")
```

## API Endpoints Cheat Sheet

### Checks
- `POST /plagiarism/checks` - Create check
- `GET /plagiarism/checks/{id}` - Get check status
- `GET /plagiarism/checks/assignment/{id}` - List assignment checks

### Results
- `GET /plagiarism/results/check/{id}` - Get check results
- `GET /plagiarism/results/{id}` - Get result details
- `POST /plagiarism/results/{id}/review` - Review result

### Visualization
- `GET /plagiarism/visualization/{id}` - Get comparison view
- `GET /plagiarism/report/assignment/{id}` - Get report

### Privacy
- `POST /plagiarism/privacy-consent` - Set privacy settings
- `GET /plagiarism/privacy-consent` - Get privacy settings

## Configuration Examples

### High Security (Strict Detection)

```json
{
  "min_similarity_threshold": 0.6,
  "min_segment_length": 30,
  "enable_citation_detection": true,
  "enable_code_analysis": true,
  "ignore_common_phrases": false,
  "max_comparisons": 2000
}
```

### Balanced (Recommended)

```json
{
  "min_similarity_threshold": 0.7,
  "min_segment_length": 50,
  "enable_citation_detection": true,
  "enable_code_analysis": true,
  "ignore_common_phrases": true,
  "max_comparisons": 1000
}
```

### Lenient (Research Papers)

```json
{
  "min_similarity_threshold": 0.8,
  "min_segment_length": 100,
  "enable_citation_detection": true,
  "enable_code_analysis": false,
  "ignore_common_phrases": true,
  "max_comparisons": 500
}
```

## Frontend Usage

### 1. Import Components

```tsx
import {
  PlagiarismCheckButton,
  PlagiarismResultsList,
  TeacherReviewInterface,
  PlagiarismReport
} from '../components/plagiarism';
```

### 2. Add to Assignment Page

```tsx
<PlagiarismCheckButton
  assignmentId={assignmentId}
  onCheckStarted={(checkId) => {
    console.log('Check started:', checkId);
    // Navigate to results or show notification
  }}
/>
```

### 3. Display Results

```tsx
<PlagiarismResultsList
  checkId={checkId}
  onViewDetails={(resultId) => {
    // Navigate to detail view
    navigate(`/plagiarism/result/${resultId}`);
  }}
/>
```

### 4. Review Interface

```tsx
<TeacherReviewInterface
  resultId={resultId}
  result={result}
  onReviewComplete={() => {
    // Refresh results
    loadResults();
  }}
/>
```

## Troubleshooting

### Issue: Check Takes Too Long

**Solution:** Reduce max_comparisons or use WITHIN_BATCH scope

```python
check_settings = {
    'max_comparisons': 500,  # Reduced from 1000
}
```

### Issue: Too Many False Positives

**Solution:** Enable citation detection and increase threshold

```python
check_settings = {
    'min_similarity_threshold': 0.8,  # Increased
    'enable_citation_detection': True,
    'ignore_common_phrases': True
}
```

### Issue: Missing Obvious Plagiarism

**Solution:** Lower threshold and segment length

```python
check_settings = {
    'min_similarity_threshold': 0.6,  # Decreased
    'min_segment_length': 30  # Decreased
}
```

## Best Practices

### 1. Text Assignments
- Use threshold 0.7-0.8
- Enable citation detection
- Enable common phrase filtering
- Use WITHIN_BATCH or CROSS_BATCH scope

### 2. Programming Assignments
- Use threshold 0.8-0.9 (code more standardized)
- Enable code analysis
- Disable citation detection
- Consider CROSS_BATCH to catch copied code

### 3. Research Papers
- Use threshold 0.8+
- Enable citation detection (critical!)
- Larger segment lengths (100+)
- Manual review for all matches

### 4. Review Process
1. Sort by highest similarity first
2. Check if citations are present
3. Review matched segments
4. Mark false positives appropriately
5. Document decisions in review notes

## Performance Tips

1. **Batch Size:** Limit to 100-200 submissions per check
2. **Comparison Scope:** Use WITHIN_BATCH for large datasets
3. **Background Processing:** Always use async for checks
4. **Caching:** Results are cached after first check
5. **Indexing:** Ensure database indexes are created

## Security Notes

- Only teachers and admins can run checks
- Students can view their own results
- Cross-institution data is anonymized
- All reviews are logged with timestamps
- Privacy settings enforced at API level

## Next Steps

1. Run migration: `alembic upgrade head`
2. Set privacy settings for your institution
3. Run test check on small assignment
4. Review and adjust thresholds
5. Train teachers on review interface
6. Document institution-specific policies

## Support

- API Documentation: http://localhost:8000/docs
- Implementation Guide: PLAGIARISM_DETECTION_IMPLEMENTATION.md
- Database Schema: See migration file
- Frontend Components: frontend/src/components/plagiarism/
