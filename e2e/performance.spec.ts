import { expect, test } from '@playwright/test';

const STARTUP_DOM_BUDGET_MS = 7_000;
const MEDIUM_PREVIEW_BUDGET_MS = 4_000;
const LARGE_OUTLINE_FILTER_BUDGET_MS = 2_000;

function mediumMarkdown(): string {
  const sections = Array.from({ length: 180 }, (_, index) => {
    const number = index + 1;
    return `## Section ${number}\n\nParagraph ${number} with **bold text**, a [local-safe link](https://example.com), and a short list.\n\n- alpha\n- beta\n- gamma\n\n\`inline-${number}\``;
  });
  return `# Performance fixture\n\n${sections.join('\n\n')}\n\n## Final marker\n\nReady.`;
}

function largeOutlineMarkdown(): string {
  return Array.from(
    { length: 1_200 },
    (_, index) => `## Heading ${String(index + 1).padStart(4, '0')}\n\nBody ${index + 1}.`,
  ).join('\n\n');
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('markora.onboarding.v1', 'complete');
    localStorage.setItem('markora.locale.v1', 'en');
  });
});

test('startup reaches an interactive editor within the release budget', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('textbox', { name: 'Markdown source' })).toBeVisible();

  const navigationMs = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
    return navigation?.domContentLoadedEventEnd ?? Number.POSITIVE_INFINITY;
  });

  expect(navigationMs).toBeLessThan(STARTUP_DOM_BUDGET_MS);
});

test('medium document reaches the live preview within the release budget', async ({ page }) => {
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Markdown source' });
  const startedAt = Date.now();

  await editor.fill(mediumMarkdown());
  await expect(page.getByRole('heading', { name: 'Final marker' })).toBeVisible();

  expect(Date.now() - startedAt).toBeLessThan(MEDIUM_PREVIEW_BUDGET_MS);
});

test('large outline filtering remains responsive within the release budget', async ({ page }) => {
  await page.goto('/');
  const editor = page.getByRole('textbox', { name: 'Markdown source' });
  await editor.fill(largeOutlineMarkdown());

  const filter = page.getByRole('searchbox', { name: 'Filter outline' });
  const startedAt = Date.now();
  await filter.fill('Heading 1199');
  await expect(page.getByRole('button', { name: /Heading 1199/ })).toBeVisible();

  expect(Date.now() - startedAt).toBeLessThan(LARGE_OUTLINE_FILTER_BUDGET_MS);
});
