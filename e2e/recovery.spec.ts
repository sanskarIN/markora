import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('markora.onboarding.v1', 'complete');
    localStorage.setItem('markora.locale.v1', 'en');
  });
  await page.goto('/');
});

test('restores unsaved editor content after an abrupt-style reload', async ({ page }) => {
  const editor = page.getByRole('textbox', { name: 'Markdown source' });
  const recoveryText = '# Recovery proof\n\nUnsaved text survives a restart.';

  await editor.fill(recoveryText);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const raw = localStorage.getItem('markora.workspace.v1');
        return raw?.includes('Unsaved text survives a restart.') ?? false;
      }),
    )
    .toBe(true);

  await page.reload();

  await expect(page.getByRole('textbox', { name: 'Markdown source' })).toHaveValue(recoveryText);
  await expect(page.getByText('Recovered your last local workspace.')).toBeVisible();
});
