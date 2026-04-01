import axios from 'axios';
import { isDemoUser, demoDataApi } from './demoDataApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Competition {
  id: number;
  institution_id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'past';
  competition_type: 'individual' | 'team' | 'school';
  team_size?: number;
  registration_start: string;
  registration_end: string;
  prize_pool?: string;
  rules?: string;
  banner_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CompetitionEvent {
  id: number;
  competition_id: number;
  name: string;
  description: string;
  subject: string;
  event_type: 'quiz' | 'challenge' | 'project';
  start_time: string;
  end_time: string;
  duration_minutes: number;
  total_points: number;
  status: 'upcoming' | 'active' | 'completed';
  questions_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Question {
  id: number;
  event_id: number;
  question_text: string;
  question_type: 'mcq' | 'true_false' | 'short_answer';
  options?: string[];
  correct_answer: string;
  points: number;
  difficulty: 'easy' | 'medium' | 'hard';
  time_limit_seconds?: number;
  order_index: number;
}

export interface Team {
  id: number;
  competition_id: number;
  name: string;
  team_code: string;
  captain_id: number;
  grade?: string;
  section?: string;
  members_count: number;
  total_points: number;
  rank?: number;
  avatar_url?: string;
  created_at: string;
  members?: TeamMember[];
}

export interface TeamMember {
  id: number;
  team_id: number;
  user_id: number;
  role: 'captain' | 'member';
  joined_at: string;
  contribution_points: number;
  user?: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    grade?: string;
    section?: string;
  };
}

export interface SchoolRanking {
  school_id: number;
  school_name: string;
  total_points: number;
  participants_count: number;
  rank: number;
  average_points: number;
  gold_medals: number;
  silver_medals: number;
  bronze_medals: number;
}

export interface IndividualRanking {
  user_id: number;
  username: string;
  first_name: string;
  last_name: string;
  grade?: string;
  section?: string;
  total_points: number;
  events_participated: number;
  rank: number;
  previous_rank?: number;
  medals: {
    gold: number;
    silver: number;
    bronze: number;
  };
}

export interface ParticipationSession {
  id: number;
  event_id: number;
  user_id: number;
  team_id?: number;
  start_time: string;
  end_time?: string;
  status: 'in_progress' | 'completed' | 'abandoned';
  total_questions: number;
  answered_questions: number;
  current_question_index: number;
  score: number;
  time_remaining_seconds: number;
}

export interface Answer {
  id: number;
  session_id: number;
  question_id: number;
  answer_text: string;
  is_correct: boolean;
  points_earned: number;
  time_taken_seconds: number;
  answered_at: string;
}

export interface Certificate {
  id: number;
  competition_id: number;
  user_id: number;
  certificate_type: 'participation' | 'winner' | 'runner_up' | 'achievement';
  rank?: number;
  issued_at: string;
  certificate_url?: string;
  verification_code: string;
}

export interface Prize {
  id: number;
  competition_id: number;
  name: string;
  description: string;
  prize_type: 'trophy' | 'medal' | 'certificate' | 'reward';
  rank_from: number;
  rank_to: number;
  value?: string;
  image_url?: string;
}

export interface LeaderboardUpdate {
  type: 'school' | 'individual' | 'team';
  rankings: SchoolRanking[] | IndividualRanking[] | Team[];
  updated_at: string;
}

export const olympicsAPI = {
  // Competitions
  getCompetitions: async (status?: 'upcoming' | 'active' | 'past'): Promise<Competition[]> => {
    if (isDemoUser()) {
      return demoDataApi.olympics?.getCompetitions?.(status) || [];
    }
    const response = await api.get('/api/v1/olympics/competitions', {
      params: { status },
    });
    return response.data;
  },

  getCompetition: async (competitionId: number): Promise<Competition> => {
    if (isDemoUser()) {
      const result = await demoDataApi.olympics?.getCompetition?.(competitionId);
      return result as unknown as Competition;
    }
    const response = await api.get(`/api/v1/olympics/competitions/${competitionId}`);
    return response.data as Competition;
  },

  // Events
  getCompetitionEvents: async (competitionId: number): Promise<CompetitionEvent[]> => {
    if (isDemoUser()) {
      return demoDataApi.olympics?.getCompetitionEvents?.(competitionId) || [];
    }
    const response = await api.get(`/api/v1/olympics/competitions/${competitionId}/events`);
    return response.data;
  },

  getEvent: async (eventId: number): Promise<CompetitionEvent> => {
    if (isDemoUser()) {
      const result = await demoDataApi.olympics?.getEvent?.(eventId);
      return result as unknown as CompetitionEvent;
    }
    const response = await api.get(`/api/v1/olympics/events/${eventId}`);
    return response.data as CompetitionEvent;
  },

  // Participation
  startEvent: async (eventId: number, teamId?: number): Promise<ParticipationSession> => {
    if (isDemoUser()) {
      const result = await demoDataApi.olympics?.startEvent?.(eventId, teamId);
      return result as unknown as ParticipationSession;
    }
    const response = await api.post(`/api/v1/olympics/events/${eventId}/start`, {
      team_id: teamId,
    });
    return response.data as ParticipationSession;
  },

  getSession: async (sessionId: number): Promise<ParticipationSession> => {
    if (isDemoUser()) {
      const result = await demoDataApi.olympics?.getSession?.(sessionId);
      return result as unknown as ParticipationSession;
    }
    const response = await api.get(`/api/v1/olympics/sessions/${sessionId}`);
    return response.data as ParticipationSession;
  },

  getQuestions: async (eventId: number): Promise<Question[]> => {
    if (isDemoUser()) {
      return demoDataApi.olympics?.getQuestions?.(eventId) || [];
    }
    const response = await api.get(`/api/v1/olympics/events/${eventId}/questions`);
    return response.data;
  },

  submitAnswer: async (sessionId: number, questionId: number, answer: string): Promise<Answer> => {
    if (isDemoUser()) {
      const result = await demoDataApi.olympics?.submitAnswer?.(sessionId, questionId, answer);
      return result as unknown as Answer;
    }
    const response = await api.post(`/api/v1/olympics/sessions/${sessionId}/answer`, {
      question_id: questionId,
      answer_text: answer,
    });
    return response.data as Answer;
  },

  completeSession: async (sessionId: number): Promise<ParticipationSession> => {
    if (isDemoUser()) {
      const result = await demoDataApi.olympics?.completeSession?.(sessionId);
      return result as unknown as ParticipationSession;
    }
    const response = await api.post(`/api/v1/olympics/sessions/${sessionId}/complete`);
    return response.data as ParticipationSession;
  },

  // Teams
  getTeams: async (competitionId: number): Promise<Team[]> => {
    if (isDemoUser()) {
      return demoDataApi.olympics?.getTeams?.(competitionId) || [];
    }
    const response = await api.get(`/api/v1/olympics/competitions/${competitionId}/teams`);
    return response.data;
  },

  createTeam: async (competitionId: number, name: string, memberIds: number[]): Promise<Team> => {
    if (isDemoUser()) {
      const result = await demoDataApi.olympics?.createTeam?.(competitionId, name, memberIds);
      return result as unknown as Team;
    }
    const response = await api.post(`/api/v1/olympics/competitions/${competitionId}/teams`, {
      name,
      member_ids: memberIds,
    });
    return response.data as Team;
  },

  joinTeam: async (teamCode: string): Promise<Team> => {
    if (isDemoUser()) {
      const result = await demoDataApi.olympics?.joinTeam?.(teamCode);
      return result as unknown as Team;
    }
    const response = await api.post('/api/v1/olympics/teams/join', {
      team_code: teamCode,
    });
    return response.data as Team;
  },

  // Leaderboards
  getSchoolRankings: async (competitionId: number): Promise<SchoolRanking[]> => {
    if (isDemoUser()) {
      return demoDataApi.olympics?.getSchoolRankings?.(competitionId) || [];
    }
    const response = await api.get(
      `/api/v1/olympics/competitions/${competitionId}/rankings/schools`
    );
    return response.data;
  },

  getIndividualRankings: async (competitionId: number): Promise<IndividualRanking[]> => {
    if (isDemoUser()) {
      return demoDataApi.olympics?.getIndividualRankings?.(competitionId) || [];
    }
    const response = await api.get(
      `/api/v1/olympics/competitions/${competitionId}/rankings/individuals`
    );
    return response.data;
  },

  getTeamRankings: async (competitionId: number): Promise<Team[]> => {
    if (isDemoUser()) {
      return demoDataApi.olympics?.getTeamRankings?.(competitionId) || [];
    }
    const response = await api.get(`/api/v1/olympics/competitions/${competitionId}/rankings/teams`);
    return response.data;
  },

  // Prizes & Certificates
  getPrizes: async (competitionId: number): Promise<Prize[]> => {
    if (isDemoUser()) {
      return demoDataApi.olympics?.getPrizes?.(competitionId) || [];
    }
    const response = await api.get(`/api/v1/olympics/competitions/${competitionId}/prizes`);
    return response.data;
  },

  getCertificates: async (userId: number): Promise<Certificate[]> => {
    if (isDemoUser()) {
      return demoDataApi.olympics?.getCertificates?.(userId) || [];
    }
    const response = await api.get(`/api/v1/olympics/users/${userId}/certificates`);
    return response.data;
  },

  downloadCertificate: async (certificateId: number): Promise<Blob> => {
    if (isDemoUser()) {
      return new Blob();
    }
    const response = await api.get(`/api/v1/olympics/certificates/${certificateId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },
};
