const { chromium } = require('/root/.local/share/pnpm/global/5/.pnpm/agent-browser@0.15.0/node_modules/playwright-core');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: '/usr/bin/google-chrome-stable',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--ignore-certificate-errors',
      '--ignore-certificate-errors-spki-list'
    ]
  });
  
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('🚀 Starting TBDS Login...');
    
    // Step 1: Open login page
    console.log('1️⃣ Opening login page...');
    await page.goto('https://tbds.tbds.boc.fsphere.cn', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForTimeout(5000);
    
    // Step 2: Click "Sub-account Login"
    console.log('2️⃣ Clicking "Sub-account Login" tab...');
    await page.click('text=子账号登录');
    await page.waitForTimeout(3000);
    
    // Step 3: Fill login form
    console.log('3️⃣ Filling login form...');
    await page.fill('input[name="ownerUin"]', '110000000000');
    await page.fill('input[name="username"]', 'leozwang');
    await page.fill('input[type="password"]', 'Leozwang@1234');
    console.log('   ✓ Form filled');
    
    // Step 4: Click login
    console.log('4️⃣ Clicking login button...');
    await page.click('button:has-text("登录")');
    await page.waitForTimeout(8000);
    
    // Step 5: Check for "logged in elsewhere" prompt
    console.log('5️⃣ Checking for "logged in elsewhere" prompt...');
    const continueLoginBtn = await page.$('text=/继续登录|强制登录|重新登录|确定/i');
    if (continueLoginBtn) {
      console.log('   ⚠️ Detected prompt, clicking continue...');
      await continueLoginBtn.click();
      await page.waitForTimeout(8000);
    }
    
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log(`   Current URL: ${currentUrl}`);
    
    if (!currentUrl.includes('/tm')) {
      console.log('❌ Login failed, still on login page');
      await page.screenshot({ path: '/tmp/tbds-error.png', fullPage: true });
      await browser.close();
      process.exit(1);
    }
    
    console.log('✅ Login successful!');
    await page.screenshot({ path: '/tmp/tbds-logged-in.png', fullPage: true });
    
    // Step 6: Find user1 cluster
    console.log('\n6️⃣ Looking for "user1" cluster...');
    
    // Try to find user1 cluster link/card
    const user1Link = await page.$('text=/user1/i');
    if (user1Link) {
      console.log('   ✓ Found user1 cluster, clicking...');
      await user1Link.click();
      await page.waitForTimeout(5000);
    } else {
      console.log('   Searching in cluster list...');
      // Look for standard clusters section
      const standardClusterLink = await page.$('text=/标准集群|集群列表/i');
      if (standardClusterLink) {
        await standardClusterLink.click();
        await page.waitForTimeout(3000);
        
        // Now look for user1
        const user1InList = await page.$('text=/user1/i');
        if (user1InList) {
          await user1InList.click();
          await page.waitForTimeout(5000);
        }
      }
    }
    
    await page.screenshot({ path: '/tmp/tbds-user1-cluster.png', fullPage: true });
    console.log('   ✓ Navigated to cluster page');
    
    // Step 7: Find Spark service
    console.log('\n7️⃣ Looking for Spark service...');
    const sparkLink = await page.$('text=/Spark/i');
    if (sparkLink) {
      console.log('   ✓ Found Spark service, clicking...');
      await sparkLink.click();
      await page.waitForTimeout(5000);
    } else {
      // Look for "集群服务" or "服务管理"
      const serviceLink = await page.$('text=/集群服务|服务管理|组件/i');
      if (serviceLink) {
        await serviceLink.click();
        await page.waitForTimeout(3000);
        
        // Now look for Spark
        const sparkInList = await page.$('text=/Spark/i');
        if (sparkInList) {
          await sparkInList.click();
          await page.waitForTimeout(5000);
        }
      }
    }
    
    await page.screenshot({ path: '/tmp/tbds-spark-service.png', fullPage: true });
    console.log('   ✓ Navigated to Spark service page');
    
    // Step 8: Restart Spark service
    console.log('\n8️⃣ Attempting to restart Spark service...');
    
    // Look for restart button (重启)
    const restartBtn = await page.$('text=/重启|重启服务|批量重启/i');
    if (restartBtn) {
      console.log('   ✓ Found restart button, clicking...');
      await restartBtn.click();
      await page.waitForTimeout(3000);
      
      // Look for confirmation button
      const confirmBtn = await page.$('text=/确定|确认|是|Yes/i');
      if (confirmBtn) {
        await confirmBtn.click();
        console.log('   ✓ Confirmed restart');
        await page.waitForTimeout(10000);
      }
    } else {
      // Try to find operation dropdown or menu
      console.log('   Looking for operation menu...');
      const operationBtn = await page.$('text=/操作|更多|批量操作/i');
      if (operationBtn) {
        await operationBtn.click();
        await page.waitForTimeout(2000);
        
        // Look for restart in dropdown
        const restartInMenu = await page.$('text=/重启/i');
        if (restartInMenu) {
          await restartInMenu.click();
          await page.waitForTimeout(3000);
          
          // Confirm
          const confirmBtn = await page.$('text=/确定|确认/i');
          if (confirmBtn) {
            await confirmBtn.click();
            console.log('   ✓ Confirmed restart');
            await page.waitForTimeout(10000);
          }
        }
      }
    }
    
    await page.screenshot({ path: '/tmp/tbds-spark-restart-result.png', fullPage: true });
    console.log('   ✓ Screenshot saved: /tmp/tbds-spark-restart-result.png');
    
    // Check for success message
    const successMsg = await page.$('text=/成功|重启成功|操作成功/i');
    if (successMsg) {
      console.log('\n✅ Spark service restart initiated successfully!');
    } else {
      console.log('\n⚠️ Restart action performed, check screenshot for status');
    }
    
    console.log('\n📸 Screenshots saved:');
    console.log('   - /tmp/tbds-logged-in.png (Login success)');
    console.log('   - /tmp/tbds-user1-cluster.png (User1 cluster)');
    console.log('   - /tmp/tbds-spark-service.png (Spark service)');
    console.log('   - /tmp/tbds-spark-restart-result.png (Restart result)');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/tbds-error.png', fullPage: true });
  }
  
  await browser.close();
})();
