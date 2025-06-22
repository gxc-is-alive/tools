// 访问统计服务
class VisitStatsService {
  constructor() {
    this.currentSession = null;
    this.apiBase = '/api/stats';
    this.init();
  }

  // 初始化服务
  init() {
    this.startSession();
    this.recordPageView();
    this.setupEventListeners();
  }

  // 开始新会话
  startSession() {
    this.currentSession = {
      id: this.generateSessionId(),
      startTime: Date.now(),
      pageViews: []
    };
  }

  // 记录页面访问
  async recordPageView() {
    try {
      const pageView = {
        timestamp: Date.now(),
        page: window.location.pathname,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        screenResolution: `${screen.width}x${screen.height}`,
        language: navigator.language
      };

      this.currentSession.pageViews.push(pageView);
      
      // 发送到后端
      await this.sendToServer(pageView);
    } catch (error) {
      console.error('记录页面访问失败:', error);
    }
  }

  // 发送数据到服务器
  async sendToServer(pageView) {
    try {
      const response = await fetch(`${this.apiBase}/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: this.currentSession.id,
          page: pageView.page,
          userAgent: pageView.userAgent,
          screenResolution: pageView.screenResolution,
          language: pageView.language
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || '记录失败');
      }
    } catch (error) {
      console.error('发送访问数据失败:', error);
    }
  }

  // 设置事件监听器
  setupEventListeners() {
    // 页面可见性变化
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.recordSessionEnd();
      } else {
        this.recordSessionResume();
      }
    });

    // 页面卸载
    window.addEventListener('beforeunload', () => {
      this.recordSessionEnd();
    });

    // 路由变化（Vue Router）
    if (window.router) {
      window.router.afterEach((to) => {
        this.recordPageView();
      });
    }
  }

  // 记录会话结束
  async recordSessionEnd() {
    if (this.currentSession) {
      this.currentSession.endTime = Date.now();
      this.currentSession.duration = this.currentSession.endTime - this.currentSession.startTime;
      
      try {
        await this.updateSessionDuration(this.currentSession.duration);
      } catch (error) {
        console.error('更新会话时长失败:', error);
      }
    }
  }

  // 记录会话恢复
  recordSessionResume() {
    if (this.currentSession) {
      this.currentSession.resumeTime = Date.now();
    }
  }

  // 更新会话时长
  async updateSessionDuration(duration) {
    try {
      const response = await fetch(`${this.apiBase}/session/${this.currentSession.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ duration })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || '更新失败');
      }
    } catch (error) {
      console.error('更新会话时长失败:', error);
    }
  }

  // 获取统计数据
  async getStats(period = 30) {
    try {
      const response = await fetch(`${this.apiBase}?period=${period}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || '获取数据失败');
      }

      return result.data;
    } catch (error) {
      console.error('获取统计数据失败:', error);
      // 返回默认数据
      return {
        totalVisits: 0,
        uniqueIPs: 0,
        uniqueRegions: 0,
        todayVisits: 0,
        avgDuration: 0,
        timeDistribution: new Array(24).fill(0),
        regionDistribution: {},
        pageViews: {},
        deviceStats: { desktop: 0, mobile: 0, tablet: 0 },
        locationStats: {}
      };
    }
  }

  // 获取访问记录
  async getRecords(period = 30, limit = 50) {
    try {
      const response = await fetch(`${this.apiBase}/records?period=${period}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || '获取记录失败');
      }

      return result.data;
    } catch (error) {
      console.error('获取访问记录失败:', error);
      return [];
    }
  }

  // 生成会话ID
  generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // 导出数据
  async exportData() {
    try {
      const response = await fetch(`${this.apiBase}/export`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      // 创建下载链接
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'visit_stats.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (error) {
      console.error('导出数据失败:', error);
      return false;
    }
  }

  // 清除数据
  async clearData() {
    try {
      const response = await fetch(`${this.apiBase}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.message || '清除失败');
      }

      return true;
    } catch (error) {
      console.error('清除数据失败:', error);
      return false;
    }
  }
}

// 创建全局实例
const visitStatsService = new VisitStatsService();

// 导出服务实例
export default visitStatsService; 