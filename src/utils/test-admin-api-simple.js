/**
 * 测试 Admin API
 */

const http = require('http');

const PORT = process.env.PORT || 3000;

console.log('🔍 测试 Admin API...\n');

// 测试登录
const loginData = JSON.stringify({ username: 'admin', password: 'admin123' });

const options = {
  hostname: 'localhost',
  port: PORT,
  path: '/api/admin/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': loginData.length
  }
};

const req = http.request(options, (res) => {
  let body = '';
  
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log(`状态码：${res.statusCode}`);
    console.log(`响应：${body}`);
    console.log('');
    
    if (res.statusCode === 200) {
      console.log('✅ Admin API 正常');
      const data = JSON.parse(body);
      console.log(`   Session ID: ${data.sessionId}`);
    } else {
      console.log('❌ Admin API 异常');
      console.log('\n💡 提示：请确保服务器正在运行 (node src/app.js)');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ 请求失败:', error.message);
  console.log('\n💡 提示：');
  console.log('   1. 确保服务器正在运行：cd /root/.openclaw/workspace/projects/arxiv-pulse && node src/app.js');
  console.log('   2. 检查端口是否被占用');
  console.log('   3. 检查防火墙设置');
});

req.write(loginData);
req.end();
