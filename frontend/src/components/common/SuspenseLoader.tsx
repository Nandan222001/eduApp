import { Suspense, ReactNode } from 'react';
import { PageLoader } from './PageLoader';

interface SuspenseLoaderProps {
  children: ReactNode;
  fallback?: ReactNode;
  message?: string;
}

export const SuspenseLoader = ({
  children,
  fallback,
  message = 'Loading...',
}: SuspenseLoaderProps) => {
  return <Suspense fallback={fallback || <PageLoader message={message} />}>{children}</Suspense>;
};

export default SuspenseLoader;
