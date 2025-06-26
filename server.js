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
// import databaseService from "./src/services/database.js";
import { v4 as uuidv4 } from "uuid";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 获取本机IP地址
function getLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // 跳过内部地址和非IPv4地址
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

const app = express();
const PORT = process.env.PORT || 3001;

// 存储错误信息的数组（在生产环境中应该使用数据库）
let errorReports = [];

// CORS配置
const corsOptions = {
  origin: function (origin, callback) {
    // 允许所有localhost和127.0.0.1的请求
    if (
      !origin ||
      origin.includes("localhost") ||
      origin.includes("127.0.0.1") ||
      origin.match(/^https?:\/\/192\.168\.\d+\.\d+:\d+$/) ||
      origin.match(/^https?:\/\/10\.\d+\.\d+\.\d+:\d+$/) ||
      origin.match(/^https?:\/\/172\.(1[6-9]|2\d|3[01])\.\d+\.\d+:\d+$/)
    ) {
      callback(null, true);
    } else {
      callback(null, true); // 在开发环境中允许所有来源
    }
  },
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

    const { quality = 80, width, height } = req.body;
    const inputPath = req.file.path;
    const outputFileName = `converted_${Date.now()}.webp`;
    const outputPath = path.join(outputDir, outputFileName);

    let sharpInstance = sharp(inputPath);

    // 如果指定了尺寸，进行缩放
    if (width || height) {
      sharpInstance = sharpInstance.resize(
        width ? parseInt(width) : undefined,
        height ? parseInt(height) : undefined,
        {
          fit: "inside",
          withoutEnlargement: true,
        }
      );
    }

    // 转换为WebP格式
    await sharpInstance.webp({ quality: parseInt(quality) }).toFile(outputPath);

    // 返回转换后的文件
    res.download(outputPath, outputFileName, (err) => {
      if (err) {
        console.error("文件下载错误:", err);
      }
      // 清理临时文件
      fs.unlinkSync(inputPath);
      fs.unlinkSync(outputPath);
    });
  } catch (error) {
    console.error("转换错误:", error);
    res.status(500).json({ error: "转换失败: " + error.message });
  }
});

// 批量转换API
app.post("/api/convert-batch", upload.array("images", 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "没有上传文件" });
    }

    const { quality = 80, width, height } = req.body;
    const convertedFiles = [];

    for (const file of req.files) {
      try {
        const inputPath = file.path;
        const outputFileName = `converted_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}.webp`;
        const outputPath = path.join(outputDir, outputFileName);

        let sharpInstance = sharp(inputPath);

        if (width || height) {
          sharpInstance = sharpInstance.resize(
            width ? parseInt(width) : undefined,
            height ? parseInt(height) : undefined,
            {
              fit: "inside",
              withoutEnlargement: true,
            }
          );
        }

        await sharpInstance
          .webp({ quality: parseInt(quality) })
          .toFile(outputPath);

        convertedFiles.push({
          originalName: file.originalname,
          convertedPath: outputPath,
          convertedName: outputFileName,
        });
      } catch (error) {
        console.error(`转换文件 ${file.originalname} 时出错:`, error);
      }
    }

    if (convertedFiles.length === 0) {
      return res.status(500).json({ error: "所有文件转换失败" });
    }

    // 创建ZIP文件
    const archiver = (await import("archiver")).default;
    const zipFileName = `converted_images_${Date.now()}.zip`;
    const zipPath = path.join(outputDir, zipFileName);
    const output = fs.createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => {
      res.download(zipPath, zipFileName, (err) => {
        if (err) {
          console.error("ZIP文件下载错误:", err);
        }
        // 清理所有临时文件
        req.files.forEach((file) => fs.unlinkSync(file.path));
        convertedFiles.forEach((file) => fs.unlinkSync(file.convertedPath));
        fs.unlinkSync(zipPath);
      });
    });

    archive.on("error", (err) => {
      throw err;
    });

    archive.pipe(output);

    convertedFiles.forEach((file) => {
      archive.file(file.convertedPath, { name: file.convertedName });
    });

    await archive.finalize();
  } catch (error) {
    console.error("批量转换错误:", error);
    res.status(500).json({ error: "批量转换失败: " + error.message });
  }
});

// 错误报告API
app.post("/api/error-report", (req, res) => {
  try {
    const { error, userAgent, url, timestamp } = req.body;
    const report = {
      id: uuidv4(),
      error,
      userAgent,
      url,
      timestamp: timestamp || new Date().toISOString(),
      ip: req.ip,
    };
    errorReports.push(report);
    console.error("错误报告:", report);
    res.json({ success: true, id: report.id });
  } catch (error) {
    console.error("保存错误报告失败:", error);
    res.status(500).json({ error: "保存失败" });
  }
});

// 获取错误报告API
app.get("/api/error-reports", (req, res) => {
  try {
    res.json(errorReports);
  } catch (error) {
    console.error("获取错误报告失败:", error);
    res.status(500).json({ error: "获取失败" });
  }
});

// 清除错误报告API
app.delete("/api/error-reports", (req, res) => {
  try {
    errorReports = [];
    res.json({ success: true });
  } catch (error) {
    console.error("清除错误报告失败:", error);
    res.status(500).json({ error: "清除失败" });
  }
});

// 静态文件服务
app.use(express.static(path.join(__dirname, "dist")));

// 健康检查
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 所有其他请求返回index.html
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "dist", "index.html"));
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`本机IP地址: http://${getLocalIPAddress()}:${PORT}`);
});
