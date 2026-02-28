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
    console.log('1. 访问登录页...');
    await page.goto('https://tbds.tbds.boc.fsphere.cn', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/tbds-step1.png', fullPage: true });
    console.log('✓ 已保存: /tmp/tbds-step1.png');
    
    console.log('2. 查找登录表单...');
    // 获取页面所有输入框
    const inputs = await page.$$('input');
    console.log(`找到 ${inputs.length} 个输入框`);
    
    // 尝试找到用户名输入框（通常是第一个 text 类型）
    const usernameSelectors = [
      'input[type="text"]',
      'input[name="username"]',
      'input[id="username"]',
      'input[placeholder*="用户"]',
      'input[placeholder*="账号"]',
      'input:first-of-type'
    ];
    
    let usernameInput = null;
    for (const selector of usernameSelectors) {
      try {
        usernameInput = await page.$(selector);
        if (usernameInput) {
          console.log(`找到用户名输入框: ${selector}`);
          break;
        }
      } catch (e) {}
    }
    
    if (usernameInput) {
      await usernameInput.fill('[YOUR_USERNAME]');
      console.log('✓ 填写用户名: [YOUR_USERNAME]');
    }
    
    // 查找密码框
    const passwordInput = await page.$('input[type="password"]');
    if (passwordInput) {
      await passwordInput.fill('[YOUR_PASSWORD]');
      console.log('✓ 填写密码');
    }
    
    await page.screenshot({ path: '/tmp/tbds-step2.png', fullPage: true });
    console.log('✓ 已保存: /tmp/tbds-step2.png');
    
    console.log('3. 点击登录...');
    const loginBtn = await page.$('button[type="submit"], button:has-text("登录"), input[type="submit"]');
    if (loginBtn) {
      await loginBtn.click();
      console.log('✓ 点击登录按钮');
    }
    
    // 等待页面跳转
    await page.waitForTimeout(10000);
    await page.screenshot({ path: '/tmp/tbds-step3.png', fullPage: true });
    console.log('✓ 已保存: /tmp/tbds-step3.png (登录后)');
    
    console.log('完成！');
    
  } catch (error) {
    console.error('错误:', error.message);
    await page.screenshot({ path: '/tmp/tbds-error.png', fullPage: true });
  }
  
  await browser.close();
})();
