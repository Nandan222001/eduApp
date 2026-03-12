import axios from 'axios';
import {
  StudyGroup,
  GroupMember,
  GroupMessage,
  GroupResource,
  GroupActivity,
  GroupInvite,
  GroupSearchFilters,
  GroupStats,
  GroupMemberRole,
} from '../types/studyGroup';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const studyGroupsApi = {
  createGroup: async (data: FormData): Promise<StudyGroup> => {
    const response = await axios.post(`${API_BASE_URL}/api/v1/study-groups`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  searchGroups: async (
    filters: GroupSearchFilters
  ): Promise<{
    groups: StudyGroup[];
    total: number;
    page: number;
    page_size: number;
    total_pages: number;
  }> => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, String(value));
      }
    });
    const response = await axios.get(`${API_BASE_URL}/api/v1/study-groups/search?${params}`);
    return response.data;
  },

  getGroup: async (groupId: number): Promise<StudyGroup> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/study-groups/${groupId}`);
    return response.data;
  },

  updateGroup: async (groupId: number, data: FormData): Promise<StudyGroup> => {
    const response = await axios.put(`${API_BASE_URL}/api/v1/study-groups/${groupId}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteGroup: async (groupId: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/api/v1/study-groups/${groupId}`);
  },

  joinGroup: async (groupId: number): Promise<GroupMember> => {
    const response = await axios.post(`${API_BASE_URL}/api/v1/study-groups/${groupId}/join`);
    return response.data;
  },

  leaveGroup: async (groupId: number): Promise<void> => {
    await axios.post(`${API_BASE_URL}/api/v1/study-groups/${groupId}/leave`);
  },

  getMembers: async (groupId: number): Promise<GroupMember[]> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/study-groups/${groupId}/members`);
    return response.data;
  },

  updateMemberRole: async (
    groupId: number,
    memberId: number,
    role: GroupMemberRole
  ): Promise<GroupMember> => {
    const response = await axios.put(
      `${API_BASE_URL}/api/v1/study-groups/${groupId}/members/${memberId}`,
      { role }
    );
    return response.data;
  },

  removeMember: async (groupId: number, memberId: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/api/v1/study-groups/${groupId}/members/${memberId}`);
  },

  getMessages: async (
    groupId: number,
    page: number = 1,
    pageSize: number = 50
  ): Promise<{
    messages: GroupMessage[];
    total: number;
    page: number;
    page_size: number;
  }> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/study-groups/${groupId}/messages`, {
      params: { page, page_size: pageSize },
    });
    return response.data;
  },

  sendMessage: async (groupId: number, data: FormData): Promise<GroupMessage> => {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/study-groups/${groupId}/messages`,
      data,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  deleteMessage: async (messageId: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/api/v1/study-groups/messages/${messageId}`);
  },

  pinMessage: async (messageId: number): Promise<GroupMessage> => {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/study-groups/messages/${messageId}/pin`
    );
    return response.data;
  },

  unpinMessage: async (messageId: number): Promise<GroupMessage> => {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/study-groups/messages/${messageId}/unpin`
    );
    return response.data;
  },

  getResources: async (groupId: number): Promise<GroupResource[]> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/study-groups/${groupId}/resources`);
    return response.data;
  },

  uploadResource: async (groupId: number, data: FormData): Promise<GroupResource> => {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/study-groups/${groupId}/resources`,
      data,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  downloadResource: async (
    resourceId: number
  ): Promise<{ download_url: string; file_name: string }> => {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/study-groups/resources/${resourceId}/download`
    );
    return response.data;
  },

  deleteResource: async (resourceId: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/api/v1/study-groups/resources/${resourceId}`);
  },

  getActivities: async (groupId: number, limit: number = 20): Promise<GroupActivity[]> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/study-groups/${groupId}/activities`, {
      params: { limit },
    });
    return response.data;
  },

  createInvite: async (
    groupId: number,
    data: { invited_user_id?: number; expires_at?: string }
  ): Promise<GroupInvite> => {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/study-groups/${groupId}/invites`,
      data
    );
    return response.data;
  },

  getMyInvites: async (): Promise<GroupInvite[]> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/study-groups/invites/my`);
    return response.data;
  },

  acceptInvite: async (inviteToken: string): Promise<GroupMember> => {
    const response = await axios.post(
      `${API_BASE_URL}/api/v1/study-groups/invites/${inviteToken}/accept`
    );
    return response.data;
  },

  declineInvite: async (inviteToken: string): Promise<void> => {
    await axios.post(`${API_BASE_URL}/api/v1/study-groups/invites/${inviteToken}/decline`);
  },

  getStats: async (): Promise<GroupStats> => {
    const response = await axios.get(`${API_BASE_URL}/api/v1/study-groups/stats`);
    return response.data;
  },
};

export default studyGroupsApi;
