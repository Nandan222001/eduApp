import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
  submitAssignmentWithOptimisticUpdate,
  checkInAttendanceWithOptimisticUpdate,
  updateProfileWithOptimisticUpdate,
} from '@utils/optimisticUpdates';
import { SubmitAssignmentData } from '@api/assignments';
import type { Profile } from '../types/student';

export const useOptimisticUpdate = () => {
  const dispatch = useAppDispatch();
  const isOnline = useAppSelector(state => state.offline.isOnline);

  const submitAssignment = useCallback(
    async (assignmentId: number, submissionData: SubmitAssignmentData) => {
      return submitAssignmentWithOptimisticUpdate(dispatch, assignmentId, submissionData, isOnline);
    },
    [dispatch, isOnline]
  );

  const checkInAttendance = useCallback(
    async (classId: number, location?: { latitude: number; longitude: number }) => {
      return checkInAttendanceWithOptimisticUpdate(classId, location, isOnline);
    },
    [isOnline]
  );

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      return updateProfileWithOptimisticUpdate(dispatch, updates, isOnline);
    },
    [dispatch, isOnline]
  );

  return {
    submitAssignment,
    checkInAttendance,
    updateProfile,
    isOnline,
  };
};
