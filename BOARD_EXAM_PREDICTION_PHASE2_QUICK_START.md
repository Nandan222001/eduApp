# Board Exam Prediction Phase 2 - Quick Start Guide

## Installation

### 1. Install Dependencies

```bash
poetry install
```

This will install all required packages including:
- sentence-transformers
- transformers
- torch
- hdbscan
- umap-learn

### 2. Run Database Migration

```bash
alembic upgrade head
```

This creates the following tables:
- `question_embeddings`
- `question_clusters`
- `question_cluster_members`
- `question_variations`
- `question_blueprints`

### 3. Start the Server

```bash
uvicorn src.main:app --reload
```

## Quick Usage Examples

### Question Similarity Detection

#### 1. Generate Embeddings for Questions

```bash
# Single question
curl -X POST "http://localhost:8000/api/v1/question-nlp/embeddings/generate?question_id=1" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Batch generation
curl -X POST "http://localhost:8000/api/v1/question-nlp/embeddings/batch-generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "question_ids": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    "batch_size": 32
  }'
```

#### 2. Find Similar Questions

```bash
curl -X POST "http://localhost:8000/api/v1/question-nlp/similarity/find" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "question_id": 1,
    "top_k": 10,
    "min_similarity": 0.7,
    "same_subject_only": true
  }'
```

Response:
```json
[
  {
    "question_id": 45,
    "question_text": "Calculate the specific heat capacity...",
    "similarity_score": 0.92,
    "difficulty_level": "medium",
    "bloom_taxonomy_level": "apply",
    "question_type": "numerical",
    "marks": 5.0
  }
]
```

#### 3. Calculate Similarity Between Two Questions

```bash
curl -X GET "http://localhost:8000/api/v1/question-nlp/similarity/calculate?question_id1=1&question_id2=45" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Question Clustering

#### 1. Cluster Questions by Subject

```bash
curl -X POST "http://localhost:8000/api/v1/question-nlp/clustering/cluster" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "grade_id": 10,
    "subject_id": 5,
    "min_cluster_size": 5,
    "min_samples": 3
  }'
```

Response:
```json
{
  "status": "success",
  "total_questions": 150,
  "clusters_created": 12,
  "noise_points": 8,
  "cluster_ids": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
}
```

#### 2. View Cluster Details

```bash
curl -X GET "http://localhost:8000/api/v1/question-nlp/clustering/cluster/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 3. List All Clusters

```bash
curl -X GET "http://localhost:8000/api/v1/question-nlp/clustering/list?grade_id=10&subject_id=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Question Variation Generation

#### 1. Generate Multiple Variations

```bash
curl -X POST "http://localhost:8000/api/v1/question-nlp/variations/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "question_id": 123,
    "variation_types": ["paraphrase", "difficulty_easy", "difficulty_hard"]
  }'
```

Response:
```json
[
  {
    "id": 1,
    "original_question_id": 123,
    "variation_text": "Compute the specific heat capacity...",
    "variation_type": "paraphrase",
    "question_type": "numerical",
    "difficulty_level": "medium",
    "bloom_taxonomy_level": "apply",
    "similarity_score": null,
    "generation_method": "rule_based",
    "is_verified": false,
    "is_active": true,
    "created_at": "2024-01-15T10:30:00"
  }
]
```

#### 2. Get All Variations for a Question

```bash
curl -X GET "http://localhost:8000/api/v1/question-nlp/variations/question/123?active_only=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 3. Verify a Variation

```bash
curl -X POST "http://localhost:8000/api/v1/question-nlp/variations/1/verify?is_verified=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Bloom's Taxonomy Classification

#### 1. Classify a Question Text

```bash
curl -X POST "http://localhost:8000/api/v1/question-nlp/bloom-taxonomy/classify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "question_text": "Analyze the impact of global warming on polar ice caps."
  }'
```

Response:
```json
{
  "predicted_level": "analyze",
  "confidence": 0.85,
  "keyword_scores": {
    "remember": 0,
    "understand": 0,
    "apply": 0,
    "analyze": 2,
    "evaluate": 0,
    "create": 0
  },
  "complexity_score": 0.65,
  "explanation": "This question requires breaking down information and examining relationships."
}
```

#### 2. Batch Classify Questions

```bash
curl -X POST "http://localhost:8000/api/v1/question-nlp/bloom-taxonomy/batch-classify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "question_ids": [1, 2, 3, 4, 5],
    "auto_update": true
  }'
```

#### 3. Update Single Question's Bloom Level

```bash
curl -X POST "http://localhost:8000/api/v1/question-nlp/bloom-taxonomy/update/123?auto_classify=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Question Blueprint Generation

#### 1. Analyze Historical Patterns

```bash
curl -X POST "http://localhost:8000/api/v1/question-blueprints/analyze" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "board": "cbse",
    "grade_id": 10,
    "subject_id": 5,
    "year_start": 2018,
    "year_end": 2023
  }'
```

Response:
```json
{
  "status": "success",
  "papers_analyzed": 6,
  "questions_analyzed": 180,
  "year_range": "2018-2023",
  "avg_total_marks": 100,
  "avg_duration_minutes": 180,
  "difficulty_distribution": {
    "easy": 30.5,
    "medium": 45.2,
    "hard": 24.3
  },
  "bloom_taxonomy_distribution": {
    "remember": 20.0,
    "understand": 25.0,
    "apply": 30.0,
    "analyze": 15.0,
    "evaluate": 7.0,
    "create": 3.0
  },
  "question_type_distribution": {
    "multiple_choice": 40.0,
    "short_answer": 35.0,
    "long_answer": 25.0
  },
  "chapter_weightage": {
    "Thermodynamics": {"marks": 15, "percentage": 15.0},
    "Optics": {"marks": 20, "percentage": 20.0}
  }
}
```

#### 2. Create Blueprint from Analysis

```bash
curl -X POST "http://localhost:8000/api/v1/question-blueprints/create-from-analysis" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "blueprint_name": "Physics Board Exam 2024",
    "description": "Standard CBSE physics board exam pattern",
    "board": "cbse",
    "grade_id": 10,
    "subject_id": 5,
    "year_start": 2018,
    "year_end": 2023
  }'
```

#### 3. Get Question Suggestions Based on Blueprint

```bash
curl -X GET "http://localhost:8000/api/v1/question-blueprints/1/suggestions?include_predictions=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "status": "success",
  "blueprint_id": 1,
  "blueprint_name": "Physics Board Exam 2024",
  "total_marks": 100,
  "duration_minutes": 180,
  "suggestions": [
    {
      "difficulty_level": "medium",
      "bloom_level": "apply",
      "target_marks": 20,
      "suggested_questions": [
        {
          "question_id": 45,
          "question_text": "Calculate the heat required to convert 100g of ice...",
          "marks": 5,
          "question_type": "numerical",
          "topic_id": 12,
          "chapter_id": 3
        }
      ]
    }
  ],
  "total_suggestion_groups": 8
}
```

#### 4. List All Blueprints

```bash
curl -X GET "http://localhost:8000/api/v1/question-blueprints/?grade_id=10&subject_id=5" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### 5. Update a Blueprint

```bash
curl -X PUT "http://localhost:8000/api/v1/question-blueprints/1" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "blueprint_name": "Updated Physics Blueprint",
    "total_marks": 80,
    "duration_minutes": 120
  }'
```

#### 6. Delete a Blueprint

```bash
curl -X DELETE "http://localhost:8000/api/v1/question-blueprints/1" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Complete Workflow Example

### Step 1: Prepare Questions
```bash
# Generate embeddings for all questions in a subject
curl -X POST "http://localhost:8000/api/v1/question-nlp/embeddings/batch-generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "question_ids": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    "batch_size": 32
  }'
```

### Step 2: Cluster Questions
```bash
# Organize questions into semantic clusters
curl -X POST "http://localhost:8000/api/v1/question-nlp/clustering/cluster" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "grade_id": 10,
    "subject_id": 5,
    "min_cluster_size": 5,
    "min_samples": 3
  }'
```

### Step 3: Classify Bloom Levels
```bash
# Auto-classify all questions
curl -X POST "http://localhost:8000/api/v1/question-nlp/bloom-taxonomy/batch-classify" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "question_ids": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
    "auto_update": true
  }'
```

### Step 4: Analyze Historical Patterns
```bash
# Analyze previous years
curl -X POST "http://localhost:8000/api/v1/question-blueprints/analyze" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "board": "cbse",
    "grade_id": 10,
    "subject_id": 5,
    "year_start": 2018,
    "year_end": 2023
  }'
```

### Step 5: Generate Predictions (Phase 1)
```bash
# Run prediction analysis
curl -X POST "http://localhost:8000/api/v1/board-exam-predictions/analyze" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "board": "cbse",
    "grade_id": 10,
    "subject_id": 5,
    "year_start": 2018,
    "year_end": 2023
  }'
```

### Step 6: Create Blueprint
```bash
# Create exam blueprint
curl -X POST "http://localhost:8000/api/v1/question-blueprints/create-from-analysis" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "blueprint_name": "Physics Board Exam 2024",
    "board": "cbse",
    "grade_id": 10,
    "subject_id": 5
  }'
```

### Step 7: Get Question Suggestions
```bash
# Get intelligent question suggestions
curl -X GET "http://localhost:8000/api/v1/question-blueprints/1/suggestions?include_predictions=true" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Step 8: Generate Variations (Optional)
```bash
# Generate variations for selected questions
curl -X POST "http://localhost:8000/api/v1/question-nlp/variations/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "question_id": 45,
    "variation_types": ["paraphrase", "difficulty_easy"]
  }'
```

## Configuration

### Environment Variables

Add to `.env`:
```env
# Model cache directory (optional)
TRANSFORMERS_CACHE=/path/to/cache
SENTENCE_TRANSFORMERS_HOME=/path/to/cache
```

### Model Configuration

Default model: `all-MiniLM-L6-v2` (384 dimensions)

To use a different model, modify the service initialization:
```python
service = QuestionNLPService(db, model_name='paraphrase-MiniLM-L6-v2')
```

## Performance Tips

1. **Batch Processing**: Always use batch endpoints for multiple questions
2. **GPU Acceleration**: Install CUDA-enabled PyTorch for faster embeddings
3. **Caching**: Embeddings are cached in database - regenerate only when needed
4. **Clustering**: Run clustering after adding significant new questions
5. **Blueprint**: Cache blueprint analysis results for reuse

## Troubleshooting

### Model Download Issues
If models fail to download, check internet connection and ensure sufficient disk space.

### Memory Issues
For large batches, reduce `batch_size` parameter:
```json
{
  "batch_size": 16
}
```

### Slow Embeddings
- Use GPU if available
- Reduce batch size
- Consider using smaller models

## API Documentation

Full API documentation available at:
```
http://localhost:8000/docs
```

## Next Steps

1. Integrate with front-end for visual clustering
2. Set up scheduled tasks for regular clustering updates
3. Configure blueprint templates for different exam types
4. Implement feedback loop for variation quality
5. Train custom models on domain-specific data
