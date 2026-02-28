const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors']
  });
  
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1920, height: 1080 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('访问登录页...');
    await page.goto('https://tbds.tbds.boc.fsphere.cn', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    
    await page.screenshot({ path: '/tmp/tbds-1-login.png', fullPage: true });
    console.log('✓ 登录页截图已保存');
    
    // 查找输入框
    const inputs = await page.$$('input');
    console.log(`找到 ${inputs.length} 个输入框`);
    
    // 尝试填写用户名
    await page.fill('input[type="text"]', '[YOUR_USERNAME]');
    console.log('✓ 填写用户名');
    
    // 填写密码
    await page.fill('input[type="password"]', '[YOUR_PASSWORD]');
    console.log('✓ 填写密码');
    
    await page.screenshot({ path: '/tmp/tbds-2-filled.png', fullPage: true });
    console.log('✓ 表单填写截图已保存');
    
    // 点击登录
    await page.click('button[type="submit"], button:has-text("登录")');
    console.log('✓ 点击登录');
    
    // 等待跳转
    await page.waitForTimeout(8000);
    await page.screenshot({ path: '/tmp/tbds-3-home.png', fullPage: true });
    console.log('✓ 首页截图已保存');
    
  } catch (e) {
    console.error('错误:', e.message);
    await page.screenshot({ path: '/tmp/tbds-error.png', fullPage: true });
  }
  
  await browser.close();
  console.log('完成');
})();
