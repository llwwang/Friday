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
    console.log('1. 打开登录页...');
    await page.goto('https://tbds.tbds.boc.fsphere.cn', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/tbds-s1.png', fullPage: true });
    console.log('✓ 截图1: 初始页面');
    
    console.log('2. 点击"子账号登录"...');
    // 使用 text selector
    await page.click('text=子账号登录');
    console.log('✓ 已点击');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/tbds-s2.png', fullPage: true });
    console.log('✓ 截图2: 点击后');
    
    console.log('3. 填写表单...');
    
    // 主账号
    await page.fill('input[name="ownerUin"]', '[YOUR_OWNER_UIN]');
    console.log('✓ 填写主账号: [YOUR_OWNER_UIN]');
    
    // 子账号用户名
    await page.fill('input[name="username"]', '[YOUR_USERNAME]');
    console.log('✓ 填写子账号: [YOUR_USERNAME]');
    
    // 密码
    await page.fill('input[type="password"]', '[YOUR_PASSWORD]');
    console.log('✓ 填写密码');
    
    await page.screenshot({ path: '/tmp/tbds-s3.png', fullPage: true });
    console.log('✓ 截图3: 填写完成');
    
    console.log('4. 点击登录...');
    await page.click('button:has-text("登录")');
    console.log('✓ 已点击登录');
    
    await page.waitForTimeout(20000);
    
    const url = page.url();
    const title = await page.title();
    console.log(`URL: ${url}`);
    console.log(`标题: ${title}`);
    
    await page.screenshot({ path: '/tmp/tbds-s4.png', fullPage: true });
    console.log('✓ 截图4: 最终结果');
    
    if (url.includes('/tm') || url.includes('/console') || url.includes('/dashboard')) {
      console.log('🎉 登录成功！');
    } else if (url.includes('login')) {
      console.log('❌ 可能仍在登录页');
    }
    
  } catch (error) {
    console.error('错误:', error.message);
    await page.screenshot({ path: '/tmp/tbds-s-error.png', fullPage: true });
  }
  
  await browser.close();
})();
