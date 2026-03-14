/**
 * 数据库模型 - 使用 SQLite
 * 增强版：支持强相关过滤、去重检测、中文摘要
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../data/arxiv-pulse.db');

class PaperDatabase {
  constructor() {
    this.db = new Database(DB_PATH);
    this.init();
  }

  init() {
    // 创建论文表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS papers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        arxiv_id TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        authors TEXT NOT NULL,
        abstract TEXT,
        pdf_url TEXT,
        arxiv_url TEXT,
        published_date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建标签表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        color TEXT DEFAULT '#3b82f6',
        is_approved INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建标签申请表
    this.db.exec(`
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

    // 创建管理员表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_login DATETIME
      )
    `);

    // 创建论文 - 标签关联表
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS paper_tags (
        paper_id INTEGER NOT NULL,
        tag_id INTEGER NOT NULL,
        PRIMARY KEY (paper_id, tag_id),
        FOREIGN KEY (paper_id) REFERENCES papers(id) ON DELETE CASCADE,
        FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
      )
    `);

    // 创建索引
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_papers_date ON papers(published_date DESC);
      CREATE INDEX IF NOT EXISTS idx_papers_arxiv_id ON papers(arxiv_id);
      CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
      CREATE INDEX IF NOT EXISTS idx_tag_applications_status ON tag_applications(status);
    `);

    // 插入默认标签（全部英文）
    const defaultTags = [
      'Docker', 'CI/CD', 'DevOps', 'Microservices', 'Cloud Native',
      'Serverless', 'Hugging Face', 'Github Actions', 
      'Agent skills', 'Deprecated Packages'
    ];

    const insertTag = this.db.prepare('INSERT OR IGNORE INTO tags (name, is_approved) VALUES (?, 1)');
    defaultTags.forEach(tag => insertTag.run(tag));

    // 创建默认管理员账号（仅当不存在时）
    try {
      const bcrypt = require('bcryptjs');
      const defaultAdminUsername = process.env.ADMIN_USERNAME || 'admin';
      const defaultAdminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const passwordHash = bcrypt.hashSync(defaultAdminPassword, 10);
      
      const insertAdmin = this.db.prepare('INSERT OR IGNORE INTO admins (username, password_hash) VALUES (?, ?)');
      insertAdmin.run(defaultAdminUsername, passwordHash);
      console.log('✅ 默认管理员账号已创建');
    } catch (error) {
      console.log('⚠️  bcrypt 未安装，管理员密码功能受限');
    }

    console.log('✅ 数据库初始化完成');
  }

  // 强相关关键词列表（全部英文，多词关键词必须连续匹配）
  getStrongRelatedKeywords() {
    return [
      'Docker', 'CI/CD', 'DevOps', 'Microservices', 'Cloud Native',
      'Serverless', 'Hugging Face', 'Github Actions', 
      'Agent skills', 'Deprecated Packages', 'Kubernetes', 'MLOps',
      'Container', 'Automation',
      'LLM', 'Agent', 'Agents', 'MCP', 'Code Agents'
    ];
  }

  // 构建 SQL WHERE 条件用于强相关过滤（严格连续匹配）
  getStrongRelatedWhereClause() {
    return `
      (
        p.title LIKE '%Docker%' OR p.title LIKE '%CI/CD%' OR p.title LIKE '%DevOps%' OR
        p.title LIKE '%Microservices%' OR 
        p.title LIKE '%Cloud Native%' OR 
        p.title LIKE '%Serverless%' OR
        p.title LIKE '%Hugging Face%' OR 
        p.title LIKE '%Github Actions%' OR 
        p.title LIKE '%Agent skills%' OR 
        p.title LIKE '%Deprecated Packages%' OR 
        p.title LIKE '%Kubernetes%' OR p.title LIKE '%MLOps%' OR
        p.title LIKE '%Container%' OR p.title LIKE '%Automation%' OR 
        p.title LIKE '%LLM%' OR
        p.title LIKE '%MCP%' OR 
        (p.title LIKE '% Agent %' OR p.title LIKE '% Agent''s' OR p.title LIKE 'Agent %' OR p.title LIKE '% Agents' OR p.title LIKE '% Agents%' OR p.title LIKE '%, Agent%' OR p.title LIKE '%-Agent%' OR p.title LIKE '%_Agent%' OR p.title LIKE '%. Agent%')
      )
    `;
  }

  // 检查论文是否已存在（去重）
  existsByArxivId(arxivId) {
    const result = this.db.prepare('SELECT id FROM papers WHERE arxiv_id = ?').get(arxivId);
    return result !== undefined;
  }

  // 论文操作
  getAllPapers(page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const strongRelatedWhere = this.getStrongRelatedWhereClause();
    
    const papers = this.db.prepare(`
      SELECT p.*, GROUP_CONCAT(t.name) as tags
      FROM papers p
      LEFT JOIN paper_tags pt ON p.id = pt.paper_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE (${strongRelatedWhere})
        AND (t.is_approved = 1 OR t.is_approved IS NULL)
      GROUP BY p.id
      ORDER BY p.published_date DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    const total = this.db.prepare(`
      SELECT COUNT(DISTINCT p.id) as count 
      FROM papers p
      LEFT JOIN paper_tags pt ON p.id = pt.paper_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE (${strongRelatedWhere})
        AND (t.is_approved = 1 OR t.is_approved IS NULL)
    `).get();

    return {
      papers,
      pagination: {
        page,
        limit,
        total: total.count,
        totalPages: Math.ceil(total.count / limit)
      }
    };
  }

  getPaperById(id) {
    return this.db.prepare(`
      SELECT p.*, GROUP_CONCAT(t.name) as tags
      FROM papers p
      LEFT JOIN paper_tags pt ON p.id = pt.paper_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.id = ?
      GROUP BY p.id
    `).get(id);
  }

  addPaper(paperData) {
    const { arxiv_id, title, authors, abstract, pdf_url, arxiv_url, published_date } = paperData;
    
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO papers (arxiv_id, title, authors, abstract, pdf_url, arxiv_url, published_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    return stmt.run(arxiv_id, title, authors, abstract || '', pdf_url, arxiv_url, published_date);
  }

  // 标签操作
  getAllTags(approvedOnly = true) {
    if (approvedOnly) {
      return this.db.prepare('SELECT * FROM tags WHERE is_approved = 1 ORDER BY name').all();
    }
    return this.db.prepare('SELECT * FROM tags ORDER BY name').all();
  }

  addTag(name, color = '#3b82f6', isApproved = 1) {
    const stmt = this.db.prepare('INSERT OR IGNORE INTO tags (name, color, is_approved) VALUES (?, ?, ?)');
    return stmt.run(name, color, isApproved);
  }

  deleteTag(id) {
    return this.db.prepare('DELETE FROM tags WHERE id = ?').run(id);
  }

  approveTag(id) {
    const update = this.db.prepare(`
      UPDATE tags SET is_approved = 1 WHERE id = ?
    `);
    return update.run(id);
  }

  rejectTag(id) {
    return this.db.prepare('DELETE FROM tags WHERE id = ? AND is_approved = 0').run(id);
  }

  // 标签申请操作
  getAllApplications(status = 'all') {
    let query;
    if (status === 'all') {
      query = 'SELECT * FROM tag_applications ORDER BY created_at DESC';
    } else {
      query = 'SELECT * FROM tag_applications WHERE status = ? ORDER BY created_at DESC';
      return this.db.prepare(query).all(status);
    }
    return this.db.prepare(query).all();
  }

  createApplication(name, color = '#3b82f6', applicantIp = '') {
    const stmt = this.db.prepare(`
      INSERT INTO tag_applications (name, color, applicant_ip, status)
      VALUES (?, ?, ?, 'pending')
    `);
    return stmt.run(name, color, applicantIp);
  }

  reviewApplication(id, approved, reviewerIp = '') {
    const app = this.db.prepare('SELECT * FROM tag_applications WHERE id = ?').get(id);
    if (!app) return null;

    const reviewStmt = this.db.prepare(`
      UPDATE tag_applications 
      SET status = ?, reviewed_at = CURRENT_TIMESTAMP, reviewer_ip = ?
      WHERE id = ?
    `);
    reviewStmt.run(approved ? 'approved' : 'rejected', reviewerIp, id);

    if (approved) {
      // 将申请的标签添加到正式标签表
      const tagResult = this.addTag(app.name, app.color, 1);
      return { success: true, tagId: tagResult.lastInsertRowid };
    }
    return { success: true, rejected: true };
  }

  deleteApplication(id) {
    return this.db.prepare('DELETE FROM tag_applications WHERE id = ?').run(id);
  }

  // 管理员操作
  getAdminByUsername(username) {
    return this.db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  }

  createAdmin(username, passwordHash, email = '') {
    const stmt = this.db.prepare('INSERT INTO admins (username, password_hash, email) VALUES (?, ?, ?)');
    return stmt.run(username, passwordHash, email);
  }

  updateAdminLastLogin(id) {
    return this.db.prepare(`
      UPDATE admins SET last_login = CURRENT_TIMESTAMP WHERE id = ?
    `).run(id);
  }

  // 论文标签关联
  addPaperTag(paperId, tagName) {
    const tag = this.db.prepare('SELECT id FROM tags WHERE name = ? AND is_approved = 1').get(tagName);
    if (!tag) {
      return null; // 只允许添加已审核的标签
    }
    
    const stmt = this.db.prepare('INSERT OR IGNORE INTO paper_tags (paper_id, tag_id) VALUES (?, ?)');
    return stmt.run(paperId, tag.id);
  }

  getPapersByTag(tagName, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const strongRelatedWhere = this.getStrongRelatedWhereClause();
    
    const papers = this.db.prepare(`
      SELECT p.*, GROUP_CONCAT(t.name) as tags
      FROM papers p
      INNER JOIN paper_tags pt ON p.id = pt.paper_id
      INNER JOIN tags t ON pt.tag_id = t.id
      WHERE t.name = ? AND t.is_approved = 1 AND (${strongRelatedWhere})
      GROUP BY p.id
      ORDER BY p.published_date DESC
      LIMIT ? OFFSET ?
    `).all(tagName, limit, offset);

    const total = this.db.prepare(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM papers p
      INNER JOIN paper_tags pt ON p.id = pt.paper_id
      INNER JOIN tags t ON pt.tag_id = t.id
      WHERE t.name = ? AND t.is_approved = 1 AND (${strongRelatedWhere})
    `).get(tagName);

    return {
      papers,
      pagination: {
        page,
        limit,
        total: total.count,
        totalPages: Math.ceil(total.count / limit)
      }
    };
  }

  searchPapers(query, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const searchTerm = `%${query}%`;
    const strongRelatedWhere = this.getStrongRelatedWhereClause();
    
    // 严格搜索：只匹配标题，不搜索摘要和作者
    const papers = this.db.prepare(`
      SELECT p.*, GROUP_CONCAT(t.name) as tags
      FROM papers p
      LEFT JOIN paper_tags pt ON p.id = pt.paper_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.title LIKE ?
        AND (${strongRelatedWhere})
        AND (t.is_approved = 1 OR t.is_approved IS NULL)
      GROUP BY p.id
      ORDER BY p.published_date DESC
      LIMIT ? OFFSET ?
    `).all(searchTerm, limit, offset);

    const total = this.db.prepare(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM papers p
      LEFT JOIN paper_tags pt ON p.id = pt.paper_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.title LIKE ?
        AND (${strongRelatedWhere})
        AND (t.is_approved = 1 OR t.is_approved IS NULL)
    `).get(searchTerm);

    return {
      papers,
      pagination: {
        page,
        limit,
        total: total.count,
        totalPages: Math.ceil(total.count / limit)
      }
    };
  }

  close() {
    this.db.close();
  }
}

module.exports = new PaperDatabase();
