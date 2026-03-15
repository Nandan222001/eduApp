import { OnboardingFlow } from '@/types/onboarding';

export const studentOnboardingFlow: OnboardingFlow = {
  id: 'student-flow-1',
  role: 'student',
  title: 'Welcome to Your Learning Journey',
  description: 'Get started with our platform and discover all the amazing features',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  steps: [
    {
      id: 'welcome-1',
      type: 'welcome',
      title: 'Welcome!',
      description: 'We are excited to have you join us',
      order: 0,
      required: true,
      config: {
        message:
          'Hello! Welcome to our learning platform. This quick tour will help you get familiar with all the features available to help you succeed in your studies.',
      },
    },
    {
      id: 'video-1',
      type: 'video',
      title: 'Platform Overview',
      description: 'Watch this short video to learn about the platform',
      order: 1,
      required: true,
      config: {
        videoTitle: 'Getting Started with Your Dashboard',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      },
    },
    {
      id: 'form-1',
      type: 'form',
      title: 'Tell Us About Yourself',
      description: 'Help us personalize your experience',
      order: 2,
      required: true,
      config: {
        formFields: [
          {
            id: 'grade',
            type: 'select',
            label: 'Grade',
            required: true,
            options: ['9', '10', '11', '12'],
          },
          {
            id: 'interests',
            type: 'select',
            label: 'Primary Interest',
            required: true,
            options: ['Science', 'Mathematics', 'Arts', 'Sports', 'Technology'],
          },
          {
            id: 'goals',
            type: 'textarea',
            label: 'Your Academic Goals',
            placeholder: 'Tell us what you hope to achieve...',
            required: false,
          },
        ],
      },
      conditionalRules: [
        {
          id: 'rule-1',
          field: 'grade',
          operator: 'equals',
          value: '9',
          nextStepId: 'quiz-1',
        },
      ],
    },
    {
      id: 'quiz-1',
      type: 'quiz',
      title: 'Quick Knowledge Check',
      description: 'Test your understanding of the platform',
      order: 3,
      required: false,
      config: {
        passingScore: 70,
        questions: [
          {
            id: 'q1',
            question: 'Where can you find your assignments?',
            type: 'multiple_choice',
            options: ['Dashboard', 'Settings', 'Profile', 'Help Center'],
            correctAnswer: 0,
            explanation: 'Your assignments are prominently displayed on your dashboard.',
          },
          {
            id: 'q2',
            question: 'Can you track your study time on this platform?',
            type: 'true_false',
            options: ['True', 'False'],
            correctAnswer: 0,
            explanation: 'Yes! Use the Pomodoro timer feature to track your study sessions.',
          },
        ],
      },
    },
    {
      id: 'tour-1',
      type: 'platform_tour',
      title: 'Feature Highlights',
      description: 'Discover key features',
      order: 4,
      required: false,
      config: {
        tourHighlights: [
          {
            id: 'h1',
            selector: '.dashboard',
            title: 'Your Dashboard',
            description:
              'This is your central hub. See your upcoming assignments, grades, and notifications here.',
            position: 'bottom',
          },
          {
            id: 'h2',
            selector: '.navigation',
            title: 'Navigation Menu',
            description:
              'Access all features from this menu including assignments, quizzes, and study materials.',
            position: 'right',
          },
          {
            id: 'h3',
            selector: '.profile',
            title: 'Your Profile',
            description:
              'Manage your account settings, view your progress, and customize your experience.',
            position: 'left',
          },
        ],
      },
    },
  ],
};

export const parentOnboardingFlow: OnboardingFlow = {
  id: 'parent-flow-1',
  role: 'parent',
  title: 'Parent Portal Onboarding',
  description: "Learn how to monitor and support your child's education",
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  steps: [
    {
      id: 'welcome-p1',
      type: 'welcome',
      title: 'Welcome Parents!',
      description: "Thank you for partnering with us in your child's education",
      order: 0,
      required: true,
      config: {
        message:
          "Welcome to the Parent Portal! Here you can track your child's progress, communicate with teachers, and stay involved in their educational journey.",
      },
    },
    {
      id: 'form-p1',
      type: 'form',
      title: 'Family Information',
      description: 'Tell us about your family',
      order: 1,
      required: true,
      config: {
        formFields: [
          {
            id: 'children_count',
            type: 'number',
            label: 'Number of Children',
            required: true,
          },
          {
            id: 'preferred_contact',
            type: 'select',
            label: 'Preferred Contact Method',
            required: true,
            options: ['Email', 'Phone', 'SMS', 'In-App Notifications'],
          },
          {
            id: 'notification_frequency',
            type: 'select',
            label: 'Notification Frequency',
            required: true,
            options: ['Daily', 'Weekly', 'Only Important Updates'],
          },
        ],
      },
      conditionalRules: [
        {
          id: 'rule-p1',
          field: 'children_count',
          operator: 'greater_than',
          value: 1,
          nextStepId: 'video-p1',
        },
      ],
    },
    {
      id: 'video-p1',
      type: 'video',
      title: 'Managing Multiple Children',
      description: 'Tips for monitoring multiple student profiles',
      order: 2,
      required: false,
      config: {
        videoTitle: 'Multi-Child Account Management',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      },
    },
    {
      id: 'signature-p1',
      type: 'signature',
      title: 'Terms and Conditions',
      description: 'Please review and sign',
      order: 3,
      required: true,
      config: {
        signatureLabel: 'I agree to the terms and conditions of using the Parent Portal',
        signatureRequired: true,
      },
    },
    {
      id: 'tour-p1',
      type: 'platform_tour',
      title: 'Parent Portal Features',
      description: 'Explore what you can do',
      order: 4,
      required: false,
      config: {
        tourHighlights: [
          {
            id: 'hp1',
            selector: '.parent-dashboard',
            title: 'Parent Dashboard',
            description:
              "View all your children's activities, grades, and attendance in one place.",
            position: 'bottom',
          },
          {
            id: 'hp2',
            selector: '.messages',
            title: 'Teacher Communication',
            description: "Send and receive messages from your child's teachers.",
            position: 'right',
          },
          {
            id: 'hp3',
            selector: '.reports',
            title: 'Progress Reports',
            description: 'Access detailed academic reports and performance analytics.',
            position: 'left',
          },
        ],
      },
    },
  ],
};

export const teacherOnboardingFlow: OnboardingFlow = {
  id: 'teacher-flow-1',
  role: 'teacher',
  title: 'Teacher Onboarding',
  description: 'Get started with teaching tools and classroom management',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  steps: [
    {
      id: 'welcome-t1',
      type: 'welcome',
      title: 'Welcome Teacher!',
      description: "Let's set up your classroom",
      order: 0,
      required: true,
      config: {
        message:
          "Welcome to our teaching platform! We've designed powerful tools to help you manage your classroom, track student progress, and create engaging learning experiences.",
      },
    },
    {
      id: 'video-t1',
      type: 'video',
      title: 'Teacher Dashboard Tour',
      description: 'Overview of your teaching tools',
      order: 1,
      required: true,
      config: {
        videoTitle: 'Getting Started as a Teacher',
        videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
      },
    },
    {
      id: 'form-t1',
      type: 'form',
      title: 'Teaching Preferences',
      description: 'Customize your teaching experience',
      order: 2,
      required: true,
      config: {
        formFields: [
          {
            id: 'subjects',
            type: 'select',
            label: 'Primary Subject',
            required: true,
            options: ['Mathematics', 'Science', 'English', 'History', 'Arts'],
          },
          {
            id: 'grade_levels',
            type: 'select',
            label: 'Grade Levels You Teach',
            required: true,
            options: ['9-10', '11-12', 'All Grades'],
          },
          {
            id: 'teaching_style',
            type: 'textarea',
            label: 'Teaching Philosophy',
            placeholder: 'Share your approach to teaching...',
            required: false,
          },
        ],
      },
    },
    {
      id: 'document-t1',
      type: 'document_upload',
      title: 'Upload Credentials',
      description: 'Please upload your teaching credentials',
      order: 3,
      required: true,
      config: {
        documentDescription:
          'Upload your teaching license, certificates, or relevant qualifications.',
        acceptedFileTypes: ['application/pdf', 'image/jpeg', 'image/png'],
        maxFileSize: 5242880,
      },
    },
    {
      id: 'tour-t1',
      type: 'platform_tour',
      title: 'Teaching Tools Overview',
      description: 'Discover your teaching toolkit',
      order: 4,
      required: false,
      config: {
        tourHighlights: [
          {
            id: 'ht1',
            selector: '.grade-book',
            title: 'Digital Grade Book',
            description: 'Manage grades, track progress, and generate reports effortlessly.',
            position: 'bottom',
          },
          {
            id: 'ht2',
            selector: '.assignments',
            title: 'Assignment Creator',
            description: 'Create, distribute, and grade assignments all in one place.',
            position: 'right',
          },
          {
            id: 'ht3',
            selector: '.analytics',
            title: 'Class Analytics',
            description: 'Get insights into class performance and identify struggling students.',
            position: 'left',
          },
        ],
      },
    },
  ],
};

export const allSampleFlows = [studentOnboardingFlow, parentOnboardingFlow, teacherOnboardingFlow];
