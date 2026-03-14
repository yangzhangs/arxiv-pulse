/**
 * 重置管理员密码
 * 用法：node src/utils/reset-admin-password.js <new_password>
 */

const db = require('../models/database');
const bcrypt = require('bcryptjs');

const newPassword = process.argv[2];

if (!newPassword) {
  console.log('❌ 请提供新密码');
  console.log('用法：node src/utils/reset-admin-password.js <new_password>');
  process.exit(1);
}

console.log('🔐 重置管理员密码...\n');

const admin = db.getAdminByUsername('admin');
if (!admin) {
  console.log('❌ 管理员账户不存在');
  process.exit(1);
}

const passwordHash = bcrypt.hashSync(newPassword, 10);

db.db.prepare('UPDATE admins SET password_hash = ? WHERE username = ?').run(passwordHash, 'admin');

console.log('✅ 密码已重置');
console.log(`   用户名：admin`);
console.log(`   新密码：${newPassword}`);
console.log('\n⚠️  请妥善保管新密码\n');
