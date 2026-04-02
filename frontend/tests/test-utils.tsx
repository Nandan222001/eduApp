import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import type { UserRole } from '@/types/auth';
import {
  setupDemoStudent,
  setupDemoTeacher,
  setupDemoParent,
  setupDemoAdmin,
  setupRegularUserAuth,
  setupUnauthenticatedState,
} from './setup';

/**
 * Test Utilities for React Component Testing
 *
 * This file provides wrapper components and render utilities for testing
 * React components with necessary providers and context.
 */

// ============================================================================
// Theme Setup
// ============================================================================

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

// ============================================================================
// Test Providers
// ============================================================================

interface AllTheProvidersProps {
  children: React.ReactNode;
}

/**
 * Wrapper component that includes all necessary providers for testing
 */
function AllTheProviders({ children }: AllTheProvidersProps) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

// ============================================================================
// Custom Render Function
// ============================================================================

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  /**
   * Pre-configure auth state before rendering
   */
  authState?:
    | 'demo-student'
    | 'demo-teacher'
    | 'demo-parent'
    | 'demo-admin'
    | 'regular'
    | 'unauthenticated';
  /**
   * For 'regular' authState, specify the role
   */
  regularUserRole?: UserRole;
  /**
   * For 'regular' authState, specify the email
   */
  regularUserEmail?: string;
}

/**
 * Custom render function that wraps components with all necessary providers
 *
 * @example
 * ```tsx
 * renderWithProviders(<MyComponent />, { authState: 'demo-student' });
 * ```
 */
function renderWithProviders(ui: ReactElement, options: CustomRenderOptions = {}) {
  const { authState, regularUserRole = 'student', regularUserEmail, ...renderOptions } = options;

  // Set up auth state before rendering
  if (authState === 'demo-student') {
    setupDemoStudent();
  } else if (authState === 'demo-teacher') {
    setupDemoTeacher();
  } else if (authState === 'demo-parent') {
    setupDemoParent();
  } else if (authState === 'demo-admin') {
    setupDemoAdmin();
  } else if (authState === 'regular') {
    setupRegularUserAuth(regularUserRole, regularUserEmail);
  } else if (authState === 'unauthenticated') {
    setupUnauthenticatedState();
  }

  return render(ui, { wrapper: AllTheProviders, ...renderOptions });
}

// ============================================================================
// Role-Specific Render Functions
// ============================================================================

/**
 * Renders component with demo student context
 */
function renderWithDemoStudent(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return renderWithProviders(ui, { ...options, authState: 'demo-student' });
}

/**
 * Renders component with demo teacher context
 */
function renderWithDemoTeacher(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return renderWithProviders(ui, { ...options, authState: 'demo-teacher' });
}

/**
 * Renders component with demo parent context
 */
function renderWithDemoParent(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return renderWithProviders(ui, { ...options, authState: 'demo-parent' });
}

/**
 * Renders component with demo admin context
 */
function renderWithDemoAdmin(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return renderWithProviders(ui, { ...options, authState: 'demo-admin' });
}

/**
 * Renders component with regular user context
 */
function renderWithRegularUser(
  ui: ReactElement,
  role: UserRole = 'student',
  email?: string,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return renderWithProviders(ui, {
    ...options,
    authState: 'regular',
    regularUserRole: role,
    regularUserEmail: email,
  });
}

/**
 * Renders component without authentication
 */
function renderUnauthenticated(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return renderWithProviders(ui, { ...options, authState: 'unauthenticated' });
}

// ============================================================================
// Wait Utilities
// ============================================================================

/**
 * Waits for a condition to be true
 */
async function waitForCondition(
  condition: () => boolean,
  timeout: number = 5000,
  interval: number = 50
): Promise<void> {
  const startTime = Date.now();

  while (!condition()) {
    if (Date.now() - startTime > timeout) {
      throw new Error('Timeout waiting for condition');
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}

/**
 * Delays execution for a specified time
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ============================================================================
// Mock Event Creators
// ============================================================================

/**
 * Creates a mock file for file upload testing
 */
function createMockFile(
  name: string = 'test.pdf',
  _size: number = 1024,
  type: string = 'application/pdf'
): File {
  const blob = new Blob(['test content'], { type });
  return new File([blob], name, { type });
}

/**
 * Creates a mock image file
 */
function createMockImageFile(
  name: string = 'test.jpg',
  _size: number = 1024,
  type: string = 'image/jpeg'
): File {
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;

  return new Promise<File>((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(new File([blob], name, { type }));
      }
    }, type);
  }) as unknown as File;
}

/**
 * Creates a mock change event for input elements
 */
function createMockChangeEvent(value: string): React.ChangeEvent<HTMLInputElement> {
  return {
    target: { value },
  } as React.ChangeEvent<HTMLInputElement>;
}

/**
 * Creates a mock file change event
 */
function createMockFileChangeEvent(files: File[]): React.ChangeEvent<HTMLInputElement> {
  return {
    target: { files },
  } as unknown as React.ChangeEvent<HTMLInputElement>;
}

// ============================================================================
// Query Client Utilities
// ============================================================================

/**
 * Creates a test query client with sensible defaults
 */
function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// ============================================================================
// Accessibility Testing Utilities
// ============================================================================

/**
 * Gets all elements with a specific ARIA role
 */
function getAllByAriaRole(container: HTMLElement, role: string): HTMLElement[] {
  return Array.from(container.querySelectorAll(`[role="${role}"]`));
}

/**
 * Checks if an element is visible to screen readers
 */
function isVisibleToScreenReader(element: HTMLElement): boolean {
  const ariaHidden = element.getAttribute('aria-hidden');
  const style = window.getComputedStyle(element);

  return (
    ariaHidden !== 'true' &&
    style.visibility !== 'hidden' &&
    style.display !== 'none' &&
    parseFloat(style.opacity) > 0
  );
}

// ============================================================================
// Form Testing Utilities
// ============================================================================

/**
 * Fills a form with test data
 */
async function fillForm(container: HTMLElement, data: Record<string, string>): Promise<void> {
  for (const [name, value] of Object.entries(data)) {
    const input = container.querySelector<HTMLInputElement>(`[name="${name}"]`);
    if (input) {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }
}

/**
 * Submits a form
 */
async function submitForm(form: HTMLFormElement): Promise<void> {
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}

// ============================================================================
// Exports
// ============================================================================

export {
  renderWithProviders,
  renderWithDemoStudent,
  renderWithDemoTeacher,
  renderWithDemoParent,
  renderWithDemoAdmin,
  renderWithRegularUser,
  renderUnauthenticated,
  AllTheProviders,
  waitForCondition,
  delay,
  createMockFile,
  createMockImageFile,
  createMockChangeEvent,
  createMockFileChangeEvent,
  createTestQueryClient,
  getAllByAriaRole,
  isVisibleToScreenReader,
  fillForm,
  submitForm,
};

// Re-export everything from @testing-library/react
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
