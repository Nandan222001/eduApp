/**
 * E2E Test Suite - Main Index
 * 
 * This file serves as the main entry point for the E2E test suite.
 * It exports all page objects, fixtures, and utilities for easy importing.
 */

// Page Objects
export * from './page-objects';

// Fixtures
export { TEST_USERS, TEST_ASSIGNMENTS, TEST_ATTENDANCE, TEST_SUBSCRIPTION_PLANS, TEST_CHAT_MESSAGES, TEST_NOTIFICATION, TEST_AI_PREDICTION_DATA } from './fixtures/test-data';
export { setAuthState, clearAuthState } from './fixtures/auth-state';
export { mockApiResponses } from './fixtures/mock-api-responses';

// Utilities
export { waitForNetworkIdle, waitForToast, fillForm, waitForApiResponse, isInViewport, scrollIntoView, takeScreenshot, waitForStable, checkA11y, setSlowNetwork, resetNetwork, generateRandomEmail, getTimestamp } from './utils/helpers';
export { test, expect } from './utils/test-helpers';
export { setupApiMocks, mockFileUpload, mockWebSocket, mockSlowNetwork, mockApiFailure } from './utils/api-mocks';
export { setupCustomMatchers } from './utils/custom-matchers';
