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
    await page.fill('input[name="ownerUin"]', '110000000000');
    await page.fill('input[name="username"]', 'leozwang');
    await page.fill('input[type="password"]', 'Leozwang@1234');
    await page.click('button:has-text("登录")');
    await page.waitForTimeout(5000);
    const continueBtn = await page.$('text=/继续登录/i');
    if (continueBtn) await continueBtn.click();
    await page.waitForTimeout(5000);
    console.log('   ✅ 登录成功');
    
    // 点击平台管理
    console.log('\n2. 进入平台管理');
    await page.click('text=平台管理');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/tbds-platform.png' });
    
    const content = await page.evaluate(() => document.body.innerText);
    console.log('   页面内容预览:', content.substring(0, 200));
    
    // 查找服务相关链接
    const links = await page.evaluate(() => {
      const result = [];
      document.querySelectorAll('a').forEach(a => {
        const text = a.textContent.trim();
        const href = a.getAttribute('href') || '';
        if (text.includes('服务') || text.includes('组件') || text.includes('Spark') || text.includes('集群')) {
          result.push({ text, href });
        }
      });
      return result;
    });
    
    console.log('\n   找到的服务相关链接:', links);
    
    // 尝试数据管理
    console.log('\n3. 进入数据管理');
    await page.click('text=数据管理');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/tbds-data.png' });
    
    const dataContent = await page.evaluate(() => document.body.innerText);
    console.log('   数据管理页面包含 Spark:', dataContent.includes('Spark'));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/tbds-platform-error.png' });
  }
  
  await browser.close();
})();
