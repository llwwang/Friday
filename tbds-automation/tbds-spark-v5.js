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
    await page.goto('https://tbds.tbds.boc.fsphere.cn', { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    await page.click('text=子账号登录');
    await page.waitForTimeout(2000);
    
    await page.fill('input[name="ownerUin"]', '[YOUR_OWNER_UIN]');
    await page.fill('input[name="username"]', '[YOUR_USERNAME]');
    await page.fill('input[type="password"]', '[YOUR_PASSWORD]');
    
    await page.click('button:has-text("登录")');
    await page.waitForTimeout(5000);
    
    const continueBtn = await page.$('text=/继续登录/i');
    if (continueBtn) await continueBtn.click();
    await page.waitForTimeout(5000);
    
    console.log('✅ Login successful');
    
    // Navigate to standard clusters
    console.log('\n📍 Navigating to standard clusters...');
    await page.goto('https://tbds.tbds.boc.fsphere.cn/tm/framework?type=standardClusters');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/tbds-std-clusters.png', fullPage: false });
    
    // Find tbds-user1
    console.log('   Looking for tbds-user1...');
    const links = await page.$$('a');
    for (const link of links) {
      const href = await link.getAttribute('href').catch(() => '');
      const text = await link.textContent().catch(() => '');
      if (href.includes('user1') || text.includes('tbds-user1')) {
        console.log('   ✓ Found tbds-user1');
        await link.click();
        await page.waitForTimeout(5000);
        break;
      }
    }
    
    await page.screenshot({ path: '/tmp/tbds-user1-page.png', fullPage: false });
    
    // Click 集群服务
    console.log('\n🔧 Clicking 集群服务...');
    try {
      await page.click('text=集群服务', { timeout: 10000 });
    } catch (e) {
      // Try finding by partial match
      const menuItems = await page.$$('a, div, li');
      for (const item of menuItems) {
        const text = await item.textContent().catch(() => '');
        if (text.includes('集群服务') || text.includes('服务')) {
          await item.click();
          console.log('   ✓ Clicked via text match');
          break;
        }
      }
    }
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/tbds-services.png', fullPage: false });
    
    // Find Spark
    console.log('\n⚡ Finding Spark...');
    const rows = await page.$$('tr');
    for (const row of rows) {
      const text = await row.textContent().catch(() => '');
      if (text.includes('Spark') && !text.includes('Spark2x')) {
        console.log('   ✓ Found Spark row');
        await row.click();
        await page.waitForTimeout(5000);
        break;
      }
    }
    
    await page.screenshot({ path: '/tmp/tbds-spark.png', fullPage: false });
    
    // Click 操作 and 重启
    console.log('\n🔄 Restarting Spark...');
    const opBtn = await page.$('button:has-text("操作")');
    if (opBtn) {
      await opBtn.click();
      await page.waitForTimeout(2000);
      
      await page.click('text=重启');
      await page.waitForTimeout(2000);
      
      await page.click('button:has-text("确定")');
      console.log('   ✓ Confirmed restart');
      await page.waitForTimeout(10000);
      
      await page.screenshot({ path: '/tmp/tbds-restart-result.png', fullPage: false });
    }
    
    console.log('\n✅ Done!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/tbds-error.png', fullPage: false });
  }
  
  await browser.close();
})();
