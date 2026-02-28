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
    
    // 进入 tbds-user1 集群服务页面
    console.log('\n2. 进入 tbds-user1 集群服务页面');
    await page.goto('https://tbds.tbds.boc.fsphere.cn/tm/framework/tbds-2083p30y?type=service');
    await page.waitForTimeout(5000);
    
    // 检查重试按钮
    const retryBtn = await page.$('text=点击重试');
    if (retryBtn) {
      console.log('   发现重试按钮，点击...');
      await retryBtn.click();
      await page.waitForTimeout(8000);
      console.log('   ✅ 重试完成');
    }
    
    await page.screenshot({ path: '/tmp/tbds-user1-01.png' });
    console.log('   ✅ 页面加载完成');
    
    // 查找大写 SPARK
    console.log('\n3. 查找 SPARK...');
    const content = await page.evaluate(() => document.body.innerText);
    
    // 查找各种可能的写法
    const hasSPARK = content.includes('SPARK');
    const hasSpark = content.includes('Spark');
    const hasspark = content.includes('spark');
    
    console.log('   包含 SPARK (大写):', hasSPARK);
    console.log('   包含 Spark (首字母大写):', hasSpark);
    console.log('   包含 spark (小写):', hasspark);
    
    if (hasSPARK || hasSpark) {
      console.log('   ✅ 找到 Spark！');
      
      // 获取所有服务
      const services = await page.evaluate(() => {
        const rows = document.querySelectorAll('tr');
        const result = [];
        rows.forEach(row => {
          const cells = row.querySelectorAll('td');
          if (cells.length > 0) {
            const name = cells[0].textContent.trim();
            if (name && name.length < 50) {
              const buttons = Array.from(row.querySelectorAll('button')).map(b => b.textContent.trim());
              result.push({ name, buttons });
            }
          }
        });
        return result;
      });
      
      console.log('\n   所有服务:');
      services.forEach((s, i) => {
        console.log(`   ${i+1}. ${s.name} - 按钮: [${s.buttons.join(', ')}]`);
      });
      
      // 查找 Spark 并重启
      const sparkService = services.find(s => s.name.includes('Spark') || s.name.includes('SPARK'));
      if (sparkService) {
        console.log(`\n4. 找到 Spark 服务: ${sparkService.name}`);
        
        // 点击操作按钮
        await page.evaluate(() => {
          const rows = document.querySelectorAll('tr');
          for (const row of rows) {
            const nameCell = row.querySelector('td:first-child');
            if (nameCell && (nameCell.textContent.includes('Spark') || nameCell.textContent.includes('SPARK'))) {
              const buttons = row.querySelectorAll('button');
              for (const btn of buttons) {
                if (btn.textContent.includes('操作') || btn.textContent.includes('更多') || btn.textContent === '...') {
                  btn.click();
                  return 'Clicked';
                }
              }
            }
          }
          return 'Not found';
        });
        
        await page.waitForTimeout(3000);
        await page.screenshot({ path: '/tmp/tbds-user1-02-menu.png' });
        
        // 点击重启
        console.log('5. 点击重启...');
        const restartResult = await page.evaluate(() => {
          const items = document.querySelectorAll('div, span, li, a, button');
          for (const item of items) {
            const text = item.textContent || '';
            if (text === '重启' || text.includes('重启')) {
              item.click();
              return text;
            }
          }
          return null;
        });
        
        if (restartResult) {
          console.log(`   ✅ 点击了: "${restartResult}"`);
          await page.waitForTimeout(3000);
          await page.click('button:has-text("确定")');
          console.log('   ✅ 确认重启！');
          await page.waitForTimeout(10000);
          await page.screenshot({ path: '/tmp/tbds-user1-03-done.png' });
          console.log('\n🎉 SPARK 重启完成！');
        }
      }
    } else {
      console.log('   ⚠️ 此集群也没有 Spark');
      console.log('   页面内容预览:', content.substring(0, 300));
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/tbds-user1-error.png' });
  }
  
  await browser.close();
})();
