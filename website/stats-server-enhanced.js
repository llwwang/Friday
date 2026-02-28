const http = require('http');
const fs = require('fs');
const path = require('path');
const geoip = require('geoip-lite');
const IP2RegionMod = require('ip2region');

// Initialize IP2Region (handle different export formats)
const IP2Region = IP2RegionMod.default || IP2RegionMod;
const ip2region = new IP2Region();

const STATS_FILE = '/usr/share/nginx/html/stats.json';
const REPORT_DIR = '/usr/share/nginx/html/reports';

// Ensure report directory exists
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

// Read current stats
function readData() {
  try {
    if (fs.existsSync(STATS_FILE)) {
      return JSON.parse(fs.readFileSync(STATS_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Error reading stats:', e);
  }
  return {
    totalVisits: 0,
    todayVisits: 0,
    lastDate: new Date().toDateString(),
    visitors: [],
    dailyStats: {},
    ipLocations: {}
  };
}

// Save stats
function saveData(data) {
  fs.writeFileSync(STATS_FILE, JSON.stringify(data, null, 2));
}

// Get IP location from myip.ipip.net
async function getIpLocationFromIpip(ip) {
  return new Promise((resolve) => {
    try {
      const http = require('http');
      const options = {
        hostname: 'myip.ipip.net',
        port: 80,
        path: `/${ip}`,
        method: 'GET',
        timeout: 3000
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            // Parse response like: "中国	北京	北京		阿里云	39.104.16.123"
            const parts = data.split('\t');
            if (parts.length >= 3) {
              resolve({
                country: parts[0]?.trim() || 'Unknown',
                region: parts[1]?.trim() || '',
                city: parts[2]?.trim() || 'Unknown',
                isp: parts[4]?.trim() || ''
              });
            } else {
              resolve(null);
            }
          } catch (e) {
            resolve(null);
          }
        });
      });

      req.on('error', () => resolve(null));
      req.on('timeout', () => {
        req.destroy();
        resolve(null);
      });
      req.setTimeout(3000);
      req.end();
    } catch (e) {
      resolve(null);
    }
  });
}

// Get IP location
async function getIpLocation(ip) {
  try {
    // Handle private IPs
    if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      return { city: '本地网络', region: '', country: '内网', isp: '' };
    }

    // Try IP2Region first (better for China IPs with Chinese names)
    try {
      const ip2result = ip2region.search(ip);
      if (ip2result) {
        // ip2region returns: { country, province, city, isp }
        const country = ip2result.country || '';
        const province = ip2result.province || '';
        const city = ip2result.city || '';
        const isp = ip2result.isp || '';

        // Build location object
        return {
          country: country,
          region: province,
          city: city || province || '未知',
          isp: isp
        };
      }
    } catch (ip2err) {
      console.error('IP2Region error:', ip2err.message);
    }

    // Fallback to geoip-lite
    const geo = geoip.lookup(ip);
    if (geo) {
      return {
        city: geo.city || 'Unknown',
        region: geo.region || '',
        country: geo.country || 'Unknown',
        isp: ''
      };
    }
  } catch (e) {
    console.error('GeoIP error:', e);
  }
  return { city: '未知', region: '', country: '未知', isp: '' };
}

// Record visit
async function recordVisit(ip, userAgent, page = '/') {
  const data = readData();
  const today = new Date().toDateString();

  // Reset daily counter if new day
  if (data.lastDate !== today) {
    // Save yesterday's stats
    if (!data.dailyStats) data.dailyStats = {};
    data.dailyStats[data.lastDate] = data.todayVisits;

    data.todayVisits = 0;
    data.lastDate = today;
  }

  data.totalVisits++;
  data.todayVisits++;

  // Get location (async)
  const location = await getIpLocation(ip);

  const visit = {
    ip: ip,
    time: new Date().toISOString(),
    ua: userAgent,
    location: location,
    page: page
  };

  if (!data.visitors) data.visitors = [];
  data.visitors.unshift(visit);

  // Keep only last 500 visitors
  if (data.visitors.length > 500) {
    data.visitors = data.visitors.slice(0, 500);
  }

  // Track IP locations
  if (!data.ipLocations) data.ipLocations = {};
  if (!data.ipLocations[ip]) {
    data.ipLocations[ip] = {
      count: 0,
      location: location
    };
  }
  data.ipLocations[ip].count++;

  // Track page statistics
  if (!data.pageStats) data.pageStats = {};
  if (!data.pageStats[page]) {
    data.pageStats[page] = {
      total: 0,
      today: 0,
      lastDate: today
    };
  }
  
  // Reset page daily counter if new day
  if (data.pageStats[page].lastDate !== today) {
    data.pageStats[page].today = 0;
    data.pageStats[page].lastDate = today;
  }
  
  data.pageStats[page].total++;
  data.pageStats[page].today++;

  saveData(data);

  // Check alert threshold (100 visits/day)
  if (data.todayVisits === 100 || data.todayVisits === 500 || data.todayVisits === 1000) {
    console.log(`🚨 ALERT: Daily visits reached ${data.todayVisits}!`);
    // Could send notification here
  }

  return data;
}

// Generate daily report
function generateDailyReport() {
  const data = readData();
  const today = new Date().toDateString();
  
  const todayVisits = data.visitors.filter(v => {
    const visitDate = new Date(v.time).toDateString();
    return visitDate === today;
  });
  
  // City statistics
  const cityStats = {};
  todayVisits.forEach(v => {
    const city = v.location ? (v.location.city || 'Unknown') : 'Unknown';
    cityStats[city] = (cityStats[city] || 0) + 1;
  });
  
  // Device statistics
  const deviceStats = { mobile: 0, desktop: 0, spider: 0, other: 0 };
  todayVisits.forEach(v => {
    const ua = v.ua || '';
    if (ua.includes('Mobile') || ua.includes('iPhone') || ua.includes('Android')) {
      deviceStats.mobile++;
    } else if (ua.includes('Baiduspider') || ua.includes('bot')) {
      deviceStats.spider++;
    } else if (ua.includes('Windows') || ua.includes('Macintosh') || ua.includes('Linux')) {
      deviceStats.desktop++;
    } else {
      deviceStats.other++;
    }
  });
  
  const report = {
    date: today,
    totalVisits: todayVisits.length,
    uniqueIPs: [...new Set(todayVisits.map(v => v.ip))].length,
    cityStats: cityStats,
    deviceStats: deviceStats,
    topIPs: Object.entries(data.ipLocations || {})
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([ip, info]) => ({
        ip: ip,
        count: info.count,
        location: info.location
      }))
  };
  
  // Save report
  const reportFile = path.join(REPORT_DIR, `report-${new Date().toISOString().split('T')[0]}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  
  return report;
}

// HTTP Server
const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  const clientIP = req.headers['x-forwarded-for'] || 
                   req.headers['x-real-ip'] || 
                   req.connection.remoteAddress;
  
  const userAgent = req.headers['user-agent'] || '';
  
  if (req.url === '/api/stats') {
    // Get stats
    const data = readData();
    // Calculate uptime
  const uptimeSeconds = Math.floor(process.uptime());
  const uptimeHours = Math.floor(uptimeSeconds / 3600);
  const uptimeMinutes = Math.floor((uptimeSeconds % 3600) / 60);
  const uptimeSecs = uptimeSeconds % 60;
  const uptimeStr = `${String(uptimeHours).padStart(2, '0')}:${String(uptimeMinutes).padStart(2, '0')}:${String(uptimeSecs).padStart(2, '0')}`;
  
  res.writeHead(200);
    res.end(JSON.stringify({
      totalVisits: data.totalVisits,
      todayVisits: data.todayVisits,
      lastDate: data.lastDate,
      activeVisitors: data.visitors ? data.visitors.length : 0,
      uptime: uptimeStr,
      serverTime: new Date().toISOString()
    }));
    
  } else if (req.url === '/api/visitors') {
    // Get visitors with location
    const data = readData();
    res.writeHead(200);
    res.end(JSON.stringify({
      visitors: data.visitors || [],
      total: data.visitors ? data.visitors.length : 0
    }));
    
  } else if (req.url === '/api/locations') {
    // Get location statistics
    const data = readData();
    const cityStats = {};
    
    (data.visitors || []).forEach(v => {
      const city = v.location ? (v.location.city || 'Unknown') : 'Unknown';
      cityStats[city] = (cityStats[city] || 0) + 1;
    });
    
    res.writeHead(200);
    res.end(JSON.stringify({
      cities: cityStats,
      total: Object.keys(cityStats).length
    }));
    
  } else if (req.url === '/api/report/daily') {
    // Generate and return daily report
    const report = generateDailyReport();
    res.writeHead(200);
    res.end(JSON.stringify(report));
    
  } else if (req.url === '/api/trend') {
    // Get 7-day trend
    const trend = getTrendData();
    res.writeHead(200);
    res.end(JSON.stringify({
      trend: trend,
      days: 7
    }));
    
  } else if (req.url === '/api/pages') {
    // Get page statistics
    const data = readData();
    const pageStats = data.pageStats || {};
    
    // Calculate total per page
    const pages = Object.entries(pageStats).map(([page, stats]) => ({
      page: page,
      total: stats.total,
      today: stats.today
    })).sort((a, b) => b.total - a.total);
    
    res.writeHead(200);
    res.end(JSON.stringify({
      pages: pages,
      total: pages.reduce((sum, p) => sum + p.total, 0)
    }));
    
  } else if (req.url === '/api/visit') {
    // Record visit (async) with page tracking
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      let page = '/';
      try {
        const params = JSON.parse(body);
        page = params.page || '/';
      } catch (e) {
        // If not JSON, try query parameter
        const urlParams = new URL(req.url, `http://${req.headers.host}`).searchParams;
        page = urlParams.get('page') || '/';
      }
      
      recordVisit(clientIP, userAgent, page).then(() => {
        res.writeHead(200);
        res.end(JSON.stringify({ success: true, page: page }));
      }).catch(err => {
        console.error('Record visit error:', err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: 'Failed to record visit' }));
      });
    });
    return;
    
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(3000, () => {
  console.log('📊 Enhanced Stats Server running on port 3000');
  console.log('Features:');
  console.log('  - IP Geolocation');
  console.log('  - Daily Reports');
  console.log('  - City Statistics');
  console.log('  - Visit Alerts');
});

// Generate daily report at midnight
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    console.log('📝 Generating daily report...');
    generateDailyReport();
  }
}, 60000); // Check every minute

// Get 7-day trend data
function getTrendData() {
  const data = readData();
  const trend = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toDateString();
    const isoDate = date.toISOString().split('T')[0];
    
    // Check if we have dailyStats for this date
    let count = 0;
    if (data.dailyStats && data.dailyStats[dateStr]) {
      count = data.dailyStats[dateStr];
    } else if (i === 0) {
      // Today
      count = data.todayVisits || 0;
    }
    
    trend.push({
      date: isoDate,
      dayName: date.toLocaleDateString('zh-CN', { weekday: 'short' }),
      visits: count
    });
  }
  
  return trend;
}
