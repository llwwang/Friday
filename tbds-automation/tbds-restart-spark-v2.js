const { chromium } = require('/root/.local/share/pnpm/global/5/.pnpm/agent-browser@0.15.0/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome-stable',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--ignore-certificate-errors'
    ]
  });
  
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('🚀 Starting TBDS Login...');
    
    // Step 1-5: Login (same as before)
    await page.goto('https://tbds.tbds.boc.fsphere.cn', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForTimeout(5000);
    
    await page.click('text=子账号登录');
    await page.waitForTimeout(3000);
    
    await page.fill('input[name="ownerUin"]', '110000000000');
    await page.fill('input[name="username"]', 'leozwang');
    await page.fill('input[type="password"]', 'Leozwang@1234');
    
    await page.click('button:has-text("登录")');
    await page.waitForTimeout(8000);
    
    const continueLoginBtn = await page.$('text=/继续登录|强制登录/i');
    if (continueLoginBtn) {
      await continueLoginBtn.click();
      await page.waitForTimeout(8000);
    }
    
    console.log('✅ Login successful!');
    await page.screenshot({ path: '/tmp/tbds-home.png', fullPage: true });
    
    // Step 6: Click "标准集群" (Standard Clusters) in left menu
    console.log('\n6️⃣ Clicking "标准集群" (Standard Clusters)...');
    const standardClusterMenu = await page.$('text=/标准集群/');
    if (standardClusterMenu) {
      await standardClusterMenu.click();
      console.log('   ✓ Clicked 标准集群');
      await page.waitForTimeout(5000);
    } else {
      console.log('   ⚠️ 标准集群 menu not found, looking for alternatives...');
      // Try to find in main content area
      const standardClusterLink = await page.$('a:has-text("标准集群"), div:has-text("标准集群")');
      if (standardClusterLink) {
        await standardClusterLink.click();
        await page.waitForTimeout(5000);
      }
    }
    
    await page.screenshot({ path: '/tmp/tbds-standard-clusters.png', fullPage: true });
    console.log('   ✓ Screenshot: standard clusters page');
    
    // Step 7: Find and click "tbds-user1" cluster
    console.log('\n7️⃣ Looking for "tbds-user1" cluster...');
    
    // Look for tbds-user1 in various formats
    const clusterSelectors = [
      'text=/tbds-user1/i',
      'text=/user1/i',
      'a:has-text("tbds-user1")',
      'div:has-text("tbds-user1")'
    ];
    
    let clusterFound = false;
    for (const selector of clusterSelectors) {
      const clusterLink = await page.$(selector);
      if (clusterLink) {
        console.log(`   ✓ Found cluster with selector: ${selector}`);
        await clusterLink.click();
        clusterFound = true;
        await page.waitForTimeout(5000);
        break;
      }
    }
    
    if (!clusterFound) {
      console.log('   ⚠️ tbds-user1 not found with text selectors, looking for all cluster links...');
      // Get all links and check their text
      const links = await page.$$('a, div[role="button"]');
      for (const link of links) {
        const text = await link.textContent().catch(() => '');
        if (text && (text.includes('user1') || text.includes('tbds'))) {
          console.log(`   Found potential cluster: ${text.trim()}`);
          await link.click();
          await page.waitForTimeout(5000);
          clusterFound = true;
          break;
        }
      }
    }
    
    await page.screenshot({ path: '/tmp/tbds-tbds-user1-cluster.png', fullPage: true });
    console.log('   ✓ Screenshot: tbds-user1 cluster page');
    
    // Step 8: Find "集群服务" (Cluster Services) and click
    console.log('\n8️⃣ Looking for "集群服务" (Cluster Services)...');
    const serviceMenu = await page.$('text=/集群服务|服务|组件/i');
    if (serviceMenu) {
      await serviceMenu.click();
      console.log('   ✓ Clicked 集群服务');
      await page.waitForTimeout(5000);
    }
    
    await page.screenshot({ path: '/tmp/tbds-services-list.png', fullPage: true });
    console.log('   ✓ Screenshot: services list');
    
    // Step 9: Find Spark service
    console.log('\n9️⃣ Looking for Spark service...');
    const sparkService = await page.$('text=/Spark/i');
    if (sparkService) {
      console.log('   ✓ Found Spark service, clicking...');
      await sparkService.click();
      await page.waitForTimeout(5000);
    } else {
      console.log('   ⚠️ Spark not found, looking for all services...');
      const services = await page.$$('a, div');
      for (const svc of services) {
        const text = await svc.textContent().catch(() => '');
        if (text && text.toLowerCase().includes('spark')) {
          console.log(`   Found: ${text.trim()}`);
          await svc.click();
          await page.waitForTimeout(5000);
          break;
        }
      }
    }
    
    await page.screenshot({ path: '/tmp/tbds-spark-detail.png', fullPage: true });
    console.log('   ✓ Screenshot: Spark detail page');
    
    // Step 10: Restart Spark service
    console.log('\n🔟 Attempting to restart Spark service...');
    
    // Look for operation buttons like "重启" (restart), "操作" (operations)
    const operationBtn = await page.$('text=/操作|批量操作|更多/i');
    if (operationBtn) {
      console.log('   ✓ Found operation button, clicking...');
      await operationBtn.click();
      await page.waitForTimeout(3000);
      
      // Look for restart option in dropdown
      const restartOption = await page.$('text=/重启|重启服务/i');
      if (restartOption) {
        console.log('   ✓ Found restart option, clicking...');
        await restartOption.click();
        await page.waitForTimeout(3000);
        
        // Confirm restart
        const confirmBtn = await page.$('text=/确定|确认|是/i');
        if (confirmBtn) {
          await confirmBtn.click();
          console.log('   ✓ Confirmed restart');
          await page.waitForTimeout(10000);
        }
      } else {
        console.log('   ⚠️ Restart option not found in dropdown');
      }
    } else {
      // Try to find direct restart button
      const restartBtn = await page.$('text=/重启全部|一键重启|服务重启/i');
      if (restartBtn) {
        console.log('   ✓ Found direct restart button');
        await restartBtn.click();
        await page.waitForTimeout(3000);
        
        const confirmBtn = await page.$('text=/确定|确认/i');
        if (confirmBtn) {
          await confirmBtn.click();
          console.log('   ✓ Confirmed restart');
          await page.waitForTimeout(10000);
        }
      }
    }
    
    await page.screenshot({ path: '/tmp/tbds-spark-restart-final.png', fullPage: true });
    console.log('   ✓ Screenshot: restart result');
    
    // Check status
    const currentUrl = page.url();
    console.log(`\n📊 Final URL: ${currentUrl}`);
    
    // Check for success or progress indicator
    const successIndicator = await page.$('text=/重启中|重启成功|操作成功|执行中/i');
    if (successIndicator) {
      const indicatorText = await successIndicator.textContent();
      console.log(`✅ Status: ${indicatorText}`);
    }
    
    console.log('\n📸 All screenshots saved:');
    console.log('   1. /tmp/tbds-home.png - TBDS Home');
    console.log('   2. /tmp/tbds-standard-clusters.png - Standard Clusters');
    console.log('   3. /tmp/tbds-tbds-user1-cluster.png - tbds-user1 Cluster');
    console.log('   4. /tmp/tbds-services-list.png - Services List');
    console.log('   5. /tmp/tbds-spark-detail.png - Spark Service Detail');
    console.log('   6. /tmp/tbds-spark-restart-final.png - Restart Result');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/tbds-error.png', fullPage: true });
  }
  
  await browser.close();
})();
