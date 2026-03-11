import { ReactNode } from 'react';
import { UseQueryResult } from '@tanstack/react-query';
import { SkeletonLoader } from './SkeletonLoader';
import { ErrorDisplay } from './ErrorDisplay';
import { EmptyState } from './EmptyState';

interface RetryableQueryProps<T> {
  query: UseQueryResult<T, Error>;
  loadingComponent?: ReactNode;
  errorComponent?: ReactNode;
  emptyComponent?: ReactNode;
  children: (data: T) => ReactNode;
  showEmpty?: boolean;
  emptyCondition?: (data: T) => boolean;
  skeletonVariant?: 'card' | 'table' | 'list' | 'form' | 'chart' | 'dashboard';
  skeletonCount?: number;
}

export function RetryableQuery<T>({
  query,
  loadingComponent,
  errorComponent,
  emptyComponent,
  children,
  showEmpty = false,
  emptyCondition,
  skeletonVariant = 'card',
  skeletonCount = 3,
}: RetryableQueryProps<T>) {
  if (query.isLoading) {
    return (
      <>{loadingComponent || <SkeletonLoader variant={skeletonVariant} count={skeletonCount} />}</>
    );
  }

  if (query.isError) {
    return (
      <>
        {errorComponent || (
          <ErrorDisplay
            message="Failed to load data. Please try again."
            error={query.error}
            onRetry={() => query.refetch()}
          />
        )}
      </>
    );
  }

  if (!query.data) {
    return (
      <>
        {emptyComponent || (
          <EmptyState title="No Data" message="No data available at the moment." variant="card" />
        )}
      </>
    );
  }

  const isEmpty = emptyCondition ? emptyCondition(query.data) : false;

  if (showEmpty && isEmpty) {
    return (
      <>
        {emptyComponent || (
          <EmptyState
            title="No Results"
            message="No results found matching your criteria."
            variant="card"
          />
        )}
      </>
    );
  }

  return <>{children(query.data)}</>;
}

export default RetryableQuery;
