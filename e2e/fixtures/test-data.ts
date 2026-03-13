export const TEST_USERS = {
  student: {
    email: 'student@test.com',
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'Student',
    role: 'student' as const,
  },
  teacher: {
    email: 'teacher@test.com',
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'Teacher',
    role: 'teacher' as const,
  },
  parent: {
    email: 'parent@test.com',
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'Parent',
    role: 'parent' as const,
  },
  admin: {
    email: 'admin@test.com',
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'Admin',
    role: 'admin' as const,
  },
};

export const TEST_ASSIGNMENTS = {
  math: {
    title: 'Algebra Homework',
    description: 'Complete exercises 1-10 from chapter 5',
    subject: 'Mathematics',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    maxMarks: 100,
  },
  science: {
    title: 'Physics Lab Report',
    description: 'Submit lab report on pendulum experiment',
    subject: 'Physics',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    maxMarks: 50,
  },
};

export const TEST_ATTENDANCE = {
  classId: 'class-1',
  students: [
    { id: 'student-1', name: 'John Doe', status: 'present' },
    { id: 'student-2', name: 'Jane Smith', status: 'absent' },
    { id: 'student-3', name: 'Bob Johnson', status: 'late' },
  ],
};

export const TEST_SUBSCRIPTION_PLANS = {
  basic: {
    name: 'Basic Plan',
    price: 999,
    features: ['Up to 100 students', 'Basic analytics', 'Email support'],
  },
  premium: {
    name: 'Premium Plan',
    price: 2999,
    features: ['Unlimited students', 'Advanced analytics', 'Priority support', 'AI predictions'],
  },
};

export const TEST_CHAT_MESSAGES = {
  simple: 'Hello, this is a test message',
  withEmoji: 'Great work! 👍',
  withMention: '@teacher Can you help with this?',
};

export const TEST_NOTIFICATION = {
  title: 'Test Notification',
  message: 'This is a test notification message',
  type: 'info' as const,
};

export const TEST_AI_PREDICTION_DATA = {
  subjects: ['Mathematics', 'Physics', 'Chemistry', 'English'],
  currentScores: {
    Mathematics: 75,
    Physics: 82,
    Chemistry: 68,
    English: 90,
  },
  whatIfScenarios: [
    { subject: 'Mathematics', targetScore: 85 },
    { subject: 'Chemistry', targetScore: 80 },
  ],
};
