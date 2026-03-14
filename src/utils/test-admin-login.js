/**
 * 测试管理员登录
 */

const db = require('../models/database');
const bcrypt = require('bcryptjs');

console.log('🔐 测试管理员登录功能...\n');

// 1. 检查管理员账户
const admin = db.getAdminByUsername('admin');
if (!admin) {
  console.log('❌ 管理员账户不存在');
  process.exit(1);
}

console.log('✅ 管理员账户存在:');
console.log(`   用户名：${admin.username}`);
console.log(`   ID: ${admin.id}`);
console.log(`   密码哈希：${admin.password_hash.substring(0, 20)}...`);
console.log(`   创建时间：${admin.created_at}`);
console.log(`   最后登录：${admin.last_login || '从未登录'}`);

// 2. 测试密码验证
const testPasswords = ['admin123', 'admin', 'password', '123456'];
console.log('\n🧪 测试密码:');

testPasswords.forEach(password => {
  const valid = bcrypt.compareSync(password, admin.password_hash);
  console.log(`   "${password}": ${valid ? '✅ 正确' : '❌ 错误'}`);
});

console.log('\n💡 提示:');
console.log('   默认用户名：admin');
console.log('   默认密码：admin123');
console.log('   如果密码不对，可以运行以下命令重置:');
console.log('   node src/utils/reset-admin-password.js <new_password>\n');
