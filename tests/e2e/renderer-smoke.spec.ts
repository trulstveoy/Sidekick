import { expect, test } from '@playwright/test';

test('renders the folder inspection empty state', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Sidekick' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Choose folder' })).toBeVisible();
  await expect(page.getByText('Choose a project folder')).toBeVisible();
  await expect(page.getByText('No folder selected')).toBeVisible();
  await expect(page.getByText('Browser preview')).toBeVisible();
  await expect(page.getByText('No warnings')).toBeVisible();
});
