import { test, expect } from '@playwright/test';

const DEFAULT_USER = process.env.WF_USER || 'admin';
const DEFAULT_PASS = process.env.WF_PASS || 'admin';

async function login(page, username = DEFAULT_USER, password = DEFAULT_PASS) {
  await page.fill('#username', username);
  await page.fill('#password', password);
  await page.getByRole('button', { name: 'ログイン' }).click();
  await expect(page.getByText('ユーザー:', { exact: false })).toBeVisible();
}

test('app loads at approot', async ({ page }) => {
  const response = await page.goto('index.htm', { waitUntil: 'domcontentloaded' });
  expect(response).not.toBeNull();
  expect(response.status()).toBe(200);

  const content = await page.content();
  expect(content).toContain('id="app"');
  await expect(page).toHaveTitle('WebFOCUS レポート管理');
});

test('login shows report browser', async ({ page }) => {
  await page.goto('index.htm', { waitUntil: 'domcontentloaded' });
  await login(page);

  await expect(page.getByRole('button', { name: 'ログアウト' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reports' })).toBeVisible();
  await expect(page.getByRole('button', { name: '🔄 更新' })).toBeVisible();

  const cards = page.locator('[data-testid="folder-card"], [data-testid="report-card"]');
  await expect.poll(() => cards.count()).toBeGreaterThan(0);
});
