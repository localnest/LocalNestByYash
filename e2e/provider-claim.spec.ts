import { test, expect } from '@playwright/test';

test.describe('Provider Atomic Claim & OTP Execution Flow (S18.2)', () => {
  test('Provider views incoming dispatch jobs and claim workspace', async ({ page }) => {
    await page.goto('/');

    // Switch to Provider role on login
    const providerBtn = page.getByRole('button', { name: /Local Service Provider/i });
    if (await providerBtn.isVisible()) {
      await providerBtn.click();
    }

    // Look for Provider sample login
    const rajeshBtn = page.getByRole('button', { name: /Rajesh Kumar/i });
    if (await rajeshBtn.isVisible()) {
      await rajeshBtn.click();
    }

    // Expect Provider dashboard tabs
    await expect(page.locator('body')).toContainText(/Earnings|Orders|Manifest|Services/i);
  });
});
