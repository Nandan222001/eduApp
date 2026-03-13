import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('Starting global teardown...');
  
  console.log('Global teardown complete');
}

export default globalTeardown;
