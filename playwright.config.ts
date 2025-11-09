import { defineConfig, devices } from '@playwright/test';

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  globalSetup: './tests/global-setup.ts',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },

  timeout: process.env.CI ? 45 * 1000 : 30 * 1000,

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 120000, // 2 minutes
    env: {
      VITE_API_KEY: process.env.VITE_API_KEY || '',
      VITE_AUTH_DOMAIN: process.env.VITE_AUTH_DOMAIN || '',
      VITE_PROJECT_ID: process.env.VITE_PROJECT_ID || '',
      VITE_STORAGE_BUCKET: process.env.VITE_STORAGE_BUCKET || '',
      VITE_MESSAGING_SENDER_ID: process.env.VITE_MESSAGING_SENDER_ID || '',
      VITE_APP_ID: process.env.VITE_APP_ID || '',
      VITE_MEASUREMENT_ID: process.env.VITE_MEASUREMENT_ID || '',
      VITE_RECAPTCHA_SITE_KEY: process.env.VITE_RECAPTCHA_SITE_KEY || '',
    },
  },
});
