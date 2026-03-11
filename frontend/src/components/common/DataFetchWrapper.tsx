import { ReactNode } from 'react';
import { SkeletonLoader } from './SkeletonLoader';
import { ErrorDisplay } from './ErrorDisplay';
import { EmptyState } from './EmptyState';

interface DataFetchWrapperProps<T> {
  loading: boolean;
  error?: Error | null;
  data: T | null | undefined;
  children: (data: T) => ReactNode;
  loadingComponent?: ReactNode;
  errorComponent?: ReactNode;
  emptyComponent?: ReactNode;
  onRetry?: () => void;
  showEmpty?: boolean;
  emptyCondition?: (data: T) => boolean;
  skeletonVariant?: 'card' | 'table' | 'list' | 'form' | 'chart' | 'dashboard';
  skeletonCount?: number;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
}

export function DataFetchWrapper<T>({
  loading,
  error,
  data,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
  onRetry,
  showEmpty = false,
  emptyCondition,
  skeletonVariant = 'card',
  skeletonCount = 3,
  emptyTitle,
  emptyMessage,
  emptyActionLabel,
  onEmptyAction,
}: DataFetchWrapperProps<T>) {
  if (loading) {
    return (
      <>{loadingComponent || <SkeletonLoader variant={skeletonVariant} count={skeletonCount} />}</>
    );
  }

  if (error) {
    return (
      <>
        {errorComponent || (
          <ErrorDisplay
            message="Failed to load data. Please try again."
            error={error}
            onRetry={onRetry}
          />
        )}
      </>
    );
  }

  if (!data) {
    return (
      <>
        {emptyComponent || (
          <EmptyState
            title={emptyTitle || 'No Data'}
            message={emptyMessage || 'No data available at the moment.'}
            actionLabel={emptyActionLabel}
            onAction={onEmptyAction}
            variant="card"
          />
        )}
      </>
    );
  }

  const isEmpty = emptyCondition ? emptyCondition(data) : false;

  if (showEmpty && isEmpty) {
    return (
      <>
        {emptyComponent || (
          <EmptyState
            title={emptyTitle || 'No Results'}
            message={emptyMessage || 'No results found matching your criteria.'}
            actionLabel={emptyActionLabel}
            onAction={onEmptyAction}
            variant="card"
          />
        )}
      </>
    );
  }

  return <>{children(data)}</>;
}

export default DataFetchWrapper;
