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
    console.log('1. Login...');
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
    
    console.log('   ✓ Logged in');
    
    // Go to tbds-user1 directly
    console.log('2. Go to tbds-user1...');
    await page.goto('https://tbds.tbds.boc.fsphere.cn/tm/framework/tbds-2083p30y');
    await page.waitForTimeout(5000);
    console.log('   ✓ In tbds-user1');
    await page.screenshot({ path: '/tmp/tbds-user1-main.png' });
    
    // Click 集群服务
    console.log('3. Click 集群服务...');
    await page.evaluate(() => {
      const items = document.querySelectorAll('a, div, span, li');
      for (const item of items) {
        if (item.textContent && item.textContent.includes('集群服务')) {
          item.click();
          return;
        }
      }
    });
    await page.waitForTimeout(5000);
    console.log('   ✓ Clicked');
    await page.screenshot({ path: '/tmp/tbds-services-list.png' });
    
    // Click Spark
    console.log('4. Find and click Spark...');
    await page.evaluate(() => {
      const rows = document.querySelectorAll('tr');
      for (const row of rows) {
        const text = row.textContent || '';
        if (text.includes('Spark') && !text.includes('Spark2x')) {
          const link = row.querySelector('a') || row;
          link.click();
          return;
        }
      }
    });
    await page.waitForTimeout(5000);
    console.log('   ✓ In Spark page');
    await page.screenshot({ path: '/tmp/tbds-spark-detail.png' });
    
    // Click 操作 and 重启
    console.log('5. Restart Spark...');
    const opBtn = await page.$('button:has-text("操作")');
    if (opBtn) {
      await opBtn.click();
      await page.waitForTimeout(2000);
      
      // Click restart
      await page.evaluate(() => {
        const items = document.querySelectorAll('div, span, li, a');
        for (const item of items) {
          if (item.textContent === '重启' || item.textContent.includes('重启')) {
            item.click();
            return;
          }
        }
      });
      await page.waitForTimeout(2000);
      
      // Confirm
      await page.click('button:has-text("确定")');
      console.log('   ✓ Confirmed restart');
      await page.waitForTimeout(10000);
      
      await page.screenshot({ path: '/tmp/tbds-restart-final.png' });
      console.log('   ✓ Done');
    } else {
      console.log('   ✗ No operation button found');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    await page.screenshot({ path: '/tmp/tbds-error.png' });
  }
  
  await browser.close();
})();
