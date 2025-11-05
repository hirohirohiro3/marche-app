import { initializeTestEnvironment } from './test-utils';
import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('--- Starting global setup for tests ---');

  // Load environment variables from .env for local testing
  if (process.env.NODE_ENV !== 'production') {
    (await import('dotenv')).config({ path: '.env.local' });
  }

  // Ensure Firebase Admin is initialized before any tests run
  initializeTestEnvironment();

  console.log('--- Global setup complete ---');
}

export default globalSetup;
