import axios from '@/lib/axios';
import {
  Election,
  Candidate,
  VoteSubmission,
  ElectionResults,
  CampaignAnalytics,
  PosterTemplate,
  Endorsement,
  ElectionCalendarEvent,
  CandidateComparison,
} from '@/types/elections';

const electionsApi = {
  getElections: async (institutionId: number): Promise<Election[]> => {
    const response = await axios.get(`/institutions/${institutionId}/elections`);
    return response.data;
  },

  getElection: async (institutionId: number, electionId: number): Promise<Election> => {
    const response = await axios.get(`/institutions/${institutionId}/elections/${electionId}`);
    return response.data;
  },

  createElection: async (institutionId: number, data: Partial<Election>): Promise<Election> => {
    const response = await axios.post(`/institutions/${institutionId}/elections`, data);
    return response.data;
  },

  updateElection: async (
    institutionId: number,
    electionId: number,
    data: Partial<Election>
  ): Promise<Election> => {
    const response = await axios.put(
      `/institutions/${institutionId}/elections/${electionId}`,
      data
    );
    return response.data;
  },

  deleteElection: async (institutionId: number, electionId: number): Promise<void> => {
    await axios.delete(`/institutions/${institutionId}/elections/${electionId}`);
  },

  getElectionCandidates: async (
    institutionId: number,
    electionId: number
  ): Promise<Candidate[]> => {
    const response = await axios.get(
      `/institutions/${institutionId}/elections/${electionId}/candidates`
    );
    return response.data;
  },

  getCandidate: async (institutionId: number, candidateId: number): Promise<Candidate> => {
    const response = await axios.get(`/institutions/${institutionId}/candidates/${candidateId}`);
    return response.data;
  },

  createCandidate: async (institutionId: number, data: Partial<Candidate>): Promise<Candidate> => {
    const response = await axios.post(`/institutions/${institutionId}/candidates`, data);
    return response.data;
  },

  updateCandidate: async (
    institutionId: number,
    candidateId: number,
    data: Partial<Candidate>
  ): Promise<Candidate> => {
    const response = await axios.put(
      `/institutions/${institutionId}/candidates/${candidateId}`,
      data
    );
    return response.data;
  },

  approveCandidate: async (institutionId: number, candidateId: number): Promise<Candidate> => {
    const response = await axios.post(
      `/institutions/${institutionId}/candidates/${candidateId}/approve`
    );
    return response.data;
  },

  rejectCandidate: async (
    institutionId: number,
    candidateId: number,
    reason: string
  ): Promise<Candidate> => {
    const response = await axios.post(
      `/institutions/${institutionId}/candidates/${candidateId}/reject`,
      {
        reason,
      }
    );
    return response.data;
  },

  withdrawCandidate: async (institutionId: number, candidateId: number): Promise<Candidate> => {
    const response = await axios.post(
      `/institutions/${institutionId}/candidates/${candidateId}/withdraw`
    );
    return response.data;
  },

  uploadPoster: async (institutionId: number, candidateId: number, file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(
      `/institutions/${institutionId}/candidates/${candidateId}/poster`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data.poster_url;
  },

  uploadVideo: async (institutionId: number, candidateId: number, file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await axios.post(
      `/institutions/${institutionId}/candidates/${candidateId}/video`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
    return response.data.video_url;
  },

  submitVote: async (institutionId: number, vote: VoteSubmission): Promise<void> => {
    await axios.post(`/institutions/${institutionId}/votes`, vote);
  },

  getElectionResults: async (
    institutionId: number,
    electionId: number
  ): Promise<ElectionResults> => {
    const response = await axios.get(
      `/institutions/${institutionId}/elections/${electionId}/results`
    );
    return response.data;
  },

  publishResults: async (institutionId: number, electionId: number): Promise<void> => {
    await axios.post(`/institutions/${institutionId}/elections/${electionId}/publish-results`);
  },

  getCampaignAnalytics: async (
    institutionId: number,
    candidateId: number
  ): Promise<CampaignAnalytics> => {
    const response = await axios.get(
      `/institutions/${institutionId}/candidates/${candidateId}/analytics`
    );
    return response.data;
  },

  recordProfileView: async (institutionId: number, candidateId: number): Promise<void> => {
    await axios.post(`/institutions/${institutionId}/candidates/${candidateId}/view`);
  },

  getPosterTemplates: async (): Promise<PosterTemplate[]> => {
    const response = await axios.get('/poster-templates');
    return response.data;
  },

  createEndorsement: async (
    institutionId: number,
    candidateId: number,
    data: { message: string; is_public: boolean }
  ): Promise<Endorsement> => {
    const response = await axios.post(
      `/institutions/${institutionId}/candidates/${candidateId}/endorsements`,
      data
    );
    return response.data;
  },

  deleteEndorsement: async (institutionId: number, endorsementId: number): Promise<void> => {
    await axios.delete(`/institutions/${institutionId}/endorsements/${endorsementId}`);
  },

  getElectionCalendar: async (institutionId: number): Promise<ElectionCalendarEvent[]> => {
    const response = await axios.get(`/institutions/${institutionId}/elections/calendar`);
    return response.data;
  },

  getCandidateComparison: async (
    institutionId: number,
    candidateIds: number[]
  ): Promise<CandidateComparison[]> => {
    const response = await axios.post(`/institutions/${institutionId}/candidates/compare`, {
      candidate_ids: candidateIds,
    });
    return response.data;
  },

  hasVoted: async (institutionId: number, electionId: number): Promise<boolean> => {
    const response = await axios.get(
      `/institutions/${institutionId}/elections/${electionId}/has-voted`
    );
    return response.data.has_voted;
  },
};

export default electionsApi;
