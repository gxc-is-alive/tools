class WebPConverter {
    constructor() {
        this.files = [];
        this.results = [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateQualityDisplay();
    }

    bindEvents() {
        // 文件选择
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileSelect(e.target.files);
        });

        // 拖拽上传
        const uploadArea = document.getElementById('uploadArea');
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFileSelect(e.dataTransfer.files);
        });

        // 质量滑块
        document.getElementById('quality').addEventListener('input', (e) => {
            this.updateQualityDisplay();
        });

        // 按钮事件
        document.getElementById('convertBtn').addEventListener('click', () => {
            this.convertFiles();
        });

        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearFiles();
        });

        document.getElementById('downloadAllBtn').addEventListener('click', () => {
            this.downloadAll();
        });

        document.getElementById('cleanBtn').addEventListener('click', () => {
            this.cleanFiles();
        });
    }

    updateQualityDisplay() {
        const quality = document.getElementById('quality').value;
        document.getElementById('qualityValue').textContent = quality + '%';
    }

    handleFileSelect(fileList) {
        const newFiles = Array.from(fileList).filter(file => {
            // 检查文件类型
            if (!file.type.startsWith('image/')) {
                this.showNotification('只支持图片文件！', 'error');
                return false;
            }

            // 检查文件大小 (10MB)
            if (file.size > 10 * 1024 * 1024) {
                this.showNotification(`文件 ${file.name} 超过10MB限制！`, 'error');
                return false;
            }

            // 检查是否重复
            if (this.files.some(f => f.name === file.name && f.size === file.size)) {
                this.showNotification(`文件 ${file.name} 已存在！`, 'warning');
                return false;
            }

            return true;
        });

        // 检查总数限制
        if (this.files.length + newFiles.length > 20) {
            this.showNotification('最多只能选择20张图片！', 'error');
            return;
        }

        this.files.push(...newFiles);
        this.updateFileList();
        this.showNotification(`成功添加 ${newFiles.length} 张图片`, 'success');
    }

    updateFileList() {
        const fileList = document.getElementById('fileList');
        const fileListSection = document.getElementById('fileListSection');

        if (this.files.length === 0) {
            fileListSection.style.display = 'none';
            return;
        }

        fileListSection.style.display = 'block';
        fileList.innerHTML = '';

        this.files.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            fileItem.innerHTML = `
                <i class="fas fa-image"></i>
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${this.formatFileSize(file.size)}</div>
                </div>
                <button class="remove-file" onclick="converter.removeFile(${index})">
                    <i class="fas fa-times"></i>
                </button>
            `;
            fileList.appendChild(fileItem);
        });
    }

    removeFile(index) {
        this.files.splice(index, 1);
        this.updateFileList();
    }

    clearFiles() {
        this.files = [];
        this.updateFileList();
        this.hideResults();
        this.showNotification('已清空文件列表', 'info');
    }

    async convertFiles() {
        if (this.files.length === 0) {
            this.showNotification('请先选择要转换的图片！', 'warning');
            return;
        }

        this.showProgress();
        const quality = document.getElementById('quality').value;

        try {
            const formData = new FormData();
            this.files.forEach(file => {
                formData.append('images', file);
            });
            formData.append('quality', quality);

            const response = await fetch('/upload', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.results = result.results;
                this.showResults();
                this.showNotification(`成功转换 ${this.results.filter(r => !r.error).length} 张图片`, 'success');
            } else {
                throw new Error(result.error || '转换失败');
            }
        } catch (error) {
            console.error('转换错误:', error);
            this.showNotification('转换失败: ' + error.message, 'error');
        } finally {
            this.hideProgress();
        }
    }

    showProgress() {
        document.getElementById('progressSection').style.display = 'block';
        document.getElementById('fileListSection').style.display = 'none';
        document.getElementById('resultsSection').style.display = 'none';
        
        // 模拟进度
        let progress = 0;
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        
        const interval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            
            progressFill.style.width = progress + '%';
            progressText.textContent = `正在转换... ${Math.round(progress)}%`;
        }, 200);

        this.progressInterval = interval;
    }

    hideProgress() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        document.getElementById('progressSection').style.display = 'none';
    }

    showResults() {
        const resultsList = document.getElementById('resultsList');
        const resultsSection = document.getElementById('resultsSection');
        
        resultsSection.style.display = 'block';
        resultsList.innerHTML = '';

        this.results.forEach(result => {
            const resultItem = document.createElement('div');
            resultItem.className = `result-item ${result.error ? 'error' : 'success'}`;
            
            if (result.error) {
                resultItem.innerHTML = `
                    <i class="fas fa-exclamation-triangle" style="color: #ff6b6b; margin-right: 10px;"></i>
                    <div class="result-info">
                        <div class="result-name">${result.originalName}</div>
                        <div class="result-details">转换失败: ${result.error}</div>
                    </div>
                `;
            } else {
                resultItem.innerHTML = `
                    <i class="fas fa-check-circle" style="color: #4CAF50; margin-right: 10px;"></i>
                    <div class="result-info">
                        <div class="result-name">${result.webpName}</div>
                        <div class="result-details">
                            原始: ${this.formatFileSize(result.originalSize)} → 
                            WebP: ${this.formatFileSize(result.webpSize)} 
                            <span class="compression-ratio">(压缩率: ${result.compressionRatio}%)</span>
                        </div>
                    </div>
                    <button class="download-btn" onclick="converter.downloadFile('${result.webpName}')">
                        <i class="fas fa-download"></i><span>下载</span>
                    </button>
                `;
            }
            
            resultsList.appendChild(resultItem);
        });
    }

    hideResults() {
        document.getElementById('resultsSection').style.display = 'none';
    }

    async downloadFile(filename) {
        try {
            const response = await fetch(`/download/${filename}`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                this.showNotification(`正在下载 ${filename}`, 'success');
            } else {
                throw new Error('下载失败');
            }
        } catch (error) {
            this.showNotification('下载失败: ' + error.message, 'error');
        }
    }

    async downloadAll() {
        if (this.results.filter(r => !r.error).length === 0) {
            this.showNotification('没有可下载的文件！', 'warning');
            return;
        }

        try {
            const response = await fetch('/download-all');
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'webp-images.zip';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                this.showNotification('正在下载所有文件', 'success');
            } else {
                throw new Error('批量下载失败');
            }
        } catch (error) {
            this.showNotification('批量下载失败: ' + error.message, 'error');
        }
    }

    async cleanFiles() {
        try {
            const response = await fetch('/clean', { method: 'POST' });
            const result = await response.json();
            
            if (result.success) {
                this.results = [];
                this.hideResults();
                this.showNotification('文件清理完成', 'success');
            } else {
                throw new Error(result.error || '清理失败');
            }
        } catch (error) {
            this.showNotification('清理失败: ' + error.message, 'error');
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    showNotification(message, type = 'info') {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;

        // 添加样式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            display: flex;
            align-items: center;
            gap: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;

        // 设置背景色
        const colors = {
            success: '#4CAF50',
            error: '#ff6b6b',
            warning: '#ff9800',
            info: '#2196F3'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        // 添加到页面
        document.body.appendChild(notification);

        // 显示动画
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // 自动隐藏
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }
}

// 初始化应用
let converter;
document.addEventListener('DOMContentLoaded', () => {
    converter = new WebPConverter();
}); 