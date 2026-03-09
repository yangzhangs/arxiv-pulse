/**
 * 数据库模型 - 使用 SQLite
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
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
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
    `);

    // 插入默认标签
    const defaultTags = [
      'Docker', 'CI/CD', 'DevOps', '微服务', '云原生', 
      'Serverless', 'Hugging Face', 'Github Actions', 
      'Agent skills', '弃用包'
    ];

    const insertTag = this.db.prepare('INSERT OR IGNORE INTO tags (name) VALUES (?)');
    defaultTags.forEach(tag => insertTag.run(tag));

    console.log('✅ 数据库初始化完成');
  }

  // 论文操作
  getAllPapers(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const papers = this.db.prepare(`
      SELECT p.*, GROUP_CONCAT(t.name) as tags
      FROM papers p
      LEFT JOIN paper_tags pt ON p.id = pt.paper_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      GROUP BY p.id
      ORDER BY p.published_date DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    const total = this.db.prepare('SELECT COUNT(*) as count FROM papers').get();

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
  getAllTags() {
    return this.db.prepare('SELECT * FROM tags ORDER BY name').all();
  }

  addTag(name, color = '#3b82f6') {
    const stmt = this.db.prepare('INSERT OR IGNORE INTO tags (name, color) VALUES (?, ?)');
    return stmt.run(name, color);
  }

  deleteTag(id) {
    return this.db.prepare('DELETE FROM tags WHERE id = ?').run(id);
  }

  // 论文标签关联
  addPaperTag(paperId, tagName) {
    const tag = this.db.prepare('SELECT id FROM tags WHERE name = ?').get(tagName);
    if (!tag) {
      this.addTag(tagName);
      tag.id = this.db.prepare('SELECT id FROM tags WHERE name = ?').get(tagName).id;
    }
    
    const stmt = this.db.prepare('INSERT OR IGNORE INTO paper_tags (paper_id, tag_id) VALUES (?, ?)');
    return stmt.run(paperId, tag.id);
  }

  getPapersByTag(tagName, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const papers = this.db.prepare(`
      SELECT p.*, GROUP_CONCAT(t.name) as tags
      FROM papers p
      INNER JOIN paper_tags pt ON p.id = pt.paper_id
      INNER JOIN tags t ON pt.tag_id = t.id
      WHERE t.name = ?
      GROUP BY p.id
      ORDER BY p.published_date DESC
      LIMIT ? OFFSET ?
    `).all(tagName, limit, offset);

    const total = this.db.prepare(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM papers p
      INNER JOIN paper_tags pt ON p.id = pt.paper_id
      INNER JOIN tags t ON pt.tag_id = t.id
      WHERE t.name = ?
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

  searchPapers(query, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    const searchTerm = `%${query}%`;
    
    const papers = this.db.prepare(`
      SELECT p.*, GROUP_CONCAT(t.name) as tags
      FROM papers p
      LEFT JOIN paper_tags pt ON p.id = pt.paper_id
      LEFT JOIN tags t ON pt.tag_id = t.id
      WHERE p.title LIKE ? OR p.authors LIKE ? OR p.abstract LIKE ?
      GROUP BY p.id
      ORDER BY p.published_date DESC
      LIMIT ? OFFSET ?
    `).all(searchTerm, searchTerm, searchTerm, limit, offset);

    const total = this.db.prepare(`
      SELECT COUNT(DISTINCT p.id) as count
      FROM papers p
      WHERE p.title LIKE ? OR p.authors LIKE ? OR p.abstract LIKE ?
    `).get(searchTerm, searchTerm, searchTerm);

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
