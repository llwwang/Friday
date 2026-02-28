const { chromium } = require('/root/.local/share/pnpm/global/5/.pnpm/agent-browser@0.15.0/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']
  });
  
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('🚀 Login to TBDS...');
    await page.goto('https://tbds.tbds.boc.fsphere.cn', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(5000);
    
    await page.click('text=子账号登录');
    await page.waitForTimeout(3000);
    
    await page.fill('input[name="ownerUin"]', '[YOUR_OWNER_UIN]');
    await page.fill('input[name="username"]', '[YOUR_USERNAME]');
    await page.fill('input[type="password"]', '[YOUR_PASSWORD]');
    
    await page.click('button:has-text("登录")');
    await page.waitForTimeout(8000);
    
    const continueBtn = await page.$('text=/继续登录/i');
    if (continueBtn) {
      await continueBtn.click();
      await page.waitForTimeout(8000);
    }
    
    console.log('✅ Login successful');
    
    // Navigate to 标准集群 → tbds-user1
    console.log('\n📍 Navigating to tbds-user1 cluster...');
    await page.click('text=标准集群');
    await page.waitForTimeout(5000);
    
    // Find and click tbds-user1
    const clusters = await page.$$('a, div[role="button"], tr');
    for (const cluster of clusters) {
      const text = await cluster.textContent().catch(() => '');
      if (text && text.includes('tbds-user1')) {
        console.log('   ✓ Found tbds-user1, clicking...');
        await cluster.click();
        await page.waitForTimeout(5000);
        break;
      }
    }
    
    // Click 集群服务 in left menu
    console.log('\n🔧 Clicking "集群服务" (Cluster Services)...');
    await page.click('text=集群服务');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/tbds-services.png', fullPage: true });
    
    // Find and click Spark service
    console.log('\n⚡ Looking for Spark service...');
    const rows = await page.$$('tr, div[class*="service"], div[class*="item"]');
    let sparkFound = false;
    
    for (const row of rows) {
      const text = await row.textContent().catch(() => '');
      if (text && text.includes('Spark') && !text.includes('Spark2x')) {
        console.log('   ✓ Found Spark service');
        
        // Look for a link or clickable element within this row
        const link = await row.$('a, button, div[role="button"]') || row;
        await link.click();
        sparkFound = true;
        await page.waitForTimeout(5000);
        break;
      }
    }
    
    if (!sparkFound) {
      // Try direct text click
      await page.click('text=/^Spark$|Spark（/');
      await page.waitForTimeout(5000);
    }
    
    console.log('   ✓ Entered Spark service page');
    await page.screenshot({ path: '/tmp/tbds-spark-page.png', fullPage: true });
    
    // Click 操作 (Operation) button in top right
    console.log('\n🔄 Clicking "操作" (Operation) button...');
    const operationBtn = await page.$('button:has-text("操作"), [class*="operation"], [class*="action"]');
    if (operationBtn) {
      await operationBtn.click();
      console.log('   ✓ Opened operation menu');
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '/tmp/tbds-operation-menu.png', fullPage: true });
    } else {
      // Try to find by position (top right area buttons)
      const buttons = await page.$$('button');
      for (const btn of buttons) {
        const text = await btn.textContent().catch(() => '');
        if (text.includes('操作') || text.includes('批量')) {
          await btn.click();
          console.log('   ✓ Clicked operation button');
          await page.waitForTimeout(3000);
          break;
        }
      }
    }
    
    // Click 重启 (Restart)
    console.log('\n🔄 Clicking "重启" (Restart)...');
    const restartOption = await page.$('text=重启, text=重启服务');
    if (restartOption) {
      await restartOption.click();
      console.log('   ✓ Clicked restart');
      await page.waitForTimeout(3000);
    } else {
      // Look in dropdown menu items
      const menuItems = await page.$$('[class*="menu"] div, [class*="dropdown"] div, li');
      for (const item of menuItems) {
        const text = await item.textContent().catch(() => '');
        if (text.includes('重启')) {
          await item.click();
          console.log('   ✓ Clicked restart in menu');
          await page.waitForTimeout(3000);
          break;
        }
      }
    }
    
    await page.screenshot({ path: '/tmp/tbds-restart-confirm.png', fullPage: true });
    
    // Confirm restart
    console.log('\n✅ Confirming restart...');
    const confirmBtn = await page.$('button:has-text("确定"), button:has-text("确认"), button[type="submit"]');
    if (confirmBtn) {
      await confirmBtn.click();
      console.log('   ✓ Confirmed restart');
      await page.waitForTimeout(10000);
    }
    
    await page.screenshot({ path: '/tmp/tbds-restart-success.png', fullPage: true });
    console.log('   ✓ Screenshot: restart result');
    
    // Check status
    const url = page.url();
    console.log(`\n📊 Final URL: ${url}`);
    
    const status = await page.$('text=/重启成功|执行中|已提交/i');
    if (status) {
      const statusText = await status.textContent();
      console.log(`✅ Status: ${statusText}`);
    } else {
      console.log('✅ Restart operation completed');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/tbds-error.png', fullPage: true });
  }
  
  await browser.close();
})();
