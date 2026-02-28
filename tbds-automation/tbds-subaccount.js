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
    
    console.log('2. 检查登录方式...');
    // 查找是否有"子账号登录"、"RAM用户"等选项
    const subAccountLinks = await page.$$('a, button, span, div');
    let hasSubAccountOption = false;
    
    for (const link of subAccountLinks) {
      const text = await link.textContent().catch(() => '');
      if (text && (text.includes('子账号') || text.includes('RAM') || text.includes('Sub'))) {
        console.log(`找到子账号相关选项: ${text.trim()}`);
        hasSubAccountOption = true;
        // 点击子账号登录
        await link.click().catch(() => {});
        await page.waitForTimeout(3000);
        break;
      }
    }
    
    if (!hasSubAccountOption) {
      console.log('未找到独立的子账号登录入口，可能是在同一表单');
    }
    
    // 截图查看当前状态
    await page.screenshot({ path: '/tmp/tbds-check-login-type.png', fullPage: true });
    console.log('✓ 已保存: /tmp/tbds-check-login-type.png');
    
    console.log('3. 尝试子账号格式登录...');
    // 尝试使用 "主账号:子账号" 格式
    const usernameInput = await page.$('input[type="text"], input[name="username"]');
    const passwordInput = await page.$('input[type="password"]');
    
    if (usernameInput && passwordInput) {
      // 先清除之前的输入
      await usernameInput.fill('');
      await passwordInput.fill('');
      
      // 尝试子账号格式：110000000000:leozwang 或 leozwang@110000000000
      console.log('尝试格式1: 110000000000:leozwang');
      await usernameInput.fill('110000000000:leozwang');
      await passwordInput.fill('Leozwang@1234');
      
      await page.screenshot({ path: '/tmp/tbds-subaccount-try1.png', fullPage: true });
      console.log('✓ 已保存: /tmp/tbds-subaccount-try1.png');
      
      // 点击登录
      const loginBtn = await page.$('button[type="submit"], button:has-text("登录")');
      if (loginBtn) {
        await loginBtn.click();
        console.log('点击登录...');
      }
      
      await page.waitForTimeout(8000);
      await page.screenshot({ path: '/tmp/tbds-subaccount-result1.png', fullPage: true });
      console.log('✓ 已保存: /tmp/tbds-subaccount-result1.png');
      
      // 检查是否登录成功（通过URL或页面内容判断）
      const currentUrl = page.url();
      console.log(`当前URL: ${currentUrl}`);
      
      if (currentUrl.includes('login') || currentUrl === 'https://tbds.tbds.boc.fsphere.cn/') {
        console.log('可能登录失败，尝试其他格式...');
        
        // 尝试另一种格式
        await page.goto('https://tbds.tbds.boc.fsphere.cn', { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(3000);
        
        const usernameInput2 = await page.$('input[type="text"], input[name="username"]');
        const passwordInput2 = await page.$('input[type="password"]');
        
        if (usernameInput2 && passwordInput2) {
          console.log('尝试格式2: leozwang (纯子账号名)');
          await usernameInput2.fill('leozwang');
          await passwordInput2.fill('Leozwang@1234');
          
          const loginBtn2 = await page.$('button[type="submit"], button:has-text("登录")');
          if (loginBtn2) {
            await loginBtn2.click();
          }
          
          await page.waitForTimeout(8000);
          await page.screenshot({ path: '/tmp/tbds-subaccount-result2.png', fullPage: true });
          console.log('✓ 已保存: /tmp/tbds-subaccount-result2.png');
        }
      }
    }
    
    console.log('完成！');
    
  } catch (error) {
    console.error('错误:', error.message);
    await page.screenshot({ path: '/tmp/tbds-error.png', fullPage: true });
  }
  
  await browser.close();
})();
