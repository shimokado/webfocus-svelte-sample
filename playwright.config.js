import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: {
    timeout: 10_000
  },
  reporter: [
    ['html', { outputFolder: 'test-results/html', open: 'never' }],
    ['list']
  ],
  use: {
    baseURL: 'http://localhost/approot/svelte/',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  }
});
