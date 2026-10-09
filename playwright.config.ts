import { defineConfig } from '@playwright/test';

// Uses the Chrome already installed on the machine (no browser download needed).
// Set BASE_URL to run the same tests against a deployed copy, e.g. BASE_URL=https://example.github.io/Hybrid-Game-A1/
const baseURL = process.env.BASE_URL ?? 'http://localhost:5173/';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  retries: 0,
  // Two browsers at a time keeps the long tests (real-time dances) reliable on a laptop with limited memory.
  workers: 2,
  reporter: [['list']],
  use: { baseURL, channel: 'chrome', trace: 'off' },
  webServer: process.env.BASE_URL ? undefined : { command: 'npm run dev', url: 'http://localhost:5173', reuseExistingServer: true, timeout: 60_000 },
});
