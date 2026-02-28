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
    
    // 访问 tbds-user1
    console.log('\n2. 访问 tbds-user1 集群');
    await page.goto('https://tbds.tbds.boc.fsphere.cn/tm/framework/tbds-2083p30y');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/tbds-user1-home.png' });
    console.log('   ✅ 进入集群');
    
    // 获取页面所有文本
    console.log('\n3. 检查页面内容');
    const content = await page.evaluate(() => document.body.innerText);
    
    // 查找是否有集群服务菜单
    const hasServiceMenu = content.includes('集群服务');
    console.log('   有集群服务菜单:', hasServiceMenu);
    
    if (hasServiceMenu) {
      console.log('   尝试点击集群服务...');
      await page.click('text=集群服务');
      await page.waitForTimeout(5000);
      await page.screenshot({ path: '/tmp/tbds-user1-services.png' });
      
      // 检查 Spark
      const serviceContent = await page.evaluate(() => document.body.innerText);
      const hasSpark = serviceContent.includes('Spark');
      console.log('   包含 Spark:', hasSpark);
      
      if (hasSpark) {
        console.log('   ✅ 找到 Spark！');
        // 查找 Spark 行并尝试重启
        const sparkRow = await page.evaluate(() => {
          const rows = document.querySelectorAll('tr');
          for (const row of rows) {
            if (row.textContent.includes('Spark') && !row.textContent.includes('Spark2x')) {
              return row.textContent.substring(0, 300);
            }
          }
          return null;
        });
        console.log('   Spark 行内容:', sparkRow);
      }
    } else {
      console.log('   没有集群服务菜单，查找其他入口...');
      
      // 查找所有菜单项
      const menuItems = await page.evaluate(() => {
        const items = document.querySelectorAll('a, div, li');
        const result = [];
        items.forEach(item => {
          const text = item.textContent.trim();
          if (text && text.length < 30 && (text.includes('服务') || text.includes('组件') || text.includes('管理'))) {
            result.push(text);
          }
        });
        return [...new Set(result)];
      });
      console.log('   相关菜单项:', menuItems);
    }
    
    // 尝试经典集群入口
    console.log('\n4. 尝试经典集群入口');
    await page.goto('https://tbds.tbds.boc.fsphere.cn/tm/framework?type=classicClusters');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/tbds-classic-clusters.png' });
    
    const classicContent = await page.evaluate(() => document.body.innerText);
    const hasSparkInClassic = classicContent.includes('Spark');
    console.log('   经典集群页面包含 Spark:', hasSparkInClassic);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/tbds-user1-error.png' });
  }
  
  await browser.close();
})();
