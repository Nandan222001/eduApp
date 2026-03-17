import { QueryClient, QueryCache, MutationCache } from '@tanstack/react-query';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      console.error(`Query error [${query.queryKey}]:`, error);
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, variables, context, mutation) => {
      console.error(`Mutation error:`, error);
    },
  }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403) {
          return false;
        }
        return failureCount < MAX_RETRIES;
      },
      retryDelay: (attemptIndex) => Math.min(RETRY_DELAY * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      networkMode: 'online',
    },
    mutations: {
      retry: (failureCount, error: any) => {
        if (error?.status === 401 || error?.status === 403 || error?.status === 422) {
          return false;
        }
        return failureCount < 2;
      },
      retryDelay: RETRY_DELAY,
      networkMode: 'online',
    },
  },
});
