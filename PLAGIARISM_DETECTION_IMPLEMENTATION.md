# Plagiarism Detection System - Implementation Guide

## Overview

This document describes the comprehensive plagiarism detection system implemented for assignment submissions. The system uses advanced NLP techniques, AST-based code analysis, and intelligent citation detection to identify potential plagiarism while minimizing false positives.

## Features Implemented

### 1. Text-Based Plagiarism Detection

**TF-IDF & Cosine Similarity Analysis**
- Uses TF-IDF vectorization to convert text into numerical representations
- Calculates cosine similarity between submission pairs
- Sliding window algorithm to find matching text segments
- Configurable similarity thresholds (default: 70%)

**Implementation Files:**
- `src/services/plagiarism_detection_service.py` - `TextSimilarityAnalyzer` class
- Uses scikit-learn's `TfidfVectorizer` and `cosine_similarity`

### 2. Source Code Plagiarism Detection

**AST-Based Analysis**
- Abstract Syntax Tree (AST) parsing for Python code
- Generates structural fingerprints independent of variable names
- Compares:
  - Code structure (control flow, function definitions)
  - Variable naming patterns
  - Function signatures and complexity
  - Overall code complexity metrics

**Features Detected:**
- Function definitions and arguments
- Class structures
- Control flow patterns (if/else, loops)
- Import statements
- Code complexity scores

**Implementation Files:**
- `src/services/plagiarism_detection_service.py` - `CodeASTAnalyzer` class
- `src/models/plagiarism.py` - `CodeASTFingerprint` model

### 3. Cross-Batch and Cross-Institution Comparison

**Comparison Scopes:**
1. **Within Batch** - Compare only within current assignment
2. **Cross Batch** - Compare across all assignments in institution
3. **Cross Institution** - Compare across institutions (with privacy controls)
4. **All** - Compare against all available submissions

**Privacy Controls:**
- Anonymization of cross-institution matches
- Privacy consent management per institution
- Configurable data retention policies
- GDPR-compliant data handling

**Implementation Files:**
- `src/models/plagiarism.py` - `PlagiarismPrivacyConsent` model
- `src/api/v1/plagiarism.py` - Privacy consent endpoints

### 4. Citation Detection & False Positive Reduction

**Citation Patterns Detected:**
- APA style: (Author, Year)
- MLA style: Author. "Title"
- Chicago style: Author, Title. Year
- IEEE style: [1], [2]
- Harvard style: (Author Year)
- Direct quotes with quotation marks
- Reference sections and bibliographies

**False Positive Reduction:**
- Ignores common academic phrases
- Detects properly cited passages
- Calculates citation coverage percentage
- Flags segments near citations as legitimate
- Template code detection for programming assignments

**Implementation Files:**
- `src/services/plagiarism_detection_service.py` - `CitationDetector` class
- `src/models/plagiarism.py` - `CitationPattern` model

### 5. Similarity Visualization

**Side-by-Side Comparison:**
- Highlighted matching segments in both submissions
- Color-coded similarity levels
- Segment-by-segment breakdown
- Citation indicators
- Code vs text differentiation

**Visualization Data:**
- Source and target text with highlights
- Matched percentage calculations
- Segment similarity scores
- Citation context display

**Implementation Files:**
- `src/services/plagiarism_visualization_service.py`
- `frontend/src/components/plagiarism/SideBySideComparison.tsx`

### 6. Teacher Review Interface

**Review Workflow:**
1. View plagiarism detection results
2. Side-by-side comparison of submissions
3. Review matched segments
4. Make decision:
   - Confirmed Plagiarism
   - False Positive
   - Legitimate Citation
   - Needs Investigation
   - Dismissed

**Review Features:**
- Mark as false positive with reason
- Add review notes
- Track review history
- Filter by review status

**Implementation Files:**
- `frontend/src/components/plagiarism/TeacherReviewInterface.tsx`
- `src/api/v1/plagiarism.py` - Review endpoints

## Database Schema

### Core Tables

**plagiarism_checks**
- Stores plagiarism check configurations and status
- Links to assignments and institutions
- Tracks processing time and results count

**plagiarism_results**
- Individual plagiarism match results
- Similarity scores (overall, text, code)
- Citation information
- Review status and decisions

**plagiarism_match_segments**
- Detailed matching text segments
- Position information for highlighting
- Segment-level similarity scores
- Citation flags

**code_ast_fingerprints**
- AST-based code fingerprints
- Structure, variable, and function hashes
- Complexity metrics
- Language-specific features

**citation_patterns**
- Detected citations in submissions
- Citation types and positions
- Reference information
- Validation status

**plagiarism_privacy_consents**
- Institution-level privacy settings
- Cross-institution comparison permissions
- Data retention policies

## API Endpoints

### Plagiarism Checks

```
POST   /api/v1/plagiarism/checks
GET    /api/v1/plagiarism/checks/{check_id}
GET    /api/v1/plagiarism/checks/assignment/{assignment_id}
```

### Results

```
GET    /api/v1/plagiarism/results/check/{check_id}
GET    /api/v1/plagiarism/results/{result_id}
GET    /api/v1/plagiarism/results/submission/{submission_id}
POST   /api/v1/plagiarism/results/{result_id}/review
```

### Visualization

```
GET    /api/v1/plagiarism/visualization/{result_id}
GET    /api/v1/plagiarism/report/assignment/{assignment_id}
```

### Privacy Controls

```
POST   /api/v1/plagiarism/privacy-consent
GET    /api/v1/plagiarism/privacy-consent
```

## Frontend Components

### Components Created

1. **PlagiarismCheckButton** - Configure and start plagiarism checks
2. **PlagiarismResultsList** - Display results table with filtering
3. **SideBySideComparison** - Visual comparison of submissions
4. **TeacherReviewInterface** - Review and decision workflow
5. **PlagiarismReport** - Assignment-level analytics and statistics

### Pages

- **PlagiarismDashboard** - Main dashboard with tabs for reports, results, and review

## Configuration Options

### Check Settings

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

### Content Types

- `TEXT` - Text submissions
- `SOURCE_CODE` - Programming assignments
- `MIXED` - Mixed content

### Comparison Scopes

- `WITHIN_BATCH` - Current assignment only
- `CROSS_BATCH` - All assignments
- `CROSS_INSTITUTION` - Across institutions
- `ALL` - All available submissions

## Usage Examples

### 1. Run Plagiarism Check

```python
# Create check
check_data = PlagiarismCheckCreate(
    assignment_id=123,
    content_type=ContentType.TEXT,
    comparison_scope=ComparisonScope.WITHIN_BATCH,
    enable_cross_institution=False,
    check_settings={
        "min_similarity_threshold": 0.7,
        "enable_citation_detection": True
    }
)

service = PlagiarismDetectionService(db)
check = service.create_plagiarism_check(institution_id, check_data)

# Run check (async via background task)
service.run_plagiarism_check(check.id)
```

### 2. Review Results

```python
# Get results
results = service.get_plagiarism_results(check_id, min_similarity=0.7)

# Review result
service.review_result(
    result_id=result.id,
    teacher_id=teacher_id,
    decision=ReviewDecision.FALSE_POSITIVE,
    notes="Common assignment template",
    is_false_positive=True
)
```

### 3. Generate Report

```python
report = service.generate_plagiarism_report(assignment_id)
# Returns statistics, flagged pairs, similarity distribution
```

## Performance Considerations

### Optimization Techniques

1. **Batch Processing** - Process multiple submissions in parallel
2. **Caching** - Cache TF-IDF vectors and AST fingerprints
3. **Limiting Comparisons** - Configurable max_comparisons
4. **Indexing** - Database indexes on similarity scores and hashes
5. **Background Tasks** - Async processing via FastAPI BackgroundTasks

### Scalability

- Handles up to 1000 comparisons per check (configurable)
- Efficient sliding window algorithm for segment matching
- Optimized SQL queries with proper indexing
- Redis caching support (future enhancement)

## Security & Privacy

### Privacy Features

1. **Anonymization** - Cross-institution matches are anonymized
2. **Consent Management** - Per-institution privacy settings
3. **Data Retention** - Configurable retention policies
4. **Access Control** - Role-based access (teachers, admins only)
5. **Audit Trail** - All reviews are logged with timestamps

### Security Measures

- JWT authentication required for all endpoints
- Role-based authorization
- Institution-level data isolation
- Input validation and sanitization
- SQL injection prevention via ORM

## Testing

### Unit Tests

Create tests for:
- Text similarity calculation
- AST fingerprint generation
- Citation detection
- False positive detection
- Privacy controls

### Integration Tests

Test:
- Full plagiarism check workflow
- Cross-batch comparisons
- Review workflow
- Report generation

## Dependencies

### Python Packages (Already in pyproject.toml)

- `scikit-learn` - TF-IDF and cosine similarity
- `numpy` - Numerical operations
- `sqlalchemy` - Database ORM
- Built-in `ast` module - Python AST parsing

### Frontend Packages

- `@mui/material` - UI components
- `recharts` - Data visualization
- `react-router-dom` - Routing
- `axios` - API client

## Future Enhancements

1. **External Source Detection** - Check against web sources
2. **Multi-language Code Support** - JavaScript, Java, C++
3. **Machine Learning** - AI-based plagiarism pattern detection
4. **Real-time Checks** - Check on submission upload
5. **Similarity Heatmaps** - Visual matrix of all comparisons
6. **Paraphrase Detection** - Advanced semantic similarity
7. **Version History** - Track submission revisions
8. **Bulk Review** - Batch review multiple results

## Migration

Run the migration to create tables:

```bash
alembic upgrade head
```

## Troubleshooting

### Common Issues

1. **High Memory Usage** - Reduce max_comparisons setting
2. **Slow Processing** - Enable caching, reduce segment window
3. **False Positives** - Lower similarity threshold, enable citation detection
4. **Missing Matches** - Lower threshold, increase segment window

### Debug Mode

Enable detailed logging:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Support

For issues or questions:
1. Check API documentation at `/docs`
2. Review logs in `logs/` directory
3. Verify database migrations are current
4. Test with small datasets first

## Conclusion

This plagiarism detection system provides comprehensive analysis of both text and code submissions with intelligent false positive reduction through citation detection. The teacher review interface ensures human oversight while the privacy controls enable safe cross-institution comparisons.
