import { readFile } from 'node:fs/promises';

import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('markora.onboarding.v1')) {
      localStorage.setItem('markora.onboarding.v1', 'complete');
    }
    if (!localStorage.getItem('markora.locale.v1')) {
      localStorage.setItem('markora.locale.v1', 'en');
    }
  });
  await page.goto('/');
});

test('language selection updates the interface locale and persists across reloads', async ({ page }) => {
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByLabel('Language').selectOption('hi');

  await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('markora.locale.v1'))).toBe('hi');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'hi');
  await expect(page.getByRole('button', { name: 'Settings' })).toHaveCount(0);
});

test('editor and preview preserve mixed bidi and complex-script content', async ({ page }) => {
  const markdown = await readFile(new URL('./fixtures/bidi-complex.md', import.meta.url), 'utf8');
  const editor = page.getByRole('textbox', { name: 'Markdown source' });
  const preview = page.getByRole('region', { name: 'Markdown preview' });

  await editor.fill(markdown);

  await expect(editor).toHaveAttribute('dir', 'auto');
  await expect(preview.locator('.markdown-preview')).toHaveAttribute('dir', 'auto');
  await expect(preview).toContainText('नमस्ते दुनिया');
  await expect(preview).toContainText('مرحبا بالعالم');
  await expect(preview).toContainText('שלום עולם');
  await expect(preview).toContainText('👩🏽‍💻 🚀 ✅');
  await expect(preview.locator('table')).toBeVisible();
});
