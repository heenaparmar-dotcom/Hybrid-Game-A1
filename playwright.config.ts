import { defineConfig } from '@playwright/test';

// Uses the Chrome already installed on the machine (no browser download needed).
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  retries: 0,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:5173', channel: 'chrome', trace: 'retain-on-failure' },
  webServer: { command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: true, timeout: 60_000 },
});
