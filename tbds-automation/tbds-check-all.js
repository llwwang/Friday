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
    console.log('\n2. 获取所有集群信息');
    await page.goto('https://tbds.tbds.boc.fsphere.cn/tm/framework?type=standardClusters');
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/tmp/tbds-all-clusters.png' });
    
    // 获取集群卡片信息
    const clusters = await page.evaluate(() => {
      const cards = document.querySelectorAll('.cluster-card, [class*="cluster"], tr');
      const result = [];
      cards.forEach(card => {
        const text = card.textContent || '';
        if (text.includes('tbds')) {
          // 查找服务数量
          const serviceMatch = text.match(/(\d+)\s*个?服务/);
          const serviceCount = serviceMatch ? serviceMatch[1] : 'unknown';
          
          // 查找集群名称
          const nameMatch = text.match(/(tbds-[a-z0-9]+)/);
          const name = nameMatch ? nameMatch[1] : 'unknown';
          
          result.push({
            name: name,
            services: serviceCount,
            preview: text.substring(0, 100)
          });
        }
      });
      return result;
    });
    
    console.log('   集群信息:');
    clusters.forEach((c, i) => {
      console.log(`   ${i+1}. ${c.name} - ${c.services} 个服务`);
    });
    
    // 点击第一个有服务的集群
    if (clusters.length > 0) {
      const targetCluster = clusters.find(c => c.services !== '0' && c.services !== 'unknown') || clusters[0];
      console.log(`\n3. 点击进入集群: ${targetCluster.name}`);
      
      await page.click(`text=${targetCluster.name}`);
      await page.waitForTimeout(5000);
      
      // 查找集群服务链接
      console.log('\n4. 查找所有可点击链接');
      const links = await page.evaluate(() => {
        const allLinks = document.querySelectorAll('a');
        const result = [];
        allLinks.forEach(link => {
          const text = link.textContent.trim();
          const href = link.getAttribute('href') || '';
          if (text && text.length < 30) {
            result.push({ text, href });
          }
        });
        return result;
      });
      
      console.log('   链接列表:');
      links.forEach((l, i) => {
        console.log(`   ${i+1}. "${l.text}" -> ${l.href}`);
      });
      
      // 查找包含 "service" 或 "集群服务" 的链接
      const serviceLink = links.find(l => l.text.includes('服务') || l.href.includes('service'));
      if (serviceLink) {
        console.log(`\n5. 点击服务链接: ${serviceLink.text}`);
        await page.click(`text=${serviceLink.text}`);
        await page.waitForTimeout(5000);
        await page.screenshot({ path: '/tmp/tbds-service-page.png' });
        
        // 检查是否有 Spark
        const content = await page.evaluate(() => document.body.innerText);
        const hasSpark = content.includes('Spark');
        console.log('   包含 Spark:', hasSpark);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/tbds-error.png' });
  }
  
  await browser.close();
})();
