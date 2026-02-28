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
    
    console.log('\n2. 进入标准集群列表');
    await page.goto('https://tbds.tbds.boc.fsphere.cn/tm/framework?type=standardClusters');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/tbds-v2-01-clusters.png' });
    
    console.log('\n3. 点击 tbds-cmpz3tbs 集群');
    await page.click('text=tbds-cmpz3tbs');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/tbds-v2-02-cluster-detail.png' });
    console.log('   ✅ 进入集群详情');
    
    console.log('\n4. 点击左侧菜单"集群服务"');
    // 等待左侧菜单加载
    await page.waitForSelector('text=集群服务', { timeout: 10000 });
    await page.click('text=集群服务');
    await page.waitForTimeout(8000);
    await page.screenshot({ path: '/tmp/tbds-v2-03-services.png' });
    console.log('   ✅ 进入集群服务');
    
    console.log('\n5. 查找所有服务');
    const services = await page.evaluate(() => {
      const result = [];
      // 查找所有可能包含服务名称的元素
      const elements = document.querySelectorAll('td, div, span, a');
      elements.forEach(el => {
        const text = el.textContent || '';
        if (text.includes('Spark') || text.includes('Hadoop') || text.includes('Hive') || 
            text.includes('YARN') || text.includes('HDFS') || text.includes('ZooKeeper')) {
          result.push(text.trim().substring(0, 50));
        }
      });
      return [...new Set(result)]; // 去重
    });
    
    console.log('   找到的服务:', services);
    
    console.log('\n6. 查找操作按钮');
    const buttons = await page.evaluate(() => {
      const result = [];
      const btns = document.querySelectorAll('button');
      btns.forEach(btn => {
        const text = btn.textContent || '';
        if (text.includes('操作') || text.includes('重启') || text.includes('更多')) {
          result.push(text.trim());
        }
      });
      return result;
    });
    
    console.log('   操作按钮:', buttons);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/tbds-v2-error.png' });
  }
  
  await browser.close();
})();
