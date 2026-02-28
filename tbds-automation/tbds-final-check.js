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
    
    // 进入标准集群列表
    console.log('\n2. 查看标准集群列表');
    await page.goto('https://tbds.tbds.boc.fsphere.cn/tm/framework?type=standardClusters');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/tbds-all-clusters.png' });
    console.log('   ✅ 集群列表截图保存');
    
    // 获取集群信息
    const clusters = await page.evaluate(() => {
      const result = [];
      // 查找所有包含 tbds 的元素
      const elements = document.querySelectorAll('a, div, tr');
      elements.forEach(el => {
        const text = el.textContent || '';
        if (text.includes('tbds') && text.length < 200) {
          result.push(text.trim().substring(0, 100));
        }
      });
      return [...new Set(result)];
    });
    
    console.log('\n   发现的集群:');
    clusters.forEach((c, i) => {
      console.log(`   ${i+1}. ${c}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  await browser.close();
})();
