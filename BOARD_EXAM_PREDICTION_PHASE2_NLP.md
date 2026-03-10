# Board Exam Question Prediction System - Phase 2 (NLP Integration)

## Overview

Phase 2 enhances the Board Exam Question Prediction System with advanced Natural Language Processing (NLP) capabilities using Sentence-BERT, question clustering, variation generation, Bloom's taxonomy classification, and question blueprint generation.

## Features Implemented

### 1. Sentence-BERT Integration for Question Similarity

#### Technology
- **Model**: Sentence-BERT (all-MiniLM-L6-v2)
- **Framework**: sentence-transformers
- **Purpose**: Generate semantic embeddings for questions to enable similarity detection

#### Components

**QuestionEmbedding Model**
- Stores vector embeddings for each question
- Supports multiple embedding models
- Tracks embedding dimension and creation time

**QuestionNLPService**
- `generate_embedding(question_id)`: Generate embedding for single question
- `batch_generate_embeddings(question_ids, batch_size)`: Efficient batch processing
- `calculate_similarity(question_id1, question_id2)`: Compute cosine similarity
- `find_similar_questions(question_id, top_k, min_similarity)`: Find semantically similar questions

#### API Endpoints

**POST `/api/v1/question-nlp/embeddings/generate`**
Generate embedding for a single question.

**POST `/api/v1/question-nlp/embeddings/batch-generate`**
```json
{
  "question_ids": [1, 2, 3, 4, 5],
  "batch_size": 32
}
```

**POST `/api/v1/question-nlp/similarity/find`**
```json
{
  "question_id": 123,
  "top_k": 10,
  "min_similarity": 0.7,
  "same_subject_only": true
}
```

**GET `/api/v1/question-nlp/similarity/calculate?question_id1=123&question_id2=456`**

### 2. Question Clustering Algorithm

#### Technology
- **Algorithm**: HDBSCAN (Hierarchical Density-Based Spatial Clustering)
- **Dimensionality**: Uses Sentence-BERT embeddings
- **Purpose**: Group semantically similar questions together

#### Components

**QuestionCluster Model**
- Stores cluster metadata and statistics
- Tracks representative question for each cluster
- Maintains centroid vector and cluster characteristics

**QuestionClusterMember Model**
- Links questions to their clusters
- Stores similarity scores and distance to centroid

#### Features
- Automatic cluster size determination
- Noise point detection (outlier questions)
- Dominant difficulty level per cluster
- Dominant Bloom's taxonomy level per cluster
- Representative question selection (closest to centroid)

#### API Endpoints

**POST `/api/v1/question-nlp/clustering/cluster`**
```json
{
  "grade_id": 10,
  "subject_id": 5,
  "min_cluster_size": 5,
  "min_samples": 3
}
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

**GET `/api/v1/question-nlp/clustering/cluster/{cluster_id}`**
Get detailed cluster information including all members.

**GET `/api/v1/question-nlp/clustering/list?grade_id=10&subject_id=5`**
List all clusters for a grade and subject.

### 3. Question Variation Generation System

#### Variation Types

**Paraphrase Variation**
- Rephrases question using synonym replacement
- Maintains same difficulty and Bloom's level
- Preserves original meaning

**Difficulty Adjustment**
- `difficulty_easy`: Simplifies question complexity
- `difficulty_hard`: Increases question complexity
- Adjusts vocabulary and sentence structure

**Bloom's Taxonomy Adjustment**
- Converts questions between Bloom's levels
- Changes verb usage (e.g., "List" → "Analyze")
- Adjusts cognitive complexity

#### Components

**QuestionVariation Model**
- Stores generated variations
- Links to original question
- Tracks generation method and metadata
- Supports verification workflow

**QuestionVariationService**
- `generate_paraphrase_variation()`: Create paraphrase
- `generate_difficulty_variation()`: Adjust difficulty
- `generate_bloom_variation()`: Adjust Bloom's level
- `generate_multiple_variations()`: Create multiple at once
- `verify_variation()`: Mark variation as verified

#### API Endpoints

**POST `/api/v1/question-nlp/variations/generate`**
```json
{
  "question_id": 123,
  "variation_types": ["paraphrase", "difficulty_easy", "difficulty_hard"]
}
```

**GET `/api/v1/question-nlp/variations/question/{question_id}`**
Get all variations for a question.

**POST `/api/v1/question-nlp/variations/{variation_id}/verify`**
Verify a generated variation.

### 4. Bloom's Taxonomy Classification

#### Technology
- **Base Model**: DistilBERT
- **Method**: Keyword analysis + complexity scoring
- **Purpose**: Auto-classify questions into Bloom's taxonomy levels

#### Classification Levels
1. **Remember**: Recall facts, terms, basic concepts
2. **Understand**: Explain ideas or concepts
3. **Apply**: Use information in new situations
4. **Analyze**: Break down and examine relationships
5. **Evaluate**: Make judgments based on criteria
6. **Create**: Produce new or original work

#### Components

**BloomTaxonomyClassifier**
- Keyword-based classification
- Text complexity analysis
- Confidence scoring
- Batch processing support

#### Features
- Keyword matching for each Bloom's level
- Complexity scoring (word count, sentence structure, etc.)
- Confidence calculation
- Automatic question database updates

#### API Endpoints

**POST `/api/v1/question-nlp/bloom-taxonomy/classify`**
```json
{
  "question_text": "Analyze the impact of climate change on coastal ecosystems."
}
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

**POST `/api/v1/question-nlp/bloom-taxonomy/batch-classify`**
```json
{
  "question_ids": [1, 2, 3, 4, 5],
  "auto_update": true
}
```

**POST `/api/v1/question-nlp/bloom-taxonomy/update/{question_id}`**
Auto-classify and update question's Bloom's level.

### 5. Hugging Face Transformers Integration

#### Models Used
- **Sentence-BERT**: all-MiniLM-L6-v2 (embedding generation)
- **DistilBERT**: distilbert-base-uncased (text classification)
- **Transformers Pipeline**: Text classification and analysis

#### Capabilities
- Semantic similarity computation
- Text classification
- Feature extraction
- Transfer learning support

### 6. Question Blueprint Generator

#### Purpose
Generate exam paper blueprints based on historical patterns and predictions.

#### Components

**QuestionBlueprint Model**
- Stores blueprint configurations
- Difficulty distribution
- Bloom's taxonomy distribution
- Question type distribution
- Chapter weightage

**QuestionBlueprintService**
- `analyze_historical_patterns()`: Analyze past papers
- `create_blueprint()`: Create custom blueprint
- `create_blueprint_from_analysis()`: Auto-generate from analysis
- `generate_question_paper_suggestions()`: Suggest questions matching blueprint

#### Features

**Historical Pattern Analysis**
- Analyzes 5-10 years of previous papers
- Calculates average marks and duration
- Determines difficulty distribution
- Analyzes Bloom's taxonomy distribution
- Computes question type distribution
- Calculates chapter-wise weightage

**Blueprint Generation**
- Auto-generates blueprints from historical data
- Manual blueprint creation support
- Customizable distributions
- Integration with topic predictions

**Question Suggestions**
- Suggests questions matching blueprint criteria
- Prioritizes high-probability topics (from predictions)
- Balances difficulty and Bloom's levels
- Ensures chapter coverage

#### API Endpoints

**POST `/api/v1/question-blueprints/analyze`**
```json
{
  "board": "cbse",
  "grade_id": 10,
  "subject_id": 5,
  "year_start": 2018,
  "year_end": 2023
}
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

**POST `/api/v1/question-blueprints/create`**
Create custom blueprint with specific distributions.

**POST `/api/v1/question-blueprints/create-from-analysis`**
```json
{
  "blueprint_name": "Physics Board Exam 2024",
  "description": "Standard physics board exam pattern",
  "board": "cbse",
  "grade_id": 10,
  "subject_id": 5,
  "year_start": 2018,
  "year_end": 2023
}
```

**GET `/api/v1/question-blueprints/`**
List all blueprints.

**GET `/api/v1/question-blueprints/{blueprint_id}`**
Get specific blueprint details.

**PUT `/api/v1/question-blueprints/{blueprint_id}`**
Update blueprint.

**DELETE `/api/v1/question-blueprints/{blueprint_id}`**
Delete blueprint.

**GET `/api/v1/question-blueprints/{blueprint_id}/suggestions?include_predictions=true`**
Get question suggestions matching blueprint criteria.

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
          "question_text": "Calculate the heat required to...",
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

## Database Schema

### question_embeddings
- `id`: Primary key
- `question_id`: Foreign key to questions_bank (unique)
- `embedding_model`: Model name (e.g., 'all-MiniLM-L6-v2')
- `embedding_vector`: JSON array of floats
- `embedding_dimension`: Vector dimension
- `created_at`, `updated_at`: Timestamps

### question_clusters
- `id`: Primary key
- `institution_id`: Foreign key to institutions
- `cluster_id`: Cluster identifier
- `grade_id`, `subject_id`: Foreign keys
- `cluster_label`: Optional label
- `cluster_size`: Number of members
- `representative_question_id`: Foreign key to questions_bank
- `centroid_vector`: JSON array
- `avg_difficulty`: Average difficulty level
- `dominant_bloom_level`: Most common Bloom's level
- `clustering_algorithm`: Algorithm name
- `clustering_metadata`: JSON metadata
- `created_at`, `updated_at`: Timestamps

### question_cluster_members
- `id`: Primary key
- `cluster_table_id`: Foreign key to question_clusters
- `question_id`: Foreign key to questions_bank
- `similarity_score`: Similarity to centroid
- `distance_to_centroid`: Euclidean distance
- `created_at`: Timestamp

### question_variations
- `id`: Primary key
- `original_question_id`: Foreign key to questions_bank
- `institution_id`: Foreign key to institutions
- `variation_text`: Variation content
- `variation_type`: Type (paraphrase, difficulty_adjusted, etc.)
- `question_type`, `difficulty_level`, `bloom_taxonomy_level`: Question attributes
- `options`, `correct_option`, `answer_text`, `explanation`: Answer data
- `similarity_score`: Similarity to original
- `generation_method`: Generation method (rule_based, ai, etc.)
- `generation_metadata`: JSON metadata
- `is_verified`, `verified_by`, `verified_at`: Verification data
- `is_active`, `usage_count`: Status fields
- `created_by`, `created_at`, `updated_at`: Audit fields

### question_blueprints
- `id`: Primary key
- `institution_id`: Foreign key to institutions
- `blueprint_name`: Blueprint name
- `description`: Optional description
- `board`, `grade_id`, `subject_id`: Exam context
- `total_marks`, `duration_minutes`: Exam parameters
- `difficulty_distribution`: JSON distribution
- `bloom_taxonomy_distribution`: JSON distribution
- `question_type_distribution`: JSON distribution
- `chapter_weightage`: JSON chapter weights
- `blueprint_metadata`: JSON metadata
- `is_active`: Active status
- `created_by`, `created_at`, `updated_at`: Audit fields

## Dependencies Added

```toml
sentence-transformers = "^2.2.2"
transformers = "^4.36.0"
torch = "^2.1.0"
hdbscan = "^0.8.33"
umap-learn = "^0.5.5"
openai = "^1.6.1"
tiktoken = "^0.5.2"
```

## Usage Examples

### 1. Generate Embeddings and Find Similar Questions
```python
# Generate embedding for a question
POST /api/v1/question-nlp/embeddings/generate?question_id=123

# Find similar questions
POST /api/v1/question-nlp/similarity/find
{
  "question_id": 123,
  "top_k": 10,
  "min_similarity": 0.75
}
```

### 2. Cluster Questions
```python
# Cluster all questions for a subject
POST /api/v1/question-nlp/clustering/cluster
{
  "grade_id": 10,
  "subject_id": 5,
  "min_cluster_size": 5,
  "min_samples": 3
}

# View cluster details
GET /api/v1/question-nlp/clustering/cluster/1
```

### 3. Generate Question Variations
```python
# Generate multiple variations
POST /api/v1/question-nlp/variations/generate
{
  "question_id": 123,
  "variation_types": ["paraphrase", "difficulty_easy", "difficulty_hard"]
}

# Verify variation
POST /api/v1/question-nlp/variations/45/verify?is_verified=true
```

### 4. Classify Bloom's Taxonomy
```python
# Classify single question
POST /api/v1/question-nlp/bloom-taxonomy/classify
{
  "question_text": "Evaluate the effectiveness of renewable energy sources."
}

# Batch classify and update
POST /api/v1/question-nlp/bloom-taxonomy/batch-classify
{
  "question_ids": [1, 2, 3, 4, 5],
  "auto_update": true
}
```

### 5. Create and Use Blueprints
```python
# Analyze historical patterns
POST /api/v1/question-blueprints/analyze
{
  "board": "cbse",
  "grade_id": 10,
  "subject_id": 5,
  "year_start": 2018,
  "year_end": 2023
}

# Create blueprint from analysis
POST /api/v1/question-blueprints/create-from-analysis
{
  "blueprint_name": "Standard Board Exam Pattern",
  "board": "cbse",
  "grade_id": 10,
  "subject_id": 5
}

# Get question suggestions
GET /api/v1/question-blueprints/1/suggestions?include_predictions=true
```

## Performance Considerations

### Embeddings
- Batch processing for efficiency (default batch_size: 32)
- Embeddings cached in database
- GPU support via PyTorch (optional)

### Clustering
- HDBSCAN scales to thousands of questions
- Incremental updates supported
- Pre-computed embeddings required

### Variations
- Rule-based generation (fast)
- AI generation support (future enhancement)

### Blueprints
- Historical analysis cached
- Query optimization with indexes
- Suggestion generation on-demand

## Future Enhancements

1. **Advanced AI Generation**
   - GPT-based question generation
   - Context-aware variations
   - Multi-language support

2. **Enhanced Clustering**
   - Hierarchical clustering
   - Topic modeling integration
   - Cluster labeling automation

3. **Blueprint Intelligence**
   - ML-based blueprint optimization
   - Adaptive difficulty balancing
   - Performance prediction

4. **Real-time Analysis**
   - Live similarity detection
   - Dynamic clustering updates
   - Streaming embeddings

## Integration with Phase 1

Phase 2 builds on Phase 1's prediction system:
- Blueprint suggestions prioritize high-probability topics
- Clustering helps identify topic patterns
- Variations enable comprehensive topic coverage
- Bloom's classification enhances prediction accuracy

## Testing

Run migrations:
```bash
alembic upgrade head
```

Install dependencies:
```bash
poetry install
```

The system is now ready for NLP-powered question analysis and blueprint generation.
