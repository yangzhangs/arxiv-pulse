/**
 * ArxivPulse 前端应用
 */

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
      limit: 20,
      total: 0,
      totalPages: 0
    },

    async init() {
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
        
        this.papers = data.papers || [];
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
