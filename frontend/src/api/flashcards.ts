import axios from 'axios';
import { isDemoUser, demoDataApi } from './demoDataApi';
import {
  Flashcard,
  FlashcardDeckCreateInput,
  FlashcardCreateInput,
  FlashcardDeckStats,
  FlashcardStudySessionUpdate,
  FlashcardDeckShare,
} from '../types/flashcard';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
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

export const flashcardApi = {
  // Deck operations
  listDecks: async (params?: {
    skip?: number;
    limit?: number;
    institution_id?: number;
    creator_id?: number;
    grade_id?: number;
    subject_id?: number;
    visibility?: string;
    search?: string;
  }) => {
    if (isDemoUser()) {
      return demoDataApi.flashcards.listDecks(params);
    }
    const response = await api.get('/flashcards/decks', { params });
    return response.data;
  },

  getDeck: async (deckId: number) => {
    if (isDemoUser()) {
      return demoDataApi.flashcards.getDeck(deckId);
    }
    const response = await api.get(`/flashcards/decks/${deckId}`);
    return response.data;
  },

  createDeck: async (deck: FlashcardDeckCreateInput) => {
    if (isDemoUser()) {
      return demoDataApi.flashcards.createDeck(deck);
    }
    const response = await api.post('/flashcards/decks', deck);
    return response.data;
  },

  createDeckWithCards: async (data: {
    deck: FlashcardDeckCreateInput;
    flashcards: Omit<FlashcardCreateInput, 'deck_id'>[];
  }) => {
    if (isDemoUser()) {
      return demoDataApi.flashcards.createDeckWithCards(data);
    }
    const response = await api.post('/flashcards/decks/bulk', data);
    return response.data;
  },

  updateDeck: async (deckId: number, updates: Partial<FlashcardDeckCreateInput>) => {
    if (isDemoUser()) {
      return demoDataApi.flashcards.updateDeck(deckId, updates);
    }
    const response = await api.put(`/flashcards/decks/${deckId}`, updates);
    return response.data;
  },

  deleteDeck: async (deckId: number) => {
    if (isDemoUser()) {
      return demoDataApi.flashcards.deleteDeck(deckId);
    }
    await api.delete(`/flashcards/decks/${deckId}`);
  },

  // Card operations
  listDeckCards: async (deckId: number) => {
    if (isDemoUser()) {
      return demoDataApi.flashcards.listDeckCards(deckId);
    }
    const response = await api.get(`/flashcards/decks/${deckId}/cards`);
    return response.data;
  },

  getCard: async (cardId: number) => {
    if (isDemoUser()) {
      return demoDataApi.flashcards.getCard(cardId);
    }
    const response = await api.get(`/flashcards/cards/${cardId}`);
    return response.data;
  },

  createCard: async (card: FlashcardCreateInput) => {
    if (isDemoUser()) {
      return demoDataApi.flashcards.createCard(card);
    }
    const response = await api.post('/flashcards/cards', card);
    return response.data;
  },

  updateCard: async (cardId: number, updates: Partial<FlashcardCreateInput>) => {
    if (isDemoUser()) {
      return demoDataApi.flashcards.updateCard(cardId, updates);
    }
    const response = await api.put(`/flashcards/cards/${cardId}`, updates);
    return response.data;
  },

  deleteCard: async (cardId: number) => {
    if (isDemoUser()) {
      return demoDataApi.flashcards.deleteCard(cardId);
    }
    await api.delete(`/flashcards/cards/${cardId}`);
  },

  // Sharing
  shareDeck: async (
    deckId: number,
    shareData: Omit<FlashcardDeckShare, 'id' | 'deck_id' | 'shared_at'>
  ) => {
    if (isDemoUser()) {
      return demoDataApi.flashcards.shareDeck(deckId, shareData);
    }
    const response = await api.post(`/flashcards/decks/${deckId}/share`, shareData);
    return response.data;
  },

  listDeckShares: async (deckId: number) => {
    if (isDemoUser()) {
      return demoDataApi.flashcards.listDeckShares(deckId);
    }
    const response = await api.get(`/flashcards/decks/${deckId}/shares`);
    return response.data;
  },

  unshareDeck: async (shareId: number) => {
    if (isDemoUser()) {
      return demoDataApi.flashcards.unshareDeck(shareId);
    }
    await api.delete(`/flashcards/decks/shares/${shareId}`);
  },

  // Study progress
  getStudyProgress: async (deckId: number, userId: number) => {
    if (isDemoUser()) {
      return demoDataApi.flashcards.getStudyProgress(deckId, userId);
    }
    const response = await api.get(`/flashcards/decks/${deckId}/progress/${userId}`);
    return response.data;
  },

  getDeckStats: async (deckId: number, userId: number): Promise<FlashcardDeckStats> => {
    if (isDemoUser()) {
      return demoDataApi.flashcards.getDeckStats(deckId, userId);
    }
    const response = await api.get(`/flashcards/decks/${deckId}/stats/${userId}`);
    return response.data;
  },

  // Study session
  updateStudySession: async (
    cardId: number,
    userId: number,
    update: FlashcardStudySessionUpdate
  ) => {
    if (isDemoUser()) {
      return demoDataApi.flashcards.updateStudySession(cardId, userId, update);
    }
    const response = await api.post(`/flashcards/cards/${cardId}/study/${userId}`, update);
    return response.data;
  },

  getDueCards: async (deckId: number, userId: number): Promise<Flashcard[]> => {
    if (isDemoUser()) {
      return demoDataApi.flashcards.getDueCards(deckId, userId);
    }
    const response = await api.get(`/flashcards/decks/${deckId}/due-cards/${userId}`);
    return response.data;
  },
};
