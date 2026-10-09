import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const VIEWPORTS = [
  { name: 'phone-320', width: 320, height: 640 },
  { name: 'phone-360', width: 360, height: 740 },
  { name: 'phone-375', width: 375, height: 667 },
  { name: 'phone-390', width: 390, height: 844 },
  { name: 'phone-414', width: 414, height: 896 },
  { name: 'phone-430', width: 430, height: 932 },
  { name: 'tablet-600', width: 600, height: 960 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'tablet-820', width: 820, height: 1180 },
  { name: 'tablet-1024', width: 1024, height: 768 },
  { name: 'laptop-1280', width: 1280, height: 800 },
  { name: 'desktop-1440', width: 1440, height: 900 },
  { name: 'desktop-1920', width: 1920, height: 1080 },
  { name: 'desktop-2560', width: 2560, height: 1440 },
  { name: 'landscape-667x375', width: 667, height: 375 },
  { name: 'landscape-844x390', width: 844, height: 390 },
  { name: 'zoom-125-desktop', width: 1024, height: 640 },
  { name: 'zoom-150-desktop', width: 853, height: 533 },
];

const resultsDir = path.resolve('test-results/audit-after');
if (!fs.existsSync(resultsDir)) {
  fs.mkdirSync(resultsDir, { recursive: true });
}

async function auditPageOverflow(page, viewName, pageLabel) {
  return await page.evaluate(({ viewName, pageLabel }) => {
    const docScrollWidth = document.documentElement.scrollWidth;
    const bodyScrollWidth = document.body.scrollWidth;
    const winWidth = window.innerWidth;
    const hasOverflow = docScrollWidth > winWidth;

    const overflowingElements = [];
    const elements = document.querySelectorAll('*');
    for (const el of elements) {
      const rect = el.getBoundingClientRect();
      if (rect.right > winWidth + 1 && rect.width > 0 && rect.height > 0) {
        const style = window.getComputedStyle(el);
        if (style.display !== 'none' && style.visibility !== 'hidden') {
          // Check if contained within a scrollable or clipped ancestor
          let isContained = false;
          let parent = el.parentElement;
          while (parent && parent !== document.body && parent !== document.documentElement) {
            const pStyle = window.getComputedStyle(parent);
            if (pStyle.overflowX === 'auto' || pStyle.overflowX === 'scroll' || pStyle.overflowX === 'hidden') {
              isContained = true;
              break;
            }
            parent = parent.parentElement;
          }

          if (!isContained) {
            overflowingElements.push({
              tag: el.tagName.toLowerCase(),
              className: el.className ? String(el.className).substring(0, 50) : '',
              id: el.id || '',
              text: (el.innerText || '').substring(0, 30).trim(),
              rectRight: Math.round(rect.right),
              rectWidth: Math.round(rect.width),
              scrollWidth: el.scrollWidth,
              clientWidth: el.clientWidth,
            });
          }
        }
      }
    }

    return {
      pageLabel,
      viewName,
      winWidth,
      docScrollWidth,
      bodyScrollWidth,
      hasOverflow,
      overflowingElements: overflowingElements.slice(0, 10),
    };
  }, { viewName, pageLabel });
}

async function runAudit() {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });

  const allIssues = [];
  let totalChecks = 0;

  for (const vp of VIEWPORTS) {
    console.log(`\nTesting Viewport: ${vp.name} (${vp.width}x${vp.height})`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height }
    });
    const page = await context.newPage();

    // 1. Auth Page
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(500);

    const logoutBtn = await page.$('button[title*="Sign out"], button:has-text("Sign Out")');
    if (logoutBtn) {
      await logoutBtn.click();
      await page.waitForTimeout(400);
    }

    totalChecks++;
    const authRes = await auditPageOverflow(page, vp.name, 'Auth Screen - Resident Tab');
    if (authRes.hasOverflow) {
      allIssues.push(authRes);
      console.log(`  [OVERFLOW] Auth Resident: docWidth=${authRes.docScrollWidth} > winWidth=${authRes.winWidth}`);
    }

    if (vp.width === 320 || vp.width === 375 || vp.width === 768 || vp.width === 1440) {
      await page.screenshot({ path: path.join(resultsDir, `auth-${vp.name}.png`), fullPage: false });
    }

    // Provider Auth Tab
    const providerAuthBtn = await page.$('button:has-text("Provider")');
    if (providerAuthBtn) {
      await providerAuthBtn.click();
      await page.waitForTimeout(200);
      totalChecks++;
      const authProvRes = await auditPageOverflow(page, vp.name, 'Auth Screen - Provider Tab');
      if (authProvRes.hasOverflow) allIssues.push(authProvRes);
    }

    // Admin Auth Tab
    const adminAuthBtn = await page.$('button:has-text("Admin")');
    if (adminAuthBtn) {
      await adminAuthBtn.click();
      await page.waitForTimeout(200);
      totalChecks++;
      const authAdminRes = await auditPageOverflow(page, vp.name, 'Auth Screen - Admin Tab');
      if (authAdminRes.hasOverflow) allIssues.push(authAdminRes);
    }

    // Toggle Registration Mode
    const createAccBtn = await page.$('button:has-text("Create an account")');
    if (createAccBtn) {
      await createAccBtn.click();
      await page.waitForTimeout(200);
      totalChecks++;
      const regRes = await auditPageOverflow(page, vp.name, 'Auth Screen - Registration Mode');
      if (regRes.hasOverflow) allIssues.push(regRes);
    }

    // 2. Login as Resident & Test Customer Portal Tabs
    const residentQuickLogin = await page.$('button:has-text("Resident (Flat A-402)")');
    if (residentQuickLogin) {
      await residentQuickLogin.click();
      const signInBtn = await page.$('button[type="submit"]:has-text("Sign In")');
      if (signInBtn) await signInBtn.click();
      await page.waitForTimeout(600);

      totalChecks++;
      const custHomeRes = await auditPageOverflow(page, vp.name, 'Resident Portal - Home');
      if (custHomeRes.hasOverflow) {
        allIssues.push(custHomeRes);
        console.log(`  [OVERFLOW] Resident Home: docWidth=${custHomeRes.docScrollWidth} > winWidth=${custHomeRes.winWidth}`);
      }

      if (vp.width === 320 || vp.width === 375 || vp.width === 768 || vp.width === 1440) {
        await page.screenshot({ path: path.join(resultsDir, `resident-home-${vp.name}.png`), fullPage: false });
      }

      // Explore Services Tab
      const exploreTab = await page.$('button:has-text("Explore Services"), [data-tab="explore"]');
      if (exploreTab) {
        await exploreTab.click();
        await page.waitForTimeout(300);
        totalChecks++;
        const expRes = await auditPageOverflow(page, vp.name, 'Resident Portal - Explore Services');
        if (expRes.hasOverflow) allIssues.push(expRes);
      }

      // My Orders Tab
      const ordersTab = await page.$('button:has-text("My Orders"), button:has-text("Orders")');
      if (ordersTab) {
        await ordersTab.click();
        await page.waitForTimeout(300);
        totalChecks++;
        const ordRes = await auditPageOverflow(page, vp.name, 'Resident Portal - My Orders');
        if (ordRes.hasOverflow) allIssues.push(ordRes);
      }

      // Subscriptions Tab
      const subsTab = await page.$('button:has-text("Subscriptions")');
      if (subsTab) {
        await subsTab.click();
        await page.waitForTimeout(300);
        totalChecks++;
        const subRes = await auditPageOverflow(page, vp.name, 'Resident Portal - Subscriptions');
        if (subRes.hasOverflow) allIssues.push(subRes);
      }

      // Booking Modal
      const bookNowBtn = await page.$('button:has-text("Book Now"), button:has-text("Select Plan")');
      if (bookNowBtn) {
        await bookNowBtn.click();
        await page.waitForTimeout(400);
        totalChecks++;
        const modalRes = await auditPageOverflow(page, vp.name, 'Resident Portal - Booking Modal');
        if (modalRes.hasOverflow) allIssues.push(modalRes);
        if (vp.width === 320 || vp.width === 375) {
          await page.screenshot({ path: path.join(resultsDir, `booking-modal-${vp.name}.png`), fullPage: false });
        }
        const closeBtn = await page.$('.modal-content button:has-text("×"), .modal-overlay button:has-text("✕"), .modal-overlay [aria-label="Close"], .modal-content button:has(svg)');
        if (closeBtn) await closeBtn.click();
        await page.waitForTimeout(200);
      }
    }

    // 3. Login as Provider & Test Provider Dashboard
    const outBtn = await page.$('button[title*="Sign out"], button:has-text("Sign Out")');
    if (outBtn) {
      await outBtn.click();
      await page.waitForTimeout(400);
    }

    const providerQuick = await page.$('button:has-text("Raj Laundry")');
    if (providerQuick) {
      await providerQuick.click();
      const signInBtn = await page.$('button[type="submit"]:has-text("Sign In")');
      if (signInBtn) await signInBtn.click();
      await page.waitForTimeout(600);

      totalChecks++;
      const provOverviewRes = await auditPageOverflow(page, vp.name, 'Provider Dashboard - Overview');
      if (provOverviewRes.hasOverflow) {
        allIssues.push(provOverviewRes);
        console.log(`  [OVERFLOW] Provider Overview: docWidth=${provOverviewRes.docScrollWidth} > winWidth=${provOverviewRes.winWidth}`);
      }
      if (vp.width === 320 || vp.width === 375 || vp.width === 768 || vp.width === 1440) {
        await page.screenshot({ path: path.join(resultsDir, `provider-overview-${vp.name}.png`), fullPage: false });
      }

      // Delivery Sheet Tab
      const deliveryTab = await page.$('button:has-text("Delivery Sheet")');
      if (deliveryTab) {
        await deliveryTab.click();
        await page.waitForTimeout(300);
        totalChecks++;
        const delivRes = await auditPageOverflow(page, vp.name, 'Provider Dashboard - Delivery Sheet');
        if (delivRes.hasOverflow) allIssues.push(delivRes);
      }

      // Earnings Tab
      const earnTab = await page.$('button:has-text("Earnings & Payouts"), button:has-text("Earnings")');
      if (earnTab) {
        await earnTab.click();
        await page.waitForTimeout(300);
        totalChecks++;
        const earnRes = await auditPageOverflow(page, vp.name, 'Provider Dashboard - Earnings');
        if (earnRes.hasOverflow) allIssues.push(earnRes);
      }
    }

    // 4. Login as Admin & Test Admin Panel
    const outBtn2 = await page.$('button[title*="Sign out"], button:has-text("Sign Out")');
    if (outBtn2) {
      await outBtn2.click();
      await page.waitForTimeout(400);
    }

    const adminQuick = await page.$('button:has-text("Platform Admin")');
    if (adminQuick) {
      await adminQuick.click();
      const signInBtn = await page.$('button[type="submit"]:has-text("Sign In")');
      if (signInBtn) await signInBtn.click();
      await page.waitForTimeout(600);

      totalChecks++;
      const adminOverviewRes = await auditPageOverflow(page, vp.name, 'Admin Panel - Overview');
      if (adminOverviewRes.hasOverflow) {
        allIssues.push(adminOverviewRes);
        console.log(`  [OVERFLOW] Admin Overview: docWidth=${adminOverviewRes.docScrollWidth} > winWidth=${adminOverviewRes.winWidth}`);
      }
      if (vp.width === 320 || vp.width === 375 || vp.width === 768 || vp.width === 1440) {
        await page.screenshot({ path: path.join(resultsDir, `admin-overview-${vp.name}.png`), fullPage: false });
      }

      // Admin Provider Queue tab
      const queueTab = await page.$('button:has-text("Provider Verification"), button:has-text("Provider Queue")');
      if (queueTab) {
        await queueTab.click();
        await page.waitForTimeout(300);
        totalChecks++;
        const qRes = await auditPageOverflow(page, vp.name, 'Admin Panel - Provider Queue');
        if (qRes.hasOverflow) allIssues.push(qRes);
      }

      // Admin Supply Gap Matrix
      const matrixTab = await page.$('button:has-text("Supply Gap Matrix")');
      if (matrixTab) {
        await matrixTab.click();
        await page.waitForTimeout(300);
        totalChecks++;
        const mRes = await auditPageOverflow(page, vp.name, 'Admin Panel - Supply Gap Matrix');
        if (mRes.hasOverflow) allIssues.push(mRes);
      }
    }

    await context.close();
  }

  await browser.close();

  fs.writeFileSync(
    path.join(resultsDir, 'audit_report.json'),
    JSON.stringify(allIssues, null, 2)
  );

  console.log(`\n======================================================`);
  console.log(`Audit After completed across ${VIEWPORTS.length} viewports!`);
  console.log(`Total Page/State Checks: ${totalChecks}`);
  console.log(`Total Horizontal Overflow Occurrences Found: ${allIssues.length}`);
  console.log(`======================================================`);
  return allIssues;
}

runAudit().catch(err => {
  console.error('Audit run error:', err);
  process.exit(1);
});
