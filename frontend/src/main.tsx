import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App';
import ThemeWrapper from './components/ThemeWrapper';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { WebSocketProvider } from './contexts/WebSocketContext';
import { WebSocketConnectionStatus } from './components/common/WebSocketConnectionStatus';
import { initSentry } from './lib/sentry';
import { analytics } from './lib/analytics';
import { initWebVitals } from './lib/webVitals';
import './index.css';

initSentry();
analytics.init();
initWebVitals();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AccessibilityProvider>
          <WebSocketProvider>
            <ThemeWrapper>
              <App />
              <WebSocketConnectionStatus />
            </ThemeWrapper>
          </WebSocketProvider>
        </AccessibilityProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>
);
