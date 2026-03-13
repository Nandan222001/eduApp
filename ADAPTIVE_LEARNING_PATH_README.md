# Adaptive Learning Path System - README

## 🎯 Overview

A comprehensive adaptive learning path system that provides personalized education experiences using AI predictions, student performance data, and advanced algorithms to dynamically adjust curriculum sequencing, difficulty levels, and review schedules.

## ✨ Features

### Core Capabilities

1. **Personalized Curriculum Sequencing** - AI-driven topic ordering based on prerequisites and student capability
2. **Adaptive Difficulty Progression** - Dynamic difficulty adjustment based on performance trends
3. **Spaced Repetition Scheduler** - SM-2 algorithm for optimal long-term retention
4. **Learning Velocity Tracker** - Real-time monitoring and pacing recommendations
5. **Visual Learning Paths** - Graph-based visualization with progress tracking
6. **Milestone System** - Achievement tracking with rewards and gamification

## 📦 What's Included

### Implementation Files (5)
- `src/models/learning_path.py` - Database models (9 tables)
- `src/schemas/learning_path.py` - Request/response schemas (15+ schemas)
- `src/services/learning_path_service.py` - Business logic (5 service classes)
- `src/api/v1/learning_paths.py` - REST API endpoints (21 endpoints)
- `alembic/versions/017_create_adaptive_learning_path_tables.py` - Database migration

### Documentation (5)
- `ADAPTIVE_LEARNING_PATH_IMPLEMENTATION.md` - Complete technical documentation
- `ADAPTIVE_LEARNING_PATH_QUICK_START.md` - Quick setup and usage guide
- `ADAPTIVE_LEARNING_PATH_CHECKLIST.md` - Implementation verification checklist
- `ADAPTIVE_LEARNING_PATH_FILES_CREATED.md` - File inventory and structure
- `ADAPTIVE_LEARNING_PATH_SUMMARY.md` - High-level feature summary

## 🚀 Quick Start

### 1. Run Database Migration
```bash
alembic upgrade head
```

### 2. Define Prerequisites
```bash
curl -X POST http://localhost:8000/api/v1/learning-paths/prerequisites \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "topic_id": 2,
    "prerequisite_topic_id": 1,
    "strength": 1.0,
    "is_hard_prerequisite": true
  }'
```

### 3. Generate Learning Path
```bash
curl -X POST http://localhost:8000/api/v1/learning-paths/generate \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "student_id": 1,
    "grade_id": 5,
    "topic_ids": [1, 2, 3, 4, 5],
    "include_ai_predictions": true
  }'
```

### 4. Track Progress
```bash
curl -X GET http://localhost:8000/api/v1/learning-paths/1/progress \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📊 Key Metrics

- **9 Database Tables** - Complete data model
- **21 API Endpoints** - Full REST API
- **5 Service Classes** - Clean architecture
- **5 Difficulty Levels** - Beginner to Expert
- **5 Mastery States** - Not Started to Mastered
- **2,500+ Lines of Code** - Production-ready implementation

## 🎓 Use Cases

### For Students
- Personalized learning paths adapted to individual ability
- Automatic review scheduling to prevent forgetting
- Visual progress tracking with milestones
- Gamified achievements and streak tracking

### For Teachers
- Data-driven insights on student performance
- Automated curriculum sequencing
- Early intervention alerts for struggling students
- Class-wide analytics and trends

### For Institutions
- Scalable personalization across all students
- Improved learning outcomes and retention
- Comprehensive learning analytics
- Competitive advantage in EdTech

## 🔑 Key Algorithms

### Topological Sort
Orders topics based on prerequisite dependencies while detecting circular references.

### SM-2 Spaced Repetition
Calculates optimal review intervals based on recall quality (0-5 scale):
- First review: 1 day
- Second review: 6 days
- Subsequent: interval × easiness factor

### Difficulty Adaptation
Analyzes performance trends to adjust difficulty:
- Excellent (≥90%): Increase difficulty
- Struggling (<50%): Decrease difficulty
- Target (60-75%): Maintain level

### Velocity Tracking
Monitors learning pace with metrics:
- Topics per day
- Efficiency (mastery per hour)
- Consistency score
- Pace recommendations

## 📚 Documentation Guide

| Document | Purpose | Audience |
|----------|---------|----------|
| IMPLEMENTATION.md | Technical details, API reference | Developers |
| QUICK_START.md | Setup and usage guide | All users |
| CHECKLIST.md | Verification and testing | QA/Developers |
| FILES_CREATED.md | File inventory | Developers |
| SUMMARY.md | Feature overview | Product/Business |

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│           API Layer (FastAPI)           │
│  21 REST endpoints with authentication  │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│         Service Layer (Python)          │
│  - AdaptiveLearningPathService          │
│  - DifficultyAdaptationService          │
│  - SpacedRepetitionService              │
│  - LearningVelocityService              │
│  - MasteryTrackingService               │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│       Data Layer (SQLAlchemy)           │
│  9 tables with relationships & indexes  │
└─────────────────┬───────────────────────┘
                  │
┌─────────────────▼───────────────────────┐
│      Database (PostgreSQL)              │
│  Multi-tenant with institution isolation│
└─────────────────────────────────────────┘
```

## 🔐 Security

- ✅ JWT authentication required
- ✅ Institution-level data isolation
- ✅ Input validation (Pydantic)
- ✅ SQL injection prevention (ORM)
- ✅ Student data privacy

## 🎯 API Endpoints

### Learning Paths
- `POST /learning-paths` - Create path
- `POST /learning-paths/generate` - Generate personalized
- `GET /learning-paths` - List with filters
- `GET /learning-paths/{id}` - Get details
- `PATCH /learning-paths/{id}` - Update
- `DELETE /learning-paths/{id}` - Delete

### Progress & Visualization
- `GET /learning-paths/{id}/progress` - Progress metrics
- `GET /learning-paths/{id}/visualization` - Graph data
- `POST /learning-paths/{id}/milestones` - Create milestone

### Performance
- `POST /learning-paths/mastery/update` - Update mastery
- `POST /learning-paths/performance` - Record performance

### Spaced Repetition
- `POST /learning-paths/spaced-repetition` - Create schedule
- `PATCH /learning-paths/spaced-repetition/{id}` - Update
- `GET /learning-paths/spaced-repetition/due` - Get due

### Velocity
- `POST /learning-paths/{id}/velocity/calculate` - Calculate
- `GET /learning-paths/{id}/velocity/trend` - Trend analysis

### Prerequisites
- `POST /learning-paths/prerequisites` - Create
- `GET /learning-paths/prerequisites/{id}` - Get
- `DELETE /learning-paths/prerequisites/{id}` - Delete

## 📈 Success Metrics

Track these KPIs:
- Path completion rates
- Average mastery scores
- Review completion percentages
- Velocity consistency
- Milestone achievement rates
- Difficulty adaptation frequency

## 🔧 Configuration

All configuration is managed through environment variables in `.env`:

```bash
# Database (required)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=your_db
DATABASE_USER=your_user
DATABASE_PASSWORD=your_password

# Redis (required for caching)
REDIS_HOST=localhost
REDIS_PORT=6379

# Authentication (required)
SECRET_KEY=your_secret_key
ALGORITHM=HS256
```

## 🧪 Testing

Run tests after implementation:

```bash
# Unit tests
pytest tests/unit/test_learning_path_service.py

# Integration tests
pytest tests/integration/test_learning_path_api.py

# Full test suite
pytest tests/
```

## 🚢 Deployment

### Prerequisites
- Python 3.11+
- PostgreSQL 12+
- Redis 5+
- Poetry or pip

### Steps
1. Install dependencies: `poetry install`
2. Configure environment: `cp .env.example .env`
3. Run migration: `alembic upgrade head`
4. Start server: `uvicorn src.main:app --reload`
5. Verify endpoints: `http://localhost:8000/docs`

## 🐛 Troubleshooting

### Topics Not Unlocking
**Problem**: Topics remain locked after completing prerequisites  
**Solution**: Verify all prerequisites are MASTERED (90%+ mastery score)

### Reviews Not Appearing  
**Problem**: No reviews showing in due list  
**Solution**: Ensure topics reached MASTERED level to trigger schedule creation

### Difficulty Not Adapting
**Problem**: Difficulty level not changing  
**Solution**: Record at least 3 performance data points for trend analysis

### Velocity Seems Incorrect
**Problem**: Velocity calculation appears wrong  
**Solution**: Check that completion timestamps are set and period is appropriate (default 7 days)

## 📞 Support

For assistance:
1. Review documentation files (see Documentation Guide above)
2. Check API documentation at `/docs` endpoint
3. Examine service layer code for business logic
4. Verify database migration completed successfully

## 🎯 Next Steps

1. **Integrate Front-end**: Build visualization UI using API data
2. **Configure Notifications**: Set up alerts for due reviews
3. **Train Users**: Educate teachers and students on system
4. **Monitor Metrics**: Track adoption and effectiveness
5. **Iterate**: Gather feedback and refine

## 🏆 Benefits

### Student Benefits
- Personalized learning at their own pace
- No skipping critical prerequisites
- Optimal retention through spaced repetition
- Clear progress visualization
- Gamified achievements

### Teacher Benefits
- Automated curriculum sequencing
- Early intervention indicators
- Data-driven insights
- Time savings on path creation
- Class-wide analytics

### Institution Benefits
- Scalable personalization
- Improved learning outcomes
- Comprehensive analytics
- Competitive differentiation
- Future-ready EdTech platform

## 📜 License

This implementation follows the project's existing license terms.

## 🙏 Acknowledgments

Built using:
- FastAPI 0.109+
- SQLAlchemy 2.0
- Pydantic 2.0
- PostgreSQL
- Redis

Algorithms:
- SM-2 Spaced Repetition (Piotr Woźniak, 1987)
- Topological Sort (Kahn's Algorithm)

---

**Version**: 1.0.0  
**Status**: Production Ready ✅  
**Last Updated**: 2024-01-15

For detailed documentation, see the individual documentation files listed in the Documentation Guide section.
