# Student Elections - Quick Start Guide

## Files Created/Modified

### Frontend Pages
1. `frontend/src/pages/StudentElections.tsx` - Main student election interface
2. `frontend/src/pages/CampaignManager.tsx` - Campaign management hub
3. `frontend/src/pages/ElectionResults.tsx` - Results visualization
4. `frontend/src/pages/ElectionAdministration.tsx` - Admin panel

### Frontend Types & API
5. `frontend/src/types/elections.ts` - TypeScript interfaces
6. `frontend/src/api/elections.ts` - API client

### Backend (Already Exists)
7. `src/models/elections.py` - Database models ✅
8. `src/api/v1/elections.py` - API endpoints ✅
9. `src/schemas/elections.py` - Pydantic schemas ✅

### Configuration
10. `frontend/package.json` - Added react-confetti dependency

### Documentation
11. `STUDENT_ELECTIONS_IMPLEMENTATION.md` - Full documentation
12. `STUDENT_ELECTIONS_QUICKSTART.md` - This file

## Installation

### Step 1: Install Frontend Dependencies
```bash
cd frontend
npm install react-confetti
```

### Step 2: Run Database Migrations
```bash
alembic upgrade head
```

### Step 3: Start Development Servers
```bash
# Backend
uvicorn src.main:app --reload

# Frontend
cd frontend
npm run dev
```

## Quick Feature Overview

### For Students
- **View Elections**: See upcoming elections and deadlines
- **View Candidates**: Browse candidate profiles, platforms, and videos
- **Compare Candidates**: Side-by-side comparison of up to 3 candidates
- **Vote**: Cast secure, anonymous votes (simple or ranked choice)
- **View Results**: See election outcomes with visualizations

### For Candidates
- **Manage Profile**: Edit campaign statement and slogan
- **Build Platform**: Add/edit campaign promises and goals
- **Upload Materials**: Add campaign posters and videos
- **Track Analytics**: View profile views, endorsements, and engagement
- **Collect Endorsements**: Receive support from peers

### For Administrators
- **Create Elections**: Set up new elections with full configuration
- **Approve Candidates**: Review and approve nominations
- **Monitor Voting**: Track real-time voting statistics
- **Publish Results**: Calculate and announce winners
- **Manage Timeline**: Control election phases and status

## Key Features

### Security & Privacy ✅
- **Vote Anonymity**: Cryptographic hashing separates voter from vote
- **Duplicate Prevention**: Voter registry tracks voting status
- **Encrypted Storage**: Votes encrypted before database storage
- **Verification Codes**: Unique codes for vote confirmation
- **Audit Trail**: IP, timestamp, and user agent logging

### Voting Methods ✅
- **Simple Voting**: One vote per voter
- **Ranked Choice**: Rank up to 3 candidates by preference
- **Point System**: 1st choice = 3 pts, 2nd = 2 pts, 3rd = 1 pt

### Campaign Tools ✅
- **Profile Editor**: Craft compelling campaign statements
- **Platform Builder**: Articulate policy positions
- **Media Upload**: Posters and videos up to 3 minutes
- **Template Library**: Pre-designed poster templates
- **Analytics Dashboard**: Real-time engagement metrics

### Results Visualization ✅
- **Confetti Animation**: Celebratory winner announcement
- **Multiple Charts**: Pie, doughnut, and bar charts
- **Demographics**: Breakdown by grade and gender
- **Voter Turnout**: Percentage and absolute numbers
- **Round Details**: Ranked choice elimination rounds

## API Endpoints Overview

### Elections
- `POST /institutions/{id}/elections` - Create
- `GET /institutions/{id}/elections` - List
- `GET /institutions/{id}/elections/{id}` - Get details
- `PUT /institutions/{id}/elections/{id}` - Update
- `DELETE /institutions/{id}/elections/{id}` - Delete

### Candidates
- `POST /institutions/{id}/candidates` - Nominate
- `GET /institutions/{id}/elections/{id}/candidates` - List
- `GET /institutions/{id}/candidates/{id}` - Get details
- `PUT /institutions/{id}/candidates/{id}` - Update
- `POST /institutions/{id}/candidates/{id}/approve` - Approve/Reject
- `POST /institutions/{id}/candidates/{id}/withdraw` - Withdraw

### Voting
- `POST /institutions/{id}/votes` - Cast vote
- `GET /institutions/{id}/elections/{id}/has-voted` - Check status

### Results
- `GET /institutions/{id}/elections/{id}/results` - Get results
- `POST /institutions/{id}/elections/{id}/publish-results` - Publish

### Analytics
- `GET /institutions/{id}/candidates/{id}/analytics` - Campaign analytics
- `POST /institutions/{id}/candidates/{id}/view` - Record profile view

## Component Structure

```
StudentElections (Main UI)
├── Election Calendar Tab
│   └── Upcoming elections and deadlines
├── Elections Tab
│   ├── Election cards
│   ├── Candidate profiles
│   ├── Comparison tool
│   └── Voting booth
└── Dialogs
    ├── Election details
    ├── Candidate profile
    ├── Voting interface
    └── Comparison view

CampaignManager (Candidate Hub)
├── Profile Editor Tab
├── Platform Builder Tab
├── Poster Upload Tab
├── Video Upload Tab
├── Endorsements Tab
└── Analytics Tab

ElectionResults (Results Display)
├── Winner Announcement
├── Results Tab
│   └── Candidate standings
├── Vote Breakdown Tab
│   ├── Pie chart
│   └── Doughnut chart
├── Demographics Tab
│   ├── By grade
│   └── By gender
└── Rounds Tab (if ranked choice)

ElectionAdministration (Admin Panel)
├── Elections Tab
│   └── Election list and actions
├── Candidates Tab
│   ├── Pending approval
│   └── Approved candidates
└── Monitoring Tab
    └── Statistics dashboard
```

## Database Schema

```
elections
├── id, institution_id, created_by
├── title, description, position
├── dates (nomination, campaign, voting)
├── status, voting_method
└── configuration options

candidates
├── id, election_id, student_id
├── campaign_statement, platform_points
├── poster_url, video_url, slogan
├── status, approvals
└── endorsements (JSON)

votes
├── id, election_id, voter_student_id
├── candidate_id, rank_position
├── encrypted_vote, vote_hash, voter_hash
├── verification_code, timestamp
└── ip_address, user_agent

voter_registry
├── id, election_id, student_id
├── voter_token, has_voted
└── voted_at, is_eligible

election_results
├── id, election_id, candidate_id
├── votes (total, first, second, third)
├── points, percentage, rank
└── is_winner, rounds_data
```

## Common Use Cases

### Use Case 1: Create and Run Election
```typescript
// 1. Admin creates election
POST /elections/
{
  title: "Student Body President 2024",
  position: "President",
  voting_method: "ranked_choice",
  ...dates
}

// 2. Students nominate themselves
POST /candidates/
{
  election_id: 1,
  student_id: 42,
  campaign_statement: "..."
}

// 3. Admin approves candidates
POST /candidates/{id}/approve
{ candidate_status: "approved" }

// 4. Students vote
POST /votes/
{
  election_id: 1,
  ranked_choices: [
    { candidate_id: 5, rank: 1 },
    { candidate_id: 3, rank: 2 }
  ]
}

// 5. Admin publishes results
POST /elections/{id}/publish-results
```

### Use Case 2: Build Campaign
```typescript
// 1. Update profile
PUT /candidates/{id}
{
  campaign_statement: "...",
  platform_points: ["...", "..."],
  slogan: "..."
}

// 2. Upload poster
POST /candidates/{id}/poster
FormData { file: posterFile }

// 3. Upload video
POST /candidates/{id}/video
FormData { file: videoFile }

// 4. View analytics
GET /candidates/{id}/analytics
```

## Security Best Practices

### Vote Anonymity
```python
# Vote Hash (unique per vote)
vote_hash = sha256(f"{election_id}:{candidate_id}:{timestamp}:{random}")

# Voter Hash (unique per voter per election)
voter_hash = sha256(f"{student_id}:{election_id}:{random}")

# Encrypted Vote (stored in database)
encrypted = sha256(f"{candidate_id}:{salt}")
```

### Verification
- Each vote gets a verification code
- Student can verify vote was counted
- Cannot see which candidate they voted for
- Maintains secret ballot requirement

## Configuration Options

### Election Settings
```typescript
{
  voting_method: "simple" | "ranked_choice",
  max_ranking_choices: 3,
  require_campaign_materials: true,
  allow_write_ins: false,
  max_candidates: 10,
  min_candidates: 2,
  eligible_voters_grade_ids: [9, 10, 11, 12]
}
```

### Candidate Requirements
- Campaign statement: 500-1000 characters
- Platform points: Unlimited
- Slogan: Max 100 characters
- Poster: Image file (recommended 1080x1920)
- Video: Max 3 minutes

## Troubleshooting

### Issue: Cannot vote
**Check**:
- Is voting period open?
- Are you eligible for this election?
- Have you already voted?
- Is your student profile active?

### Issue: Candidate not approved
**Check**:
- Election status (nominations must be open)
- Campaign materials completeness
- Admin approval pending

### Issue: Results not showing
**Check**:
- Election status (must be completed)
- Results published by admin
- Sufficient votes cast

## Performance Tips

### For Large Elections
- Enable pagination for candidate lists
- Cache frequently accessed data
- Use lazy loading for images/videos
- Implement debouncing for search

### For Real-Time Updates
- WebSocket connections for live results
- Polling with exponential backoff
- Server-sent events for notifications
- Optimistic UI updates

## Next Steps

1. ✅ Install dependencies
2. ✅ Run migrations
3. ✅ Start development servers
4. 🔄 Create test election
5. 🔄 Test nomination workflow
6. 🔄 Test voting process
7. 🔄 Verify results calculation
8. 🔄 Review security measures
9. 🔄 Deploy to production

## Additional Resources

- Full Documentation: `STUDENT_ELECTIONS_IMPLEMENTATION.md`
- API Docs: `/docs` (Swagger UI)
- Models: `src/models/elections.py`
- API Endpoints: `src/api/v1/elections.py`
- Frontend Types: `frontend/src/types/elections.ts`

## Support Contacts

For technical issues or questions:
- Check documentation first
- Review code comments
- Consult API documentation
- Contact development team

---

**Status**: ✅ Implementation Complete
**Version**: 1.0.0
**Last Updated**: 2024
