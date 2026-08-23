import { expect, test } from '@playwright/test';

const modifier = process.platform === 'darwin' ? 'Meta' : 'Control';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('markora.onboarding.v1', 'complete');
    localStorage.setItem('markora.locale.v1', 'en');
  });
  await page.goto('/');
});

test('interactive controls expose accessible names', async ({ page }) => {
  const unnamed = await page.locator('button, input, select, textarea').evaluateAll((elements) =>
    elements.flatMap((element, index) => {
      const html = element as HTMLElement;
      if (element instanceof HTMLInputElement && element.type === 'hidden') return [];

      const ariaLabel = html.getAttribute('aria-label')?.trim() ?? '';
      const labelledBy = (html.getAttribute('aria-labelledby') ?? '')
        .split(/\s+/)
        .filter(Boolean)
        .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
        .join(' ')
        .trim();
      const labels =
        element instanceof HTMLInputElement ||
        element instanceof HTMLSelectElement ||
        element instanceof HTMLTextAreaElement
          ? Array.from(element.labels ?? []).map((label) => label.textContent?.trim() ?? '').join(' ').trim()
          : '';
      const buttonText = element instanceof HTMLButtonElement ? element.textContent?.trim() ?? '' : '';
      const title = html.getAttribute('title')?.trim() ?? '';

      return ariaLabel || labelledBy || labels || buttonText || title
        ? []
        : [`${element.tagName.toLowerCase()}[${index}]`];
    }),
  );

  expect(unnamed).toEqual([]);
});

test('rendered application has no duplicate element ids', async ({ page }) => {
  const duplicates = await page.locator('[id]').evaluateAll((elements) => {
    const counts = new Map<string, number>();
    for (const element of elements) {
      const id = element.id;
      counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return [...counts.entries()].filter(([, count]) => count > 1).map(([id]) => id);
  });

  expect(duplicates).toEqual([]);
});

test('primary toolbar remains keyboard reachable in DOM order', async ({ page }) => {
  const newButton = page.getByRole('button', { name: 'New', exact: true });
  const openButton = page.getByRole('button', { name: 'Open', exact: true });

  await newButton.focus();
  await expect(newButton).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(openButton).toBeFocused();
});

test('forced colors preserve an explicit keyboard focus indicator', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  const newButton = page.getByRole('button', { name: 'New', exact: true });
  await newButton.focus();

  const focusStyle = await newButton.evaluate((element) => {
    const style = getComputedStyle(element);
    return { outlineStyle: style.outlineStyle, outlineWidth: style.outlineWidth };
  });

  expect(focusStyle.outlineStyle).not.toBe('none');
  expect(focusStyle.outlineWidth).not.toBe('0px');
});

test('command and settings dialogs expose accessible names and close from Escape', async ({ page }) => {
  await page.keyboard.press(`${modifier}+k`);
  const commands = page.getByRole('dialog', { name: 'Command palette' });
  await expect(commands).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(commands).toHaveCount(0);

  await page.getByRole('button', { name: 'Settings' }).click();
  const settings = page.getByRole('dialog', { name: 'Settings' });
  await expect(settings).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(settings).toHaveCount(0);
});
