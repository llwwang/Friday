const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--ignore-certificate-errors',
      '--ignore-certificate-errors-spki-list'
    ],
    ignoreHTTPSErrors: true
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  try {
    // 访问登录页
    console.log('正在访问登录页...');
    await page.goto('https://tbds.tbds.boc.fsphere.cn', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // 截图查看页面结构
    await page.screenshot({ path: '/tmp/tbds-login-page.png', fullPage: true });
    console.log('已保存登录页截图: /tmp/tbds-login-page.png');
    
    // 查找用户名输入框
    const usernameInput = await page.$('input[type="text"], input[name="username"], input[id="username"], input[placeholder*="用户名"], input[placeholder*="账号"]');
    const passwordInput = await page.$('input[type="password"], input[name="password"], input[id="password"]');
    
    if (usernameInput && passwordInput) {
      console.log('找到登录表单，正在填写...');
      
      // 填写用户名
      await usernameInput.click();
      await usernameInput.type('leozwang');
      
      // 填写密码
      await passwordInput.click();
      await passwordInput.type('Leozwang@1234');
      
      // 截图填写后的表单
      await page.screenshot({ path: '/tmp/tbds-filled-form.png', fullPage: true });
      console.log('已保存填写后的表单: /tmp/tbds-filled-form.png');
      
      // 查找登录按钮
      const loginButton = await page.$('button[type="submit"], button:has-text("登录"), input[type="submit"], a:has-text("登录")');
      
      if (loginButton) {
        console.log('点击登录按钮...');
        await loginButton.click();
        
        // 等待页面跳转
        await page.waitForTimeout(5000);
        
        // 截图登录后的页面
        await page.screenshot({ path: '/tmp/tbds-after-login.png', fullPage: true });
        console.log('已保存登录后页面: /tmp/tbds-after-login.png');
        
        // 等待首页完全加载
        await page.waitForTimeout(5000);
        await page.screenshot({ path: '/tmp/tbds-homepage.png', fullPage: true });
        console.log('已保存首页截图: /tmp/tbds-homepage.png');
      } else {
        console.log('未找到登录按钮');
      }
    } else {
      console.log('未找到用户名或密码输入框');
      console.log('usernameInput:', !!usernameInput);
      console.log('passwordInput:', !!passwordInput);
    }
    
  } catch (error) {
    console.error('错误:', error.message);
    await page.screenshot({ path: '/tmp/tbds-error.png', fullPage: true });
    console.log('已保存错误截图: /tmp/tbds-error.png');
  }
  
  await browser.close();
  console.log('完成');
})();
