/**
 * 数据库迁移脚本 - 添加标签审核和管理员功能
 */

const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../data/arxiv-pulse.db');

console.log('📦 开始数据库迁移...');
console.log(`数据库路径：${DB_PATH}`);

const db = new Database(DB_PATH);

try {
  // 1. 为 tags 表添加 is_approved 列
  console.log('\n✅ 迁移 tags 表...');
  try {
    db.exec(`ALTER TABLE tags ADD COLUMN is_approved INTEGER DEFAULT 1`);
    console.log('   - 已添加 is_approved 列');
  } catch (error) {
    if (error.message.includes('duplicate column')) {
      console.log('   - is_approved 列已存在，跳过');
    } else {
      throw error;
    }
  }

  // 2. 创建 tag_applications 表
  console.log('\n✅ 创建 tag_applications 表...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS tag_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      color TEXT DEFAULT '#3b82f6',
      applicant_ip TEXT,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      reviewed_at DATETIME,
      reviewer_ip TEXT
    )
  `);
  console.log('   - 标签申请表已创建');

  // 3. 创建 admins 表
  console.log('\n✅ 创建 admins 表...');
  db.exec(`
    CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      email TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `);
  console.log('   - 管理员表已创建');

  // 4. 创建索引
  console.log('\n✅ 创建索引...');
  db.exec(`CREATE INDEX IF NOT EXISTS idx_tag_applications_status ON tag_applications(status)`);
  console.log('   - 索引已创建');

  // 5. 创建默认管理员账号
  console.log('\n✅ 创建默认管理员账号...');
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const passwordHash = bcrypt.hashSync(adminPassword, 10);
  
  try {
    const stmt = db.prepare('INSERT OR IGNORE INTO admins (username, password_hash) VALUES (?, ?)');
    stmt.run(adminUsername, passwordHash);
    console.log(`   - 管理员账号 "${adminUsername}" 已创建`);
  } catch (error) {
    console.log('   - 管理员账号可能已存在');
  }

  // 6. 更新现有标签为已审核状态
  console.log('\n✅ 更新现有标签状态...');
  const updateResult = db.exec(`UPDATE tags SET is_approved = 1 WHERE is_approved IS NULL`);
  console.log(`   - 已更新 ${updateResult.changes} 个标签`);

  console.log('\n✅ 数据库迁移完成！\n');
  
  // 显示统计信息
  const tagCount = db.prepare('SELECT COUNT(*) as count FROM tags').get().count;
  const adminCount = db.prepare('SELECT COUNT(*) as count FROM admins').get().count;
  
  console.log('📊 当前数据库状态:');
  console.log(`   - 标签总数：${tagCount}`);
  console.log(`   - 管理员数量：${adminCount}`);
  console.log('\n🎉 迁移成功！\n');

} catch (error) {
  console.error('\n❌ 迁移失败:', error.message);
  process.exit(1);
} finally {
  db.close();
}
