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
    
    // 尝试访问第二个集群 tbds-8215p6l6
    console.log('\n2. 尝试 tbds-8215p6l6 集群');
    await page.goto('https://tbds.tbds.boc.fsphere.cn/tm/framework/tbds-8215p6l6');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/tbds-v4-cluster2.png' });
    console.log('   ✅ 进入集群2详情');
    
    // 获取页面菜单
    console.log('\n3. 查找左侧菜单');
    const menuItems = await page.evaluate(() => {
      const items = document.querySelectorAll('a, div, li');
      const result = [];
      items.forEach(item => {
        const text = item.textContent.trim();
        if (text && text.length < 20 && (text.includes('集群') || text.includes('服务') || text.includes('概览'))) {
          result.push(text);
        }
      });
      return [...new Set(result)];
    });
    console.log('   菜单项:', menuItems);
    
    // 尝试通过 JavaScript 点击集群服务
    console.log('\n4. 尝试点击集群服务');
    const clicked = await page.evaluate(() => {
      const items = document.querySelectorAll('*');
      for (const item of items) {
        if (item.textContent && item.textContent.trim() === '集群服务') {
          item.click();
          return 'Clicked';
        }
      }
      return 'Not found';
    });
    console.log('   点击结果:', clicked);
    
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/tbds-v4-services.png' });
    
    // 检查是否有 Spark
    console.log('\n5. 检查页面内容');
    const content = await page.evaluate(() => document.body.innerText);
    const hasSpark = content.includes('Spark');
    console.log('   包含 Spark:', hasSpark);
    
    if (hasSpark) {
      console.log('   ✅ 找到 Spark！');
      // 尝试查找 Spark 行
      const sparkInfo = await page.evaluate(() => {
        const rows = document.querySelectorAll('tr');
        for (const row of rows) {
          if (row.textContent.includes('Spark') && !row.textContent.includes('Spark2x')) {
            return row.textContent.substring(0, 200);
          }
        }
        return null;
      });
      console.log('   Spark 信息:', sparkInfo);
    } else {
      console.log('   ⚠️ 此集群也没有 Spark');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/tbds-v4-error.png' });
  }
  
  await browser.close();
})();
