import { expect, test } from '@playwright/test';

const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';

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

test('formats the active selection with structural editor commands', async ({ page }) => {
  const editor = page.getByRole('textbox', { name: 'Markdown source' });
  await editor.fill('important');
  await editor.press(`${modifier}+a`);
  await editor.press(`${modifier}+b`);

  await expect(editor).toHaveValue('**important**');
  await expect(page.getByRole('strong')).toHaveText('important');

  await editor.fill('Alpha\nBeta');
  await editor.selectText();
  await page.getByRole('button', { name: 'H2' }).click();
  await expect(editor).toHaveValue('## Alpha\n## Beta');
});

test('find and replace changes the active document', async ({ page }) => {
  const editor = page.getByRole('textbox', { name: 'Markdown source' });
  await editor.fill('alpha beta alpha');

  await page.keyboard.press(`${modifier}+f`);
  const findInput = page.getByPlaceholder('Find');
  await findInput.fill('alpha');
  await page.getByPlaceholder('Replace with').fill('gamma');
  await page.getByRole('button', { name: 'Replace all' }).click();

  await expect(editor).toHaveValue('gamma beta gamma');
});

test('find supports whole-word and bounded regex modes', async ({ page }) => {
  const editor = page.getByRole('textbox', { name: 'Markdown source' });
  await editor.fill('cat category cat issue-12 issue-204');

  await page.keyboard.press(`${modifier}+f`);
  const findInput = page.getByPlaceholder('Find');
  await findInput.fill('cat');
  await page.getByLabel('Whole word').check();
  await expect(page.getByRole('status').filter({ hasText: '1 / 2' })).toBeVisible();

  await page.getByLabel('Regex').check();
  await findInput.fill('issue-\\d+');
  await expect(page.getByRole('status').filter({ hasText: '1 / 2' })).toBeVisible();
});

test('layout preference persists across reloads', async ({ page }) => {
  await expect(page.getByRole('region', { name: 'Markdown preview' })).toBeVisible();
  await page.getByRole('button', { name: 'Editor', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Markdown preview' })).toHaveCount(0);

  await page.reload();
  await expect(page.getByRole('textbox', { name: 'Markdown source' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Markdown preview' })).toHaveCount(0);
});

test('command palette opens from the keyboard and creates a document', async ({ page }) => {
  await page.keyboard.press(`${modifier}+k`);
  const dialog = page.getByRole('dialog', { name: 'Command palette' });
  await expect(dialog).toBeVisible();
  await dialog.getByPlaceholder('Type a command…').fill('new document');
  await dialog.getByRole('option', { name: /New document/ }).click();

  await expect(page.getByRole('tab', { selected: true })).toContainText('Untitled');
});

test('settings expose privacy, recovery, accessibility, and project identity', async ({ page }) => {
  await page.getByRole('button', { name: 'Settings' }).click();
  const dialog = page.getByRole('dialog', { name: /Settings/ });

  await expect(dialog.getByRole('heading', { name: 'Privacy & data' })).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Recovery' })).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Accessibility' })).toBeVisible();
  await expect(dialog.getByText('Made by the Sanskar')).toBeVisible();
});
