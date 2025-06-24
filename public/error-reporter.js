/**
 * 前端错误上报器 - 独立版本
 * 支持自动捕获和手动上报JavaScript错误
 * 版本: 2.0.0
 */

(function (window) {
  "use strict";

  // 默认配置
  const defaultConfig = {
    url: "/api/error", // 错误上报接口地址
    autoReport: true, // 是否自动监听全局错误
    timeout: 5000, // 请求超时时间(ms)
    maxRetries: 3, // 失败重试次数
    enableConsole: true, // 是否输出控制台日志
    userId: null, // 用户ID
    debug: false, // 调试模式
    maxErrorCount: 50, // 最大错误缓存数量
    reportInterval: 1000, // 错误上报间隔(ms)
    enableLocalStorage: true, // 是否启用本地存储
    filters: [], // 错误过滤器
  };

  // 错误上报器类
  class ErrorReporter {
    constructor(config = {}) {
      this.config = { ...defaultConfig, ...config };
      this.errorQueue = [];
      this.isReporting = false;
      this.retryCount = 0;
      this.userId = this.config.userId || this.getUserId();

      // 初始化
      this.init();
    }

    /**
     * 初始化错误监听器
     */
    init() {
      if (this.config.autoReport) {
        this.setupErrorListeners();
      }

      // 加载本地存储的错误
      this.loadStoredErrors();

      this.log("ErrorReporter 初始化完成", this.config);
    }

    /**
     * 设置全局错误监听器
     */
    setupErrorListeners() {
      // JavaScript运行时错误
      window.addEventListener("error", (event) => {
        this.captureError({
          type: "javascript-error",
          message: event.message,
          filename: event.filename,
          line: event.lineno,
          column: event.colno,
          stack: event.error ? event.error.stack : "",
          error: event.error,
        });
      });

      // Promise未捕获的rejection
      window.addEventListener("unhandledrejection", (event) => {
        this.captureError({
          type: "unhandled-promise-rejection",
          message: event.reason
            ? event.reason.toString()
            : "Unhandled Promise Rejection",
          stack: event.reason && event.reason.stack ? event.reason.stack : "",
          error: event.reason,
        });
      });

      // 资源加载错误
      window.addEventListener(
        "error",
        (event) => {
          if (event.target !== window) {
            this.captureError({
              type: "resource-error",
              message: `Failed to load resource: ${
                event.target.src || event.target.href
              }`,
              filename: event.target.src || event.target.href,
              tagName: event.target.tagName,
              error: new Error(`Resource load failed: ${event.target.tagName}`),
            });
          }
        },
        true
      );
    }

    /**
     * 捕获错误
     */
    captureError(errorInfo, customData = {}) {
      try {
        const errorData = this.formatError(errorInfo, customData);

        // 应用过滤器
        if (this.shouldFilter(errorData)) {
          return;
        }

        this.errorQueue.push(errorData);
        this.log("捕获到错误:", errorData);

        // 限制队列大小
        if (this.errorQueue.length > this.config.maxErrorCount) {
          this.errorQueue.shift();
        }

        // 存储到本地
        this.storeErrors();

        // 延迟上报，避免频繁请求
        this.scheduleReport();
      } catch (error) {
        this.log("捕获错误时发生异常:", error, "error");
      }
    }

    /**
     * 格式化错误数据
     */
    formatError(errorInfo, customData = {}) {
      return {
        id: this.generateId(),
        type: errorInfo.type || "unknown",
        message: errorInfo.message || "Unknown error",
        stack: errorInfo.stack || "",
        url: window.location.href,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        userId: this.userId,

        // 页面信息
        title: document.title,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
        },

        // 错误位置
        filename: errorInfo.filename || "",
        line: errorInfo.line || 0,
        column: errorInfo.column || 0,

        // 自定义数据
        customData: customData,

        // 运行环境
        platform: navigator.platform,
        language: navigator.language,

        // 额外信息
        tagName: errorInfo.tagName,
        level: customData.level || "error",
      };
    }

    /**
     * 检查是否应该过滤错误
     */
    shouldFilter(errorData) {
      return this.config.filters.some((filter) => {
        if (typeof filter === "function") {
          return filter(errorData);
        }
        if (typeof filter === "string") {
          return errorData.message.includes(filter);
        }
        return false;
      });
    }

    /**
     * 调度错误上报
     */
    scheduleReport() {
      if (this.reportTimer) {
        return;
      }

      this.reportTimer = setTimeout(() => {
        this.reportErrors();
        this.reportTimer = null;
      }, this.config.reportInterval);
    }

    /**
     * 上报错误队列
     */
    async reportErrors() {
      if (this.isReporting || this.errorQueue.length === 0) {
        return;
      }

      this.isReporting = true;
      const errorsToReport = [...this.errorQueue];
      this.errorQueue = [];

      try {
        for (const error of errorsToReport) {
          await this.sendError(error);
        }
        this.retryCount = 0;
        this.clearStoredErrors();
        this.log(`成功上报 ${errorsToReport.length} 个错误`);
      } catch (error) {
        // 上报失败，重新加入队列
        this.errorQueue.unshift(...errorsToReport);
        this.handleReportFailure(error);
      } finally {
        this.isReporting = false;
      }
    }

    /**
     * 发送单个错误
     */
    async sendError(errorData) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.open("POST", this.config.url, true);
        xhr.setRequestHeader("Content-Type", "application/json");
        xhr.timeout = this.config.timeout;

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(xhr.response);
          } else {
            reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
          }
        };

        xhr.onerror = () => reject(new Error("Network error"));
        xhr.ontimeout = () => reject(new Error("Request timeout"));

        xhr.send(JSON.stringify(errorData));
      });
    }

    /**
     * 处理上报失败
     */
    handleReportFailure(error) {
      this.log("错误上报失败:", error, "error");

      this.retryCount++;
      if (this.retryCount < this.config.maxRetries) {
        const delay = Math.pow(2, this.retryCount) * 1000; // 指数退避
        setTimeout(() => {
          this.reportErrors();
        }, delay);
      } else {
        this.log("达到最大重试次数，停止上报", null, "warn");
        this.retryCount = 0;
      }
    }

    /**
     * 手动上报错误
     */
    report(error, customData = {}) {
      if (error instanceof Error) {
        this.captureError(
          {
            type: "manual-report",
            message: error.message,
            stack: error.stack,
            error: error,
          },
          customData
        );
      } else if (typeof error === "string") {
        this.captureError(
          {
            type: "manual-report",
            message: error,
            error: new Error(error),
          },
          customData
        );
      } else {
        this.captureError(
          {
            type: "manual-report",
            message: JSON.stringify(error),
            error: new Error("Manual report"),
          },
          customData
        );
      }
    }

    /**
     * 测试上报功能
     */
    test() {
      this.report(new Error("这是一个测试错误"), {
        test: true,
        timestamp: Date.now(),
      });
      this.log("测试错误已发送");
    }

    /**
     * 配置更新
     */
    config(newConfig) {
      this.config = { ...this.config, ...newConfig };
      this.log("配置已更新:", this.config);
      return this;
    }

    /**
     * 设置用户ID
     */
    setUserId(userId) {
      this.userId = userId;
      if (this.config.enableLocalStorage) {
        localStorage.setItem("error-reporter-userId", userId);
      }
      return this;
    }

    /**
     * 获取用户ID
     */
    getUserId() {
      if (this.config.enableLocalStorage) {
        return localStorage.getItem("error-reporter-userId") || "anonymous";
      }
      return "anonymous";
    }

    /**
     * 存储错误到本地
     */
    storeErrors() {
      if (!this.config.enableLocalStorage) return;

      try {
        localStorage.setItem(
          "error-reporter-queue",
          JSON.stringify(this.errorQueue)
        );
      } catch (error) {
        this.log("存储错误失败:", error, "warn");
      }
    }

    /**
     * 加载本地存储的错误
     */
    loadStoredErrors() {
      if (!this.config.enableLocalStorage) return;

      try {
        const stored = localStorage.getItem("error-reporter-queue");
        if (stored) {
          this.errorQueue = JSON.parse(stored);
          this.log(`加载了 ${this.errorQueue.length} 个本地存储的错误`);
        }
      } catch (error) {
        this.log("加载本地错误失败:", error, "warn");
      }
    }

    /**
     * 清空本地存储的错误
     */
    clearStoredErrors() {
      if (!this.config.enableLocalStorage) return;

      try {
        localStorage.removeItem("error-reporter-queue");
      } catch (error) {
        this.log("清空本地错误失败:", error, "warn");
      }
    }

    /**
     * 生成唯一ID
     */
    generateId() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * 日志输出
     */
    log(message, data = null, level = "info") {
      if (!this.config.enableConsole && !this.config.debug) return;

      const prefix = "[ErrorReporter]";
      if (level === "error") {
        console.error(prefix, message, data);
      } else if (level === "warn") {
        console.warn(prefix, message, data);
      } else {
        console.log(prefix, message, data);
      }
    }

    /**
     * 销毁实例
     */
    destroy() {
      if (this.reportTimer) {
        clearTimeout(this.reportTimer);
      }
      this.errorQueue = [];
      this.log("ErrorReporter 已销毁");
    }
  }

  // 创建全局实例
  const errorReporter = new ErrorReporter();

  // 暴露全局接口
  window.ErrorReporter = ErrorReporter;
  window.postError = (error, customData) =>
    errorReporter.report(error, customData);

  // 暴露实例方法到全局
  window.ErrorReporter.config = (config) => errorReporter.config(config);
  window.ErrorReporter.setUserId = (userId) => errorReporter.setUserId(userId);
  window.ErrorReporter.report = (error, customData) =>
    errorReporter.report(error, customData);
  window.ErrorReporter.test = () => errorReporter.test();

  // 支持AMD/CommonJS
  if (typeof module !== "undefined" && module.exports) {
    module.exports = ErrorReporter;
  } else if (typeof define === "function" && define.amd) {
    define(function () {
      return ErrorReporter;
    });
  }
})(typeof window !== "undefined" ? window : this);
