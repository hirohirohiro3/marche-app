import './test-utils'; // This will run the initialization code in test-utils
import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('--- Starting global setup for tests ---');

  // The import './test-utils' is enough to initialize Firebase.
  // The dotenv import is also handled within test-utils if needed,
  // but let's keep it here for clarity during global setup.
  if (process.env.NODE_ENV !== 'production') {
    (await import('dotenv')).config({ path: '.env.local' });
  }

  console.log('--- Global setup complete ---');
}

export default globalSetup;
