import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentApi, GradesParams } from '../api/student';
import { assignmentsApi, SubmitAssignmentData, AssignmentsListParams } from '../api/assignments';
import { isDemoUser, demoDataApi } from '../api/demoDataApi';

const DEFAULT_STALE_TIME = 5 * 60 * 1000;
const DEFAULT_RETRY = 3;
const DEFAULT_RETRY_DELAY = (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000);

export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      if (isDemoUser()) {
        return await demoDataApi.student.getProfile();
      }
      const response = await studentApi.getProfile();
      return response.data;
    },
    staleTime: DEFAULT_STALE_TIME,
    retry: DEFAULT_RETRY,
    retryDelay: DEFAULT_RETRY_DELAY,
  });
};

export const useDashboard = () => {
  return useQuery({
    queryKey: ['student-dashboard'],
    queryFn: async () => {
      if (isDemoUser()) {
        return await demoDataApi.student.getDashboard();
      }
      const response = await studentApi.getDashboard();
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
    retry: DEFAULT_RETRY,
    retryDelay: DEFAULT_RETRY_DELAY,
  });
};

export const useAttendanceSummary = () => {
  return useQuery({
    queryKey: ['attendance', 'summary'],
    queryFn: async () => {
      if (isDemoUser()) {
        return await demoDataApi.student.getAttendance();
      }
      const response = await studentApi.getAttendanceSummary();
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
    retry: DEFAULT_RETRY,
    retryDelay: DEFAULT_RETRY_DELAY,
  });
};

export const useAssignments = () => {
  return useQuery({
    queryKey: ['assignments'],
    queryFn: async () => {
      if (isDemoUser()) {
        return await demoDataApi.student.getAssignments();
      }
      const response = await studentApi.getAssignments();
      return response.data;
    },
    staleTime: 3 * 60 * 1000,
    retry: DEFAULT_RETRY,
    retryDelay: DEFAULT_RETRY_DELAY,
  });
};

export const useGrades = (params?: GradesParams) => {
  return useQuery({
    queryKey: ['grades', params?.term, params?.subject],
    queryFn: async () => {
      if (isDemoUser()) {
        return await demoDataApi.student.getGrades();
      }
      const response = await studentApi.getGrades(params);
      return response.data;
    },
    staleTime: DEFAULT_STALE_TIME,
    retry: DEFAULT_RETRY,
    retryDelay: DEFAULT_RETRY_DELAY,
  });
};

export const useAIPrediction = () => {
  return useQuery({
    queryKey: ['ai-prediction'],
    queryFn: async () => {
      if (isDemoUser()) {
        return await demoDataApi.student.getAIPredictionDashboard();
      }
      const response = await studentApi.getAIPredictionDashboard();
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
    retry: DEFAULT_RETRY,
    retryDelay: DEFAULT_RETRY_DELAY,
  });
};

export const useWeakAreas = () => {
  return useQuery({
    queryKey: ['weak-areas'],
    queryFn: async () => {
      if (isDemoUser()) {
        return await demoDataApi.student.getWeakAreas();
      }
      const response = await studentApi.getWeakAreas();
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
    retry: DEFAULT_RETRY,
    retryDelay: DEFAULT_RETRY_DELAY,
  });
};

export const useGamification = () => {
  return useQuery({
    queryKey: ['gamification'],
    queryFn: async () => {
      if (isDemoUser()) {
        return await demoDataApi.student.getGamification();
      }
      const response = await studentApi.getGamification();
      return response.data;
    },
    staleTime: 1 * 60 * 1000,
    retry: DEFAULT_RETRY,
    retryDelay: DEFAULT_RETRY_DELAY,
  });
};

export const useTimetable = () => {
  return useQuery({
    queryKey: ['timetable'],
    queryFn: async () => {
      const response = await studentApi.getTimetable();
      return response.data;
    },
    staleTime: 10 * 60 * 1000,
    retry: DEFAULT_RETRY,
    retryDelay: DEFAULT_RETRY_DELAY,
  });
};

export const useAssignmentsList = (params?: AssignmentsListParams) => {
  return useQuery({
    queryKey: ['assignments', params?.status, params?.page, params?.limit],
    queryFn: async () => {
      const response = await assignmentsApi.getAssignments(params);
      return response.data;
    },
    staleTime: 2 * 60 * 1000,
    retry: DEFAULT_RETRY,
    retryDelay: DEFAULT_RETRY_DELAY,
  });
};

export const useAssignmentDetail = (assignmentId: string) => {
  return useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: async () => {
      const response = await assignmentsApi.getAssignmentDetail(assignmentId);
      return response.data;
    },
    enabled: !!assignmentId,
    staleTime: 2 * 60 * 1000,
    retry: DEFAULT_RETRY,
    retryDelay: DEFAULT_RETRY_DELAY,
  });
};

export const useSubmitAssignment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubmitAssignmentData) => assignmentsApi.submitAssignment(data),
    onMutate: async newSubmission => {
      await queryClient.cancelQueries({
        queryKey: ['assignment', newSubmission.assignmentId.toString()],
      });

      const previousAssignment = queryClient.getQueryData([
        'assignment',
        newSubmission.assignmentId.toString(),
      ]);

      queryClient.setQueryData(
        ['assignment', newSubmission.assignmentId.toString()],
        (old: any) => ({
          ...old,
          status: 'submitted',
          submittedAt: new Date().toISOString(),
        })
      );

      return { previousAssignment };
    },
    onError: (err, newSubmission, context) => {
      if (context?.previousAssignment) {
        queryClient.setQueryData(
          ['assignment', newSubmission.assignmentId.toString()],
          context.previousAssignment
        );
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['assignment', variables.assignmentId.toString()],
      });
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });
    },
  });
};

export const useUpdateSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      submissionId,
      data,
    }: {
      submissionId: number;
      data: Partial<SubmitAssignmentData>;
    }) => assignmentsApi.updateSubmission(submissionId, data),
    onSuccess: (data, variables) => {
      if (variables.data.assignmentId) {
        queryClient.invalidateQueries({
          queryKey: ['assignment', variables.data.assignmentId.toString()],
        });
      }
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });
    },
  });
};

export const useDeleteSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (submissionId: number) => assignmentsApi.deleteSubmission(submissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['student-dashboard'] });
    },
  });
};
