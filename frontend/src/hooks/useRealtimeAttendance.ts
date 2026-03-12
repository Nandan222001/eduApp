import { useEffect, useCallback, useState } from 'react';
import { useWebSocket } from '@/contexts/WebSocketContext';
import { useToast } from './useToast';
import { useQueryClient } from '@tanstack/react-query';

interface AttendanceUpdate {
  type: 'attendance_update';
  student_id: number;
  student_name: string;
  date: string;
  status: string;
  timestamp?: string;
}

export const useRealtimeAttendance = (studentIds?: number[]) => {
  const { onMessage } = useWebSocket();
  const { showInfo } = useToast();
  const queryClient = useQueryClient();
  const [recentUpdates, setRecentUpdates] = useState<AttendanceUpdate[]>([]);

  useEffect(() => {
    const unsubscribeAttendance = onMessage('attendance_update', (message) => {
      const update = message as unknown as AttendanceUpdate;

      if (!studentIds || studentIds.includes(update.student_id)) {
        const statusEmoji =
          {
            present: '✓',
            absent: '✗',
            late: '⏰',
            half_day: '◐',
          }[update.status] || '';

        showInfo(
          `${statusEmoji} Attendance updated for ${update.student_name} on ${new Date(
            update.date
          ).toLocaleDateString()}: ${update.status}`
        );

        setRecentUpdates((prev) => [update, ...prev].slice(0, 10));

        queryClient.invalidateQueries({ queryKey: ['attendance'] });
        queryClient.invalidateQueries({ queryKey: ['attendanceSummary'] });
      }
    });

    return () => {
      unsubscribeAttendance();
    };
  }, [onMessage, showInfo, queryClient, studentIds]);

  const clearRecentUpdates = useCallback(() => {
    setRecentUpdates([]);
  }, []);

  return {
    recentUpdates,
    clearRecentUpdates,
  };
};
