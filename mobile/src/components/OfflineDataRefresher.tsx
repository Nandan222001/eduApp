import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@store/hooks';
import {
  fetchProfile,
  fetchDashboard,
  fetchAssignments,
  fetchGrades,
  fetchAttendance,
} from '@store/slices/studentDataSlice';
import { shouldRefreshData } from '@utils/optimisticUpdates';

interface OfflineDataRefresherProps {
  children: React.ReactNode;
  autoRefresh?: boolean;
  refreshIntervalMinutes?: number;
}

export const OfflineDataRefresher: React.FC<OfflineDataRefresherProps> = ({
  children,
  autoRefresh = true,
  refreshIntervalMinutes = 15,
}) => {
  const dispatch = useAppDispatch();
  const isOnline = useAppSelector(state => state.offline.isOnline);
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  const {
    profileLastSync,
    dashboardLastSync,
    assignmentsLastSync,
    gradesLastSync,
    attendanceLastSync,
  } = useAppSelector(state => state.studentData);

  useEffect(() => {
    if (!isAuthenticated || !isOnline || !autoRefresh) {
      return;
    }

    const refreshData = async () => {
      const refreshPromises = [];

      if (shouldRefreshData(profileLastSync, refreshIntervalMinutes)) {
        refreshPromises.push(dispatch(fetchProfile()));
      }

      if (shouldRefreshData(dashboardLastSync, refreshIntervalMinutes)) {
        refreshPromises.push(dispatch(fetchDashboard()));
      }

      if (shouldRefreshData(assignmentsLastSync, refreshIntervalMinutes)) {
        refreshPromises.push(dispatch(fetchAssignments()));
      }

      if (shouldRefreshData(gradesLastSync, refreshIntervalMinutes)) {
        refreshPromises.push(dispatch(fetchGrades(undefined)));
      }

      if (shouldRefreshData(attendanceLastSync, refreshIntervalMinutes)) {
        refreshPromises.push(dispatch(fetchAttendance()));
      }

      if (refreshPromises.length > 0) {
        await Promise.allSettled(refreshPromises);
      }
    };

    refreshData();

    const intervalId = setInterval(refreshData, refreshIntervalMinutes * 60 * 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [
    dispatch,
    isOnline,
    isAuthenticated,
    autoRefresh,
    refreshIntervalMinutes,
    profileLastSync,
    dashboardLastSync,
    assignmentsLastSync,
    gradesLastSync,
    attendanceLastSync,
  ]);

  return <>{children}</>;
};
