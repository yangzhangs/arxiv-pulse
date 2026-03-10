/**
 * 更新标签页，显示每个标签下的论文数量
 */

const db = require('../models/database');
const fs = require('fs');
const path = require('path');

console.log('📊 统计每个标签的论文数量...\n');

const tags = db.getAllTags(true);
const tagCounts = {};

tags.forEach(tag => {
  const result = db.db.prepare(`
    SELECT COUNT(DISTINCT p.id) as count
    FROM papers p
    INNER JOIN paper_tags pt ON p.id = pt.paper_id
    INNER JOIN tags t ON pt.tag_id = t.id
    WHERE t.name = ? AND t.is_approved = 1
  `).get(tag.name);
  
  tagCounts[tag.name] = result.count;
  console.log(`   ${tag.name}: ${result.count} 篇`);
});

console.log('\n✅ 统计完成\n');

// 更新 tags.html 文件
const tagsHtmlPath = path.join(__dirname, '../../views/tags.html');
let tagsHtml = fs.readFileSync(tagsHtmlPath, 'utf-8');

// 修改模板，显示论文数量
tagsHtml = tagsHtml.replace(
  /<span class="font-medium px-3 py-1 bg-blue-100 text-blue-700 rounded-full" x-text="tag\.name"><\/span>/g,
  `<div class="flex items-center space-x-2">
    <span class="font-medium px-3 py-1 bg-blue-100 text-blue-700 rounded-full" x-text="tag.name"></span>
    <span class="text-xs text-gray-500" x-text="'(' + (tag.paper_count || 0) + ')'"></span>
  </div>`
);

// 修改 JavaScript，加载论文数量
const oldLoadTags = `async loadTags() {
          this.loading = true;
          try {
            const response = await fetch('api/tags');
            const data = await response.json();
            this.tags = data.tags || [];
          } catch (error) {
            console.error('Failed to load tags:', error);
          } finally {
            this.loading = false;
          }
        }`;

const newLoadTags = `async loadTags() {
          this.loading = true;
          try {
            const response = await fetch('api/tags?with_counts=true');
            const data = await response.json();
            this.tags = data.tags || [];
          } catch (error) {
            console.error('Failed to load tags:', error);
          } finally {
            this.loading = false;
          }
        }`;

tagsHtml = tagsHtml.replace(oldLoadTags, newLoadTags);

fs.writeFileSync(tagsHtmlPath, tagsHtml, 'utf-8');
console.log('✅ tags.html 已更新\n');

// 更新 API，返回论文数量
const tagsRoutePath = path.join(__dirname, '../../src/routes/tags.js');
let tagsRoute = fs.readFileSync(tagsRoutePath, 'utf-8');

const oldGetTags = `// 获取所有标签（默认只返回已审核的）
router.get('/', (req, res) => {
  try {
    const approvedOnly = req.query.approved !== 'false';
    const tags = db.getAllTags(approvedOnly);
    res.json({ tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});`;

const newGetTags = `// 获取所有标签（默认只返回已审核的）
router.get('/', (req, res) => {
  try {
    const approvedOnly = req.query.approved !== 'false';
    const withCounts = req.query.with_counts === 'true';
    let tags = db.getAllTags(approvedOnly);
    
    if (withCounts) {
      // 添加每个标签的论文数量
      tags = tags.map(tag => {
        const result = db.db.prepare(\`
          SELECT COUNT(DISTINCT p.id) as count
          FROM papers p
          INNER JOIN paper_tags pt ON p.id = pt.paper_id
          INNER JOIN tags t ON pt.tag_id = t.id
          WHERE t.name = ? AND t.is_approved = 1
        \`).get(tag.name);
        return { ...tag, paper_count: result.count };
      });
    }
    
    res.json({ tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});`;

tagsRoute = tagsRoute.replace(oldGetTags, newGetTags);

fs.writeFileSync(tagsRoutePath, tagsRoute, 'utf-8');
console.log('✅ routes/tags.js 已更新\n');

console.log('🎉 标签计数功能已完成！\n');
