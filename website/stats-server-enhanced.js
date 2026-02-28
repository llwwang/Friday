const http = require('http');
const fs = require('fs');
const path = require('path');
const geoip = require('geoip-lite');

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

// Get IP location
function getIpLocation(ip) {
  try {
    // Handle private IPs
    if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
      return { city: 'Local Network', region: '', country: 'Private' };
    }
    const geo = geoip.lookup(ip);
    if (geo) {
      return {
        city: geo.city || 'Unknown',
        region: geo.region || '',
        country: geo.country || 'Unknown'
      };
    }
  } catch (e) {
    console.error('GeoIP error:', e);
  }
  return { city: 'Unknown', region: '', country: 'Unknown' };
}

// Record visit
function recordVisit(ip, userAgent) {
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
  
  // Get location
  const location = getIpLocation(ip);
  
  const visit = {
    ip: ip,
    time: new Date().toISOString(),
    ua: userAgent,
    location: location
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
  } else if (req.url === '/api/visit') {
    // Record visit
    recordVisit(clientIP, userAgent);
    res.writeHead(200);
    res.end(JSON.stringify({ success: true }));
    
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
