/**
 * ArxivPulse 前端应用 - 增强版
 * 显示中文摘要，支持所有强相关论文展示
 */

// 语言切换函数
function switchLang(lang) {
  fetch(`/arxiv-pulse/api/set-lang?lang=${lang}`)
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        localStorage.setItem('lang', lang);
        location.reload();
      }
    });
}

// 获取当前语言
function getCurrentLang() {
  return localStorage.getItem('lang') || 'zh';
}

// 加载翻译
async function loadTranslations(lang) {
  try {
    const response = await fetch(`/arxiv-pulse/api/i18n?lang=${lang}`);
    const data = await response.json();
    return data.translations || {};
  } catch (error) {
    console.error('Failed to load translations:', error);
    return {};
  }
}

function paperApp() {
  return {
    papers: [],
    tags: [],
    loading: false,
    searchQuery: '',
    selectedTag: '',
    currentPage: 1,
    pagination: {
      page: 1,
      limit: 50,  // 增加每页数量，显示所有强相关论文
      total: 0,
      totalPages: 0
    },
    currentLang: getCurrentLang(),
    t: {},

    async init() {
      // 加载翻译
      this.t = await loadTranslations(this.currentLang);
      
      // 从 URL 获取初始标签
      const urlParams = new URLSearchParams(window.location.search);
      this.selectedTag = urlParams.get('tag') || '';

      await Promise.all([
        this.loadTags(),
        this.loadPapers()
      ]);
      // 翻译在导入时完成，保存到数据库 chinese_abstract 字段
    },

    async loadTags() {
      try {
        const response = await fetch('/arxiv-pulse/api/tags');
        const data = await response.json();
        this.tags = data.tags || [];
      } catch (error) {
        console.error('Failed to load tags:', error);
      }
    },

    async loadPapers() {
      this.loading = true;
      try {
        let url = `/arxiv-pulse/api/papers?page=${this.currentPage}&limit=${this.pagination.limit}`;
        
        if (this.selectedTag) {
          url = `/arxiv-pulse/api/papers/tag/${encodeURIComponent(this.selectedTag)}?page=${this.currentPage}&limit=${this.pagination.limit}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        
        this.papers = (data.papers || []).map(paper => {
          // 确保 submitted_date 有值
          if (!paper.submitted_date && paper.published_date) {
            paper.submitted_date = paper.published_date;
          }
          // 解析 accepted_venue 信息
          if (!paper.accepted_venue && paper.comment) {
            paper.accepted_venue = this.parseAcceptedAt(paper);
          }
          // 确保 chinese_abstract 有值
          if (!paper.chinese_abstract && paper.abstract) {
            paper.chinese_abstract = paper.abstract.replace(/^\[中文摘要\]\s*/, '').trim();
          }
          return paper;
        });
        
        this.pagination = data.pagination || this.pagination;
      } catch (error) {
        console.error('Failed to load papers:', error);
      } finally {
        this.loading = false;
      }
    },

    async search() {
      if (!this.searchQuery.trim()) {
        await this.loadPapers();
        return;
      }

      this.loading = true;
      try {
        const url = `/arxiv-pulse/api/papers/search/${encodeURIComponent(this.searchQuery)}?page=${this.currentPage}&limit=${this.pagination.limit}`;
        const response = await fetch(url);
        const data = await response.json();
        
        this.papers = data.papers || [];
        this.pagination = data.pagination || this.pagination;
      } catch (error) {
        console.error('Failed to search papers:', error);
      } finally {
        this.loading = false;
      }
    },

    async filterByTag() {
      this.currentPage = 1;
      this.searchQuery = '';
      await this.loadPapers();
      
      // 更新 URL
      const url = new URL(window.location);
      if (this.selectedTag) {
        url.searchParams.set('tag', this.selectedTag);
      } else {
        url.searchParams.delete('tag');
      }
      window.history.pushState({}, '', url);
    },

    formatTags(tags) {
      // 标签可能是逗号分隔的字符串或数组
      if (!tags) return [];
      if (Array.isArray(tags)) return tags;
      return tags.split(',').filter(t => t.trim());
    },

    formatDate(dateString) {
      if (!dateString) {
        return this.currentLang === 'zh' ? '日期未知' : 'Date unknown';
      }
      
      const date = new Date(dateString);
      
      // 检查日期是否有效
      if (isNaN(date.getTime())) {
        return this.currentLang === 'zh' ? '日期无效' : 'Invalid date';
      }
      
      // 根据当前语言选择日期格式
      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      
      if (this.currentLang === 'en') {
        // 英文格式：March 9, 2026
        return date.toLocaleDateString('en-US', options);
      } else {
        // 中文格式：2026 年 3 月 9 日
        return date.toLocaleDateString('zh-CN', options);
      }
    },

    formatAbstract(paper) {
      if (!paper) {
        return this.currentLang === 'zh' ? '暂无简介' : 'No abstract available';
      }
      
      // 中文界面：优先使用 chinese_abstract 字段
      if (this.currentLang === 'zh') {
        if (paper.chinese_abstract && paper.chinese_abstract.length > 10) {
          return `<div class="text-gray-700">${paper.chinese_abstract}</div>`;
        }
        // 降级：使用 abstract 字段（移除前缀）
        const cleanAbstract = (paper.abstract || '').replace(/^\[中文摘要\]\s*/, '').trim();
        return `<div class="text-gray-700">${cleanAbstract || '暂无简介'}</div>`;
      }
      
      // 英文界面：使用 abstract 字段（移除前缀）
      const cleanAbstract = (paper.abstract || '').replace(/^\[中文摘要\]\s*/, '').trim();
      return `<div class="text-gray-700">${cleanAbstract || 'No abstract available'}</div>`;
    },

    // 翻译在导入时完成，保存到数据库 chinese_abstract 字段
    // 已移除 translateAbstractOnPage 函数

    parseAcceptedAt(paper) {
      // 优先使用 accepted_venue 字段
      if (paper.accepted_venue) {
        return paper.accepted_venue;
      }
      
      // 兼容旧数据：从 comment 字段解析
      if (!paper.comment) return null;
      
      const comments = paper.comment;
      
      // 匹配 "accepted at" 模式
      const acceptedMatch = comments.match(/accepted at (.+?)(?:\.|$)/i);
      
      if (acceptedMatch) {
        const fullName = acceptedMatch[1].trim();
        
        // 提取会议/期刊缩写（括号中的内容）
        const abbrMatch = fullName.match(/\(([^)]+)\)/);
        return abbrMatch ? abbrMatch[1] : fullName;
      }
      
      return null;
    },

    get totalPagesArray() {
      const pages = [];
      const maxVisible = 5;
      let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
      let end = Math.min(this.pagination.totalPages, start + maxVisible - 1);
      
      if (end - start < maxVisible - 1) {
        start = Math.max(1, end - maxVisible + 1);
      }
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      return pages;
    }
  };
}
