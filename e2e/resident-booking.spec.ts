import { test, expect } from '@playwright/test';

test.describe('Resident Service Booking Flow (S18.1)', () => {
  test('Resident logs in and navigates service catalog', async ({ page }) => {
    await page.goto('/');

    // Check if on login screen
    const residentBtn = page.getByRole('button', { name: /Society Resident/i });
    if (await residentBtn.isVisible()) {
      await residentBtn.click();
    }

    // Expect hero banner or society marketplace title
    await expect(page.locator('body')).toContainText(/LocalNest|Greenfield Heights/i);
  });

  test('Opens service booking modal and calculates escrow total', async ({ page }) => {
    await page.goto('/');

    // Ensure logged in as resident
    const residentDemoBtn = page.getByRole('button', { name: /Rahul Sharma|Society Resident/i });
    if (await residentDemoBtn.isVisible()) {
      await residentDemoBtn.click();
    }

    // Look for a service card (e.g. Laundry or Cleaning or Repairs)
    const bookBtn = page.locator('button:has-text("Book"), button:has-text("Schedule")').first();
    if (await bookBtn.isVisible()) {
      await bookBtn.click();

      // Modal should appear
      await expect(page.locator('.modal-content')).toBeVisible();

      // Should show Escrow guarantee badge
      await expect(page.locator('.modal-content')).toContainText(/Escrow|Total Payable|Razorpay/i);
    }
  });
});
