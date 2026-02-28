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
    console.log('1. 登录...');
    await page.goto('https://tbds.tbds.boc.fsphere.cn', { waitUntil: 'networkidle', timeout: 30000 });
    await page.click('text=子账号登录');
    await page.fill('input[name="ownerUin"]', '[YOUR_OWNER_UIN]');
    await page.fill('input[name="username"]', '[YOUR_USERNAME]');
    await page.fill('input[type="password"]', '[YOUR_PASSWORD]');
    await page.click('button:has-text("登录")');
    await page.waitForTimeout(5000);
    const continueBtn = await page.$('text=/继续登录/i');
    if (continueBtn) await continueBtn.click();
    await page.waitForTimeout(5000);
    console.log('   ✅ 登录成功');
    
    // 尝试 tbds-user2
    console.log('\n2. 进入 tbds-user2 集群服务页面');
    await page.goto('https://tbds.tbds.boc.fsphere.cn/tm/framework/tbds-user2?type=service');
    await page.waitForTimeout(5000);
    
    const retryBtn = await page.$('text=点击重试');
    if (retryBtn) {
      console.log('   点击重试...');
      await retryBtn.click();
      await page.waitForTimeout(8000);
    }
    
    await page.screenshot({ path: '/tmp/tbds-user2-01.png' });
    console.log('   ✅ 页面加载完成');
    
    // 查找 Spark
    const content = await page.evaluate(() => document.body.innerText);
    const hasSpark = content.includes('Spark') || content.includes('SPARK');
    console.log('   包含 Spark:', hasSpark);
    
    if (hasSpark) {
      console.log('   ✅ 找到 Spark！');
    } else {
      console.log('   ⚠️ 未找到 Spark');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  await browser.close();
})();
