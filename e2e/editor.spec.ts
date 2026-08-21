import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  const start = page.getByRole('button', { name: 'Start writing' });
  if (await start.isVisible().catch(() => false)) await start.click();
});

test('edits markdown and renders the live preview', async ({ page }) => {
  const editor = page.getByRole('textbox', { name: 'Markdown source' });
  await editor.fill('# Project Notes\n\n- [x] Build Markora\n\n```ts\nconst ready = true;\n```');

  await expect(page.getByRole('heading', { name: 'Project Notes' })).toBeVisible();
  await expect(page.getByRole('checkbox')).toBeChecked();
  await expect(page.getByText('const ready = true;')).toBeVisible();
});

test('find and replace changes the active document', async ({ page }) => {
  const editor = page.getByRole('textbox', { name: 'Markdown source' });
  await editor.fill('alpha beta alpha');

  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+f' : 'Control+f');
  const findInput = page.getByPlaceholder('Find');
  await findInput.fill('alpha');
  await page.getByPlaceholder('Replace with').fill('gamma');
  await page.getByRole('button', { name: 'Replace all' }).click();

  await expect(editor).toHaveValue('gamma beta gamma');
});

test('command palette opens from the keyboard and creates a document', async ({ page }) => {
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+k' : 'Control+k');
  const dialog = page.getByRole('dialog', { name: 'Command palette' });
  await expect(dialog).toBeVisible();
  await dialog.getByPlaceholder('Type a command…').fill('new document');
  await dialog.getByRole('option', { name: /New document/ }).click();

  await expect(page.getByRole('tab', { selected: true })).toContainText('Untitled');
});

test('settings expose privacy, accessibility, and project identity', async ({ page }) => {
  await page.getByRole('button', { name: 'Settings' }).click();
  const dialog = page.getByRole('dialog', { name: /Settings/ });

  await expect(dialog.getByRole('heading', { name: 'Privacy & data' })).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Accessibility' })).toBeVisible();
  await expect(dialog.getByText('Made by the Sanskar')).toBeVisible();
});
