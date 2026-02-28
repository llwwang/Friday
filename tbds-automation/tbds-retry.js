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
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/tbds-r1-start.png', fullPage: true });
    console.log('✓ 已截图初始页面');
    
    console.log('2. 查找并点击"子账号登录"...');
    // 查找所有文本包含"子账号登录"的元素
    const allElements = await page.$$('*');
    let subAccountElement = null;
    
    for (const el of allElements) {
      const text = await el.textContent().catch(() => '');
      if (text && text.trim() === '子账号登录') {
        subAccountElement = el;
        console.log('找到精确匹配的"子账号登录"元素');
        break;
      }
    }
    
    if (!subAccountElement) {
      // 尝试模糊匹配
      for (const el of allElements) {
        const text = await el.textContent().catch(() => '');
        if (text && text.includes('子账号登录')) {
          subAccountElement = el;
          console.log(`找到包含"子账号登录"的元素: "${text.trim()}"`);
          break;
        }
      }
    }
    
    if (subAccountElement) {
      // 尝试点击元素的父级（可能是按钮或链接）
      let clickableParent = subAccountElement;
      for (let i = 0; i < 3; i++) {
        const parent = await clickableParent.evaluate(el => el.parentElement).catch(() => null);
        if (parent) {
          const tagName = await parent.evaluate(el => el.tagName.toLowerCase());
          if (['a', 'button', 'div', 'span'].includes(tagName)) {
            clickableParent = parent;
            console.log(`找到可点击父元素: ${tagName}`);
            break;
          }
          clickableParent = parent;
        }
      }
      
      await clickableParent.click();
      console.log('✓ 已点击"子账号登录"');
      await page.waitForTimeout(5000);
    } else {
      console.log('未找到"子账号登录"按钮');
    }
    
    await page.screenshot({ path: '/tmp/tbds-r2-after-click.png', fullPage: true });
    console.log('✓ 已截图点击后页面');
    
    console.log('3. 填写登录表单...');
    // 查找所有输入框
    const inputs = await page.$$('input');
    console.log(`找到 ${inputs.length} 个输入框`);
    
    // 显示每个输入框的信息
    for (let i = 0; i < inputs.length; i++) {
      const placeholder = await inputs[i].getAttribute('placeholder').catch(() => '');
      const name = await inputs[i].getAttribute('name').catch(() => '');
      const id = await inputs[i].getAttribute('id').catch(() => '');
      const type = await inputs[i].getAttribute('type').catch(() => '');
      console.log(`输入框 ${i}: name="${name}", id="${id}", placeholder="${placeholder}", type="${type}"`);
    }
    
    // 按 name 属性填写
    const ownerUin = await page.$('input[name="ownerUin"]');
    const username = await page.$('input[name="username"]');
    const password = await page.$('input[type="password"]');
    
    if (ownerUin) {
      await ownerUin.click();
      await ownerUin.fill('110000000000');
      console.log('✓ 填写主账号: 110000000000');
    }
    
    if (username) {
      await username.click();
      await username.fill('leozwang');
      console.log('✓ 填写子账号用户名: leozwang');
    }
    
    if (password) {
      await password.click();
      await password.fill('Leozwang@1234');
      console.log('✓ 填写密码');
    }
    
    await page.screenshot({ path: '/tmp/tbds-r3-filled.png', fullPage: true });
    console.log('✓ 已截图填写后');
    
    console.log('4. 点击登录按钮...');
    // 查找登录按钮
    const loginBtns = await page.$$('button');
    console.log(`找到 ${loginBtns.length} 个按钮`);
    
    for (const btn of loginBtns) {
      const text = await btn.textContent().catch(() => '');
      if (text.includes('登录')) {
        console.log(`点击登录按钮: "${text.trim()}"`);
        await btn.click();
        break;
      }
    }
    
    console.log('等待跳转...');
    await page.waitForTimeout(15000);
    
    const currentUrl = page.url();
    console.log(`当前URL: ${currentUrl}`);
    
    const title = await page.title();
    console.log(`页面标题: ${title}`);
    
    await page.screenshot({ path: '/tmp/tbds-r4-final.png', fullPage: true });
    console.log('✓ 已截图最终结果');
    
    // 检查是否在登录页
    if (currentUrl.includes('login')) {
      console.log('⚠️ 似乎还在登录页，检查错误信息...');
      const errorText = await page.$eval('.error, .error-message, [role="alert"], .ant-form-item-explain', el => el.textContent).catch(() => '');
      if (errorText) {
        console.log(`错误信息: ${errorText}`);
      }
    }
    
  } catch (error) {
    console.error('错误:', error.message);
    await page.screenshot({ path: '/tmp/tbds-r-error.png', fullPage: true });
  }
  
  await browser.close();
  console.log('完成');
})();
