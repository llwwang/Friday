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
    console.log('1. 访问登录页...');
    await page.goto('https://tbds.tbds.boc.fsphere.cn', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    await page.waitForTimeout(5000);
    
    console.log('2. 点击"子账号登录"选项卡...');
    // 查找并点击"子账号登录"
    const subAccountTab = await page.$('text=子账号登录');
    if (subAccountTab) {
      await subAccountTab.click();
      console.log('✓ 已点击子账号登录');
      await page.waitForTimeout(3000);
    } else {
      console.log('未找到子账号登录选项卡，尝试查找包含"子账号"的元素...');
      // 尝试查找包含子账号文本的链接或按钮
      const elements = await page.$$('a, button, span');
      for (const el of elements) {
        const text = await el.textContent().catch(() => '');
        if (text.includes('子账号')) {
          console.log(`点击: ${text}`);
          await el.click();
          await page.waitForTimeout(3000);
          break;
        }
      }
    }
    
    await page.screenshot({ path: '/tmp/tbds-step1-tab.png', fullPage: true });
    console.log('✓ 已保存: /tmp/tbds-step1-tab.png');
    
    console.log('3. 填写子账号信息...');
    // 子账号登录通常需要主账号和子账号两个字段，或特定格式
    const inputs = await page.$$('input');
    console.log(`找到 ${inputs.length} 个输入框`);
    
    // 获取输入框的 placeholder 或 name 属性
    for (let i = 0; i < inputs.length; i++) {
      const placeholder = await inputs[i].getAttribute('placeholder').catch(() => '');
      const name = await inputs[i].getAttribute('name').catch(() => '');
      const type = await inputs[i].getAttribute('type').catch(() => '');
      console.log(`输入框 ${i}: type=${type}, name=${name}, placeholder=${placeholder}`);
    }
    
    // 尝试填写 - 可能需要主账号和子账号两个字段
    // 或者使用 主账号:子账号 格式
    const usernameInput = await page.$('input[type="text"]:visible');
    const passwordInput = await page.$('input[type="password"]:visible');
    
    if (usernameInput) {
      // 尝试使用 @ 或 : 分隔的格式
      console.log('填写用户名: [YOUR_OWNER_UIN]@[YOUR_USERNAME]');
      await usernameInput.fill('[YOUR_OWNER_UIN]@[YOUR_USERNAME]');
    }
    
    if (passwordInput) {
      await passwordInput.fill('[YOUR_PASSWORD]');
      console.log('✓ 填写密码');
    }
    
    await page.screenshot({ path: '/tmp/tbds-step2-filled.png', fullPage: true });
    console.log('✓ 已保存: /tmp/tbds-step2-filled.png');
    
    console.log('4. 点击登录...');
    const loginBtn = await page.$('button[type="submit"], button:has-text("登录")');
    if (loginBtn) {
      await loginBtn.click();
      console.log('✓ 点击登录');
    }
    
    await page.waitForTimeout(10000);
    await page.screenshot({ path: '/tmp/tbds-step3-result.png', fullPage: true });
    console.log('✓ 已保存: /tmp/tbds-step3-result.png');
    
    const finalUrl = page.url();
    console.log(`最终URL: ${finalUrl}`);
    
    // 如果还是失败，尝试直接访问子账号登录链接
    if (finalUrl.includes('login')) {
      console.log('登录可能失败，尝试直接访问子账号登录页面...');
      await page.goto('https://tbds.tbds.boc.fsphere.cn/login/subaccount', {
        waitUntil: 'domcontentloaded',
        timeout: 20000
      }).catch(() => {});
      
      await page.waitForTimeout(5000);
      await page.screenshot({ path: '/tmp/tbds-step4-direct.png', fullPage: true });
      console.log('✓ 已保存: /tmp/tbds-step4-direct.png');
    }
    
    console.log('完成！');
    
  } catch (error) {
    console.error('错误:', error.message);
    await page.screenshot({ path: '/tmp/tbds-error.png', fullPage: true });
  }
  
  await browser.close();
})();
