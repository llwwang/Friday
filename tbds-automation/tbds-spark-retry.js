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
    console.log('🚀 Step 1: 登录 TBDS');
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
    await page.screenshot({ path: '/tmp/tbds-01-logged-in.png' });
    
    console.log('\n🚀 Step 2: 进入标准集群列表');
    await page.goto('https://tbds.tbds.boc.fsphere.cn/tm/framework?type=standardClusters');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/tbds-02-clusters.png' });
    console.log('   ✅ 集群列表已加载');
    
    console.log('\n🚀 Step 3: 查找所有集群');
    const clusters = await page.evaluate(() => {
      const links = document.querySelectorAll('a');
      const result = [];
      links.forEach(link => {
        const text = link.textContent || '';
        const href = link.getAttribute('href') || '';
        if (text.includes('tbds') || href.includes('tbds')) {
          result.push({ text: text.trim(), href });
        }
      });
      return result;
    });
    
    console.log('   找到的集群:', clusters);
    
    // 尝试第一个有 tbds-cmp 的链接
    console.log('\n🚀 Step 4: 尝试访问 tbds-cmp 服务页面');
    await page.goto('https://tbds.tbds.boc.fsphere.cn/tm/framework/tbds-cmpz3tbs?type=service');
    await page.waitForTimeout(8000);
    
    // 点击重试按钮（如果有）
    const retryBtn = await page.$('text=点击重试');
    if (retryBtn) {
      console.log('   点击重试按钮...');
      await retryBtn.click();
      await page.waitForTimeout(8000);
    }
    
    await page.screenshot({ path: '/tmp/tbds-03-services.png' });
    console.log('   ✅ 服务页面已加载');
    
    console.log('\n🚀 Step 5: 查找 Spark 服务');
    const services = await page.evaluate(() => {
      const rows = document.querySelectorAll('tr');
      const result = [];
      rows.forEach((row, idx) => {
        const text = row.textContent || '';
        if (text.includes('Spark') || text.includes('Hadoop') || text.includes('Hive') || text.includes('YARN')) {
          const buttons = row.querySelectorAll('button');
          const btnTexts = [];
          buttons.forEach(btn => btnTexts.push(btn.textContent.trim()));
          result.push({ idx, text: text.substring(0, 100), buttons: btnTexts });
        }
      });
      return result;
    });
    
    console.log('   找到的服务:', services);
    
    if (services.length === 0) {
      console.log('   ⚠️ 没有找到 Spark，获取页面文本...');
      const pageText = await page.evaluate(() => document.body.innerText.substring(0, 500));
      console.log('   页面内容:', pageText);
    }
    
    console.log('\n🚀 Step 6: 尝试通过页面交互找到 Spark');
    // 尝试点击左侧菜单的"集群服务"
    await page.evaluate(() => {
      const items = document.querySelectorAll('a, div, li');
      for (const item of items) {
        if (item.textContent && item.textContent.trim() === '集群服务') {
          item.click();
          return 'Clicked 集群服务';
        }
      }
      return 'Not found';
    });
    
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/tbds-04-after-menu.png' });
    
    // 再次查找服务
    const services2 = await page.evaluate(() => {
      const allText = document.body.innerText;
      const hasSpark = allText.includes('Spark');
      const hasHadoop = allText.includes('Hadoop');
      return { hasSpark, hasHadoop, sparkCount: (allText.match(/Spark/g) || []).length };
    });
    
    console.log('   页面包含 Spark:', services2.hasSpark, '次数:', services2.sparkCount);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/tbds-error.png' });
  }
  
  await browser.close();
})();
