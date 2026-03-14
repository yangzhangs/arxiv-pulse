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
    },

    async loadTags() {
      try {
        const response = await fetch('api/tags');
        const data = await response.json();
        this.tags = data.tags || [];
      } catch (error) {
        console.error('Failed to load tags:', error);
      }
    },

    async loadPapers() {
      this.loading = true;
      try {
        let url = `api/papers?page=${this.currentPage}&limit=${this.pagination.limit}`;
        
        if (this.selectedTag) {
          url = `api/papers/tag/${encodeURIComponent(this.selectedTag)}?page=${this.currentPage}&limit=${this.pagination.limit}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        
        this.papers = (data.papers || []).map(paper => {
          // 解析 accepted_at 信息
          paper.accepted_at = this.parseAcceptedAt(paper.comments);
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
        const url = `api/papers/search/${encodeURIComponent(this.searchQuery)}?page=${this.currentPage}&limit=${this.pagination.limit}`;
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

    formatDate(dateString) {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    },

    formatAbstract(abstract) {
      if (!abstract) return '暂无简介';
      
      // 只显示中文摘要
      if (abstract.includes('[EN]') && abstract.includes('[CN]')) {
        const cnPart = abstract.split('[CN]')[1].trim();
        return `<div class="text-gray-700">${cnPart}</div>`;
      }
      
      // 旧格式兼容
      if (abstract.startsWith('[中文摘要]')) {
        return abstract.replace('[中文摘要]', '');
      }
      
      return abstract;
    },

    parseAcceptedAt(comments) {
      if (!comments) return null;
      
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
