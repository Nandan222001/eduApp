# AI Prediction Dashboard - Quick Start Guide

## 🚀 Getting Started

### Prerequisites
- Backend server running (FastAPI)
- Frontend development server running (React)
- Database with topic predictions data
- Redis server for caching

### Access the Dashboard

1. **Login as Student**
   - Navigate to `/login`
   - Login with student credentials
   - Email must be verified

2. **Navigate to AI Prediction Dashboard**
   - Click "AI Exam Prediction" in the sidebar
   - Or navigate to `/student/ai-prediction`

## 📊 Dashboard Features

### 1. Topic Probability Rankings

**View topic predictions:**
- See all topics ranked by probability score
- Check star ratings (1-5 stars)
- View percentage bars for visual probability
- Identify priority topics with color-coded tags
- Check confidence levels

**Key Metrics:**
- Rank position
- Probability score (0-100%)
- Expected marks
- Study hours recommended
- Frequency count
- Last appeared year

### 2. Question Paper Blueprint

**Explore predicted paper structure:**
- Click sections to expand details
- View question types per section
- Check difficulty distribution
- See Bloom's taxonomy levels
- Review topic coverage

**Information Available:**
- Total marks and duration
- Number of sections
- Topics in each section
- Mark distribution

### 3. Study Plan Timeline

**Generate personalized plan:**

1. Select exam date using date picker
2. Enter available study hours per day (0.5-12 hours)
3. Click "Generate Plan"

**Features:**
- Weekly breakdown
- Daily tasks with descriptions
- Task completion checkboxes
- Focus topics per week
- Milestone dates
- Progress tracking

**Task Management:**
- Check off completed tasks
- Track completion percentage
- View task types (study, practice, revision, test)
- See priority levels

### 4. What-If Scenario Simulator

**Run simulations:**

1. Adjust study hours slider (-5 to +10 hours/day)
2. Set practice test count (0-20 tests)
3. Optionally select focus topics
4. Click "Simulate Scenario"

**Results:**
- Current predicted score
- Projected score after adjustments
- Score improvement
- Prediction changes for metrics
- Recommendations
- Risk factors

**Use Cases:**
- "What if I study 2 more hours daily?"
- "What if I take 10 practice tests?"
- "What if I focus only on high-priority topics?"

### 5. Crash Course Mode

**Activate for last-minute preparation:**

1. Enter days until exam (1-30 days)
2. Click "Activate Mode"

**What You Get:**
- High-ROI priority topics
- Daily intensive schedule (8 hours/day)
  - Morning: 8 AM - 12 PM (3 hours)
  - Afternoon: 1 PM - 5 PM (3 hours)
  - Evening: 6 PM - 8 PM (2 hours)
- Quick wins for fast scoring
- Topics to skip (low ROI)
- Expected score range
- Estimated coverage percentage

**Perfect For:**
- Exam in 1-2 weeks
- Last-minute preparation
- Quick revision
- Maximizing score in limited time

## 📈 Charts and Visualizations

### Marks Distribution Pie Chart
- Shows expected marks by probability category
- Color-coded segments
- Percentage labels

### Study Time Allocation Donut Chart
- Displays time distribution across priorities
- Hour allocations
- Category descriptions

## 🎯 Best Practices

### For Maximum Benefit:

1. **Regular Updates**
   - Check dashboard weekly
   - Update completed tasks
   - Adjust study plan as needed

2. **Topic Prioritization**
   - Focus on "MUST STUDY" topics first
   - Don't ignore medium priority topics
   - Track topics marked "OVERDUE"

3. **Study Plan Adherence**
   - Follow generated timeline
   - Complete daily tasks
   - Hit milestone dates

4. **Use What-If Simulator**
   - Before making study changes
   - To optimize time allocation
   - To understand impact of decisions

5. **Crash Course Mode**
   - Activate 1-2 weeks before exam
   - Follow intensive schedule
   - Focus on quick wins

## 🔍 Understanding Metrics

### Probability Score
- **80-100%**: Very High - Almost certain to appear
- **65-79%**: High - Likely to appear
- **50-64%**: Medium - May appear
- **35-49%**: Low - Less likely
- **0-34%**: Very Low - Unlikely

### Priority Tags
- **MUST STUDY**: Critical topics, high probability + due
- **VERY HIGH**: 80%+ probability
- **HIGH**: 65-79% probability
- **MEDIUM**: 50-64% probability
- **OVERDUE**: Not appeared for 5+ years
- **LOW**: <50% probability

### Confidence Levels
- **Very High**: Strong historical pattern, frequent appearances
- **High**: Good pattern, consistent appearances
- **Medium**: Moderate pattern, some variance
- **Low**: Weak pattern, limited data

### Star Ratings
- ⭐⭐⭐⭐⭐ (5 stars): 85%+ probability
- ⭐⭐⭐⭐ (4 stars): 70-84% probability
- ⭐⭐⭐ (3 stars): 55-69% probability
- ⭐⭐ (2 stars): 40-54% probability
- ⭐ (1 star): <40% probability

## 💡 Tips and Tricks

### Topic Rankings
- Sort by different columns (rank, probability, marks)
- Look for warning icons (⚠️) for due topics
- Check both probability and expected marks

### Study Plan
- Start early for better distribution
- Adjust hours per day based on capacity
- Mark weak areas for focused planning
- Use checkboxes to track progress

### What-If Simulator
- Try different scenarios
- Compare projections
- Follow recommendations
- Heed risk factors

### Crash Course
- Use only in urgent situations
- Follow schedule strictly
- Focus on quick wins first
- Skip low-ROI topics

## 🎨 Color Coding Guide

### Priority Colors
- 🔴 Red: Critical/Must Study
- 🟠 Orange: High Priority
- 🟡 Yellow: Medium Priority
- 🔵 Blue: Low Priority

### Task Types
- 🟣 Purple: Study new topic
- 🔵 Blue: Practice questions
- 🟡 Yellow: Revision
- 🔴 Red: Take test

## 📱 Navigation

### Tabs
1. **Topic Rankings**: Main predictions table
2. **Question Blueprint**: Paper structure prediction
3. **Study Plan**: Generate personalized timeline
4. **What-If Simulator**: Run scenarios
5. **Crash Course**: Last-minute mode

### Filters
- **Board**: CBSE, ICSE, State Board
- **Grade**: 10, 12
- **Subject**: Mathematics, Science, English, etc.

## ❓ Troubleshooting

### No Predictions Showing
- Ensure predictions are generated for your subject
- Check filter selections (board, grade, subject)
- Contact admin if data is missing

### Study Plan Not Generating
- Verify exam date is in the future
- Check study hours (0.5-12 range)
- Ensure predictions exist

### What-If Results Unexpected
- Review adjustments made
- Consider recommendations
- Try different parameters

### Crash Course Not Activating
- Check days until exam (1-30 range)
- Ensure predictions available
- Verify sufficient topic data

## 📞 Support

For issues or questions:
- Contact your teacher
- Reach out to institution admin
- Check documentation

## 🎓 Example Workflow

### 60 Days Before Exam

1. Open AI Prediction Dashboard
2. Select your subject
3. Review topic rankings
4. Generate study plan (4 hours/day)
5. Follow weekly schedule
6. Check off completed tasks

### 30 Days Before Exam

1. Review progress (50%+ completion)
2. Run what-if scenario
3. Adjust study hours if needed
4. Focus on high-priority topics
5. Take practice tests

### 7 Days Before Exam

1. Activate crash course mode
2. Follow intensive schedule
3. Focus on quick wins
4. Skip low-ROI topics
5. Take final mock tests

## 🌟 Success Tips

1. **Start Early**: Don't wait until last minute
2. **Be Consistent**: Daily study is key
3. **Track Progress**: Use checkboxes
4. **Adapt**: Adjust plan based on performance
5. **Practice**: Take practice tests
6. **Revise**: Regular revision prevents forgetting
7. **Stay Healthy**: Balance study with rest

---

**Happy Studying! 🎉**

Your AI-powered companion for exam success!
