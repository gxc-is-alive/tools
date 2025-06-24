import express from "express";
import multer from "multer";
import sharp from "sharp";
import cors from "cors";
import path from "path";
import fs from "fs";
import fetch from "node-fetch";
import FormData from "form-data";
import { fileURLToPath } from "url";
import { dirname } from "path";
import axios from "axios";
import databaseService from "./src/services/database.js";
import { v4 as uuidv4 } from "uuid";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// 存储错误信息的数组（在生产环境中应该使用数据库）
let errorReports = [];

// CORS配置
const corsOptions = {
  origin: [
    "http://localhost:3000", // Vue3开发服务器
    "http://localhost:3001", // 生产环境
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001",
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
  optionsSuccessStatus: 200,
};

// 中间件
app.use(cors(corsOptions));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// 创建上传和输出目录
const uploadDir = path.join(__dirname, "uploads");
const outputDir = path.join(__dirname, "output");

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
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // 只允许图片文件
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("只允许上传图片文件！"), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB限制
  },
});

// 暂存室文件上传配置
const storageUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      const storageDir = path.join(__dirname, "uploads", "storage");
      if (!fs.existsSync(storageDir)) {
        fs.mkdirSync(storageDir, { recursive: true });
      }
      cb(null, storageDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname);
      cb(null, uniqueSuffix + ext);
    },
  }),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB限制
  },
});

// Multer middleware for multipart/form-data
const proxyUpload = multer({ storage: multer.memoryStorage() });

// API请求代理
app.post("/api-proxy", proxyUpload.any(), async (req, res) => {
  let url, method, headers, body;

  // Check content type to decide how to parse the request
  if (req.is("multipart/form-data")) {
    url = req.body.url;
    method = req.body.method;
    headers = JSON.parse(req.body.headers || "{}");

    const formData = new FormData();
    // Append text fields
    for (const key in req.body) {
      if (key !== "url" && key !== "method" && key !== "headers") {
        formData.append(key, req.body[key]);
      }
    }
    // Append files
    req.files.forEach((file) => {
      formData.append(file.fieldname, file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });
    });
    body = formData;
    // Let node-fetch set the Content-Type header for multipart
    delete headers["content-type"];
  } else {
    // Assume JSON
    ({ url, method, headers, body } = req.body);
  }

  try {
    const fetchOptions = {
      method,
      headers,
    };

    if (body && method !== "GET" && method !== "HEAD") {
      fetchOptions.body = body;
    }

    const apiResponse = await fetch(url, fetchOptions);

    const responseHeaders = {};
    apiResponse.headers.forEach((value, name) => {
      responseHeaders[name] = value;
    });

    let responseBody;
    const contentType = apiResponse.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      responseBody = await apiResponse.json();
    } else {
      responseBody = await apiResponse.text();
    }

    res.json({
      status: apiResponse.status,
      statusText: apiResponse.statusText,
      headers: responseHeaders,
      body: responseBody,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 新的WebP转换API - 支持Vue3前端
app.post("/api/convert", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "没有上传文件" });
    }

    const quality = parseInt(req.body.quality) || 80;
    const inputPath = req.file.path;
    const outputFilename = path.parse(req.file.originalname).name + ".webp";
    const outputPath = path.join(outputDir, outputFilename);

    // 转换为WebP
    await sharp(inputPath).webp({ quality: quality }).toFile(outputPath);

    // 读取转换后的文件并发送
    const webpBuffer = fs.readFileSync(outputPath);

    // 清理临时文件
    fs.unlinkSync(inputPath);
    fs.unlinkSync(outputPath);

    res.setHeader("Content-Type", "image/webp");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${outputFilename}"`
    );
    res.send(webpBuffer);
  } catch (error) {
    console.error("WebP转换错误:", error);
    res.status(500).json({ error: "转换失败" });
  }
});

// 批量下载API
app.post("/api/download-all", async (req, res) => {
  try {
    const { files } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "没有文件需要下载" });
    }

    // 这里应该实现zip打包逻辑
    // 暂时返回成功响应
    res.json({ message: "批量下载功能待实现" });
  } catch (error) {
    console.error("批量下载错误:", error);
    res.status(500).json({ error: "下载失败" });
  }
});

// 批量上传图片 (保留原有API)
app.post("/upload", upload.array("images", 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "没有上传文件" });
    }

    const quality = parseInt(req.body.quality) || 80;
    const results = [];

    for (const file of req.files) {
      try {
        const inputPath = file.path;
        const outputFilename = path.parse(file.originalname).name + ".webp";
        const outputPath = path.join(outputDir, outputFilename);

        // 转换为WebP
        await sharp(inputPath).webp({ quality: quality }).toFile(outputPath);

        results.push({
          originalName: file.originalname,
          webpName: outputFilename,
          originalSize: file.size,
          webpSize: fs.statSync(outputPath).size,
          compressionRatio: (
            (1 - fs.statSync(outputPath).size / file.size) *
            100
          ).toFixed(2),
        });

        // 删除原始文件
        fs.unlinkSync(inputPath);
      } catch (error) {
        console.error(`处理文件 ${file.originalname} 时出错:`, error);
        results.push({
          originalName: file.originalname,
          error: "转换失败",
        });
      }
    }

    res.json({
      success: true,
      results: results,
    });
  } catch (error) {
    console.error("批量转换错误:", error);
    res.status(500).json({ error: "批量转换失败" });
  }
});

// 下载转换后的文件
app.get("/download/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(outputDir, filename);

  if (fs.existsSync(filePath)) {
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error("下载文件时出错:", err);
        res.status(500).json({ error: "下载失败" });
      }
    });
  } else {
    res.status(404).json({ error: "文件不存在" });
  }
});

// 批量下载为zip
app.get("/download-all", async (req, res) => {
  try {
    const archiver = (await import("archiver")).default;
    const archive = archiver("zip", {
      zlib: { level: 9 },
    });

    res.attachment("webp-files.zip");
    archive.pipe(res);

    const files = fs.readdirSync(outputDir);
    files.forEach((file) => {
      if (file.endsWith(".webp")) {
        archive.file(path.join(outputDir, file), { name: file });
      }
    });

    await archive.finalize();
  } catch (error) {
    console.error("创建zip文件时出错:", error);
    res.status(500).json({ error: "创建zip文件失败" });
  }
});

// ==================== 错误监控API ====================

// POST接口：接收错误上报
app.post("/api/error", (req, res) => {
  try {
    const errorData = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      userAgent: req.get("User-Agent"),
      ip: getRealIP(req),
      ...req.body,
    };

    errorReports.unshift(errorData); // 添加到数组开头，最新的在前面

    // 限制存储的错误数量，避免内存溢出
    if (errorReports.length > 1000) {
      errorReports = errorReports.slice(0, 1000);
    }

    console.log("收到新的错误上报:", errorData);

    res.status(200).json({
      success: true,
      message: "错误上报成功",
      id: errorData.id,
    });
  } catch (error) {
    console.error("处理错误上报失败:", error);
    res.status(500).json({
      success: false,
      message: "服务器内部错误",
    });
  }
});

// GET接口：获取错误列表
app.get("/api/errors", (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const pageSize = parseInt(req.query.pageSize) || 20;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  const paginatedErrors = errorReports.slice(startIndex, endIndex);

  res.json({
    success: true,
    data: paginatedErrors,
    total: errorReports.length,
    page,
    pageSize,
    totalPages: Math.ceil(errorReports.length / pageSize),
  });
});

// GET接口：获取单个错误详情
app.get("/api/error/:id", (req, res) => {
  const errorId = req.params.id;
  const error = errorReports.find((err) => err.id === errorId);

  if (error) {
    res.json({
      success: true,
      data: error,
    });
  } else {
    res.status(404).json({
      success: false,
      message: "错误记录未找到",
    });
  }
});

// DELETE接口：清空所有错误
app.delete("/api/errors", (req, res) => {
  errorReports = [];
  res.json({
    success: true,
    message: "所有错误记录已清空",
  });
});

// 健康检查API
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  });
});

// 服务器信息API
app.get("/info", (req, res) => {
  res.json({
    name: "在线工具箱API服务器",
    version: "1.0.0",
    nodeVersion: process.version,
    platform: process.platform,
    timestamp: new Date().toISOString(),
    endpoints: {
      webp: "/upload, /api/convert, /download/:filename",
      timestamp: "/api/timestamp/convert",
      apiTest: "/api-proxy",
    },
  });
});

// 时间戳转换API
app.post("/api/timestamp/convert", (req, res) => {
  try {
    const { timestamp, format } = req.body;

    if (!timestamp) {
      return res.status(400).json({ error: "时间戳不能为空" });
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
      return res.status(400).json({ error: "无效的时间戳格式" });
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
      second: date.getSeconds(),
    };

    res.json(result);
  } catch (error) {
    console.error("时间戳转换错误:", error);
    res.status(500).json({ error: "时间戳转换失败" });
  }
});

// API测试端点
app.post("/api/test", (req, res) => {
  try {
    const { method, url, headers, body } = req.body;

    res.json({
      message: "API测试成功",
      received: {
        method,
        url,
        headers,
        body,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("API测试错误:", error);
    res.status(500).json({ error: "API测试失败" });
  }
});

// 文件管理API
app.get("/api/files", (req, res) => {
  try {
    const files = fs
      .readdirSync(outputDir)
      .filter((file) => file.endsWith(".webp"))
      .map((file) => {
        const filePath = path.join(outputDir, file);
        const stats = fs.statSync(filePath);
        return {
          name: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime,
        };
      });

    res.json({ files });
  } catch (error) {
    console.error("获取文件列表错误:", error);
    res.status(500).json({ error: "获取文件列表失败" });
  }
});

// 删除文件API
app.delete("/api/files/:filename", (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(outputDir, filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.json({ message: "文件删除成功" });
    } else {
      res.status(404).json({ error: "文件不存在" });
    }
  } catch (error) {
    console.error("删除文件错误:", error);
    res.status(500).json({ error: "删除文件失败" });
  }
});

// 新增：站点状态检查 API
app.get("/api/check-url", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ success: false, message: "URL is required" });
  }

  try {
    const response = await axios.get(url, {
      timeout: 5000, // 5秒超时
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    });
    // 只要有响应（即使是4xx或5xx），就认为URL是可访问的
    res.json({ success: true, status: response.status });
  } catch (error) {
    // 请求失败 (例如，DNS问题, 连接超时, ECONNRESET)
    res.json({ success: false, message: error.message });
  }
});

// 新增：汇率查询 API
app.get("/api/exchange-rate", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.frankfurter.app/latest?from=AUD&to=CNY",
      {
        timeout: 10000, // 10秒超时
      }
    );

    if (response.data && response.data.rates && response.data.rates.CNY) {
      res.json({
        success: true,
        base: "AUD",
        target: "CNY",
        rate: response.data.rates.CNY,
        date: response.data.date,
      });
    } else {
      throw new Error("Invalid API response format");
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// WebP 转换 API
app.post("/api/convert-to-webp", upload.array("images"), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "没有上传文件" });
    }

    const quality = parseInt(req.body.quality) || 80;
    const results = [];

    for (const file of req.files) {
      try {
        const inputPath = file.path;
        const outputFilename = path.parse(file.originalname).name + ".webp";
        const outputPath = path.join(outputDir, outputFilename);

        // 转换为WebP
        await sharp(inputPath).webp({ quality: quality }).toFile(outputPath);

        results.push({
          originalName: file.originalname,
          webpName: outputFilename,
          originalSize: file.size,
          webpSize: fs.statSync(outputPath).size,
          compressionRatio: (
            (1 - fs.statSync(outputPath).size / file.size) *
            100
          ).toFixed(2),
        });

        // 删除原始文件
        fs.unlinkSync(inputPath);
      } catch (error) {
        console.error(`处理文件 ${file.originalname} 时出错:`, error);
        results.push({
          originalName: file.originalname,
          error: "转换失败",
        });
      }
    }

    res.json({
      success: true,
      results: results,
    });
  } catch (error) {
    console.error("批量转换错误:", error);
    res.status(500).json({ error: "批量转换失败" });
  }
});

// 访问统计数据存储已迁移到数据库

// JSON文件操作函数已废弃，访问统计已迁移到数据库

// 获取真实IP地址
function getRealIP(req) {
  return (
    req.headers["x-forwarded-for"] ||
    req.headers["x-real-ip"] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip ||
    "unknown"
  );
}

// 获取地理位置信息
async function getLocationInfo(ip) {
  try {
    // 使用免费的IP地理位置API
    const response = await fetch(
      `http://ip-api.com/json/${ip}?fields=status,message,country,regionName,city,lat,lon,isp,org,as,mobile,proxy,hosting,query`
    );
    const data = await response.json();

    if (data.status === "success") {
      return {
        country: data.country || "未知",
        region: data.regionName || "未知",
        city: data.city || "未知",
        lat: data.lat,
        lon: data.lon,
        isp: data.isp || "未知",
        org: data.org || "未知",
        mobile: data.mobile || false,
        proxy: data.proxy || false,
        hosting: data.hosting || false,
      };
    }
  } catch (error) {
    console.error("获取地理位置失败:", error);
  }

  return {
    country: "未知",
    region: "未知",
    city: "未知",
    lat: null,
    lon: null,
    isp: "未知",
    org: "未知",
    mobile: false,
    proxy: false,
    hosting: false,
  };
}

// 访问统计API
app.post("/api/stats/record", async (req, res) => {
  try {
    const { sessionId, page, userAgent, screenResolution, language } = req.body;
    const ip = getRealIP(req);
    const timestamp = Date.now();

    // 检查会话是否已存在
    const existingSession = await databaseService.dbGet(
      "SELECT session_id FROM visit_sessions WHERE session_id = ?",
      [sessionId]
    );

    if (!existingSession) {
      // 获取地理位置信息
      const locationInfo = await getLocationInfo(ip);
      const deviceType = getDeviceInfo(userAgent);

      // 创建新会话
      await databaseService.createVisitSession({
        sessionId,
        ip,
        userAgent,
        startTime: timestamp,
        location: locationInfo,
        deviceType,
      });
    }

    // 添加页面访问记录
    await databaseService.addPageView(sessionId, page, timestamp);

    res.json({ success: true, message: "访问记录已保存" });
  } catch (error) {
    console.error("记录访问统计失败:", error);
    res.status(500).json({ success: false, message: "服务器错误" });
  }
});

// 更新会话时长
app.put("/api/stats/session/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { duration } = req.body;
    const endTime = Date.now();

    await databaseService.updateVisitSession(sessionId, endTime, duration);
    res.json({ success: true, message: "会话时长已更新" });
  } catch (error) {
    console.error("更新会话时长失败:", error);
    res.status(500).json({ success: false, message: "服务器错误" });
  }
});

// 获取统计数据
app.get("/api/stats", async (req, res) => {
  try {
    const { period = 30 } = req.query;
    const days = parseInt(period);

    const stats = await databaseService.getVisitStats(days);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("获取统计数据失败:", error);
    res.status(500).json({ success: false, message: "服务器错误" });
  }
});

// 获取详细访问记录
app.get("/api/stats/records", async (req, res) => {
  try {
    const { period = 30, limit = 50 } = req.query;
    const days = parseInt(period);
    const recordLimit = parseInt(limit);

    const records = await databaseService.getVisitRecords(days, recordLimit);
    res.json({ success: true, data: records });
  } catch (error) {
    console.error("获取访问记录失败:", error);
    res.status(500).json({ success: false, message: "服务器错误" });
  }
});

// 辅助函数 - 这些统计函数已迁移到数据库服务中

function getDeviceInfo(userAgent) {
  if (!userAgent) return "desktop";

  const ua = userAgent.toLowerCase();
  if (
    ua.includes("mobile") ||
    ua.includes("android") ||
    ua.includes("iphone")
  ) {
    return "mobile";
  } else if (ua.includes("tablet") || ua.includes("ipad")) {
    return "tablet";
  }
  return "desktop";
}

// 导出统计数据
app.get("/api/stats/export", async (req, res) => {
  try {
    const data = await databaseService.exportVisitStats();
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=visit_stats.json"
    );
    res.json(data);
  } catch (error) {
    console.error("导出统计数据失败:", error);
    res.status(500).json({ success: false, message: "服务器错误" });
  }
});

// 清除统计数据
app.delete("/api/stats", async (req, res) => {
  try {
    await databaseService.clearVisitStats();
    res.json({ success: true, message: "统计数据已清除" });
  } catch (error) {
    console.error("清除统计数据失败:", error);
    res.status(500).json({ success: false, message: "服务器错误" });
  }
});

// ===================== 暂存室 API 路由 =====================

// 房间管理API
app.post("/api/storage/room/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { roomName } = req.body;
    const room = await databaseService.createOrAccessRoom(roomId, roomName);
    res.json({ success: true, data: room });
  } catch (error) {
    console.error("创建或访问房间失败:", error);
    res.status(500).json({ success: false, message: "操作失败" });
  }
});

app.get("/api/storage/room/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await databaseService.getRoomInfo(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: "房间不存在" });
    }
    res.json({ success: true, data: room });
  } catch (error) {
    console.error("获取房间信息失败:", error);
    res.status(500).json({ success: false, message: "获取失败" });
  }
});

app.get("/api/storage/rooms", async (req, res) => {
  try {
    const rooms = await databaseService.getAllRooms();
    res.json({ success: true, data: rooms });
  } catch (error) {
    console.error("获取房间列表失败:", error);
    res.status(500).json({ success: false, message: "获取失败" });
  }
});

// 获取指定房间的所有暂存项目
app.get("/api/storage/items/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const items = await databaseService.getAllItems(roomId);
    res.json({ success: true, data: items });
  } catch (error) {
    console.error("获取暂存项目失败:", error);
    res.status(500).json({ success: false, message: "获取失败" });
  }
});

// 添加文本项目
app.post("/api/storage/text/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const { title, content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: "内容不能为空" });
    }

    const uuid = uuidv4();
    const item = await databaseService.addTextItem({
      uuid,
      roomId,
      title: title || "文本片段",
      content: content.trim(),
    });

    res.json({ success: true, data: item });
  } catch (error) {
    console.error("添加文本项目失败:", error);
    res.status(500).json({ success: false, message: "添加失败" });
  }
});

// 上传文件项目
app.post(
  "/api/storage/file/:roomId",
  storageUpload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "没有上传文件" });
      }

      const { roomId } = req.params;
      const { title } = req.body;
      const uuid = uuidv4();
      const relativePath = path.join("storage", req.file.filename);

      const item = await databaseService.addFileItem({
        uuid,
        roomId,
        title: title || req.file.originalname,
        filePath: relativePath,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      });

      res.json({ success: true, data: item });
    } catch (error) {
      console.error("上传文件失败:", error);
      // 删除已上传的文件
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ success: false, message: "上传失败" });
    }
  }
);

// 更新项目
app.put("/api/storage/items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;

    const item = await databaseService.updateItem(id, { title, content });
    if (!item) {
      return res.status(404).json({ success: false, message: "项目不存在" });
    }

    res.json({ success: true, data: item });
  } catch (error) {
    console.error("更新项目失败:", error);
    res.status(500).json({ success: false, message: "更新失败" });
  }
});

// 删除项目
app.delete("/api/storage/items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await databaseService.deleteItem(id);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("删除项目失败:", error);
    res.status(500).json({ success: false, message: "删除失败" });
  }
});

// 清空指定房间的所有项目
app.delete("/api/storage/items/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const result = await databaseService.clearAllItems(roomId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("清空项目失败:", error);
    res.status(500).json({ success: false, message: "清空失败" });
  }
});

// 获取指定房间的统计信息
app.get("/api/storage/stats/:roomId", async (req, res) => {
  try {
    const { roomId } = req.params;
    const stats = await databaseService.getStats(roomId);
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error("获取统计信息失败:", error);
    res.status(500).json({ success: false, message: "获取失败" });
  }
});

// 文件预览/下载
app.get("/api/storage/file/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const item = await databaseService.getItemByUuid(id);

    if (!item || item.type !== "file") {
      return res.status(404).json({ success: false, message: "文件不存在" });
    }

    const filePath = path.join(__dirname, "uploads", item.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "文件不存在" });
    }

    // 设置响应头
    res.setHeader("Content-Type", item.fileType);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${encodeURIComponent(item.fileName)}"`
    );

    // 发送文件
    res.sendFile(filePath);
  } catch (error) {
    console.error("获取文件失败:", error);
    res.status(500).json({ success: false, message: "获取失败" });
  }
});

// 文件下载
app.get("/api/storage/download/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const item = await databaseService.getItemByUuid(id);

    if (!item || item.type !== "file") {
      return res.status(404).json({ success: false, message: "文件不存在" });
    }

    const filePath = path.join(__dirname, "uploads", item.filePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "文件不存在" });
    }

    // 强制下载
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(item.fileName)}"`
    );

    res.sendFile(filePath);
  } catch (error) {
    console.error("下载文件失败:", error);
    res.status(500).json({ success: false, message: "下载失败" });
  }
});

// 同步相关API
app.get("/api/storage/sync", async (req, res) => {
  try {
    const { since } = req.query;
    const items = await databaseService.getAllItems();
    const syncLog = await databaseService.getSyncLog(since);

    res.json({
      success: true,
      data: {
        items,
        syncLog,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("同步失败:", error);
    res.status(500).json({ success: false, message: "同步失败" });
  }
});

// 导出数据
app.get("/api/storage/export", async (req, res) => {
  try {
    const items = await databaseService.getAllItems();
    const exportData = {
      items,
      exportTime: new Date().toISOString(),
      version: "1.0",
    };

    res.setHeader("Content-Type", "application/json");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="storage_backup_${
        new Date().toISOString().split("T")[0]
      }.json"`
    );
    res.json(exportData);
  } catch (error) {
    console.error("导出数据失败:", error);
    res.status(500).json({ success: false, message: "导出失败" });
  }
});

// 静态文件服务 - 放在API路由之后
app.use(express.static("dist"));
app.use(express.static("public")); // 保留原有静态文件
app.use("/uploads", express.static("uploads")); // 提供上传文件的静态访问

// 处理所有其他路由，返回index.html（SPA支持）
app.get("*", (req, res) => {
  try {
    const indexPath = path.join(__dirname, "dist", "index.html");
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Page not found");
    }
  } catch (error) {
    console.error("Error serving index.html:", error);
    res.status(500).send("Internal server error");
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`Vue3开发服务器运行在 http://localhost:3000`);
});
