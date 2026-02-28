const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const DATA_FILE = path.join(__dirname, 'stats.json');
const PORT = 3000;

// 初始化数据文件
function initData() {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify({
            totalVisits: 0,
            todayVisits: 0,
            lastDate: new Date().toDateString(),
            visitors: []
        }));
    }
}

// 读取数据
function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        return { totalVisits: 0, todayVisits: 0, lastDate: new Date().toDateString(), visitors: [] };
    }
}

// 保存数据
function saveData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// 记录访问
function recordVisit(ip, userAgent) {
    const data = readData();
    const today = new Date().toDateString();
    
    // 检查是否是新的一天
    if (data.lastDate !== today) {
        data.todayVisits = 0;
        data.lastDate = today;
    }
    
    data.totalVisits++;
    data.todayVisits++;
    
    // 记录访客（保留最近100个）
    data.visitors.unshift({
        ip: ip,
        time: new Date().toISOString(),
        ua: userAgent
    });
    
    if (data.visitors.length > 100) {
        data.visitors = data.visitors.slice(0, 100);
    }
    
    saveData(data);
    return data;
}

// 获取系统状态
function getSystemStatus(callback) {
    exec("top -bn1 | grep 'Cpu(s)' | awk '{print $2}' | cut -d'%' -f1", (err, cpu) => {
        exec("free | grep Mem | awk '{printf \"%.1f\", $3/$2 * 100.0}'", (err, mem) => {
            exec("uptime -p", (err, uptime) => {
                callback({
                    cpu: cpu ? parseFloat(cpu).toFixed(1) : '0.0',
                    memory: mem ? parseFloat(mem).toFixed(1) : '0.0',
                    uptime: uptime ? uptime.trim() : 'Unknown'
                });
            });
        });
    });
}

// 创建HTTP服务器
const server = http.createServer((req, res) => {
    // 设置CORS头
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    if (req.url === '/api/stats') {
        // 记录访问并返回统计数据
        const stats = recordVisit(clientIP, userAgent);
        
        getSystemStatus((sysStatus) => {
            res.writeHead(200);
            res.end(JSON.stringify({
                totalVisits: stats.totalVisits,
                todayVisits: stats.todayVisits,
                system: sysStatus
            }));
        });
    } else if (req.url === '/api/visit') {
        // 仅记录访问
        recordVisit(clientIP, userAgent);
        res.writeHead(200);
        res.end(JSON.stringify({ success: true }));
    } else if (req.url === '/api/visitors') {
        // 返回访问日志（不包含本次访问）
        const data = readData();
        res.writeHead(200);
        res.end(JSON.stringify({
            visitors: data.visitors || [],
            total: data.visitors ? data.visitors.length : 0
        }));
    } else {
        res.writeHead(404);
        res.end(JSON.stringify({ error: 'Not found' }));
    }
});

// 初始化
initData();

// 启动服务器
server.listen(PORT, () => {
    console.log(`Stats server running on port ${PORT}`);
});

// 优雅退出
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
        process.exit(0);
    });
});