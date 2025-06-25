<template>
  <div class="storage-container">
    <!-- 房间选择模态框 -->
    <div v-if="!currentRoomId" class="modal-overlay room-selector-overlay">
      <div class="modal-content room-selector-modal">
        <div class="modal-header">
          <h3><i class="fas fa-door-open"></i> 选择暂存室</h3>
        </div>
        <div class="modal-body">
          <div class="room-input-section">
            <h4>输入房间号码</h4>
            <p>相同号码的用户可以共享暂存室</p>
            <div class="room-input-group">
              <input
                v-model="roomInput"
                type="text"
                placeholder="请输入房间号码（如：1001）"
                class="room-input"
                @keyup.enter="enterRoom"
                maxlength="20"
              />
              <button
                @click="enterRoom"
                class="btn-primary"
                :disabled="!roomInput.trim()"
              >
                <i class="fas fa-sign-in-alt"></i>
                进入
              </button>
            </div>
          </div>

          <div v-if="recentRooms.length > 0" class="recent-rooms-section">
            <h4>最近访问的房间</h4>
            <div class="recent-rooms-list">
              <div
                v-for="room in recentRooms"
                :key="room.room_id"
                class="recent-room-item"
                @click="selectRoom(room.room_id)"
              >
                <div class="room-info">
                  <span class="room-id">{{ room.room_id }}</span>
                  <span class="room-name">{{ room.room_name }}</span>
                  <span class="room-stats">{{ room.item_count }} 个项目</span>
                </div>
                <div class="room-time">
                  {{ formatTime(room.last_accessed) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else>
      <header class="storage-header">
        <div class="header-top">
          <button @click="goBack" class="back-btn">
            <i class="fas fa-arrow-left"></i>
            返回主页
          </button>
        </div>
        <h1><i class="fas fa-archive"></i> 暂存室</h1>
        <p>安全暂存文本和文件，支持多端同步</p>
      </header>

      <main class="storage-main">
        <!-- 操作栏 -->
        <div class="action-bar">
          <div class="room-section">
            <span class="current-room">
              <i class="fas fa-door-open"></i>
              房间: {{ currentRoomId }}
            </span>
            <button @click="showRoomSelector" class="btn-switch-room">
              <i class="fas fa-exchange-alt"></i>
              切换房间
            </button>
          </div>

          <div class="add-buttons">
            <button @click="showAddTextModal = true" class="btn-primary">
              <i class="fas fa-plus"></i>
              添加文本
            </button>
            <button @click="triggerFileInput" class="btn-secondary">
              <i class="fas fa-upload"></i>
              添加文件
            </button>
            <input
              ref="fileInput"
              type="file"
              multiple
              @change="handleFileAdd"
              style="display: none"
            />
          </div>

          <div class="management-buttons">
            <button @click="syncData" class="btn-sync" :disabled="syncing">
              <i
                :class="syncing ? 'fas fa-spinner fa-spin' : 'fas fa-sync'"
              ></i>
              {{ syncing ? "同步中..." : "同步数据" }}
            </button>
            <button @click="exportData" class="btn-outline">
              <i class="fas fa-download"></i>
              导出数据
            </button>
            <button @click="clearAll" class="btn-danger">
              <i class="fas fa-trash"></i>
              清空所有
            </button>
          </div>
        </div>

        <!-- 统计信息 -->
        <div class="stats-bar">
          <div class="stats-item">
            <i class="fas fa-file-text"></i>
            <span>文本项目: {{ textItems.length }}</span>
          </div>
          <div class="stats-item">
            <i class="fas fa-file"></i>
            <span>文件项目: {{ fileItems.length }}</span>
          </div>
          <div class="stats-item">
            <i class="fas fa-database"></i>
            <span>总存储: {{ formatSize(totalSize) }}</span>
          </div>
          <div class="stats-item">
            <i class="fas fa-clock"></i>
            <span>最后同步: {{ lastSyncTime }}</span>
          </div>
        </div>

        <!-- 搜索和筛选 -->
        <div class="filter-bar">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input
              ref="searchInput"
              v-model="searchQuery"
              type="text"
              placeholder="搜索暂存内容..."
              class="search-input"
            />
          </div>
          <div class="filter-buttons">
            <button
              :class="{ active: filter === 'all' }"
              @click="filter = 'all'"
              class="filter-btn"
            >
              全部
            </button>
            <button
              :class="{ active: filter === 'text' }"
              @click="filter = 'text'"
              class="filter-btn"
            >
              文本
            </button>
            <button
              :class="{ active: filter === 'file' }"
              @click="filter = 'file'"
              class="filter-btn"
            >
              文件
            </button>
          </div>
        </div>

        <!-- 暂存项目列表 -->
        <div class="storage-list">
          <div
            v-for="item in filteredItems"
            :key="item.id"
            class="storage-item"
            :class="{
              'item-text': item.type === 'text',
              'item-file': item.type === 'file',
            }"
          >
            <div class="item-header">
              <div class="item-type">
                <i :class="getItemIcon(item)"></i>
                <span class="item-title">{{ item.title || "未命名" }}</span>
              </div>
              <div class="item-meta">
                <span class="item-size">{{ formatSize(item.size) }}</span>
                <span class="item-time">{{ formatTime(item.createdAt) }}</span>
              </div>
              <div class="item-actions">
                <button
                  v-if="item.type === 'text'"
                  @click="copyToClipboard(item.content)"
                  class="action-btn"
                  title="复制"
                >
                  <i class="fas fa-copy"></i>
                </button>
                <button
                  v-if="item.type === 'file'"
                  @click="previewFile(item)"
                  class="action-btn"
                  title="预览"
                >
                  <i class="fas fa-eye"></i>
                </button>
                <button
                  v-if="item.type === 'file'"
                  @click="downloadFile(item)"
                  class="action-btn"
                  title="下载"
                >
                  <i class="fas fa-download"></i>
                </button>
                <button @click="editItem(item)" class="action-btn" title="编辑">
                  <i class="fas fa-edit"></i>
                </button>
                <button
                  @click="deleteItem(item.id)"
                  class="action-btn danger"
                  title="删除"
                >
                  <i class="fas fa-trash"></i>
                </button>
              </div>
            </div>

            <div class="item-content">
              <div v-if="item.type === 'text'" class="text-content">
                <pre
                  >{{ item.content.substring(0, 200)
                  }}{{ item.content.length > 200 ? "..." : "" }}</pre
                >
              </div>
              <div v-else class="file-content" @click="previewFile(item)">
                <div class="file-info">
                  <span class="file-name">{{ item.fileName }}</span>
                  <span class="file-type">{{ item.fileType }}</span>
                  <span class="preview-hint">点击预览</span>
                </div>
                <div
                  v-if="item.fileType && item.fileType.startsWith('image/')"
                  class="file-preview"
                >
                  <img :src="`/api/storage/file/${item.id}`" alt="预览"
                  @error="$event.target.style.display='none'"
                </div>
              </div>
            </div>
          </div>

          <div v-if="filteredItems.length === 0" class="empty-state">
            <i class="fas fa-inbox"></i>
            <h3>暂存室为空</h3>
            <p>开始添加文本或文件到暂存室吧</p>
          </div>
        </div>
      </main>

      <!-- 添加文本模态框 -->
      <div
        v-if="showAddTextModal"
        class="modal-overlay"
        @click="showAddTextModal = false"
      >
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>添加文本</h3>
            <button @click="showAddTextModal = false" class="close-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>标题</label>
              <input
                v-model="newTextItem.title"
                type="text"
                placeholder="输入文本标题..."
                class="form-input"
              />
            </div>
            <div class="form-group">
              <label>内容</label>
              <textarea
                v-model="newTextItem.content"
                placeholder="输入文本内容..."
                class="form-textarea"
                rows="10"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="showAddTextModal = false" class="btn-secondary">
              取消
            </button>
            <button @click="addTextItem" class="btn-primary">保存</button>
          </div>
        </div>
      </div>

      <!-- 编辑项目模态框 -->
      <div
        v-if="showEditModal"
        class="modal-overlay"
        @click="showEditModal = false"
      >
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>编辑{{ editingItem.type === "text" ? "文本" : "文件" }}</h3>
            <button @click="showEditModal = false" class="close-btn">
              <i class="fas fa-times"></i>
            </button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>标题</label>
              <input
                v-model="editingItem.title"
                type="text"
                class="form-input"
              />
            </div>
            <div v-if="editingItem.type === 'text'" class="form-group">
              <label>内容</label>
              <textarea
                v-model="editingItem.content"
                class="form-textarea"
                rows="10"
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="showEditModal = false" class="btn-secondary">
              取消
            </button>
            <button @click="saveEdit" class="btn-primary">保存</button>
          </div>
        </div>
      </div>

      <!-- 文件预览模态框 -->
      <div
        v-if="showPreviewModal"
        class="modal-overlay preview-overlay"
        @click="showPreviewModal = false"
      >
        <div class="modal-content preview-modal" @click.stop>
          <div class="modal-header">
            <h3>文件预览 - {{ previewItem.fileName }}</h3>
            <div class="preview-actions">
              <button @click="downloadFile(previewItem)" class="btn-outline">
                <i class="fas fa-download"></i>
                下载
              </button>
              <button @click="showPreviewModal = false" class="close-btn">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>
          <div class="modal-body preview-body">
            <!-- 图片预览 -->
            <div v-if="isImageFile(previewItem)" class="image-preview">
              <img
                :src="`/api/storage/file/${previewItem.id}`"
                :alt="previewItem.fileName"
                @error="handleImageError"
              />
            </div>

            <!-- 文本文件预览 -->
            <div v-else-if="isTextFile(previewItem)" class="text-preview">
              <pre v-if="previewContent">{{ previewContent }}</pre>
              <div v-else class="loading-preview">
                <i class="fas fa-spinner fa-spin"></i>
                <span>加载中...</span>
              </div>
            </div>

            <!-- PDF预览 -->
            <div v-else-if="isPdfFile(previewItem)" class="pdf-preview">
              <iframe
                :src="`/api/storage/file/${previewItem.id}`"
                width="100%"
                height="600px"
                frameborder="0"
              ></iframe>
            </div>

            <!-- 音频预览 -->
            <div v-else-if="isAudioFile(previewItem)" class="audio-preview">
              <div class="audio-info">
                <i class="fas fa-music"></i>
                <div>
                  <h4>{{ previewItem.fileName }}</h4>
                  <p>文件大小: {{ formatSize(previewItem.size) }}</p>
                </div>
              </div>
              <audio controls width="100%">
                <source
                  :src="`/api/storage/file/${previewItem.id}`"
                  :type="previewItem.fileType"
                />
                您的浏览器不支持音频播放
              </audio>
            </div>

            <!-- 视频预览 -->
            <div v-else-if="isVideoFile(previewItem)" class="video-preview">
              <video controls width="100%" height="400">
                <source
                  :src="`/api/storage/file/${previewItem.id}`"
                  :type="previewItem.fileType"
                />
                您的浏览器不支持视频播放
              </video>
            </div>

            <!-- 不支持预览的文件 -->
            <div v-else class="unsupported-preview">
              <div class="file-icon">
                <i :class="getFileIcon(previewItem)"></i>
              </div>
              <h4>{{ previewItem.fileName }}</h4>
              <p>文件类型: {{ previewItem.fileType || "未知" }}</p>
              <p>文件大小: {{ formatSize(previewItem.size) }}</p>
              <p class="unsupported-text">此文件类型不支持在线预览</p>
              <button @click="downloadFile(previewItem)" class="btn-primary">
                <i class="fas fa-download"></i>
                下载文件
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, reactive, nextTick } from "vue";

// 响应式数据
const storageItems = ref([]);
const searchQuery = ref("");
const filter = ref("all");
const syncing = ref(false);
const lastSyncTime = ref("从未同步");

// 房间相关
const currentRoomId = ref(null);
const roomInput = ref("");
const recentRooms = ref([]);

// 模态框状态
const showAddTextModal = ref(false);
const showEditModal = ref(false);
const showPreviewModal = ref(false);
const editingItem = ref({});
const previewItem = ref({});
const previewContent = ref("");

// 新文本项目
const newTextItem = reactive({
  title: "",
  content: "",
});

// 文件输入引用
const fileInput = ref(null);
// 搜索输入引用
const searchInput = ref(null);

// 计算属性
const textItems = computed(() =>
  storageItems.value.filter((item) => item.type === "text")
);
const fileItems = computed(() =>
  storageItems.value.filter((item) => item.type === "file")
);
const totalSize = computed(() =>
  storageItems.value.reduce((sum, item) => sum + (item.size || 0), 0)
);

const filteredItems = computed(() => {
  let items = storageItems.value;

  // 按类型筛选
  if (filter.value !== "all") {
    items = items.filter((item) => item.type === filter.value);
  }

  // 按搜索查询筛选
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    items = items.filter(
      (item) =>
        item.title?.toLowerCase().includes(query) ||
        item.content?.toLowerCase().includes(query) ||
        item.fileName?.toLowerCase().includes(query)
    );
  }

  // 按创建时间排序，最新的在前面
  return items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
});

// 房间管理方法
const initializeRoom = async () => {
  // 从本地存储获取当前房间ID
  const savedRoomId = localStorage.getItem("currentRoomId");
  if (savedRoomId) {
    currentRoomId.value = savedRoomId;
    await loadData();
  }

  // 加载最近访问的房间
  await loadRecentRooms();
};

const loadRecentRooms = async () => {
  try {
    const response = await fetch("/api/storage/rooms");
    const result = await response.json();

    if (result.success) {
      recentRooms.value = result.data.slice(0, 5); // 只显示最近5个房间
    }
  } catch (error) {
    console.error("加载最近房间失败:", error);
  }
};

const enterRoom = async () => {
  if (!roomInput.value.trim()) {
    alert("请输入房间号码");
    return;
  }

  await selectRoom(roomInput.value.trim());
};

const selectRoom = async (roomId) => {
  try {
    // 创建或访问房间
    const response = await fetch(`/api/storage/room/${roomId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        roomName: `房间${roomId}`,
      }),
    });

    const result = await response.json();

    if (result.success) {
      currentRoomId.value = roomId;
      localStorage.setItem("currentRoomId", roomId);
      roomInput.value = "";

      // 加载房间数据
      await loadData();

      // 自动聚焦搜索框
      await nextTick();
      if (searchInput.value) {
        searchInput.value.focus();
      }

      alert(`成功进入房间 ${roomId}`);
    } else {
      alert("进入房间失败: " + result.message);
    }
  } catch (error) {
    console.error("进入房间失败:", error);
    alert("进入房间失败，请检查网络连接");
  }
};

const showRoomSelector = () => {
  currentRoomId.value = null;
  localStorage.removeItem("currentRoomId");
  loadRecentRooms();
};

// 方法
const loadData = async () => {
  if (!currentRoomId.value) return;

  try {
    const response = await fetch(`/api/storage/items/${currentRoomId.value}`);
    const result = await response.json();

    if (result.success) {
      storageItems.value = result.data;
    } else {
      console.error("加载数据失败:", result.message);
    }

    // 加载统计信息
    const statsResponse = await fetch(
      `/api/storage/stats/${currentRoomId.value}`
    );
    const statsResult = await statsResponse.json();

    if (statsResult.success && statsResult.data.lastSync) {
      lastSyncTime.value = formatTime(statsResult.data.lastSync);
    }
  } catch (e) {
    console.error("加载数据失败:", e);
  }
};

const addTextItem = async () => {
  if (!newTextItem.content.trim()) {
    alert("请输入文本内容");
    return;
  }

  if (!currentRoomId.value) {
    alert("请先选择房间");
    return;
  }

  try {
    const response = await fetch(`/api/storage/text/${currentRoomId.value}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: newTextItem.title || "文本片段",
        content: newTextItem.content.trim(),
      }),
    });

    const result = await response.json();

    if (result.success) {
      // 添加到本地数组
      storageItems.value.unshift(result.data);

      // 重置表单
      newTextItem.title = "";
      newTextItem.content = "";
      showAddTextModal.value = false;
      alert("文本已添加到暂存室");
    } else {
      alert("保存失败: " + result.message);
    }
  } catch (error) {
    console.error("添加文本失败:", error);
    alert("保存失败，请检查网络连接");
  }
};

const triggerFileInput = () => {
  fileInput.value.click();
};

const handleFileAdd = async (event) => {
  if (!currentRoomId.value) {
    alert("请先选择房间");
    return;
  }

  const files = Array.from(event.target.files);
  let successCount = 0;
  let failedFiles = [];

  for (const file of files) {
    try {
      // 检查文件大小
      if (file.size > 500 * 1024 * 1024) {
        failedFiles.push(`${file.name} (文件过大，超过500MB)`);
        continue;
      }

      // 创建FormData
      const formData = new FormData();
      formData.append("file", file);
      formData.append("title", file.name);

      const response = await fetch(`/api/storage/file/${currentRoomId.value}`, {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // 添加到本地数组
        storageItems.value.unshift(result.data);
        successCount++;
      } else {
        failedFiles.push(`${file.name} (${result.message})`);
      }
    } catch (error) {
      console.error("上传文件失败:", file.name, error);
      failedFiles.push(`${file.name} (上传失败)`);
    }
  }

  event.target.value = ""; // 清空文件输入

  // 显示结果
  let message = "";
  if (successCount > 0) {
    message += `成功添加 ${successCount} 个文件`;
  }
  if (failedFiles.length > 0) {
    if (message) message += "\n";
    message += `失败 ${failedFiles.length} 个文件:\n${failedFiles.join("\n")}`;
  }

  if (message) {
    alert(message);
  }
};

const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    alert("已复制到剪贴板");
  } catch (e) {
    console.error("复制失败:", e);
    alert("复制失败，请手动复制");
  }
};

const downloadFile = (item) => {
  try {
    const link = document.createElement("a");
    link.href = `/api/storage/download/${item.id}`;
    link.download = item.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (e) {
    console.error("下载失败:", e);
    alert("下载失败");
  }
};

const editItem = (item) => {
  editingItem.value = { ...item };
  showEditModal.value = true;
};

const saveEdit = async () => {
  try {
    const response = await fetch(`/api/storage/items/${editingItem.value.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: editingItem.value.title,
        content: editingItem.value.content,
      }),
    });

    const result = await response.json();

    if (result.success) {
      // 更新本地数据
      const index = storageItems.value.findIndex(
        (item) => item.id === editingItem.value.id
      );
      if (index >= 0) {
        storageItems.value[index] = result.data;
      }

      showEditModal.value = false;
      alert("修改已保存");
    } else {
      alert("保存失败: " + result.message);
    }
  } catch (error) {
    console.error("保存编辑失败:", error);
    alert("保存失败，请检查网络连接");
  }
};

const deleteItem = async (id) => {
  if (confirm("确定要删除这个项目吗？")) {
    try {
      const response = await fetch(`/api/storage/items/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (result.success) {
        // 从本地数组中移除
        const index = storageItems.value.findIndex((item) => item.id === id);
        if (index >= 0) {
          storageItems.value.splice(index, 1);
        }
        alert("项目已删除");
      } else {
        alert("删除失败: " + result.message);
      }
    } catch (error) {
      console.error("删除失败:", error);
      alert("删除失败，请检查网络连接");
    }
  }
};

const clearAll = async () => {
  if (confirm("确定要清空当前房间的所有暂存项目吗？此操作不可恢复。")) {
    try {
      const response = await fetch(
        `/api/storage/items/${currentRoomId.value}`,
        {
          method: "DELETE",
        }
      );

      const result = await response.json();

      if (result.success) {
        storageItems.value = [];
        alert("暂存室已清空");
      } else {
        alert("清空失败: " + result.message);
      }
    } catch (error) {
      console.error("清空失败:", error);
      alert("清空失败，请检查网络连接");
    }
  }
};

const syncData = async () => {
  syncing.value = true;
  try {
    const response = await fetch("/api/storage/sync");
    const result = await response.json();

    if (result.success) {
      // 更新本地数据
      storageItems.value = result.data.items;
      lastSyncTime.value = formatTime(result.data.timestamp);
      alert("数据同步完成");
    } else {
      alert("同步失败: " + result.message);
    }
  } catch (error) {
    console.error("同步失败:", error);
    alert("同步失败，请检查网络连接");
  } finally {
    syncing.value = false;
  }
};

const exportData = () => {
  try {
    const link = document.createElement("a");
    link.href = "/api/storage/export";
    link.download = `storage_backup_${
      new Date().toISOString().split("T")[0]
    }.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert("数据导出成功");
  } catch (e) {
    console.error("导出失败:", e);
    alert("导出失败");
  }
};

// 文件预览相关方法
const previewFile = async (item) => {
  previewItem.value = item;
  previewContent.value = "";
  showPreviewModal.value = true;

  // 如果是文本文件，需要加载内容
  if (isTextFile(item)) {
    try {
      const response = await fetch(`/api/storage/file/${item.id}`);
      if (response.ok) {
        previewContent.value = await response.text();
      } else {
        previewContent.value = "无法加载文件内容";
      }
    } catch (error) {
      console.error("加载文本文件失败:", error);
      previewContent.value = "加载失败";
    }
  }
};

const isImageFile = (item) => {
  return item.fileType && item.fileType.startsWith("image/");
};

const isTextFile = (item) => {
  if (!item.fileType) return false;
  const textTypes = [
    "text/",
    "application/json",
    "application/xml",
    "application/javascript",
    "application/x-javascript",
  ];
  return (
    textTypes.some((type) => item.fileType.startsWith(type)) ||
    item.fileName?.match(
      /\.(txt|md|json|xml|html|css|js|ts|vue|jsx|tsx|py|java|cpp|c|h|php|rb|go|rs|swift|kt|scala|sql|yaml|yml|toml|ini|cfg|conf|log)$/i
    )
  );
};

const isPdfFile = (item) => {
  return item.fileType && item.fileType.includes("pdf");
};

const isAudioFile = (item) => {
  return item.fileType && item.fileType.startsWith("audio/");
};

const isVideoFile = (item) => {
  return item.fileType && item.fileType.startsWith("video/");
};

const getFileIcon = (item) => {
  if (isImageFile(item)) return "fas fa-image";
  if (isVideoFile(item)) return "fas fa-video";
  if (isAudioFile(item)) return "fas fa-music";
  if (isPdfFile(item)) return "fas fa-file-pdf";
  if (isTextFile(item)) return "fas fa-file-code";
  if (item.fileType?.includes("zip") || item.fileType?.includes("rar"))
    return "fas fa-file-archive";
  if (item.fileType?.includes("word") || item.fileName?.match(/\.(doc|docx)$/i))
    return "fas fa-file-word";
  if (
    item.fileType?.includes("excel") ||
    item.fileName?.match(/\.(xls|xlsx)$/i)
  )
    return "fas fa-file-excel";
  if (
    item.fileType?.includes("powerpoint") ||
    item.fileName?.match(/\.(ppt|pptx)$/i)
  )
    return "fas fa-file-powerpoint";
  return "fas fa-file";
};

const handleImageError = (event) => {
  event.target.style.display = "none";
  event.target.parentNode.innerHTML =
    '<div class="image-error"><i class="fas fa-exclamation-triangle"></i><p>图片加载失败</p></div>';
};

const getItemIcon = (item) => {
  if (item.type === "text") {
    return "fas fa-file-text";
  } else {
    return getFileIcon(item);
  }
};

const formatSize = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const formatTime = (timeString) => {
  if (!timeString) return "从未";
  const date = new Date(timeString);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return "刚刚";
  if (diff < 3600000) return Math.floor(diff / 60000) + " 分钟前";
  if (diff < 86400000) return Math.floor(diff / 3600000) + " 小时前";
  if (diff < 604800000) return Math.floor(diff / 86400000) + " 天前";

  return date.toLocaleDateString();
};

// 导航方法
const goBack = () => {
  // 使用Vue Router返回主页
  try {
    // 尝试使用Vue Router
    if (window.$router) {
      window.$router.push("/");
    } else if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = "/";
    }
  } catch (error) {
    // 如果路由失败，直接跳转
    window.location.href = "/";
  }
};

// 键盘快捷键处理
const handleKeydown = (event) => {
  // Ctrl+F 或 Cmd+F 聚焦搜索框
  if ((event.ctrlKey || event.metaKey) && event.key === "f") {
    event.preventDefault();
    if (searchInput.value) {
      searchInput.value.focus();
      searchInput.value.select(); // 选中所有文本
    }
  }
  // ESC 清空搜索框
  if (event.key === "Escape" && searchInput.value === document.activeElement) {
    searchQuery.value = "";
    searchInput.value.blur();
  }
};

// 生命周期
onMounted(async () => {
  await initializeRoom();

  // 在组件挂载后自动聚焦搜索框（无论是否有房间）
  await nextTick();
  if (searchInput.value) {
    searchInput.value.focus();
  }

  // 添加键盘事件监听器
  document.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  // 移除键盘事件监听器
  document.removeEventListener("keydown", handleKeydown);
});
</script>

<style scoped>
/* 房间选择器样式 */
.room-selector-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.room-selector-modal {
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.room-input-section {
  margin-bottom: 30px;
}

.room-input-section h4 {
  margin: 0 0 8px 0;
  color: #333;
  font-size: 18px;
}

.room-input-section p {
  margin: 0 0 15px 0;
  color: #666;
  font-size: 14px;
}

.room-input-group {
  display: flex;
  gap: 10px;
}

.room-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.room-input:focus {
  outline: none;
  border-color: #667eea;
}

.recent-rooms-section {
  border-top: 1px solid #e1e5e9;
  padding-top: 20px;
}

.recent-rooms-section h4 {
  margin: 0 0 15px 0;
  color: #333;
  font-size: 16px;
}

.recent-rooms-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.recent-room-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border: 1px solid #e1e5e9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.recent-room-item:hover {
  border-color: #667eea;
  background: #f8f9fa;
}

.room-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.room-id {
  font-weight: 600;
  color: #667eea;
  font-size: 16px;
}

.room-name {
  color: #666;
  font-size: 14px;
}

.room-stats {
  color: #999;
  font-size: 12px;
}

.room-time {
  color: #999;
  font-size: 12px;
}

/* 房间信息样式已移动到操作栏 */

.current-room {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #e3f2fd;
  border-radius: 6px;
  color: #1976d2;
  font-weight: 500;
  font-size: 13px;
}

.btn-switch-room {
  padding: 6px 10px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-switch-room:hover {
  border-color: #667eea;
  color: #667eea;
}

.storage-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

.storage-header {
  text-align: center;
  margin-bottom: 30px;
  color: #2d3748;
  position: relative;
}

.header-top {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 20px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: white;
  border: 2px solid #667eea;
  border-radius: 8px;
  color: #667eea;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.1);
}

.back-btn:hover {
  background: #667eea;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.back-btn i {
  font-size: 16px;
}

.storage-header h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

.storage-header p {
  font-size: 1.1rem;
  color: #667282;
}

.storage-main {
  max-width: 1200px;
  margin: 0 auto;
}

.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 20px;
  border-radius: 15px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.room-section {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.add-buttons,
.management-buttons {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-primary,
.btn-secondary,
.btn-outline,
.btn-danger,
.btn-sync {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.3s ease;
  font-weight: 500;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a67d8;
  transform: translateY(-2px);
}

.btn-secondary {
  background: #f7fafc;
  color: #2d3748;
  border: 1px solid #e2e8f0;
}

.btn-secondary:hover {
  background: #edf2f7;
}

.btn-outline {
  background: transparent;
  color: #667eea;
  border: 1px solid #667eea;
}

.btn-outline:hover {
  background: #667eea;
  color: white;
}

.btn-danger {
  background: #e53e3e;
  color: white;
}

.btn-danger:hover {
  background: #c53030;
}

.btn-sync {
  background: #38a169;
  color: white;
}

.btn-sync:hover:not(:disabled) {
  background: #2f855a;
}

.btn-sync:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.stats-bar {
  display: flex;
  justify-content: space-around;
  background: white;
  padding: 15px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 10px;
}

.stats-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #4a5568;
  font-size: 14px;
  font-weight: 500;
}

.stats-item i {
  color: #667eea;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  padding: 15px 20px;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.search-box {
  display: flex;
  align-items: center;
  background: #f7fafc;
  border-radius: 8px;
  padding: 0 15px;
  flex: 1;
  max-width: 300px;
}

.search-box i {
  color: #a0aec0;
  margin-right: 10px;
}

.search-input {
  border: none;
  background: none;
  outline: none;
  padding: 10px 0;
  flex: 1;
  font-size: 14px;
  transition: background-color 0.2s ease;
}

.search-input:focus {
  background: rgba(102, 126, 234, 0.05);
}

.search-box:focus-within i {
  color: #667eea;
}

.filter-buttons {
  display: flex;
  gap: 5px;
}

.filter-btn {
  padding: 8px 16px;
  border: none;
  background: #f7fafc;
  color: #4a5568;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
}

.filter-btn.active,
.filter-btn:hover {
  background: #667eea;
  color: white;
}

.storage-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.storage-item {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.storage-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #f1f5f9;
  flex-wrap: wrap;
  gap: 10px;
}

.item-type {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 200px;
}

.item-type i {
  font-size: 18px;
  color: #667eea;
}

.item-title {
  font-weight: 600;
  color: #2d3748;
  font-size: 16px;
}

.item-meta {
  display: flex;
  gap: 15px;
  color: #718096;
  font-size: 13px;
}

.item-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  color: #718096;
  transition: all 0.2s ease;
}

.action-btn:hover {
  background: #f7fafc;
  color: #2d3748;
}

.action-btn.danger:hover {
  background: #fed7d7;
  color: #e53e3e;
}

.item-content {
  padding: 20px;
}

.text-content pre {
  background: #f7fafc;
  border-radius: 8px;
  padding: 15px;
  font-family: "Courier New", monospace;
  font-size: 13px;
  color: #4a5568;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
}

.file-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.file-info {
  flex: 1;
}

.file-name {
  display: block;
  font-weight: 500;
  color: #2d3748;
  margin-bottom: 5px;
}

.file-type {
  font-size: 12px;
  color: #718096;
  background: #f7fafc;
  padding: 2px 8px;
  border-radius: 4px;
}

.file-preview img {
  max-width: 100px;
  max-height: 80px;
  border-radius: 6px;
  object-fit: cover;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #a0aec0;
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: 20px;
}

.empty-state h3 {
  font-size: 1.5rem;
  margin-bottom: 10px;
  color: #718096;
}

/* 模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: 20px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  color: #2d3748;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
  color: #718096;
  padding: 4px;
}

.close-btn:hover {
  color: #2d3748;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 20px 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #2d3748;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
  font-family: "Courier New", monospace;
}

/* 文件预览样式 */
.file-content {
  cursor: pointer;
  transition: all 0.2s ease;
}

.file-content:hover {
  background: #f8f9fa;
  border-radius: 8px;
}

.preview-hint {
  font-size: 11px;
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
  padding: 2px 6px;
  border-radius: 3px;
  margin-left: 8px;
}

/* 预览模态框样式 */
.preview-overlay {
  background: rgba(0, 0, 0, 0.8);
}

.preview-modal {
  max-width: 90vw;
  max-height: 90vh;
  width: auto;
  height: auto;
}

.preview-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-body {
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

/* 图片预览 */
.image-preview {
  text-align: center;
  padding: 20px;
}

.image-preview img {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.image-error {
  text-align: center;
  color: #e53e3e;
  padding: 40px;
}

.image-error i {
  font-size: 2rem;
  margin-bottom: 10px;
}

/* 文本预览 */
.text-preview {
  width: 100%;
  padding: 20px;
}

.text-preview pre {
  background: #f7fafc;
  border-radius: 8px;
  padding: 20px;
  font-family: "Courier New", monospace;
  font-size: 13px;
  color: #2d3748;
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  max-height: 60vh;
  overflow-y: auto;
}

.loading-preview {
  text-align: center;
  padding: 40px;
  color: #718096;
}

.loading-preview i {
  font-size: 2rem;
  margin-bottom: 10px;
}

/* PDF预览 */
.pdf-preview {
  width: 100%;
  height: 600px;
}

/* 音频预览 */
.audio-preview {
  padding: 30px;
  text-align: center;
}

.audio-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
}

.audio-info i {
  font-size: 2rem;
  color: #667eea;
}

.audio-info h4 {
  margin: 0 0 5px 0;
  color: #2d3748;
}

.audio-info p {
  margin: 0;
  color: #718096;
  font-size: 14px;
}

.audio-preview audio {
  width: 100%;
  max-width: 400px;
}

/* 视频预览 */
.video-preview {
  padding: 20px;
  text-align: center;
}

.video-preview video {
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

/* 不支持预览的文件 */
.unsupported-preview {
  text-align: center;
  padding: 40px;
}

.file-icon {
  margin-bottom: 20px;
}

.file-icon i {
  font-size: 4rem;
  color: #a0aec0;
}

.unsupported-preview h4 {
  color: #2d3748;
  margin-bottom: 10px;
}

.unsupported-preview p {
  color: #718096;
  margin-bottom: 8px;
}

.unsupported-text {
  color: #e53e3e;
  font-style: italic;
  margin: 20px 0 !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .storage-header h1 {
    font-size: 2rem;
  }

  .back-btn {
    font-size: 13px;
    padding: 8px 12px;
  }

  .action-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }

  .room-section {
    justify-content: center;
    order: -1;
  }

  .add-buttons,
  .management-buttons {
    justify-content: center;
  }

  .current-room,
  .btn-switch-room {
    font-size: 12px;
    padding: 6px 10px;
  }

  .preview-modal {
    max-width: 95vw;
    max-height: 95vh;
  }

  .image-preview img {
    max-height: 50vh;
  }

  .text-preview pre {
    font-size: 12px;
    max-height: 40vh;
  }

  .action-bar,
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: none;
  }

  .stats-bar {
    flex-direction: column;
    align-items: center;
  }

  .item-header {
    flex-direction: column;
    align-items: stretch;
  }

  .item-meta {
    justify-content: space-between;
  }

  .file-content {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
