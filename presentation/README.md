# Educational SaaS Platform - Presentation Generator

This folder contains the Python script to generate a comprehensive PowerPoint presentation showcasing the Educational SaaS Platform.

## Overview

The presentation generator creates a professional PowerPoint file with detailed information about:
- Platform architecture and technology stack
- Core features organized by user role
- AI/ML capabilities and intelligent features
- Mobile app architecture with Expo Router
- Security, compliance, and deployment infrastructure
- Unique differentiators including blockchain credentials
- Future roadmap and enhancements

## Prerequisites

Install the required dependency:

```bash
# Using poetry (recommended)
poetry add python-pptx

# Using pip
pip install python-pptx
```

The dependency is already added to `pyproject.toml` in the project root.

## Usage

### Generate the Presentation

#### Option 1: Using Helper Scripts (Easiest)

**Windows (PowerShell):**
```powershell
cd presentation
.\generate.ps1
```

**Linux/Mac (Bash):**
```bash
cd presentation
chmod +x generate.sh
./generate.sh
```

The helper scripts will:
- Check Python installation
- Install python-pptx if needed
- Generate the presentation
- Display success/error messages

#### Option 2: Run Python Script Directly

From the presentation folder:
```bash
cd presentation
python create_presentation.py
```

Or from the project root:
```bash
python presentation/create_presentation.py
```

### Output

The script generates a PowerPoint file:
- **Filename**: `Educational_SaaS_Platform_Presentation.pptx`
- **Location**: Current directory where the script is run
- **Slide Count**: 15+ slides with section dividers

## Presentation Structure

### 1. Title Slide
- Platform name and tagline
- Key highlights: AI-Powered Learning, Blockchain Credentials, Mobile-First

### 2. Executive Summary
- Complete educational ecosystem
- Multi-tenant B2B2C architecture
- AI-powered intelligence
- Mobile-first design
- Enterprise security
- Cloud-native infrastructure

### 3. Platform Overview
- B2B2C SaaS architecture
- Multi-tenant data isolation
- Row-level security
- Scalability features

### 4. Technology Stack
**Backend:**
- FastAPI, MySQL, Redis, Celery
- PyTorch, Scikit-learn, Sentence Transformers
- SQLAlchemy, Alembic, Pydantic

**Frontend & Mobile:**
- React Native, Expo Router, TypeScript
- Redux Toolkit, Axios, WebSocket

### 5. Core Features by Role
- **Students**: Courses, assignments, exams, AI study buddy
- **Teachers**: Content creation, grading, analytics
- **Parents**: Progress tracking, communication, payments
- **Admins**: Institution management, reporting
- **Super Admins**: Multi-institution oversight

### 6. AI/ML Capabilities
- AI Study Buddy (GPT-4)
- Smart Homework Scanner (OCR + SymPy)
- Weakness Detection Engine
- Smart Recommendation Engine
- Predictive Analytics
- Content Intelligence

### 7. Mobile App Highlights
- Expo Router architecture
- Cross-platform (iOS, Android, Web)
- Biometric authentication
- Performance optimization (< 2MB bundle)
- Offline functionality

### 8. Security & Compliance
- JWT authentication & RBAC
- Row-level security policies
- Audit logging
- Data encryption
- GDPR compliance ready

### 9. Deployment & Infrastructure
- Docker containerization
- AWS cloud infrastructure
- CI/CD pipeline with GitLab
- Monitoring with Sentry and CloudWatch
- Auto-scaling capabilities

### 10. Unique Differentiators
- **Blockchain**: Hyperledger Fabric credentials
- **Advanced Learning**: Reverse classroom, peer tutoring
- **Content Ecosystem**: Marketplace, external integrations
- **Community**: Live events, yearbook, peer recognition
- **Analytics**: Predictive analytics, custom reports

### 11. Roadmap & Future Enhancements
- Q2 2026: Enhanced AI (essay grading, proctoring)
- Q3 2026: Video conferencing, AR learning
- Q4 2026: Advanced analytics, data warehouse
- 2027: Plugin marketplace, white-label solution

## Customization

You can customize the presentation by modifying `create_presentation.py`:

### Color Scheme
```python
PRIMARY_COLOR = RGBColor(26, 35, 126)      # Deep Blue
SECONDARY_COLOR = RGBColor(67, 160, 71)    # Green
ACCENT_COLOR = RGBColor(255, 152, 0)       # Orange
```

### Slide Dimensions
```python
self.prs.slide_width = Inches(10)
self.prs.slide_height = Inches(7.5)
```

### Content
Edit the methods in the `PresentationGenerator` class to update slide content.

## Features

- ✅ Professional color scheme (Blue, Green, Orange)
- ✅ Consistent formatting across all slides
- ✅ Section divider slides for better organization
- ✅ Two-column layouts for technical content
- ✅ Bullet points with proper hierarchy
- ✅ Placeholder support for future screenshots
- ✅ Comprehensive coverage of all platform features

## File Structure

```
presentation/
├── create_presentation.py          # Main presentation generator script
├── generate.ps1                     # Windows PowerShell helper script
├── generate.sh                      # Linux/Mac Bash helper script
├── requirements.txt                 # Python dependency (python-pptx)
├── README.md                        # This file (comprehensive guide)
├── INSTALL.md                       # Installation guide
├── IMPLEMENTATION_SUMMARY.md        # Implementation details
├── .gitkeep                         # Ensures folder is tracked in git
└── Educational_SaaS_Platform_Presentation.pptx  # Generated output (gitignored)
```

## Technical Details

### Dependencies
- **python-pptx**: Python library for creating and updating PowerPoint files
  - Version: ^0.6.21
  - Documentation: https://python-pptx.readthedocs.io/

### Slide Layouts
The script uses blank layouts (layout index 6) for maximum flexibility and custom formatting.

### Text Formatting
- Titles: 28pt, bold, white on blue background
- Headings: 14-18pt, bold, primary color
- Body text: 10-12pt, regular, dark gray
- Bullet points: Hierarchical with proper indentation

## Support

For issues or questions about the presentation generator:
1. Check the python-pptx documentation
2. Review the code comments in `create_presentation.py`
3. Refer to the main project README for platform details

## License

This presentation generator is part of the Educational SaaS Platform project.
