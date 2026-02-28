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
    console.log('1. 登录并进入 tbds-cmp 集群服务...');
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
    
    // 直接访问集群详情
    await page.goto('https://tbds.tbds.boc.fsphere.cn/tm/framework/tbds-cmpz3tbs');
    await page.waitForTimeout(5000);
    
    // 点击集群服务
    await page.click('text=集群服务');
    await page.waitForTimeout(8000);
    console.log('   ✅ 进入集群服务页面');
    
    console.log('\n2. 获取完整页面内容');
    const fullText = await page.evaluate(() => document.body.innerText);
    console.log('   页面文本长度:', fullText.length);
    
    // 查找 Spark
    const sparkMatches = fullText.match(/Spark[^\n]*/g);
    console.log('   Spark 匹配:', sparkMatches);
    
    // 查找所有服务名称（通常在表格中）
    console.log('\n3. 查找表格中的服务');
    const tableServices = await page.evaluate(() => {
      const result = [];
      const rows = document.querySelectorAll('tr');
      rows.forEach((row, idx) => {
        const firstCell = row.querySelector('td:first-child, th:first-child');
        if (firstCell) {
          const text = firstCell.textContent.trim();
          if (text && text.length > 0 && text.length < 50) {
            const versionCell = row.querySelector('td:nth-child(2)');
            const version = versionCell ? versionCell.textContent.trim() : '';
            result.push({ name: text, version: version });
          }
        }
      });
      return result;
    });
    
    console.log('   表格中的服务:');
    tableServices.forEach((s, i) => {
      console.log(`   ${i+1}. ${s.name} ${s.version}`);
    });
    
    // 截图保存
    await page.screenshot({ path: '/tmp/tbds-v3-full.png', fullPage: true });
    console.log('\n   截图: /tmp/tbds-v3-full.png');
    
    console.log('\n4. 检查是否有分页或滚动');
    const hasScroll = await page.evaluate(() => {
      return document.body.scrollHeight > window.innerHeight;
    });
    console.log('   页面可滚动:', hasScroll);
    
    if (hasScroll) {
      console.log('   滚动到页面底部...');
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '/tmp/tbds-v3-scrolled.png' });
      
      // 再次查找 Spark
      const textAfterScroll = await page.evaluate(() => document.body.innerText);
      const sparkAfterScroll = textAfterScroll.match(/Spark[^\n]*/g);
      console.log('   滚动后 Spark 匹配:', sparkAfterScroll);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/tbds-v3-error.png' });
  }
  
  await browser.close();
})();
