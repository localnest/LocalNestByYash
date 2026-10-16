import { test, expect } from '@playwright/test';

test.describe('Admin Dispute Desk & Verification Flow (S18.3)', () => {
  test('Admin logs in and views dispute and SLA metrics', async ({ page }) => {
    await page.goto('/');

    // Switch to Admin role on login
    const adminBtn = page.getByRole('button', { name: /Platform Admin/i });
    if (await adminBtn.isVisible()) {
      await adminBtn.click();
    }

    // Expect Admin panel tabs
    await expect(page.locator('body')).toContainText(
      /Overview|Providers|Societies|Disputes|Commission/i,
    );
  });
});
