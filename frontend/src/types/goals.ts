export type GoalType = 'performance' | 'behavioral' | 'skill';

export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'overdue';

export interface Milestone {
  id: string;
  title: string;
  description: string;
  targetDate: string;
  completedDate?: string;
  progress: number;
  status: 'pending' | 'in_progress' | 'completed';
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  type: GoalType;
  status: GoalStatus;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
  startDate: string;
  targetDate: string;
  completedDate?: string;
  progress: number;
  milestones: Milestone[];
  createdAt: string;
  updatedAt: string;
}

export interface GoalFormData {
  title: string;
  description: string;
  type: GoalType;
  specific: string;
  measurable: string;
  achievable: string;
  relevant: string;
  timeBound: string;
  startDate: string;
  targetDate: string;
  milestones: Omit<Milestone, 'id' | 'status' | 'completedDate'>[];
  [key: string]: unknown;
}

export interface GoalAnalytics {
  totalGoals: number;
  completedGoals: number;
  completionRate: number;
  averageProgress: number;
  goalsByType: {
    performance: number;
    behavioral: number;
    skill: number;
  };
  goalsByStatus: {
    not_started: number;
    in_progress: number;
    completed: number;
    overdue: number;
  };
  impactCorrelation: {
    academicPerformance: number;
    attendanceRate: number;
    assignmentCompletion: number;
  };
  monthlyProgress: {
    month: string;
    goalsCreated: number;
    goalsCompleted: number;
  }[];
}
