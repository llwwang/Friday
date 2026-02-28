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
    console.log('访问 TBDS...');
    await page.goto('https://tbds.tbds.boc.fsphere.cn', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForTimeout(5000);
    
    // 点击子账号登录
    const subAccountLink = await page.$('text=子账号登录');
    if (subAccountLink) {
      await subAccountLink.click();
      await page.waitForTimeout(3000);
      console.log('✓ 切换到子账号登录');
    }
    
    // 正确填写三个字段
    console.log('填写登录信息...');
    
    // 1. 主账号UIN
    const ownerUinInput = await page.$('input[name="ownerUin"]');
    if (ownerUinInput) {
      await ownerUinInput.fill('[YOUR_OWNER_UIN]');
      console.log('✓ 填写主账号UIN: [YOUR_OWNER_UIN]');
    }
    
    // 2. 子账号用户名
    const usernameInput = await page.$('input[name="username"]');
    if (usernameInput) {
      await usernameInput.fill('[YOUR_USERNAME]');
      console.log('✓ 填写子账号用户名: [YOUR_USERNAME]');
    }
    
    // 3. 密码
    const passwordInput = await page.$('input[type="password"]');
    if (passwordInput) {
      await passwordInput.fill('[YOUR_PASSWORD]');
      console.log('✓ 填写密码');
    }
    
    await page.screenshot({ path: '/tmp/tbds-final-filled.png', fullPage: true });
    
    // 点击登录
    const loginBtn = await page.$('button:has-text("登录")');
    if (loginBtn) {
      await loginBtn.click();
      console.log('✓ 点击登录按钮');
    }
    
    // 等待更长时间，看是否有加载或跳转
    await page.waitForTimeout(15000);
    
    const currentUrl = page.url();
    console.log(`当前URL: ${currentUrl}`);
    
    await page.screenshot({ path: '/tmp/tbds-final-result.png', fullPage: true });
    console.log('✓ 已保存最终结果');
    
    // 检查页面标题
    const title = await page.title();
    console.log(`页面标题: ${title}`);
    
  } catch (error) {
    console.error('错误:', error.message);
  }
  
  await browser.close();
})();
