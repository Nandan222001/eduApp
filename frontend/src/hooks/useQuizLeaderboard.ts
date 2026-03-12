import { useState, useEffect } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';

interface LeaderboardEntry {
  rank: number;
  user_id: number;
  user_name: string;
  best_score: number;
  best_percentage: number;
  best_time_seconds: number;
  total_attempts: number;
}

interface LeaderboardUpdate {
  type: 'leaderboard_update';
  quiz_id: number;
  leaderboard: LeaderboardEntry[];
  timestamp?: string;
}

export const useQuizLeaderboard = (quizId: number) => {
  const { subscribe, unsubscribe, onMessage } = useWebSocket();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);

  useEffect(() => {
    const room = `quiz_${quizId}`;
    subscribe([room]);

    const unsubscribeLeaderboard = onMessage('leaderboard_update', (message) => {
      const update = message as unknown as LeaderboardUpdate;
      if (update.quiz_id === quizId) {
        setLeaderboard(update.leaderboard);
        setLastUpdate(update.timestamp || new Date().toISOString());
      }
    });

    return () => {
      unsubscribe([room]);
      unsubscribeLeaderboard();
    };
  }, [quizId, subscribe, unsubscribe, onMessage]);

  return {
    leaderboard,
    lastUpdate,
  };
};
