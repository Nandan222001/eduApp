import { ReactNode, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '../../hooks/useToast';
import axios from 'axios';

interface QueryErrorHandlerProps {
  children: ReactNode;
}

export const QueryErrorHandler = ({ children }: QueryErrorHandlerProps) => {
  const queryClient = useQueryClient();
  const { showError } = useToast();

  useEffect(() => {
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === 'updated' && event.query.state.status === 'error') {
        const error = event.query.state.error;

        let errorMessage = 'An error occurred while fetching data';

        if (axios.isAxiosError(error)) {
          if (error.response) {
            errorMessage = error.response.data?.message || error.message;
          } else if (error.request) {
            errorMessage = 'Network error. Please check your connection.';
          } else {
            errorMessage = error.message;
          }
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        showError(errorMessage);
      }
    });

    return () => unsubscribe();
  }, [queryClient, showError]);

  return <>{children}</>;
};

export default QueryErrorHandler;
