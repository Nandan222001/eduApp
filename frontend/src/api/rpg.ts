import axios from 'axios';
import {
  CharacterStats,
  Equipment,
  SubjectRegion,
  BossBattle,
  LootDrop,
  SubjectPassport,
} from '../types/rpg';

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

export const rpgAPI = {
  getCharacterStats: async (userId: number): Promise<CharacterStats> => {
    const response = await api.get(`/api/v1/rpg/character/${userId}/stats`);
    return response.data;
  },

  getEquipment: async (userId: number): Promise<Equipment[]> => {
    const response = await api.get(`/api/v1/rpg/character/${userId}/equipment`);
    return response.data;
  },

  equipItem: async (userId: number, equipmentId: string): Promise<void> => {
    await api.post(`/api/v1/rpg/character/${userId}/equip`, { equipmentId });
  },

  getSubjectRegions: async (userId: number): Promise<SubjectRegion[]> => {
    const response = await api.get(`/api/v1/rpg/regions/${userId}`);
    return response.data;
  },

  startBossBattle: async (userId: number, regionId: string): Promise<BossBattle> => {
    const response = await api.post(`/api/v1/rpg/battle/start`, { userId, regionId });
    return response.data;
  },

  selectMethod: async (
    battleId: string,
    methodId: string
  ): Promise<{ battle: BossBattle; loot?: LootDrop }> => {
    const response = await api.post(`/api/v1/rpg/battle/${battleId}/action`, { methodId });
    return response.data;
  },

  getPassport: async (userId: number): Promise<SubjectPassport> => {
    const response = await api.get(`/api/v1/rpg/passport/${userId}`);
    return response.data;
  },

  addJournalEntry: async (
    userId: number,
    entry: { title: string; content: string; chapterId: string; mood: string; reflections: string }
  ): Promise<void> => {
    await api.post(`/api/v1/rpg/passport/${userId}/journal`, entry);
  },

  takeBorderTest: async (userId: number, testId: string): Promise<void> => {
    await api.post(`/api/v1/rpg/passport/${userId}/border-test/${testId}`);
  },
};

// Mock data for development/demo
export const mockCharacterStats: CharacterStats = {
  level: 15,
  currentXP: 3500,
  xpToNextLevel: 5000,
  health: 850,
  maxHealth: 1000,
  mana: 450,
  maxMana: 500,
  attack: 75,
  defense: 60,
};

export const mockEquipment: Equipment[] = [
  {
    id: '1',
    name: 'Calculus Blade',
    type: 'weapon',
    rarity: 'epic',
    stats: { attack: 50 },
    iconUrl: '/icons/sword.png',
  },
  {
    id: '2',
    name: 'Algebra Shield',
    type: 'armor',
    rarity: 'rare',
    stats: { defense: 40, health: 100 },
    iconUrl: '/icons/shield.png',
  },
  {
    id: '3',
    name: 'Wisdom Amulet',
    type: 'accessory',
    rarity: 'legendary',
    stats: { mana: 100, attack: 20 },
    iconUrl: '/icons/amulet.png',
  },
];

export const mockSubjectRegions: SubjectRegion[] = [
  {
    id: '1',
    name: 'Kingdom of Algebra',
    subject: 'Mathematics',
    status: 'complete',
    completionPercentage: 100,
    bossDefeated: true,
    chapterCount: 8,
    completedChapters: 8,
    color: '#4CAF50',
  },
  {
    id: '2',
    name: 'Empire of Physics',
    subject: 'Physics',
    status: 'in-progress',
    completionPercentage: 65,
    bossDefeated: false,
    chapterCount: 10,
    completedChapters: 6,
    color: '#2196F3',
  },
  {
    id: '3',
    name: 'Realm of Chemistry',
    subject: 'Chemistry',
    status: 'in-progress',
    completionPercentage: 40,
    bossDefeated: false,
    chapterCount: 12,
    completedChapters: 5,
    color: '#FF9800',
  },
  {
    id: '4',
    name: 'Territory of Biology',
    subject: 'Biology',
    status: 'locked',
    completionPercentage: 0,
    bossDefeated: false,
    chapterCount: 9,
    completedChapters: 0,
    color: '#9C27B0',
  },
];
