import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// CORS配置
const corsOptions = {
  origin: [
    'http://localhost:3000', // Vue3开发服务器
    'http://localhost:3001', // 生产环境
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  optionsSuccessStatus: 200
};

// 中间件
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 静态文件服务 - 优先服务Vue3构建文件
app.use(express.static('dist'));
app.use(express.static('public')); // 保留原有静态文件

// 创建上传和输出目录
const uploadDir = path.join(__dirname, 'uploads');
const outputDir = path.join(__dirname, 'output');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// 配置multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        // 只允许图片文件
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('只允许上传图片文件！'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB限制
    }
});

// Multer middleware for multipart/form-data
const proxyUpload = multer({ storage: multer.memoryStorage() });

// API请求代理
app.post('/api-proxy', proxyUpload.any(), async (req, res) => {
    
    let url, method, headers, body;

    // Check content type to decide how to parse the request
    if (req.is('multipart/form-data')) {
        url = req.body.url;
        method = req.body.method;
        headers = JSON.parse(req.body.headers || '{}');
        
        const formData = new FormData();
        // Append text fields
        for (const key in req.body) {
            if (key !== 'url' && key !== 'method' && key !== 'headers') {
                formData.append(key, req.body[key]);
            }
        }
        // Append files
        req.files.forEach(file => {
            formData.append(file.fieldname, file.buffer, {
                filename: file.originalname,
                contentType: file.mimetype,
            });
        });
        body = formData;
        // Let node-fetch set the Content-Type header for multipart
        delete headers['content-type'];
    } else {
        // Assume JSON
        ({ url, method, headers, body } = req.body);
    }


    try {
        const fetchOptions = {
            method,
            headers,
        };

        if (body && method !== 'GET' && method !== 'HEAD') {
            fetchOptions.body = body;
        }

        const apiResponse = await fetch(url, fetchOptions);
        
        const responseHeaders = {};
        apiResponse.headers.forEach((value, name) => {
            responseHeaders[name] = value;
        });

        let responseBody;
        const contentType = apiResponse.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
            responseBody = await apiResponse.json();
        } else {
            responseBody = await apiResponse.text();
        }
        
        res.json({
            status: apiResponse.status,
            statusText: apiResponse.statusText,
            headers: responseHeaders,
            body: responseBody
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 新的WebP转换API - 支持Vue3前端
app.post('/api/convert', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: '没有上传文件' });
        }

        const quality = parseInt(req.body.quality) || 80;
        const inputPath = req.file.path;
        const outputFilename = path.parse(req.file.originalname).name + '.webp';
        const outputPath = path.join(outputDir, outputFilename);

        // 转换为WebP
        await sharp(inputPath)
            .webp({ quality: quality })
            .toFile(outputPath);

        // 读取转换后的文件并发送
        const webpBuffer = fs.readFileSync(outputPath);
        
        // 清理临时文件
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);

        res.setHeader('Content-Type', 'image/webp');
        res.setHeader('Content-Disposition', `attachment; filename="${outputFilename}"`);
        res.send(webpBuffer);

    } catch (error) {
        console.error('WebP转换错误:', error);
        res.status(500).json({ error: '转换失败' });
    }
});

// 批量下载API
app.post('/api/download-all', async (req, res) => {
    try {
        const { files } = req.body;
        
        if (!files || files.length === 0) {
            return res.status(400).json({ error: '没有文件需要下载' });
        }

        // 这里应该实现zip打包逻辑
        // 暂时返回成功响应
        res.json({ message: '批量下载功能待实现' });
        
    } catch (error) {
        console.error('批量下载错误:', error);
        res.status(500).json({ error: '下载失败' });
    }
});

// 批量上传图片 (保留原有API)
app.post('/upload', upload.array('images', 20), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: '没有上传文件' });
        }

        const quality = parseInt(req.body.quality) || 80;
        const results = [];

        for (const file of req.files) {
            try {
                const inputPath = file.path;
                const outputFilename = path.parse(file.originalname).name + '.webp';
                const outputPath = path.join(outputDir, outputFilename);

                // 转换为WebP
                await sharp(inputPath)
                    .webp({ quality: quality })
                    .toFile(outputPath);

                results.push({
                    originalName: file.originalname,
                    webpName: outputFilename,
                    originalSize: file.size,
                    webpSize: fs.statSync(outputPath).size,
                    compressionRatio: ((1 - fs.statSync(outputPath).size / file.size) * 100).toFixed(2)
                });

                // 删除原始文件
                fs.unlinkSync(inputPath);
            } catch (error) {
                console.error(`处理文件 ${file.originalname} 时出错:`, error);
                results.push({
                    originalName: file.originalname,
                    error: '转换失败'
                });
            }
        }

        res.json({
            success: true,
            results: results
        });

    } catch (error) {
        console.error('批量转换错误:', error);
        res.status(500).json({ error: '批量转换失败' });
    }
});

// 下载转换后的文件
app.get('/download/:filename', (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(outputDir, filename);
    
    if (fs.existsSync(filePath)) {
        res.download(filePath, filename, (err) => {
            if (err) {
                console.error('下载文件时出错:', err);
                res.status(500).json({ error: '下载失败' });
            }
        });
    } else {
        res.status(404).json({ error: '文件不存在' });
    }
});

// 批量下载为zip
app.get('/download-all', async (req, res) => {
    try {
        const archiver = (await import('archiver')).default;
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        res.attachment('webp-files.zip');
        archive.pipe(res);

        const files = fs.readdirSync(outputDir);
        files.forEach(file => {
            if (file.endsWith('.webp')) {
                archive.file(path.join(outputDir, file), { name: file });
            }
        });

        await archive.finalize();

    } catch (error) {
        console.error('创建zip文件时出错:', error);
        res.status(500).json({ error: '创建zip文件失败' });
    }
});

// 健康检查API
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

// 服务器信息API
app.get('/info', (req, res) => {
    res.json({
        name: '在线工具箱API服务器',
        version: '1.0.0',
        nodeVersion: process.version,
        platform: process.platform,
        timestamp: new Date().toISOString(),
        endpoints: {
            webp: '/upload, /api/convert, /download/:filename',
            timestamp: '/api/timestamp/convert',
            apiTest: '/api-proxy'
        }
    });
});

// 时间戳转换API
app.post('/api/timestamp/convert', (req, res) => {
    try {
        const { timestamp, format } = req.body;
        
        if (!timestamp) {
            return res.status(400).json({ error: '时间戳不能为空' });
        }

        let date;
        const timestampNum = parseInt(timestamp);

        // 判断时间戳格式
        if (timestamp.length === 10) {
            // 秒级时间戳
            date = new Date(timestampNum * 1000);
        } else if (timestamp.length === 13) {
            // 毫秒级时间戳
            date = new Date(timestampNum);
        } else {
            // 尝试解析为日期字符串
            date = new Date(timestamp);
        }

        if (isNaN(date.getTime())) {
            return res.status(400).json({ error: '无效的时间戳格式' });
        }

        const result = {
            timestamp: Math.floor(date.getTime() / 1000), // 秒级
            timestampMs: date.getTime(), // 毫秒级
            iso: date.toISOString(),
            local: date.toString(),
            utc: date.toUTCString(),
            year: date.getFullYear(),
            month: date.getMonth() + 1,
            day: date.getDate(),
            hour: date.getHours(),
            minute: date.getMinutes(),
            second: date.getSeconds()
        };

        res.json(result);
    } catch (error) {
        console.error('时间戳转换错误:', error);
        res.status(500).json({ error: '时间戳转换失败' });
    }
});

// API测试端点
app.post('/api/test', (req, res) => {
    try {
        const { method, url, headers, body } = req.body;
        
        res.json({
            message: 'API测试成功',
            received: {
                method,
                url,
                headers,
                body
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('API测试错误:', error);
        res.status(500).json({ error: 'API测试失败' });
    }
});

// 文件管理API
app.get('/api/files', (req, res) => {
    try {
        const files = fs.readdirSync(outputDir)
            .filter(file => file.endsWith('.webp'))
            .map(file => {
                const filePath = path.join(outputDir, file);
                const stats = fs.statSync(filePath);
                return {
                    name: file,
                    size: stats.size,
                    created: stats.birthtime,
                    modified: stats.mtime
                };
            });

        res.json({ files });
    } catch (error) {
        console.error('获取文件列表错误:', error);
        res.status(500).json({ error: '获取文件列表失败' });
    }
});

// 删除文件API
app.delete('/api/files/:filename', (req, res) => {
    try {
        const filename = req.params.filename;
        const filePath = path.join(outputDir, filename);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ message: '文件删除成功' });
        } else {
            res.status(404).json({ error: '文件不存在' });
        }
    } catch (error) {
        console.error('删除文件错误:', error);
        res.status(500).json({ error: '删除文件失败' });
    }
});

// 新增：站点状态检查 API
app.get('/api/check-url', async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ success: false, message: 'URL is required' });
  }

  try {
    const response = await axios.get(url, { 
      timeout: 5000, // 5秒超时
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    // 只要有响应（即使是4xx或5xx），就认为URL是可访问的
    res.json({ success: true, status: response.status });
  } catch (error) {
    // 请求失败 (例如，DNS问题, 连接超时, ECONNRESET)
    res.json({ success: false, message: error.message });
  }
});

// 新增：汇率查询 API
app.get('/api/exchange-rate', async (req, res) => {
  try {
    const response = await axios.get('https://api.frankfurter.app/latest?from=AUD&to=CNY', {
      timeout: 10000 // 10秒超时
    });
    
    if (response.data && response.data.rates && response.data.rates.CNY) {
      res.json({
        success: true,
        base: 'AUD',
        target: 'CNY',
        rate: response.data.rates.CNY,
        date: response.data.date
      });
    } else {
      throw new Error('Invalid API response format');
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// WebP 转换 API
app.post('/api/convert-to-webp', upload.array('images'), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: '没有上传文件' });
        }

        const quality = parseInt(req.body.quality) || 80;
        const results = [];

        for (const file of req.files) {
            try {
                const inputPath = file.path;
                const outputFilename = path.parse(file.originalname).name + '.webp';
                const outputPath = path.join(outputDir, outputFilename);

                // 转换为WebP
                await sharp(inputPath)
                    .webp({ quality: quality })
                    .toFile(outputPath);

                results.push({
                    originalName: file.originalname,
                    webpName: outputFilename,
                    originalSize: file.size,
                    webpSize: fs.statSync(outputPath).size,
                    compressionRatio: ((1 - fs.statSync(outputPath).size / file.size) * 100).toFixed(2)
                });

                // 删除原始文件
                fs.unlinkSync(inputPath);
            } catch (error) {
                console.error(`处理文件 ${file.originalname} 时出错:`, error);
                results.push({
                    originalName: file.originalname,
                    error: '转换失败'
                });
            }
        }

        res.json({
            success: true,
            results: results
        });

    } catch (error) {
        console.error('批量转换错误:', error);
        res.status(500).json({ error: '批量转换失败' });
    }
});

app.listen(PORT, () => {
    console.log(`服务器运行在 http://localhost:${PORT}`);
    console.log(`Vue3开发服务器运行在 http://localhost:3000`);
}); 