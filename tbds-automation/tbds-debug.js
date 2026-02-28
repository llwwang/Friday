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
    await page.goto('https://tbds.tbds.boc.fsphere.cn', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(3000);
    
    // 点击子账号登录
    await page.click('text=子账号登录');
    await page.waitForTimeout(3000);
    
    // 填写表单
    await page.fill('input[name="ownerUin"]', '[YOUR_OWNER_UIN]');
    await page.fill('input[name="username"]', '[YOUR_USERNAME]');
    await page.fill('input[type="password"]', '[YOUR_PASSWORD]');
    
    await page.screenshot({ path: '/tmp/tbds-debug-before.png', fullPage: true });
    
    // 点击登录
    await page.click('button:has-text("登录")');
    console.log('已点击登录');
    
    // 等待响应
    await page.waitForTimeout(8000);
    
    // 检查URL
    const url = page.url();
    console.log('当前URL:', url);
    
    // 检查页面内容
    const content = await page.content();
    if (content.includes('错误') || content.includes('失败') || content.includes('error')) {
      console.log('页面可能包含错误信息');
    }
    
    await page.screenshot({ path: '/tmp/tbds-debug-after.png', fullPage: true });
    console.log('✓ 已保存调试截图');
    
  } catch (error) {
    console.error('错误:', error.message);
  }
  
  await browser.close();
})();
