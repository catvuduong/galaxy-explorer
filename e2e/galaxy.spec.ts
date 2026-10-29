import { test, expect } from '@playwright/test';

// Resolves once the scene has rendered its first frames (the stage is marked ready).
async function waitForScene(page: import('@playwright/test').Page) {
  await expect(page.getByTestId('galaxy-stage')).toHaveAttribute('data-ready', 'true', { timeout: 30_000 });
}

test('galaxy canvas renders and reaches its first frames', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('galaxy-canvas')).toBeVisible();
  await waitForScene(page);
});

test('control panel changes the galaxy and survives a reload', async ({ page }) => {
  await page.goto('/');
  await waitForScene(page);

  await page.getByTestId('panel-toggle').click();
  await expect(page.getByTestId('control-panel')).toBeVisible();

  await page.getByTestId('arms-slider').fill('6');
  await expect(page.getByTestId('arms-value')).toHaveText('6');

  await page.getByTestId('speed-slider').fill('2');
  await expect(page.getByTestId('speed-value')).toHaveText('2.00×');

  await page.getByTestId('spin-toggle').uncheck();
  await expect(page.getByTestId('spin-toggle')).not.toBeChecked();

  await page.getByTestId('color-core').fill('#00ff88');

  await page.reload();
  await waitForScene(page);
  await page.getByTestId('panel-toggle').click();
  await expect(page.getByTestId('arms-value')).toHaveText('6');
  await expect(page.getByTestId('speed-value')).toHaveText('2.00×');
  await expect(page.getByTestId('spin-toggle')).not.toBeChecked();
  await expect(page.getByTestId('color-core')).toHaveValue('#00ff88');

  await page.getByTestId('panel-reset').click();
  await expect(page.getByTestId('arms-value')).toHaveText('4');
  await expect(page.getByTestId('speed-value')).toHaveText('1.00×');
  await expect(page.getByTestId('spin-toggle')).toBeChecked();
  await expect(page.getByTestId('color-core')).toHaveValue('#ffa64d');
});

test('clicking a planet opens its card and closing it returns to the overview', async ({ page }) => {
  await page.goto('/');
  await waitForScene(page);

  await page.getByTestId('planet-ember').click();
  await expect(page.getByTestId('planet-card-name')).toHaveText('Ember Prime');
  await expect(page.getByTestId('galaxy-explorer')).toHaveAttribute('data-focus', 'ember');

  await page.getByTestId('planet-card-close').click();
  await expect(page.getByTestId('planet-card')).toHaveCount(0);
  await expect(page.getByTestId('galaxy-explorer')).toHaveAttribute('data-focus', '');
});
