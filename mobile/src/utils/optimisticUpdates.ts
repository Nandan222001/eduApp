import { AppDispatch } from '@store';
import {
  updateAssignmentOptimistic,
  updateProfileOptimistic,
} from '@store/slices/studentDataSlice';
import { offlineQueueManager, QueuedRequestType } from './offlineQueue';
import { SubmitAssignmentData, assignmentsApi } from '@api/assignments';
import { apiClient } from '@api/client';
import type { Profile, Assignment } from '../types/student';

export const submitAssignmentWithOptimisticUpdate = async (
  dispatch: AppDispatch,
  assignmentId: number,
  submissionData: SubmitAssignmentData,
  isOnline: boolean
): Promise<void> => {
  dispatch(
    updateAssignmentOptimistic({
      id: assignmentId,
      updates: {
        status: 'submitted',
        submission_date: new Date().toISOString(),
      },
    })
  );

  if (!isOnline) {
    await offlineQueueManager.addRequest(
      QueuedRequestType.ASSIGNMENT_SUBMISSION,
      '/api/v1/submissions',
      'POST',
      submissionData
    );
    return;
  }

  try {
    await assignmentsApi.submitAssignment(submissionData);
  } catch (error) {
    dispatch(
      updateAssignmentOptimistic({
        id: assignmentId,
        updates: {
          status: 'pending',
          submission_date: undefined,
        },
      })
    );

    await offlineQueueManager.addRequest(
      QueuedRequestType.ASSIGNMENT_SUBMISSION,
      '/api/v1/submissions',
      'POST',
      submissionData
    );
    throw error;
  }
};

export const checkInAttendanceWithOptimisticUpdate = async (
  classId: number,
  location?: { latitude: number; longitude: number },
  isOnline: boolean = true
): Promise<void> => {
  const checkInData = {
    classId,
    timestamp: new Date().toISOString(),
    location,
  };

  if (!isOnline) {
    await offlineQueueManager.addRequest(
      QueuedRequestType.ATTENDANCE_MARKING,
      '/api/v1/attendance/check-in',
      'POST',
      checkInData
    );
    return;
  }

  try {
    await apiClient.post('/api/v1/attendance/check-in', checkInData);
  } catch (error) {
    await offlineQueueManager.addRequest(
      QueuedRequestType.ATTENDANCE_MARKING,
      '/api/v1/attendance/check-in',
      'POST',
      checkInData
    );
    throw error;
  }
};

export const updateProfileWithOptimisticUpdate = async (
  dispatch: AppDispatch,
  updates: Partial<Profile>,
  isOnline: boolean
): Promise<void> => {
  dispatch(updateProfileOptimistic(updates));

  if (!isOnline) {
    await offlineQueueManager.addRequest(
      QueuedRequestType.PROFILE_UPDATE,
      '/api/v1/profile',
      'PUT',
      updates
    );
    return;
  }

  try {
    await apiClient.put('/api/v1/profile', updates);
  } catch (error) {
    await offlineQueueManager.addRequest(
      QueuedRequestType.PROFILE_UPDATE,
      '/api/v1/profile',
      'PUT',
      updates
    );
    throw error;
  }
};

export const getCachedDataAge = (lastSyncTime: number | null): string | null => {
  if (!lastSyncTime) {
    return null;
  }

  const ageInMinutes = Math.floor((Date.now() - lastSyncTime) / (1000 * 60));

  if (ageInMinutes < 1) {
    return 'Just now';
  } else if (ageInMinutes < 60) {
    return `${ageInMinutes}m ago`;
  } else if (ageInMinutes < 1440) {
    return `${Math.floor(ageInMinutes / 60)}h ago`;
  } else {
    return `${Math.floor(ageInMinutes / 1440)}d ago`;
  }
};

export const shouldRefreshData = (
  lastSyncTime: number | null,
  maxAgeMinutes: number = 15
): boolean => {
  if (!lastSyncTime) {
    return true;
  }

  const ageInMinutes = (Date.now() - lastSyncTime) / (1000 * 60);
  return ageInMinutes > maxAgeMinutes;
};
