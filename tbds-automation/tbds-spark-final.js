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
    console.log('1. 登录 TBDS...');
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
    
    // 进入 tbds-cmp 集群服务页面
    console.log('\n2. 进入 tbds-cmp 集群服务页面');
    await page.goto('https://tbds.tbds.boc.fsphere.cn/tm/framework/tbds-cmpz3tbs?type=service');
    await page.waitForTimeout(5000);
    
    // 检查是否有重试按钮
    const retryBtn = await page.$('text=点击重试');
    if (retryBtn) {
      console.log('   发现重试按钮，点击...');
      await retryBtn.click();
      await page.waitForTimeout(8000);
      console.log('   ✅ 重试完成');
    }
    
    await page.screenshot({ path: '/tmp/tbds-spark-01.png' });
    console.log('   ✅ 页面加载完成');
    
    // 查找大写的 SPARK
    console.log('\n3. 查找 SPARK (大写)...');
    const content = await page.evaluate(() => document.body.innerText);
    const hasSPARK = content.includes('SPARK');
    console.log('   包含 SPARK:', hasSPARK);
    
    if (hasSPARK) {
      console.log('   ✅ 找到 SPARK！');
      
      // 查找 SPARK 行
      const sparkInfo = await page.evaluate(() => {
        const rows = document.querySelectorAll('tr');
        for (const row of rows) {
          if (row.textContent.includes('SPARK')) {
            return {
              text: row.textContent.substring(0, 300),
              buttons: Array.from(row.querySelectorAll('button')).map(b => b.textContent.trim())
            };
          }
        }
        return null;
      });
      
      console.log('   SPARK 信息:', sparkInfo);
      
      if (sparkInfo) {
        console.log('\n4. 尝试点击 SPARK 行的操作按钮...');
        
        // 点击操作按钮
        await page.evaluate(() => {
          const rows = document.querySelectorAll('tr');
          for (const row of rows) {
            if (row.textContent.includes('SPARK')) {
              const buttons = row.querySelectorAll('button');
              for (const btn of buttons) {
                if (btn.textContent.includes('操作') || btn.textContent.includes('更多')) {
                  btn.click();
                  return 'Clicked operation button';
                }
              }
            }
          }
          return 'Not found';
        });
        
        await page.waitForTimeout(3000);
        await page.screenshot({ path: '/tmp/tbds-spark-02-menu.png' });
        console.log('   ✅ 操作菜单已打开');
        
        // 查找重启选项
        console.log('\n5. 查找重启选项...');
        const menuItems = await page.evaluate(() => {
          const items = document.querySelectorAll('div, span, li, a');
          const result = [];
          items.forEach(item => {
            const text = item.textContent || '';
            if (text.includes('重启') || text.includes('启动') || text.includes('停止')) {
              result.push(text.trim());
            }
          });
          return result;
        });
        
        console.log('   菜单项:', menuItems);
        
        // 点击重启
        const restartClicked = await page.evaluate(() => {
          const items = document.querySelectorAll('div, span, li, a, button');
          for (const item of items) {
            const text = item.textContent || '';
            if (text === '重启' || text.includes('重启服务')) {
              item.click();
              return text;
            }
          }
          return null;
        });
        
        if (restartClicked) {
          console.log(`   ✅ 点击了: "${restartClicked}"`);
          await page.waitForTimeout(3000);
          await page.screenshot({ path: '/tmp/tbds-spark-03-confirm.png' });
          
          // 确认重启
          console.log('\n6. 确认重启...');
          await page.click('button:has-text("确定")');
          console.log('   ✅ 已确认重启！');
          await page.waitForTimeout(10000);
          await page.screenshot({ path: '/tmp/tbds-spark-04-done.png' });
          
          console.log('\n🎉 SPARK 重启完成！');
        } else {
          console.log('   ❌ 未找到重启选项');
        }
      }
    } else {
      console.log('   ⚠️ 未找到 SPARK');
      
      // 显示页面上的所有服务
      console.log('\n   页面上的所有服务:');
      const services = await page.evaluate(() => {
        const rows = document.querySelectorAll('tr');
        const result = [];
        rows.forEach(row => {
          const firstCell = row.querySelector('td:first-child');
          if (firstCell) {
            const text = firstCell.textContent.trim();
            if (text && text.length > 0 && text.length < 50) {
              result.push(text);
            }
          }
        });
        return result;
      });
      
      services.forEach((s, i) => {
        console.log(`   ${i+1}. ${s}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/tbds-spark-error.png' });
  }
  
  await browser.close();
})();
