import sqlite3 from "sqlite3";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const DB_PATH = "./data/storage.db";

class DatabaseService {
  constructor() {
    this.db = null;
    this.init();
  }

  async init() {
    // 确保数据目录存在
    const dataDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // 创建数据库连接
    this.db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error("数据库连接失败:", err);
      } else {
        console.log("数据库连接成功");
        this.createTables();
      }
    });

    // 将回调方法转为Promise
    this.dbRun = promisify(this.db.run.bind(this.db));
    this.dbGet = promisify(this.db.get.bind(this.db));
    this.dbAll = promisify(this.db.all.bind(this.db));
  }

  async createTables() {
    const createStorageItemsTable = `
      CREATE TABLE IF NOT EXISTS storage_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        room_id TEXT NOT NULL,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT,
        file_path TEXT,
        file_name TEXT,
        file_type TEXT,
        file_size INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createRoomsTable = `
      CREATE TABLE IF NOT EXISTS storage_rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id TEXT UNIQUE NOT NULL,
        room_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createSyncLogTable = `
      CREATE TABLE IF NOT EXISTS sync_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        item_uuid TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        client_id TEXT
      )
    `;

    const createVisitSessionsTable = `
      CREATE TABLE IF NOT EXISTS visit_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE NOT NULL,
        ip TEXT NOT NULL,
        user_agent TEXT,
        start_time INTEGER NOT NULL,
        end_time INTEGER,
        duration INTEGER,
        location_country TEXT,
        location_region TEXT,
        location_city TEXT,
        device_type TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createPageViewsTable = `
      CREATE TABLE IF NOT EXISTS page_views (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        page TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES visit_sessions(session_id)
      )
    `;

    const createMemoRoomsTable = `
      CREATE TABLE IF NOT EXISTS memo_rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id TEXT UNIQUE NOT NULL,
        room_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createMemosTable = `
      CREATE TABLE IF NOT EXISTS memos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT UNIQUE NOT NULL,
        room_id TEXT NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        content_type TEXT DEFAULT 'markdown',
        is_task_list BOOLEAN DEFAULT 0,
        tags TEXT,
        priority INTEGER DEFAULT 0,
        is_pinned BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    const createTaskItemsTable = `
      CREATE TABLE IF NOT EXISTS task_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        memo_uuid TEXT NOT NULL,
        content TEXT NOT NULL,
        is_completed BOOLEAN DEFAULT 0,
        order_index INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (memo_uuid) REFERENCES memos(uuid) ON DELETE CASCADE
      )
    `;

    try {
      await this.dbRun(createStorageItemsTable);
      await this.dbRun(createRoomsTable);
      await this.dbRun(createSyncLogTable);
      await this.dbRun(createVisitSessionsTable);
      await this.dbRun(createPageViewsTable);
      await this.dbRun(createMemoRoomsTable);
      await this.dbRun(createMemosTable);
      await this.dbRun(createTaskItemsTable);
      console.log("数据库表创建成功");
    } catch (error) {
      console.error("创建数据库表失败:", error);
    }
  }

  // 获取指定房间的所有存储项目
  async getAllItems(roomId) {
    try {
      const items = await this.dbAll(
        `
        SELECT * FROM storage_items 
        WHERE room_id = ?
        ORDER BY created_at DESC
      `,
        [roomId]
      );
      return items.map(this.formatItem);
    } catch (error) {
      console.error("获取存储项目失败:", error);
      throw error;
    }
  }

  // 添加文本项目
  async addTextItem(data) {
    const { uuid, roomId, title, content } = data;
    try {
      const result = await this.dbRun(
        `
        INSERT INTO storage_items (uuid, room_id, type, title, content, file_size)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
        [
          uuid,
          roomId,
          "text",
          title,
          content,
          Buffer.byteLength(content, "utf8"),
        ]
      );

      await this.logSync("create", uuid);
      return this.getItemByUuid(uuid);
    } catch (error) {
      console.error("添加文本项目失败:", error);
      throw error;
    }
  }

  // 添加文件项目
  async addFileItem(data) {
    const { uuid, roomId, title, filePath, fileName, fileType, fileSize } =
      data;
    try {
      const result = await this.dbRun(
        `
        INSERT INTO storage_items (uuid, room_id, type, title, file_path, file_name, file_type, file_size)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [uuid, roomId, "file", title, filePath, fileName, fileType, fileSize]
      );

      await this.logSync("create", uuid);
      return this.getItemByUuid(uuid);
    } catch (error) {
      console.error("添加文件项目失败:", error);
      throw error;
    }
  }

  // 根据UUID获取项目
  async getItemByUuid(uuid) {
    try {
      const item = await this.dbGet(
        `
        SELECT * FROM storage_items WHERE uuid = ?
      `,
        [uuid]
      );
      return item ? this.formatItem(item) : null;
    } catch (error) {
      console.error("获取项目失败:", error);
      throw error;
    }
  }

  // 更新项目
  async updateItem(uuid, data) {
    const { title, content } = data;
    try {
      await this.dbRun(
        `
        UPDATE storage_items 
        SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP
        WHERE uuid = ?
      `,
        [title, content || null, uuid]
      );

      await this.logSync("update", uuid);
      return this.getItemByUuid(uuid);
    } catch (error) {
      console.error("更新项目失败:", error);
      throw error;
    }
  }

  // 删除项目
  async deleteItem(uuid) {
    try {
      const item = await this.getItemByUuid(uuid);
      if (!item) {
        throw new Error("项目不存在");
      }

      // 如果是文件，删除物理文件
      if (item.type === "file" && item.file_path) {
        const fullPath = path.join("./uploads", item.file_path);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }

      await this.dbRun(`DELETE FROM storage_items WHERE uuid = ?`, [uuid]);
      await this.logSync("delete", uuid);

      return { success: true };
    } catch (error) {
      console.error("删除项目失败:", error);
      throw error;
    }
  }

  // 清空指定房间的所有项目
  async clearAllItems(roomId) {
    try {
      // 获取指定房间的所有文件项目，删除物理文件
      const fileItems = await this.dbAll(
        `
        SELECT file_path FROM storage_items WHERE room_id = ? AND type = 'file' AND file_path IS NOT NULL
      `,
        [roomId]
      );

      fileItems.forEach((item) => {
        const fullPath = path.join("./uploads", item.file_path);
        if (fs.existsSync(fullPath)) {
          try {
            fs.unlinkSync(fullPath);
          } catch (err) {
            console.warn("删除文件失败:", fullPath, err);
          }
        }
      });

      await this.dbRun(`DELETE FROM storage_items WHERE room_id = ?`, [roomId]);
      await this.logSync("clear_all");

      return { success: true };
    } catch (error) {
      console.error("清空项目失败:", error);
      throw error;
    }
  }

  // 获取指定房间的统计信息
  async getStats(roomId) {
    try {
      const textCount = await this.dbGet(
        `
        SELECT COUNT(*) as count FROM storage_items WHERE room_id = ? AND type = 'text'
      `,
        [roomId]
      );

      const fileCount = await this.dbGet(
        `
        SELECT COUNT(*) as count FROM storage_items WHERE room_id = ? AND type = 'file'
      `,
        [roomId]
      );

      const totalSize = await this.dbGet(
        `
        SELECT SUM(file_size) as size FROM storage_items WHERE room_id = ?
      `,
        [roomId]
      );

      const lastSync = await this.dbGet(`
        SELECT MAX(timestamp) as last_sync FROM sync_log
      `);

      return {
        textCount: textCount.count || 0,
        fileCount: fileCount.count || 0,
        totalSize: totalSize.size || 0,
        lastSync: lastSync.last_sync,
      };
    } catch (error) {
      console.error("获取统计信息失败:", error);
      throw error;
    }
  }

  // 房间管理方法
  async createOrAccessRoom(roomId, roomName = null) {
    try {
      // 检查房间是否存在
      const existingRoom = await this.dbGet(
        `
        SELECT * FROM storage_rooms WHERE room_id = ?
      `,
        [roomId]
      );

      if (existingRoom) {
        // 更新最后访问时间
        await this.dbRun(
          `
          UPDATE storage_rooms SET last_accessed = CURRENT_TIMESTAMP WHERE room_id = ?
        `,
          [roomId]
        );
        return existingRoom;
      } else {
        // 创建新房间
        await this.dbRun(
          `
          INSERT INTO storage_rooms (room_id, room_name) VALUES (?, ?)
        `,
          [roomId, roomName || `房间${roomId}`]
        );

        return await this.dbGet(
          `
          SELECT * FROM storage_rooms WHERE room_id = ?
        `,
          [roomId]
        );
      }
    } catch (error) {
      console.error("创建或访问房间失败:", error);
      throw error;
    }
  }

  async getRoomInfo(roomId) {
    try {
      return await this.dbGet(
        `
        SELECT * FROM storage_rooms WHERE room_id = ?
      `,
        [roomId]
      );
    } catch (error) {
      console.error("获取房间信息失败:", error);
      throw error;
    }
  }

  async getAllRooms() {
    try {
      return await this.dbAll(`
        SELECT r.*, COUNT(s.id) as item_count 
        FROM storage_rooms r 
        LEFT JOIN storage_items s ON r.room_id = s.room_id 
        GROUP BY r.room_id 
        ORDER BY r.last_accessed DESC
      `);
    } catch (error) {
      console.error("获取所有房间失败:", error);
      throw error;
    }
  }

  // 访问统计方法
  async createVisitSession(sessionData) {
    try {
      const { sessionId, ip, userAgent, startTime, location, deviceType } =
        sessionData;
      await this.dbRun(
        `
        INSERT INTO visit_sessions (
          session_id, ip, user_agent, start_time, 
          location_country, location_region, location_city, device_type
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          sessionId,
          ip,
          userAgent,
          startTime,
          location?.country || "",
          location?.region || "",
          location?.city || "",
          deviceType || "desktop",
        ]
      );
    } catch (error) {
      console.error("创建访问会话失败:", error);
      throw error;
    }
  }

  async updateVisitSession(sessionId, endTime, duration) {
    try {
      await this.dbRun(
        `
        UPDATE visit_sessions 
        SET end_time = ?, duration = ?
        WHERE session_id = ?
      `,
        [endTime, duration, sessionId]
      );
    } catch (error) {
      console.error("更新访问会话失败:", error);
      throw error;
    }
  }

  async addPageView(sessionId, page, timestamp) {
    try {
      await this.dbRun(
        `
        INSERT INTO page_views (session_id, page, timestamp)
        VALUES (?, ?, ?)
      `,
        [sessionId, page, timestamp]
      );
    } catch (error) {
      console.error("添加页面访问失败:", error);
      throw error;
    }
  }

  async getVisitStats(period = 30) {
    try {
      const cutoff = Date.now() - period * 24 * 60 * 60 * 1000;

      // 总访问数
      const totalVisits = await this.dbGet(
        `
        SELECT COUNT(*) as count FROM visit_sessions WHERE start_time >= ?
      `,
        [cutoff]
      );

      // 独立IP数
      const uniqueIPs = await this.dbGet(
        `
        SELECT COUNT(DISTINCT ip) as count FROM visit_sessions WHERE start_time >= ?
      `,
        [cutoff]
      );

      // 独立地区数
      const uniqueRegions = await this.dbGet(
        `
        SELECT COUNT(DISTINCT location_region) as count FROM visit_sessions 
        WHERE start_time >= ? AND location_region != ''
      `,
        [cutoff]
      );

      // 今日访问
      const today = new Date().setHours(0, 0, 0, 0);
      const todayVisits = await this.dbGet(
        `
        SELECT COUNT(*) as count FROM visit_sessions WHERE start_time >= ?
      `,
        [today]
      );

      // 平均访问时长
      const avgDuration = await this.dbGet(
        `
        SELECT AVG(duration) as duration FROM visit_sessions 
        WHERE start_time >= ? AND duration IS NOT NULL
      `,
        [cutoff]
      );

      // 时间分布
      const timeDistribution = await this.dbAll(
        `
        SELECT 
          CAST(strftime('%H', datetime(start_time/1000, 'unixepoch')) AS INTEGER) as hour,
          COUNT(*) as count
        FROM visit_sessions 
        WHERE start_time >= ?
        GROUP BY hour
        ORDER BY hour
      `,
        [cutoff]
      );

      // 地区分布
      const regionDistribution = await this.dbAll(
        `
        SELECT location_region as region, COUNT(*) as count
        FROM visit_sessions 
        WHERE start_time >= ? AND location_region != ''
        GROUP BY location_region
        ORDER BY count DESC
        LIMIT 10
      `,
        [cutoff]
      );

      // 页面访问统计
      const pageViews = await this.dbAll(
        `
        SELECT p.page, COUNT(*) as count
        FROM page_views p
        JOIN visit_sessions s ON p.session_id = s.session_id
        WHERE s.start_time >= ?
        GROUP BY p.page
        ORDER BY count DESC
      `,
        [cutoff]
      );

      // 设备统计
      const deviceStats = await this.dbAll(
        `
        SELECT device_type, COUNT(*) as count
        FROM visit_sessions 
        WHERE start_time >= ?
        GROUP BY device_type
      `,
        [cutoff]
      );

      // 国家统计
      const locationStats = await this.dbAll(
        `
        SELECT location_country as country, COUNT(*) as count
        FROM visit_sessions 
        WHERE start_time >= ? AND location_country != ''
        GROUP BY location_country
        ORDER BY count DESC
        LIMIT 10
      `,
        [cutoff]
      );

      return {
        totalVisits: totalVisits.count || 0,
        uniqueIPs: uniqueIPs.count || 0,
        uniqueRegions: uniqueRegions.count || 0,
        todayVisits: todayVisits.count || 0,
        avgDuration: Math.round((avgDuration.duration || 0) / 1000 / 60), // 转换为分钟
        timeDistribution: this.formatTimeDistribution(timeDistribution),
        regionDistribution: this.formatDistribution(regionDistribution),
        pageViews: this.formatDistribution(pageViews),
        deviceStats: this.formatDeviceStats(deviceStats),
        locationStats: this.formatDistribution(locationStats, "country"),
      };
    } catch (error) {
      console.error("获取访问统计失败:", error);
      throw error;
    }
  }

  async getVisitRecords(period = 30, limit = 50) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - period);

      const records = await this.dbAll(
        `
        SELECT 
          vs.session_id,
          vs.ip,
          vs.user_agent,
          vs.start_time,
          vs.end_time,
          vs.duration,
          vs.location_country,
          vs.location_region,
          vs.location_city,
          vs.device_type,
          pv.page,
          pv.timestamp
        FROM visit_sessions vs
        LEFT JOIN page_views pv ON vs.session_id = pv.session_id
        WHERE vs.start_time >= ?
        ORDER BY vs.start_time DESC
        LIMIT ?
      `,
        [cutoffDate.getTime(), limit]
      );

      return records.map((record) => ({
        id: record.session_id,
        ip: record.ip,
        userAgent: record.user_agent,
        startTime: record.start_time,
        endTime: record.end_time,
        duration: record.duration,
        region: record.location_region || "未知",
        city: record.location_city || "未知",
        device: record.device_type || "desktop",
        page: record.page || "/",
        timestamp: record.timestamp,
      }));
    } catch (error) {
      console.error("获取访问记录失败:", error);
      return [];
    }
  }

  async clearVisitStats() {
    try {
      await this.dbRun("DELETE FROM page_views");
      await this.dbRun("DELETE FROM visit_sessions");
      return { success: true };
    } catch (error) {
      console.error("清除访问统计失败:", error);
      throw error;
    }
  }

  async exportVisitStats() {
    try {
      const sessions = await this.dbAll(
        "SELECT * FROM visit_sessions ORDER BY start_time DESC"
      );
      const pageViews = await this.dbAll(
        "SELECT * FROM page_views ORDER BY timestamp DESC"
      );

      return {
        sessions,
        pageViews,
        exportTime: new Date().toISOString(),
      };
    } catch (error) {
      console.error("导出访问统计失败:", error);
      throw error;
    }
  }

  // 格式化辅助方法
  formatTimeDistribution(data) {
    const result = new Array(24).fill(0);
    data.forEach((item) => {
      result[item.hour] = item.count;
    });
    return result;
  }

  formatDistribution(data, keyField = "region") {
    const result = {};
    data.forEach((item) => {
      const key = item[keyField] || item.page || item.country;
      result[key] = item.count;
    });
    return result;
  }

  formatDeviceStats(data) {
    const result = { desktop: 0, mobile: 0, tablet: 0 };
    data.forEach((item) => {
      const device = item.device_type || "desktop";
      result[device] = item.count;
    });
    return result;
  }

  // 记录同步日志
  async logSync(action, itemUuid = null, clientId = null) {
    try {
      await this.dbRun(
        `
        INSERT INTO sync_log (action, item_uuid, client_id)
        VALUES (?, ?, ?)
      `,
        [action, itemUuid, clientId]
      );
    } catch (error) {
      console.warn("记录同步日志失败:", error);
    }
  }

  // 获取同步日志
  async getSyncLog(since = null) {
    try {
      let query = `SELECT * FROM sync_log ORDER BY timestamp DESC`;
      let params = [];

      if (since) {
        query = `SELECT * FROM sync_log WHERE timestamp > ? ORDER BY timestamp DESC`;
        params = [since];
      }

      return await this.dbAll(query, params);
    } catch (error) {
      console.error("获取同步日志失败:", error);
      throw error;
    }
  }

  // 格式化项目数据
  formatItem(item) {
    return {
      id: item.uuid,
      type: item.type,
      title: item.title,
      content: item.content,
      filePath: item.file_path,
      fileName: item.file_name,
      fileType: item.file_type,
      size: item.file_size || 0,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    };
  }

  // 关闭数据库连接
  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error("关闭数据库失败:", err);
        } else {
          console.log("数据库连接已关闭");
        }
      });
    }
  }

  // ============ 备忘录相关方法 ============

  // 创建或访问备忘录房间
  async createOrAccessMemoRoom(roomId, roomName = null) {
    try {
      // 检查房间是否存在
      let room = await this.dbGet(
        "SELECT * FROM memo_rooms WHERE room_id = ?",
        [roomId]
      );

      if (room) {
        // 更新最后访问时间
        await this.dbRun(
          "UPDATE memo_rooms SET last_accessed = CURRENT_TIMESTAMP WHERE room_id = ?",
          [roomId]
        );
      } else {
        // 创建新房间
        await this.dbRun(
          "INSERT INTO memo_rooms (room_id, room_name) VALUES (?, ?)",
          [roomId, roomName || `备忘录房间${roomId}`]
        );
        room = await this.dbGet("SELECT * FROM memo_rooms WHERE room_id = ?", [
          roomId,
        ]);
      }

      return room;
    } catch (error) {
      console.error("创建或访问备忘录房间失败:", error);
      throw error;
    }
  }

  // 获取所有备忘录房间
  async getAllMemoRooms() {
    try {
      const rooms = await this.dbAll(`
        SELECT mr.*, COUNT(m.id) as memo_count
        FROM memo_rooms mr
        LEFT JOIN memos m ON mr.room_id = m.room_id
        GROUP BY mr.room_id
        ORDER BY mr.last_accessed DESC
      `);
      return rooms;
    } catch (error) {
      console.error("获取备忘录房间失败:", error);
      throw error;
    }
  }

  // 获取指定房间的所有备忘录
  async getAllMemos(roomId) {
    try {
      const memos = await this.dbAll(
        `
        SELECT * FROM memos 
        WHERE room_id = ?
        ORDER BY is_pinned DESC, updated_at DESC
      `,
        [roomId]
      );

      // 获取任务清单项目
      for (let memo of memos) {
        if (memo.is_task_list) {
          memo.tasks = await this.dbAll(
            `
            SELECT * FROM task_items 
            WHERE memo_uuid = ?
            ORDER BY order_index ASC, created_at ASC
          `,
            [memo.uuid]
          );
        }
        memo.tags = memo.tags ? JSON.parse(memo.tags) : [];
      }

      return memos;
    } catch (error) {
      console.error("获取备忘录失败:", error);
      throw error;
    }
  }

  // 创建备忘录
  async createMemo(data) {
    const {
      uuid,
      roomId,
      title,
      content,
      contentType = "markdown",
      isTaskList = false,
      tags = [],
      priority = 0,
    } = data;
    try {
      await this.dbRun(
        `
        INSERT INTO memos (uuid, room_id, title, content, content_type, is_task_list, tags, priority)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          uuid,
          roomId,
          title,
          content,
          contentType,
          isTaskList ? 1 : 0,
          JSON.stringify(tags),
          priority,
        ]
      );

      return this.getMemoByUuid(uuid);
    } catch (error) {
      console.error("创建备忘录失败:", error);
      throw error;
    }
  }

  // 获取单个备忘录
  async getMemoByUuid(uuid) {
    try {
      const memo = await this.dbGet("SELECT * FROM memos WHERE uuid = ?", [
        uuid,
      ]);
      if (!memo) return null;

      if (memo.is_task_list) {
        memo.tasks = await this.dbAll(
          `
          SELECT * FROM task_items 
          WHERE memo_uuid = ?
          ORDER BY order_index ASC, created_at ASC
        `,
          [uuid]
        );
      }
      memo.tags = memo.tags ? JSON.parse(memo.tags) : [];
      return memo;
    } catch (error) {
      console.error("获取备忘录失败:", error);
      throw error;
    }
  }

  // 更新备忘录
  async updateMemo(uuid, data) {
    const { title, content, contentType, tags, priority, isPinned } = data;
    try {
      await this.dbRun(
        `
        UPDATE memos 
        SET title = ?, content = ?, content_type = ?, tags = ?, priority = ?, is_pinned = ?, updated_at = CURRENT_TIMESTAMP
        WHERE uuid = ?
      `,
        [
          title,
          content,
          contentType,
          JSON.stringify(tags),
          priority,
          isPinned ? 1 : 0,
          uuid,
        ]
      );

      return this.getMemoByUuid(uuid);
    } catch (error) {
      console.error("更新备忘录失败:", error);
      throw error;
    }
  }

  // 删除备忘录
  async deleteMemo(uuid) {
    try {
      // 先删除关联的任务项目
      await this.dbRun("DELETE FROM task_items WHERE memo_uuid = ?", [uuid]);
      // 删除备忘录
      await this.dbRun("DELETE FROM memos WHERE uuid = ?", [uuid]);
      return true;
    } catch (error) {
      console.error("删除备忘录失败:", error);
      throw error;
    }
  }

  // 添加任务项目
  async addTaskItem(memoUuid, content, orderIndex = 0) {
    try {
      await this.dbRun(
        `
        INSERT INTO task_items (memo_uuid, content, order_index)
        VALUES (?, ?, ?)
      `,
        [memoUuid, content, orderIndex]
      );

      // 获取最新插入的任务项目
      return this.dbGet(
        `
        SELECT * FROM task_items 
        WHERE memo_uuid = ? AND content = ? AND order_index = ?
        ORDER BY created_at DESC, id DESC
        LIMIT 1
      `,
        [memoUuid, content, orderIndex]
      );
    } catch (error) {
      console.error("添加任务项目失败:", error);
      throw error;
    }
  }

  // 更新任务项目
  async updateTaskItem(taskId, data) {
    const { content, isCompleted, orderIndex } = data;
    try {
      await this.dbRun(
        `
        UPDATE task_items 
        SET content = ?, is_completed = ?, order_index = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
        [content, isCompleted ? 1 : 0, orderIndex, taskId]
      );

      return this.dbGet("SELECT * FROM task_items WHERE id = ?", [taskId]);
    } catch (error) {
      console.error("更新任务项目失败:", error);
      throw error;
    }
  }

  // 删除任务项目
  async deleteTaskItem(taskId) {
    try {
      await this.dbRun("DELETE FROM task_items WHERE id = ?", [taskId]);
      return true;
    } catch (error) {
      console.error("删除任务项目失败:", error);
      throw error;
    }
  }

  // 获取备忘录统计
  async getMemoStats(roomId) {
    try {
      const totalMemos = await this.dbGet(
        `
        SELECT COUNT(*) as count FROM memos WHERE room_id = ?
      `,
        [roomId]
      );

      const taskListCount = await this.dbGet(
        `
        SELECT COUNT(*) as count FROM memos WHERE room_id = ? AND is_task_list = 1
      `,
        [roomId]
      );

      const completedTasks = await this.dbGet(
        `
        SELECT COUNT(*) as count 
        FROM task_items ti 
        JOIN memos m ON ti.memo_uuid = m.uuid 
        WHERE m.room_id = ? AND ti.is_completed = 1
      `,
        [roomId]
      );

      const totalTasks = await this.dbGet(
        `
        SELECT COUNT(*) as count 
        FROM task_items ti 
        JOIN memos m ON ti.memo_uuid = m.uuid 
        WHERE m.room_id = ?
      `,
        [roomId]
      );

      return {
        totalMemos: totalMemos.count,
        taskListCount: taskListCount.count,
        completedTasks: completedTasks.count,
        totalTasks: totalTasks.count,
        completionRate:
          totalTasks.count > 0
            ? Math.round((completedTasks.count / totalTasks.count) * 100)
            : 0,
      };
    } catch (error) {
      console.error("获取备忘录统计失败:", error);
      throw error;
    }
  }

  // 记录访问
  async recordVisit(page, timestamp) {
    try {
      const sessionId = `session_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // 创建访问会话
      await this.dbRun(
        `
        INSERT INTO visit_sessions (session_id, ip, user_agent, start_time)
        VALUES (?, ?, ?, ?)
      `,
        [sessionId, "unknown", "unknown", timestamp || Date.now()]
      );

      // 记录页面访问
      await this.dbRun(
        `
        INSERT INTO page_views (session_id, page, timestamp)
        VALUES (?, ?, ?)
      `,
        [sessionId, page, timestamp || Date.now()]
      );

      return { success: true, sessionId };
    } catch (error) {
      console.error("记录访问失败:", error);
      return { success: false, error: error.message };
    }
  }

  // 更新会话时长
  async updateSessionDuration(sessionId, duration) {
    try {
      await this.dbRun(
        `
        UPDATE visit_sessions 
        SET end_time = ?, duration = ?
        WHERE session_id = ?
      `,
        [Date.now(), duration, sessionId]
      );
      return { success: true };
    } catch (error) {
      console.error("更新会话时长失败:", error);
      return { success: false, error: error.message };
    }
  }
}

// 创建单例实例
const databaseService = new DatabaseService();

export default databaseService;
