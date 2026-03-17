import { useMutation, UseMutationOptions, UseMutationResult } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { getErrorMessage } from '../utils/apiErrorHandler';

interface MutationWithErrorOptions<TData, TError, TVariables, TContext> extends UseMutationOptions<
  TData,
  TError,
  TVariables,
  TContext
> {
  showErrorAlert?: boolean;
  errorTitle?: string;
}

export function useMutationWithError<
  TData = unknown,
  TError = unknown,
  TVariables = void,
  TContext = unknown,
>(
  options: MutationWithErrorOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const { showErrorAlert = true, errorTitle = 'Error', onError, ...mutationOptions } = options;

  return useMutation({
    ...mutationOptions,
    onError: (error, variables, context) => {
      if (showErrorAlert) {
        const errorMessage = getErrorMessage(error);
        Alert.alert(errorTitle, errorMessage);
      }

      if (onError) {
        onError(error, variables, context);
      }
    },
  });
}
