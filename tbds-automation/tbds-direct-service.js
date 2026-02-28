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
    
    // 尝试不同的 URL 模式访问服务
    console.log('\n2. 尝试直接访问服务页面');
    
    // 尝试模式1: /service
    await page.goto('https://tbds.tbds.boc.fsphere.cn/tm/framework/tbds-cmpz3tbs/service');
    await page.waitForTimeout(5000);
    let content = await page.evaluate(() => document.body.innerText);
    console.log('   URL模式1结果:', content.substring(0, 100));
    await page.screenshot({ path: '/tmp/tbds-url1.png' });
    
    if (content.includes('Spark')) {
      console.log('   ✅ 找到 Spark！');
    } else {
      // 尝试模式2: /services
      console.log('\n3. 尝试 /services');
      await page.goto('https://tbds.tbds.boc.fsphere.cn/tm/framework/tbds-cmpz3tbs/services');
      await page.waitForTimeout(5000);
      content = await page.evaluate(() => document.body.innerText);
      console.log('   URL模式2结果:', content.substring(0, 100));
      await page.screenshot({ path: '/tmp/tbds-url2.png' });
      
      if (content.includes('Spark')) {
        console.log('   ✅ 找到 Spark！');
      } else {
        // 尝试模式3: /component
        console.log('\n4. 尝试 /component');
        await page.goto('https://tbds.tbds.boc.fsphere.cn/tm/framework/tbds-cmpz3tbs/component');
        await page.waitForTimeout(5000);
        content = await page.evaluate(() => document.body.innerText);
        console.log('   URL模式3结果:', content.substring(0, 100));
        await page.screenshot({ path: '/tmp/tbds-url3.png' });
        
        if (content.includes('Spark')) {
          console.log('   ✅ 找到 Spark！');
        } else {
          console.log('\n5. 尝试获取完整页面HTML查找线索');
          const html = await page.content();
          
          // 查找所有链接
          const links = await page.evaluate(() => {
            const result = [];
            document.querySelectorAll('a').forEach(a => {
              const href = a.getAttribute('href') || '';
              const text = a.textContent.trim();
              if (href.includes('service') || href.includes('component') || text.includes('服务')) {
                result.push({ text, href });
              }
            });
            return result;
          });
          
          console.log('   服务相关链接:', links);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/tbds-error.png' });
  }
  
  await browser.close();
})();
