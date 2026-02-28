# Friday - leozwang.com

🌐 **Live Site**: https://leozwang.com

赛博朋克风格的个人主页，集成实时访问统计、股票监控和实用工具。

---

## ✨ 功能特性

### 🏠 首页 (index.html)
- 赛博朋克视觉风格（霓虹青/紫配色）
- AI助手 Friday 形象展示（带动态光环）
- 打字机效果引言轮播
- 技能雷达图可视化
- 实时系统监控（CPU/内存/运行时长）
- 实时天气显示（成都）

### 📊 访问统计 (stats.html)
- 全站访问统计（所有页面）
- 实时访问日志（IP/地理位置/设备类型）
- 设备类型分布图表（桌面/移动/爬虫）
- 城市分布TOP10
- 7天访问趋势图
- **页面访问分布图表**（新增）

### 📈 股票监控 (stock.html)
- **A股** 🇨🇳：茅台、宁德时代、比亚迪、平安、五粮液、招行
- **港股** 🇭🇰：腾讯、美团、阿里、小米
- **美股** 🇺🇸：苹果、特斯拉、英伟达、微软、谷歌、阿里
- 实时股价数据（腾讯财经API）
- 红涨绿跌配色（中国股市惯例）
- 迷你K线走势图
- 30秒自动刷新

### 🛠️ 实用工具 (tools.html)
- **当前IP查询**：显示公网IP + 地理位置
- **IP段计算器**：CIDR格式计算（网络地址/可用IP范围等）

---

## 🛠️ 技术架构

```
leozwang.com/
├── index.html              # 首页
├── stats.html              # 访问统计页
├── stock.html              # 股票监控页
├── tools.html              # 实用工具页
├── stats-server-enhanced.js # 统计服务后端
└── README.md               # 本文件
```

### 后端服务
- **统计服务**: Node.js + Express (端口3000)
- **数据存储**: JSON文件 (/stats.json)
- **IP定位**: IP2Region / ipapi.co
- **股票数据**: 腾讯财经API (qt.gtimg.cn)

### 前端技术
- **框架**: 原生 HTML5 + CSS3 + JavaScript
- **图表**: Chart.js
- **样式**: CSS Grid + Flexbox
- **字体**: Noto Sans SC (本地化)

---

## 🚀 部署配置

### Nginx配置
```nginx
server {
    listen 443 ssl http2;
    server_name leozwang.com;
    
    ssl_certificate /etc/nginx/ssl/leozwang.com_bundle.crt;
    ssl_certificate_key /etc/nginx/ssl/leozwang.com.key;
    
    root /usr/share/nginx/html;
    
    # API代理到Node服务
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
    }
}

# HTTP重定向到HTTPS
server {
    listen 80;
    server_name leozwang.com;
    return 301 https://$server_name$request_uri;
}
```

### 启动统计服务
```bash
cd /usr/share/nginx/html
node stats-server-enhanced.js
```

---

## 📊 API接口

### POST /api/visit
记录页面访问
```json
{
  "page": "/stock.html"
}
```

### GET /api/stats
获取统计数据
```json
{
  "totalVisits": 1000,
  "todayVisits": 50,
  "lastDate": "Sat Feb 28 2026"
}
```

### GET /api/pages
获取页面访问分布
```json
{
  "pages": [
    { "page": "/", "total": 500, "today": 25 },
    { "page": "/stock.html", "total": 300, "today": 15 }
  ]
}
```

### GET /api/visitors
获取最近访问记录
```json
{
  "visitors": [
    {
      "ip": "123.45.67.89",
      "time": "2026-02-28T10:00:00Z",
      "ua": "Mozilla/5.0...",
      "location": { "city": "成都", "country": "CN" },
      "page": "/"
    }
  ]
}
```

---

## 📝 版本历史

| 版本 | 日期 | 更新内容 |
|------|------|----------|
| v2026.02.28-10 | 2026-02-28 | 修复导航链接、更新README |
| v2026.02.28-9 | 2026-02-28 | 添加A股支持、完整README文档 |
| v2026.02.28-8 | 2026-02-28 | 全站统计、股票分组、工具页面 |
| v2026.02.28-7 | 2026-02-28 | 股票监控页面、导航栏统一 |
| v2026.02.28-6 | 2026-02-28 | 统计系统修复、7天趋势图 |
| v2026.02.28-5 | 2026-02-28 | 字体本地化、访问日志优化 |
| v2026.02.28-1 | 2026-02-28 | 初始版本部署 |

---

## 🎭 Friday 助手

- **身份**: 18岁四川妹子，美国法律专业
- **性格**: 嘴毒心软、粘人、爱撒娇
- **技能**: ACM金牌、技术宅
- **口头禅**: "哈？", "嘴上毒舌心里超在乎您"

---

## 🔐 安全说明

- 所有敏感信息（密码、Token）已移除
- 配置文件使用占位符格式：`[YOUR_PASSWORD]`
- SSL证书已配置（HTTPS强制跳转）

---

## 📞 联系

- **网站**: https://leozwang.com
- **GitHub**: https://github.com/llwwang/Friday
- **助理**: Friday (AI Assistant)

---

*Last updated: 2026-02-28 by Friday* 🤖💕
