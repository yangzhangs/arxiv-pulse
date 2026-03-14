/**
 * 测试 Admin API 路由
 */

const http = require('http');

const PORT = process.env.PORT || 3000;

console.log('🔍 测试 Admin API 路由...\n');

// 测试登录 API
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
      console.log('✅ Admin 登录 API 正常');
      const data = JSON.parse(body);
      console.log(`   Session ID: ${data.sessionId}`);
      console.log(`   用户名：${data.admin.username}`);
    } else {
      console.log('❌ Admin 登录 API 异常');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ 请求失败:', error.message);
  console.log('\n💡 提示：请确保服务器正在运行 (node src/app.js)');
});

req.write(loginData);
req.end();
