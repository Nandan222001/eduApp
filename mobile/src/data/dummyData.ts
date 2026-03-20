import {
  User,
  TokenResponse,
  RoleInfo,
  InstitutionInfo,
} from '../types/auth';
import {
  Assignment,
  StudentStats,
  AIPrediction,
  WeakArea,
  Subject,
  Achievement,
} from '../types/student';
import {
  AttendanceSummary,
  AttendanceHistory,
} from '../types/attendance';
import {
  ExamResult as StudentExamResult,
  Exam,
} from '../types/examinations';
import {
  Points,
  Badge,
  Leaderboard,
  Streak,
  GamificationStats,
} from '../types/gamification';
import {
  Child,
  ChildStats,
  TodayAttendance,
  Grade,
  Assignment as ParentAssignment,
  FeePayment,
  TeacherMessage,
  Announcement,
  AttendanceCalendar,
  SubjectAttendance as ParentSubjectAttendance,
  ExamResult as ParentExamResult,
  SubjectPerformance,
} from '../types/parent';

export interface DemoUser {
  email: string;
  password: string;
  user: User;
  tokens: TokenResponse;
}

const demoInstitution: InstitutionInfo = {
  id: 1,
  name: 'Springfield Academy',
  slug: 'springfield-academy',
};

const studentRole: RoleInfo = {
  id: 3,
  name: 'Student',
  slug: 'student',
};

const parentRole: RoleInfo = {
  id: 4,
  name: 'Parent',
  slug: 'parent',
};

export const demoStudentUser: DemoUser = {
  email: 'demo@example.com',
  password: 'Demo@123',
  user: {
    id: 1001,
    email: 'demo@example.com',
    username: 'demo_student',
    first_name: 'Alex',
    last_name: 'Johnson',
    phone: '+1234567890',
    institution_id: 1,
    role_id: 3,
    is_active: true,
    is_superuser: false,
    email_verified: true,
    last_login: new Date().toISOString(),
    permissions: ['view_profile', 'view_assignments', 'submit_assignment', 'view_grades', 'view_attendance'],
    role: studentRole,
    institution: demoInstitution,
  },
  tokens: {
    access_token: 'demo_student_access_token_' + Date.now(),
    refresh_token: 'demo_student_refresh_token_' + Date.now(),
    token_type: 'Bearer',
  },
};

export const demoParentUser: DemoUser = {
  email: 'parent@demo.com',
  password: 'Demo@123',
  user: {
    id: 2001,
    email: 'parent@demo.com',
    username: 'demo_parent',
    first_name: 'Sarah',
    last_name: 'Johnson',
    phone: '+1234567891',
    institution_id: 1,
    role_id: 4,
    is_active: true,
    is_superuser: false,
    email_verified: true,
    last_login: new Date().toISOString(),
    permissions: ['view_children', 'view_attendance', 'view_grades', 'view_fees', 'communicate_teachers'],
    role: parentRole,
    institution: demoInstitution,
  },
  tokens: {
    access_token: 'demo_parent_access_token_' + Date.now(),
    refresh_token: 'demo_parent_refresh_token_' + Date.now(),
    token_type: 'Bearer',
  },
};

export const studentProfile = {
  id: 1001,
  first_name: 'Alex',
  last_name: 'Johnson',
  firstName: 'Alex',
  lastName: 'Johnson',
  photo_url: 'https://i.pravatar.cc/300?img=12',
  profilePhoto: 'https://i.pravatar.cc/300?img=12',
  email: 'demo@example.com',
  phone: '+1234567890',
  grade: '10th Grade',
  class: '10-A',
  class_name: '10-A',
  rollNumber: 'SA-2024-1001',
  roll_number: 'SA-2024-1001',
  date_of_birth: '2009-05-15',
  address: '123 Main Street, Springfield',
  parent_name: 'Sarah Johnson',
  parent_phone: '+1234567891',
  admission_date: '2019-04-01',
  blood_group: 'A+',
};

export const studentStats: StudentStats = {
  attendance_percentage: 80,
  total_courses: 8,
  pending_assignments: 2,
  average_grade: 85.5,
  streak_days: 7,
  points: 2450,
  level: 5,
};

const getDateDaysFromNow = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
};

const getDateDaysAgo = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

export const assignments: Assignment[] = [
  {
    id: 1,
    title: 'Quadratic Equations - Problem Set',
    description: 'Solve problems 1-25 from Chapter 4. Show all work and explanations.',
    subject: 'Mathematics',
    subject_id: 101,
    due_date: getDateDaysFromNow(2),
    dueDate: getDateDaysFromNow(2),
    max_score: 100,
    status: 'pending',
    attachments: ['https://example.com/math_ch4.pdf'],
  },
  {
    id: 2,
    title: 'Photosynthesis Lab Report',
    description: 'Write a detailed lab report on the photosynthesis experiment conducted in class.',
    subject: 'Biology',
    subject_id: 102,
    due_date: getDateDaysFromNow(5),
    dueDate: getDateDaysFromNow(5),
    max_score: 50,
    status: 'pending',
  },
  {
    id: 3,
    title: 'World War II Essay',
    description: 'Write a 1000-word essay on the causes and effects of World War II.',
    subject: 'History',
    subject_id: 103,
    due_date: getDateDaysAgo(1),
    dueDate: getDateDaysAgo(1),
    max_score: 100,
    status: 'overdue',
    submission_date: getDateDaysAgo(2),
    score: 88,
    grade_letter: 'A',
    feedback: 'Excellent analysis of historical events. Well-structured arguments.',
  },
  {
    id: 4,
    title: 'Shakespeare Analysis',
    description: 'Analyze the themes in Romeo and Juliet Act 3.',
    subject: 'English Literature',
    subject_id: 104,
    due_date: getDateDaysAgo(7),
    dueDate: getDateDaysAgo(7),
    max_score: 75,
    status: 'graded',
    submission_date: getDateDaysAgo(8),
    score: 68,
    grade_letter: 'B',
    feedback: 'Good understanding of themes. Could improve on textual evidence.',
  },
  {
    id: 5,
    title: 'Chemical Reactions Worksheet',
    description: 'Complete the balancing equations worksheet.',
    subject: 'Chemistry',
    subject_id: 105,
    due_date: getDateDaysAgo(14),
    dueDate: getDateDaysAgo(14),
    max_score: 40,
    status: 'graded',
    submission_date: getDateDaysAgo(15),
    score: 38,
    grade_letter: 'A',
    feedback: 'Excellent work! All equations balanced correctly.',
  },
  {
    id: 6,
    title: 'Python Programming Project',
    description: 'Create a simple calculator application using Python.',
    subject: 'Computer Science',
    subject_id: 106,
    due_date: getDateDaysFromNow(10),
    dueDate: getDateDaysFromNow(10),
    max_score: 100,
    status: 'pending',
    attachments: ['https://example.com/python_project_guidelines.pdf'],
  },
];

export const subjects: Subject[] = [
  { id: 101, name: 'Mathematics', code: 'MATH-10', teacher_name: 'Dr. Robert Brown', material_count: 45 },
  { id: 102, name: 'Biology', code: 'BIO-10', teacher_name: 'Ms. Emily Davis', material_count: 38 },
  { id: 103, name: 'History', code: 'HIST-10', teacher_name: 'Mr. James Wilson', material_count: 52 },
  { id: 104, name: 'English Literature', code: 'ENG-10', teacher_name: 'Mrs. Patricia Moore', material_count: 41 },
  { id: 105, name: 'Chemistry', code: 'CHEM-10', teacher_name: 'Dr. Michael Taylor', material_count: 36 },
  { id: 106, name: 'Computer Science', code: 'CS-10', teacher_name: 'Mr. David Anderson', material_count: 29 },
  { id: 107, name: 'Physics', code: 'PHY-10', teacher_name: 'Dr. Sarah Thompson', material_count: 33 },
  { id: 108, name: 'Physical Education', code: 'PE-10', teacher_name: 'Coach Mark Johnson', material_count: 12 },
];

export const attendanceSummary: AttendanceSummary = {
  totalClasses: 160,
  attendedClasses: 128,
  absentClasses: 25,
  lateClasses: 7,
  percentage: 80,
  monthlyPercentage: 85,
  todayStatus: 'present',
  subjectWiseAttendance: [
    { subjectId: 101, subjectName: 'Mathematics', totalClasses: 24, attendedClasses: 20, percentage: 83.3 },
    { subjectId: 102, subjectName: 'Biology', totalClasses: 20, attendedClasses: 16, percentage: 80 },
    { subjectId: 103, subjectName: 'History', totalClasses: 20, attendedClasses: 17, percentage: 85 },
    { subjectId: 104, subjectName: 'English Literature', totalClasses: 24, attendedClasses: 19, percentage: 79.2 },
    { subjectId: 105, subjectName: 'Chemistry', totalClasses: 20, attendedClasses: 15, percentage: 75 },
    { subjectId: 106, subjectName: 'Computer Science', totalClasses: 20, attendedClasses: 18, percentage: 90 },
    { subjectId: 107, subjectName: 'Physics', totalClasses: 20, attendedClasses: 16, percentage: 80 },
    { subjectId: 108, subjectName: 'Physical Education', totalClasses: 12, attendedClasses: 11, percentage: 91.7 },
  ],
};

const generateMonthlyAttendance = (): AttendanceHistory[] => {
  const history: AttendanceHistory[] = [];
  const statuses: ('present' | 'absent' | 'late')[] = ['present', 'present', 'present', 'present', 'absent', 'late'];
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    history.push({
      date: date.toISOString().split('T')[0],
      status,
      markedBy: 'System',
      sessions: [
        {
          id: i * 10 + 1,
          period: 1,
          subject: 'Mathematics',
          status,
          teacher: 'Dr. Robert Brown',
          startTime: '08:00',
          endTime: '08:45',
        },
        {
          id: i * 10 + 2,
          period: 2,
          subject: 'Biology',
          status,
          teacher: 'Ms. Emily Davis',
          startTime: '08:50',
          endTime: '09:35',
        },
      ],
    });
  }
  
  return history;
};

export const attendanceHistory = generateMonthlyAttendance();

export const examResults: StudentExamResult[] = [
  {
    id: 1,
    examId: 101,
    examName: 'Mid-Term Examination',
    studentId: 1001,
    subjectId: 101,
    subjectName: 'Mathematics',
    subject: 'Mathematics',
    totalMarks: 100,
    obtainedMarks: 88,
    percentage: 88,
    grade: 'A',
    rank: 5,
    classAverage: 75.5,
    highestMarks: 98,
    lowestMarks: 42,
    remarks: 'Excellent performance',
    publishedDate: getDateDaysAgo(10),
    examDate: getDateDaysAgo(10),
    sectionBreakdown: [
      { sectionName: 'Algebra', maxMarks: 40, obtainedMarks: 36, percentage: 90 },
      { sectionName: 'Geometry', maxMarks: 30, obtainedMarks: 26, percentage: 86.7 },
      { sectionName: 'Trigonometry', maxMarks: 30, obtainedMarks: 26, percentage: 86.7 },
    ],
  },
  {
    id: 2,
    examId: 102,
    examName: 'Mid-Term Examination',
    studentId: 1001,
    subjectId: 102,
    subjectName: 'Biology',
    subject: 'Biology',
    totalMarks: 100,
    obtainedMarks: 82,
    percentage: 82,
    grade: 'A',
    rank: 8,
    classAverage: 71.2,
    highestMarks: 95,
    lowestMarks: 38,
    remarks: 'Good work',
    publishedDate: getDateDaysAgo(10),
    examDate: getDateDaysAgo(10),
    sectionBreakdown: [
      { sectionName: 'Cell Biology', maxMarks: 50, obtainedMarks: 43, percentage: 86 },
      { sectionName: 'Ecology', maxMarks: 50, obtainedMarks: 39, percentage: 78 },
    ],
  },
  {
    id: 3,
    examId: 103,
    examName: 'Mid-Term Examination',
    studentId: 1001,
    subjectId: 105,
    subjectName: 'Chemistry',
    subject: 'Chemistry',
    totalMarks: 100,
    obtainedMarks: 85,
    percentage: 85,
    grade: 'A',
    rank: 6,
    classAverage: 72.8,
    highestMarks: 96,
    lowestMarks: 45,
    remarks: 'Very good understanding of concepts',
    publishedDate: getDateDaysAgo(10),
    examDate: getDateDaysAgo(10),
    sectionBreakdown: [
      { sectionName: 'Organic Chemistry', maxMarks: 50, obtainedMarks: 44, percentage: 88 },
      { sectionName: 'Inorganic Chemistry', maxMarks: 50, obtainedMarks: 41, percentage: 82 },
    ],
  },
];

export const upcomingExams: Exam[] = [
  {
    id: 201,
    name: 'Final Examination',
    description: 'End of semester final exam',
    examType: 'final',
    startDate: getDateDaysFromNow(15),
    endDate: getDateDaysFromNow(20),
    duration: 180,
    totalMarks: 100,
    passingMarks: 40,
    subjectId: 101,
    subjectName: 'Mathematics',
    classId: 10,
    className: '10-A',
    status: 'upcoming',
    venue: 'Main Hall',
    instructions: 'Bring scientific calculator. No mobile phones allowed.',
    syllabusTopics: ['Quadratic Equations', 'Trigonometry', 'Coordinate Geometry', 'Statistics'],
    createdAt: getDateDaysAgo(30),
  },
  {
    id: 202,
    name: 'Final Examination',
    description: 'End of semester final exam',
    examType: 'final',
    startDate: getDateDaysFromNow(16),
    endDate: getDateDaysFromNow(20),
    duration: 180,
    totalMarks: 100,
    passingMarks: 40,
    subjectId: 102,
    subjectName: 'Biology',
    classId: 10,
    className: '10-A',
    status: 'upcoming',
    venue: 'Science Lab',
    instructions: 'Bring pencils for diagrams.',
    syllabusTopics: ['Cell Biology', 'Genetics', 'Evolution', 'Ecology'],
    createdAt: getDateDaysAgo(30),
  },
];

export const aiPredictions: AIPrediction[] = [
  {
    subject: 'Mathematics',
    predicted_grade: 90,
    predictedPercentage: 90,
    confidence: 0.85,
    trend: 'improving',
    nextMilestone: {
      target: 95,
      daysRemaining: 15,
    },
  },
  {
    subject: 'Biology',
    predicted_grade: 83,
    predictedPercentage: 83,
    confidence: 0.78,
    trend: 'stable',
  },
  {
    subject: 'Chemistry',
    predicted_grade: 86,
    predictedPercentage: 86,
    confidence: 0.82,
    trend: 'improving',
  },
  {
    subject: 'History',
    predicted_grade: 80,
    predictedPercentage: 80,
    confidence: 0.75,
    trend: 'stable',
  },
  {
    subject: 'English Literature',
    predicted_grade: 78,
    predictedPercentage: 78,
    confidence: 0.70,
    trend: 'declining',
  },
];

export const weakAreas: WeakArea[] = [
  {
    id: 1,
    subject: 'Mathematics',
    topic: 'Trigonometric Identities',
    score_percentage: 65,
    score: 65,
    recommendation: 'Practice more problems on trigonometric identities and memorize key formulas.',
    difficulty: 'hard',
    recommendedResources: 5,
  },
  {
    id: 2,
    subject: 'English Literature',
    topic: 'Literary Analysis',
    score_percentage: 68,
    score: 68,
    recommendation: 'Focus on analyzing themes and literary devices in texts.',
    difficulty: 'medium',
    recommendedResources: 3,
  },
  {
    id: 3,
    subject: 'Chemistry',
    topic: 'Organic Reactions',
    score_percentage: 72,
    score: 72,
    recommendation: 'Review reaction mechanisms and practice naming compounds.',
    difficulty: 'medium',
    recommendedResources: 4,
  },
  {
    id: 4,
    subject: 'Physics',
    topic: 'Electromagnetic Induction',
    score_percentage: 70,
    score: 70,
    recommendation: 'Review Faraday\'s and Lenz\'s laws with practical examples.',
    difficulty: 'hard',
    recommendedResources: 6,
  },
];

export const focusAreas = {
  high_priority: [
    { topic: 'Trigonometric Identities', subject: 'Mathematics', proficiency: 65 },
    { topic: 'Literary Analysis', subject: 'English Literature', proficiency: 68 },
  ],
  medium_priority: [
    { topic: 'Organic Reactions', subject: 'Chemistry', proficiency: 72 },
    { topic: 'World War Causes', subject: 'History', proficiency: 75 },
  ],
  low_priority: [
    { topic: 'Cell Division', subject: 'Biology', proficiency: 82 },
  ],
};

export const topicProbabilities = {
  mathematics: {
    'Quadratic Equations': 0.92,
    'Trigonometry': 0.88,
    'Coordinate Geometry': 0.85,
    'Statistics': 0.79,
    'Probability': 0.82,
  },
  biology: {
    'Cell Biology': 0.86,
    'Genetics': 0.81,
    'Evolution': 0.78,
    'Ecology': 0.84,
  },
  chemistry: {
    'Organic Chemistry': 0.88,
    'Inorganic Chemistry': 0.82,
    'Physical Chemistry': 0.79,
  },
};

export const gamificationPoints: Points = {
  totalPoints: 2450,
  currentLevel: 5,
  levelName: 'Scholar',
  pointsToNextLevel: 550,
  pointsInCurrentLevel: 450,
  pointsRequiredForNextLevel: 1000,
  recentActivities: [
    {
      id: 1,
      activityType: 'assignment_submitted',
      description: 'Submitted World War II Essay',
      pointsEarned: 50,
      timestamp: getDateDaysAgo(2),
    },
    {
      id: 2,
      activityType: 'perfect_attendance',
      description: 'Perfect attendance this week',
      pointsEarned: 100,
      timestamp: getDateDaysAgo(3),
    },
    {
      id: 3,
      activityType: 'high_grade',
      description: 'Scored 88% in Math exam',
      pointsEarned: 80,
      timestamp: getDateDaysAgo(10),
    },
    {
      id: 4,
      activityType: 'streak_bonus',
      description: '7-day login streak',
      pointsEarned: 70,
      timestamp: getDateDaysAgo(1),
    },
  ],
};

export const badges: Badge[] = [
  {
    id: 1,
    name: 'Perfect Week',
    description: 'Attended all classes for a week',
    icon: 'medal',
    category: 'attendance',
    rarity: 'rare',
    earnedAt: getDateDaysAgo(3),
    isEarned: true,
  },
  {
    id: 2,
    name: 'Math Wizard',
    description: 'Scored above 85% in 3 consecutive math tests',
    icon: 'calculator',
    category: 'academic',
    rarity: 'epic',
    earnedAt: getDateDaysAgo(15),
    isEarned: true,
  },
  {
    id: 3,
    name: 'Early Bird',
    description: 'Never late for a month',
    icon: 'alarm',
    category: 'attendance',
    rarity: 'rare',
    earnedAt: getDateDaysAgo(30),
    isEarned: true,
  },
  {
    id: 4,
    name: 'Team Player',
    description: 'Participated in 5 group projects',
    icon: 'people',
    category: 'participation',
    rarity: 'common',
    earnedAt: getDateDaysAgo(45),
    isEarned: true,
  },
  {
    id: 5,
    name: 'Century Club',
    description: 'Earn 100 points in a single day',
    icon: 'trophy',
    category: 'special',
    rarity: 'legendary',
    isEarned: false,
    progress: { current: 80, target: 100, percentage: 80 },
  },
  {
    id: 6,
    name: 'Bookworm',
    description: 'Complete 10 reading assignments',
    icon: 'book',
    category: 'academic',
    rarity: 'rare',
    isEarned: false,
    progress: { current: 7, target: 10, percentage: 70 },
  },
];

export const leaderboard: Leaderboard = {
  timeframe: 'weekly',
  myRank: 8,
  myPoints: 2450,
  totalParticipants: 150,
  topRankers: [
    {
      rank: 1,
      studentId: 1010,
      studentName: 'Emma Watson',
      profilePhoto: 'https://i.pravatar.cc/150?img=1',
      points: 3850,
      level: 7,
      badgeCount: 12,
      trend: 'up',
    },
    {
      rank: 2,
      studentId: 1015,
      studentName: 'Michael Chen',
      profilePhoto: 'https://i.pravatar.cc/150?img=2',
      points: 3620,
      level: 6,
      badgeCount: 10,
      trend: 'same',
    },
    {
      rank: 3,
      studentId: 1022,
      studentName: 'Sofia Rodriguez',
      profilePhoto: 'https://i.pravatar.cc/150?img=3',
      points: 3450,
      level: 6,
      badgeCount: 11,
      trend: 'up',
    },
  ],
  nearbyRankers: [
    {
      rank: 7,
      studentId: 1045,
      studentName: 'James Wilson',
      profilePhoto: 'https://i.pravatar.cc/150?img=4',
      points: 2520,
      level: 5,
      badgeCount: 7,
      trend: 'down',
    },
    {
      rank: 8,
      studentId: 1001,
      studentName: 'Alex Johnson',
      profilePhoto: 'https://i.pravatar.cc/300?img=12',
      points: 2450,
      level: 5,
      badgeCount: 6,
      trend: 'up',
    },
    {
      rank: 9,
      studentId: 1052,
      studentName: 'Olivia Brown',
      profilePhoto: 'https://i.pravatar.cc/150?img=5',
      points: 2380,
      level: 5,
      badgeCount: 6,
      trend: 'same',
    },
  ],
};

export const streaks: Streak[] = [
  {
    currentStreak: 7,
    longestStreak: 21,
    streakType: 'daily_login',
    lastActivityDate: new Date().toISOString(),
    isActive: true,
    nextMilestone: 14,
  },
  {
    currentStreak: 4,
    longestStreak: 8,
    streakType: 'assignment_submission',
    lastActivityDate: getDateDaysAgo(2),
    isActive: true,
    nextMilestone: 7,
  },
  {
    currentStreak: 5,
    longestStreak: 12,
    streakType: 'attendance',
    lastActivityDate: new Date().toISOString(),
    isActive: true,
    nextMilestone: 7,
  },
];

export const achievements: Achievement[] = [
  {
    id: 1,
    title: 'Perfect Week Achievement',
    description: 'Attended all classes for a complete week',
    category: 'attendance',
    pointsEarned: 100,
    badgeEarned: badges[0],
    achievedAt: getDateDaysAgo(3),
    isNew: false,
  },
  {
    id: 2,
    title: 'Math Excellence',
    description: 'Maintained above 85% in mathematics',
    category: 'academic',
    pointsEarned: 150,
    badgeEarned: badges[1],
    achievedAt: getDateDaysAgo(15),
    isNew: false,
  },
];

export const gamificationStats: GamificationStats = {
  totalPoints: 2450,
  totalBadges: 4,
  totalAchievements: 2,
  currentLevel: 5,
  rank: 8,
  totalStudents: 150,
  nextLevelPoints: 550,
  badges: badges.filter(b => b.isEarned),
  streaks,
  recentAchievements: achievements,
};

export const studentGoals = [
  {
    id: 1,
    title: 'Improve Math Grade',
    description: 'Achieve 90% or above in final mathematics exam',
    category: 'academic',
    targetDate: getDateDaysFromNow(20),
    targetValue: 90,
    currentValue: 75,
    progress: 75,
    status: 'in_progress',
    milestones: [
      { id: 1, title: 'Complete all practice problems', completed: true, completedDate: getDateDaysAgo(10) },
      { id: 2, title: 'Score 85%+ in mid-term', completed: true, completedDate: getDateDaysAgo(10) },
      { id: 3, title: 'Attend extra coaching sessions', completed: false },
      { id: 4, title: 'Score 90%+ in final exam', completed: false },
    ],
  },
  {
    id: 2,
    title: 'Perfect Attendance',
    description: 'Maintain 95% attendance this semester',
    category: 'attendance',
    targetDate: getDateDaysFromNow(45),
    targetValue: 95,
    currentValue: 80,
    progress: 80,
    status: 'in_progress',
    milestones: [
      { id: 1, title: 'No absences in Month 1', completed: true, completedDate: getDateDaysAgo(60) },
      { id: 2, title: 'No absences in Month 2', completed: true, completedDate: getDateDaysAgo(30) },
      { id: 3, title: 'No absences in Month 3', completed: false },
    ],
  },
  {
    id: 3,
    title: 'Complete Python Project',
    description: 'Build and submit calculator application',
    category: 'project',
    targetDate: getDateDaysFromNow(10),
    targetValue: 100,
    currentValue: 40,
    progress: 40,
    status: 'in_progress',
    milestones: [
      { id: 1, title: 'Design UI', completed: true, completedDate: getDateDaysAgo(5) },
      { id: 2, title: 'Implement basic operations', completed: false },
      { id: 3, title: 'Add advanced features', completed: false },
      { id: 4, title: 'Testing and debugging', completed: false },
    ],
  },
];

export const parentChildren: Child[] = [
  {
    id: 1001,
    first_name: 'Alex',
    last_name: 'Johnson',
    photo_url: 'https://i.pravatar.cc/300?img=12',
    grade: '10th Grade',
    class_name: '10-A',
    roll_number: 'SA-2024-1001',
    student_id: 'SA1001',
  },
  {
    id: 1002,
    first_name: 'Emma',
    last_name: 'Johnson',
    photo_url: 'https://i.pravatar.cc/300?img=25',
    grade: '7th Grade',
    class_name: '7-B',
    roll_number: 'SA-2024-1002',
    student_id: 'SA1002',
  },
];

export const childrenStats: { [childId: number]: ChildStats } = {
  1001: {
    attendance_percentage: 80,
    rank: 8,
    average_score: 84.3,
    total_subjects: 8,
  },
  1002: {
    attendance_percentage: 92,
    rank: 3,
    average_score: 91.5,
    total_subjects: 7,
  },
};

export const todayAttendance: { [childId: number]: TodayAttendance } = {
  1001: {
    child_id: 1001,
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    marked_at: new Date().toISOString(),
    marked_by: 'System',
  },
  1002: {
    child_id: 1002,
    date: new Date().toISOString().split('T')[0],
    status: 'present',
    marked_at: new Date().toISOString(),
    marked_by: 'System',
  },
};

export const parentGrades: { [childId: number]: Grade[] } = {
  1001: [
    {
      id: 1,
      subject_name: 'Mathematics',
      exam_name: 'Mid-Term Examination',
      exam_type: 'midterm',
      marks_obtained: 88,
      total_marks: 100,
      percentage: 88,
      grade: 'A',
      date: getDateDaysAgo(10),
      term: 'First',
    },
    {
      id: 2,
      subject_name: 'Biology',
      exam_name: 'Mid-Term Examination',
      exam_type: 'midterm',
      marks_obtained: 82,
      total_marks: 100,
      percentage: 82,
      grade: 'A',
      date: getDateDaysAgo(10),
      term: 'First',
    },
    {
      id: 3,
      subject_name: 'Chemistry',
      exam_name: 'Mid-Term Examination',
      exam_type: 'midterm',
      marks_obtained: 85,
      total_marks: 100,
      percentage: 85,
      grade: 'A',
      date: getDateDaysAgo(10),
      term: 'First',
    },
  ],
  1002: [
    {
      id: 4,
      subject_name: 'Mathematics',
      exam_name: 'Mid-Term Examination',
      exam_type: 'midterm',
      marks_obtained: 95,
      total_marks: 100,
      percentage: 95,
      grade: 'A+',
      date: getDateDaysAgo(10),
      term: 'First',
    },
    {
      id: 5,
      subject_name: 'Science',
      exam_name: 'Mid-Term Examination',
      exam_type: 'midterm',
      marks_obtained: 92,
      total_marks: 100,
      percentage: 92,
      grade: 'A+',
      date: getDateDaysAgo(10),
      term: 'First',
    },
  ],
};

export const parentAssignments: { [childId: number]: ParentAssignment[] } = {
  1001: [
    {
      id: 1,
      title: 'Quadratic Equations - Problem Set',
      subject_name: 'Mathematics',
      due_date: getDateDaysFromNow(2),
      status: 'pending',
      total_marks: 100,
    },
    {
      id: 2,
      title: 'Photosynthesis Lab Report',
      subject_name: 'Biology',
      due_date: getDateDaysFromNow(5),
      status: 'pending',
      total_marks: 50,
    },
  ],
  1002: [
    {
      id: 3,
      title: 'Fraction Worksheet',
      subject_name: 'Mathematics',
      due_date: getDateDaysFromNow(3),
      status: 'submitted',
      marks_obtained: 48,
      total_marks: 50,
    },
  ],
};

export const feePayments: { [childId: number]: FeePayment[] } = {
  1001: [
    {
      id: 1,
      child_id: 1001,
      fee_type: 'Tuition Fee - Quarter 1',
      amount: 5000,
      due_date: getDateDaysAgo(15),
      paid_date: getDateDaysAgo(20),
      status: 'paid',
    },
    {
      id: 2,
      child_id: 1001,
      fee_type: 'Tuition Fee - Quarter 2',
      amount: 5000,
      due_date: getDateDaysFromNow(5),
      status: 'pending',
    },
    {
      id: 3,
      child_id: 1001,
      fee_type: 'Library Fee',
      amount: 500,
      due_date: getDateDaysAgo(10),
      paid_date: getDateDaysAgo(12),
      status: 'paid',
    },
    {
      id: 4,
      child_id: 1001,
      fee_type: 'Sports Fee',
      amount: 1000,
      due_date: getDateDaysFromNow(10),
      status: 'pending',
    },
  ],
  1002: [
    {
      id: 5,
      child_id: 1002,
      fee_type: 'Tuition Fee - Quarter 1',
      amount: 4500,
      due_date: getDateDaysAgo(15),
      paid_date: getDateDaysAgo(20),
      status: 'paid',
    },
    {
      id: 6,
      child_id: 1002,
      fee_type: 'Tuition Fee - Quarter 2',
      amount: 4500,
      due_date: getDateDaysFromNow(5),
      status: 'pending',
    },
  ],
};

export const teacherMessages: TeacherMessage[] = [
  {
    id: 1,
    sender_name: 'Dr. Robert Brown',
    sender_role: 'Mathematics Teacher',
    subject: 'Regarding Alex\'s Math Performance',
    message: 'Alex has shown excellent improvement in mathematics. Keep encouraging the practice of problem-solving.',
    sent_at: getDateDaysAgo(3),
    read: false,
    priority: 'medium',
  },
  {
    id: 2,
    sender_name: 'Ms. Emily Davis',
    sender_role: 'Biology Teacher',
    subject: 'Lab Report Submission',
    message: 'Please remind Alex to submit the photosynthesis lab report by Friday.',
    sent_at: getDateDaysAgo(5),
    read: true,
    priority: 'high',
  },
  {
    id: 3,
    sender_name: 'Principal Johnson',
    sender_role: 'Principal',
    subject: 'Parent-Teacher Meeting',
    message: 'We are organizing a parent-teacher meeting next week. Your presence would be appreciated.',
    sent_at: getDateDaysAgo(7),
    read: true,
    priority: 'high',
  },
  {
    id: 4,
    sender_name: 'Mrs. Patricia Moore',
    sender_role: 'English Teacher',
    subject: 'Emma\'s Outstanding Performance',
    message: 'Emma has been doing exceptionally well in English Literature. Her essay writing has improved significantly.',
    sent_at: getDateDaysAgo(2),
    read: false,
    priority: 'low',
  },
];

export const announcements: Announcement[] = [
  {
    id: 1,
    title: 'Annual Sports Day - March 15th',
    content: 'We are excited to announce our Annual Sports Day on March 15th. All students are encouraged to participate.',
    posted_by: 'Principal Johnson',
    posted_at: getDateDaysAgo(5),
    category: 'Events',
    is_important: true,
  },
  {
    id: 2,
    title: 'Science Fair Registration Open',
    content: 'Registration for the inter-school science fair is now open. Interested students should register by this Friday.',
    posted_by: 'Science Department',
    posted_at: getDateDaysAgo(8),
    category: 'Academic',
    is_important: false,
  },
  {
    id: 3,
    title: 'Winter Break Schedule',
    content: 'School will be closed from December 20th to January 5th for winter break. Classes resume on January 6th.',
    posted_by: 'Administration',
    posted_at: getDateDaysAgo(15),
    category: 'General',
    is_important: true,
  },
  {
    id: 4,
    title: 'Library Timings Extended',
    content: 'The school library will now be open until 6 PM on weekdays to support students\' study needs.',
    posted_by: 'Librarian',
    posted_at: getDateDaysAgo(10),
    category: 'Facilities',
    is_important: false,
  },
];

const generateAttendanceCalendar = (childId: number): AttendanceCalendar => {
  const calendar: AttendanceCalendar = {};
  const statuses: ('present' | 'absent' | 'late' | 'excused')[] = 
    childId === 1001 
      ? ['present', 'present', 'present', 'absent', 'late']
      : ['present', 'present', 'present', 'present', 'present', 'absent'];
  
  for (let i = 60; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    const dateKey = date.toISOString().split('T')[0];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    calendar[dateKey] = {
      date: dateKey,
      status,
    };
  }
  
  return calendar;
};

export const attendanceCalendar: { [childId: number]: AttendanceCalendar } = {
  1001: generateAttendanceCalendar(1001),
  1002: generateAttendanceCalendar(1002),
};

export const subjectAttendance: { [childId: number]: ParentSubjectAttendance[] } = {
  1001: [
    { subject_name: 'Mathematics', present_count: 20, total_count: 24, percentage: 83.3 },
    { subject_name: 'Biology', present_count: 16, total_count: 20, percentage: 80 },
    { subject_name: 'History', present_count: 17, total_count: 20, percentage: 85 },
    { subject_name: 'English Literature', present_count: 19, total_count: 24, percentage: 79.2 },
    { subject_name: 'Chemistry', present_count: 15, total_count: 20, percentage: 75 },
    { subject_name: 'Computer Science', present_count: 18, total_count: 20, percentage: 90 },
    { subject_name: 'Physics', present_count: 16, total_count: 20, percentage: 80 },
    { subject_name: 'Physical Education', present_count: 11, total_count: 12, percentage: 91.7 },
  ],
  1002: [
    { subject_name: 'Mathematics', present_count: 22, total_count: 24, percentage: 91.7 },
    { subject_name: 'Science', present_count: 21, total_count: 24, percentage: 87.5 },
    { subject_name: 'English', present_count: 23, total_count: 24, percentage: 95.8 },
    { subject_name: 'Social Studies', present_count: 22, total_count: 24, percentage: 91.7 },
    { subject_name: 'Hindi', present_count: 20, total_count: 20, percentage: 100 },
    { subject_name: 'Art', present_count: 11, total_count: 12, percentage: 91.7 },
    { subject_name: 'Physical Education', present_count: 12, total_count: 12, percentage: 100 },
  ],
};

export const parentExamResults: { [childId: number]: ParentExamResult[] } = {
  1001: [
    {
      id: 1,
      exam_name: 'Mid-Term Examination',
      term: 'First',
      total_marks: 800,
      marks_obtained: 672,
      percentage: 84,
      rank: 8,
      subjects: [
        { subject_name: 'Mathematics', marks_obtained: 88, total_marks: 100, percentage: 88, grade: 'A' },
        { subject_name: 'Biology', marks_obtained: 82, total_marks: 100, percentage: 82, grade: 'A' },
        { subject_name: 'Chemistry', marks_obtained: 85, total_marks: 100, percentage: 85, grade: 'A' },
        { subject_name: 'Physics', marks_obtained: 80, total_marks: 100, percentage: 80, grade: 'A' },
        { subject_name: 'English', marks_obtained: 78, total_marks: 100, percentage: 78, grade: 'B+' },
        { subject_name: 'History', marks_obtained: 88, total_marks: 100, percentage: 88, grade: 'A' },
        { subject_name: 'Computer Science', marks_obtained: 92, total_marks: 100, percentage: 92, grade: 'A+' },
        { subject_name: 'Physical Education', marks_obtained: 79, total_marks: 100, percentage: 79, grade: 'B+' },
      ],
    },
  ],
  1002: [
    {
      id: 2,
      exam_name: 'Mid-Term Examination',
      term: 'First',
      total_marks: 700,
      marks_obtained: 640,
      percentage: 91.4,
      rank: 3,
      subjects: [
        { subject_name: 'Mathematics', marks_obtained: 95, total_marks: 100, percentage: 95, grade: 'A+' },
        { subject_name: 'Science', marks_obtained: 92, total_marks: 100, percentage: 92, grade: 'A+' },
        { subject_name: 'English', marks_obtained: 88, total_marks: 100, percentage: 88, grade: 'A' },
        { subject_name: 'Social Studies', marks_obtained: 90, total_marks: 100, percentage: 90, grade: 'A+' },
        { subject_name: 'Hindi', marks_obtained: 85, total_marks: 100, percentage: 85, grade: 'A' },
        { subject_name: 'Art', marks_obtained: 95, total_marks: 100, percentage: 95, grade: 'A+' },
        { subject_name: 'Physical Education', marks_obtained: 95, total_marks: 100, percentage: 95, grade: 'A+' },
      ],
    },
  ],
};

export const subjectPerformance: { [childId: number]: SubjectPerformance[] } = {
  1001: [
    {
      subject_name: 'Mathematics',
      average_score: 85.5,
      highest_score: 92,
      lowest_score: 78,
      total_exams: 4,
      trend: 'improving',
    },
    {
      subject_name: 'Biology',
      average_score: 81.2,
      highest_score: 88,
      lowest_score: 75,
      total_exams: 4,
      trend: 'stable',
    },
    {
      subject_name: 'Chemistry',
      average_score: 83.8,
      highest_score: 90,
      lowest_score: 76,
      total_exams: 4,
      trend: 'improving',
    },
    {
      subject_name: 'Computer Science',
      average_score: 89.5,
      highest_score: 95,
      lowest_score: 84,
      total_exams: 3,
      trend: 'improving',
    },
  ],
  1002: [
    {
      subject_name: 'Mathematics',
      average_score: 93.5,
      highest_score: 98,
      lowest_score: 88,
      total_exams: 4,
      trend: 'improving',
    },
    {
      subject_name: 'Science',
      average_score: 90.8,
      highest_score: 95,
      lowest_score: 86,
      total_exams: 4,
      trend: 'stable',
    },
    {
      subject_name: 'English',
      average_score: 87.2,
      highest_score: 92,
      lowest_score: 82,
      total_exams: 4,
      trend: 'improving',
    },
  ],
};

export const dummyData = {
  students: {
    demo: {
      user: demoStudentUser,
      profile: studentProfile,
      stats: studentStats,
      assignments,
      subjects,
      attendance: {
        summary: attendanceSummary,
        history: attendanceHistory,
      },
      exams: {
        results: examResults,
        upcoming: upcomingExams,
      },
      ai: {
        predictions: aiPredictions,
        weakAreas,
        focusAreas,
        topicProbabilities,
      },
      gamification: {
        points: gamificationPoints,
        badges,
        leaderboard,
        streaks,
        achievements,
        stats: gamificationStats,
      },
      goals: studentGoals,
    },
  },
  parents: {
    demo: {
      user: demoParentUser,
      children: parentChildren,
      childrenStats,
      todayAttendance,
      grades: parentGrades,
      assignments: parentAssignments,
      feePayments,
      messages: teacherMessages,
      announcements,
      attendanceCalendar,
      subjectAttendance,
      examResults: parentExamResults,
      subjectPerformance,
    },
  },
};
