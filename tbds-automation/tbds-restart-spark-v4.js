const { chromium } = require('/root/.local/share/pnpm/global/5/.pnpm/agent-browser@0.15.0/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome-stable',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']
  });
  
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1920, height: 1080 })
  });
  
  const page = await context.newPage();
  
  try {
    console.log('🚀 Login to TBDS...');
    await page.goto('https://tbds.tbds.boc.fsphere.cn', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    await page.click('text=子账号登录');
    await page.waitForTimeout(2000);
    
    await page.fill('input[name="ownerUin"]', '110000000000');
    await page.fill('input[name="username"]', 'leozwang');
    await page.fill('input[type="password"]', 'Leozwang@1234');
    
    await page.click('button:has-text("登录")');
    await page.waitForTimeout(5000);
    
    const continueBtn = await page.$('text=/继续登录/i');
    if (continueBtn) await continueBtn.click();
    await page.waitForTimeout(5000);
    
    console.log('✅ Login successful');
    await page.screenshot({ path: '/tmp/tbds-logged-in.png', fullPage: false });
    
    // Directly navigate to tbds-user1 cluster services page
    console.log('\n📍 Navigating directly to tbds-user1 services...');
    
    // Try to construct the URL or find the link
    const user1Link = await page.$('a[href*="tbds-user1"], a:has-text("tbds-user1")');
    if (user1Link) {
      await user1Link.click();
      await page.waitForTimeout(5000);
    } else {
      // Try clicking through standard clusters
      await page.goto('https://tbds.tbds.boc.fsphere.cn/tm/framework?type=standardClusters');
      await page.waitForTimeout(5000);
      
      // Find tbds-user1
      const links = await page.$$('a');
      for (const link of links) {
        const href = await link.getAttribute('href').catch(() => '');
        const text = await link.textContent().catch(() => '');
        if (href.includes('user1') || text.includes('tbds-user1')) {
          await link.click();
          await page.waitForTimeout(5000);
          break;
        }
      }
    }
    
    console.log('   ✓ In tbds-user1 cluster');
    await page.screenshot({ path: '/tmp/tbds-user1.png', fullPage: false });
    
    // Click 集群服务 with retry
    console.log('\n🔧 Clicking "集群服务"...');
    try {
      // Wait for the element to be visible
      await page.waitForSelector('text=集群服务', { timeout: 10000 });
      await page.click('text=集群服务');
      console.log('   ✓ Clicked 集群服务');
    } catch (e) {
      // Try alternative selectors
      console.log('   Trying alternative selectors...');
      const menuItems = await page.$$('a, div, span');
      for (const item of menuItems) {
        const text = await item.textContent().catch(() => '');
        if (text.trim() === '集群服务' || text.includes('集群服务')) {
          await item.click();
          console.log('   ✓ Clicked via alternative selector');
          break;
        }
      }
    }
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/tbds-cluster-services.png', fullPage: false });
    
    // Find and click Spark
    console.log('\n⚡ Finding Spark service...');
    const sparkRow = await page.$('tr:has-text("Spark"):not(:has-text("Spark2x"))');
    if (sparkRow) {
      const sparkLink = await sparkRow.$('a, td');
      if (sparkLink) {
        await sparkLink.click();
        console.log('   ✓ Clicked Spark service');
      }
    } else {
      // Try clicking "Spark" text directly
      await page.click('text=/^Spark$/', { timeout: 5000 }).catch(async () => {
        // Look for Spark in table
        const cells = await page.$$('td, div[class*="cell"]');
        for (const cell of cells) {
          const text = await cell.textContent().catch(() => '');
          if (text.trim() === 'Spark') {
            await cell.click();
            console.log('   ✓ Clicked Spark cell');
            break;
          }
        }
      });
    }
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/tbds-spark-detail.png', fullPage: false });
    console.log('   ✓ In Spark service page');
    
    // Click 操作 button
    console.log('\n🔄 Clicking "操作" button...');
    const opBtn = await page.$('button:has-text("操作")');
    if (opBtn) {
      await opBtn.click();
      console.log('   ✓ Clicked 操作');
      await page.waitForTimeout(2000);
      
      // Click 重启
      console.log('\n🔄 Clicking "重启"...');
      await page.click('text=重启');
      console.log('   ✓ Clicked 重启');
      await page.waitForTimeout(3000);
      
      // Confirm
      console.log('\n✅ Confirming...');
      await page.click('button:has-text("确定")');
      console.log('   ✓ Confirmed');
      await page.waitForTimeout(10000);
      
      await page.screenshot({ path: '/tmp/tbds-restart-done.png', fullPage: false });
      console.log('   ✓ Restart completed');
    } else {
      console.log('   ⚠️ Operation button not found');
    }
    
    console.log('\n📸 Screenshots saved:');
    console.log('   - /tmp/tbds-logged-in.png');
    console.log('   - /tmp/tbds-user1.png');
    console.log('   - /tmp/tbds-cluster-services.png');
    console.log('   - /tmp/tbds-spark-detail.png');
    console.log('   - /tmp/tbds-restart-done.png');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/tbds-error.png', fullPage: false });
  }
  
  await browser.close();
})();
