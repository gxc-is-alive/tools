<template>
  <div class="memo-container">
    <!-- 房间选择器 -->
    <div v-if="!currentRoomId" class="room-selector-overlay">
      <div class="room-selector-modal">
        <div class="modal-header">
          <h3>选择备忘录房间</h3>
        </div>

        <div class="room-input-section">
          <h4>输入房间号码</h4>
          <p>相同号码的房间可以共享备忘录</p>
          <div class="room-input-group">
            <input
              v-model="roomInput"
              type="text"
              placeholder="请输入房间号码"
              class="room-input"
              @keyup.enter="enterRoom"
            />
            <button @click="enterRoom" class="btn-primary">进入</button>
          </div>
        </div>

        <div v-if="recentRooms.length" class="recent-rooms-section">
          <h4>最近访问的房间</h4>
          <div class="recent-rooms-list">
            <div
              v-for="room in recentRooms"
              :key="room.room_id"
              class="recent-room-item"
              @click="selectRoom(room.room_id)"
            >
              <div class="room-info">
                <div class="room-id">房间 {{ room.room_id }}</div>
                <div class="room-name">{{ room.room_name }}</div>
                <div class="room-stats">{{ room.memo_count }} 个备忘录</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主界面 -->
    <div v-else class="memo-main">
      <!-- 头部 -->
      <div class="memo-header">
        <div class="header-top">
          <button @click="goBack" class="back-btn">
            <i class="fas fa-arrow-left"></i>
            <span>返回</span>
          </button>
        </div>
        <h1>备忘录</h1>
      </div>

      <!-- 操作栏 -->
      <div class="action-bar">
        <div class="room-section">
          <div class="current-room">
            <i class="fas fa-users"></i>
            <span>房间 {{ currentRoomId }}</span>
          </div>
          <button @click="showRoomSelector" class="btn-switch-room">
            <i class="fas fa-exchange-alt"></i>
            <span>切换房间</span>
          </button>
        </div>
      </div>

      <!-- 搜索和控制栏 -->
      <div class="search-control-bar">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="搜索备忘录..."
            class="search-input"
          />
        </div>

        <div class="add-buttons">
          <button @click="showAddMemoModal = true" class="btn-add">
            <i class="fas fa-plus"></i>
            <span>新建备忘录</span>
          </button>
          <button @click="showAddTaskModal = true" class="btn-add">
            <i class="fas fa-list-check"></i>
            <span>新建任务清单</span>
          </button>
        </div>

        <div class="view-controls">
          <button
            :class="['view-btn', { active: viewMode === 'all' }]"
            @click="viewMode = 'all'"
          >
            全部
          </button>
          <button
            :class="['view-btn', { active: viewMode === 'memo' }]"
            @click="viewMode = 'memo'"
          >
            备忘录
          </button>
          <button
            :class="['view-btn', { active: viewMode === 'task' }]"
            @click="viewMode = 'task'"
          >
            任务清单
          </button>
        </div>
      </div>

      <!-- 统计信息 -->
      <div class="stats-bar">
        <div class="stat-item">
          <i class="fas fa-sticky-note"></i>
          <span>{{ stats.totalMemos }} 个备忘录</span>
        </div>
        <div class="stat-item">
          <i class="fas fa-list-check"></i>
          <span>{{ stats.taskListCount }} 个任务清单</span>
        </div>
        <div class="stat-item">
          <i class="fas fa-check-circle"></i>
          <span>完成率 {{ stats.completionRate }}%</span>
        </div>
      </div>

      <!-- 备忘录列表 -->
      <div class="memo-list">
        <div
          v-for="memo in filteredMemos"
          :key="memo.uuid"
          class="memo-item"
          :class="{ pinned: memo.is_pinned }"
        >
          <div class="memo-header-item">
            <div class="memo-title-section">
              <h3 class="memo-title">
                <i v-if="memo.is_pinned" class="fas fa-thumbtack pin-icon"></i>
                <i
                  :class="
                    memo.is_task_list
                      ? 'fas fa-list-check'
                      : 'fas fa-sticky-note'
                  "
                  class="memo-type-icon"
                ></i>
                {{ memo.title }}
              </h3>
              <div class="memo-meta">
                <span class="memo-date">{{ formatDate(memo.updated_at) }}</span>
                <div v-if="memo.tags && memo.tags.length" class="memo-tags">
                  <span v-for="tag in memo.tags" :key="tag" class="tag">{{
                    tag
                  }}</span>
                </div>
              </div>
            </div>
            <div class="memo-actions">
              <button @click="editMemo(memo)" class="action-btn" title="编辑">
                <i class="fas fa-edit"></i>
              </button>
              <button @click="togglePin(memo)" class="action-btn" title="置顶">
                <i
                  :class="
                    memo.is_pinned
                      ? 'fas fa-thumbtack pin-active'
                      : 'fas fa-thumbtack pin-inactive'
                  "
                ></i>
              </button>
              <button
                @click="deleteMemo(memo)"
                class="action-btn danger"
                title="删除"
              >
                <i class="fas fa-trash"></i>
              </button>
            </div>
          </div>

          <!-- 备忘录内容预览 -->
          <div v-if="!memo.is_task_list" class="memo-content-preview">
            <div
              v-html="renderMarkdown(memo.content.substring(0, 200))"
              class="markdown-preview"
            ></div>
            <div v-if="memo.content.length > 200" class="content-more">...</div>
          </div>

          <!-- 任务清单预览 -->
          <div v-else class="task-list-preview">
            <div v-if="memo.tasks && memo.tasks.length" class="task-items">
              <div
                v-for="task in memo.tasks.slice(0, 5)"
                :key="task.id"
                class="task-item-preview"
                :class="{ completed: task.is_completed }"
              >
                <button
                  @click="toggleTaskInPreview(task, memo)"
                  class="task-checkbox-btn"
                  :class="{ completed: task.is_completed }"
                  title="点击切换完成状态"
                >
                  <i
                    :class="
                      task.is_completed
                        ? 'fas fa-check-square'
                        : 'far fa-square'
                    "
                    class="task-checkbox"
                  ></i>
                </button>
                <span class="task-content" @click="editMemo(memo)">{{
                  task.content
                }}</span>
                <span
                  v-if="task.is_completed"
                  class="task-completed-time"
                  title="完成时间"
                >
                  <i class="fas fa-check"></i>
                </span>
              </div>
              <div v-if="memo.tasks.length > 5" class="task-more">
                还有 {{ memo.tasks.length - 5 }} 个任务...
                <button @click="editMemo(memo)" class="view-all-btn">
                  查看全部
                </button>
              </div>
            </div>
            <div v-else class="empty-task-list">
              <i class="fas fa-list"></i>
              <span>空任务清单</span>
              <button @click="editMemo(memo)" class="add-task-btn">
                添加任务
              </button>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="!filteredMemos.length" class="empty-state">
          <i class="fas fa-sticky-note"></i>
          <h3>暂无备忘录</h3>
          <p>点击上方按钮创建你的第一个备忘录</p>
        </div>
      </div>
    </div>

    <!-- 新建备忘录模态框 -->
    <div
      v-if="showAddMemoModal"
      class="modal-overlay"
      @click="showAddMemoModal = false"
    >
      <div class="modal-content memo-modal" @click.stop>
        <div class="modal-header">
          <h3>新建备忘录</h3>
          <button @click="showAddMemoModal = false" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>标题</label>
            <input
              v-model="newMemo.title"
              type="text"
              placeholder="请输入备忘录标题"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>内容类型</label>
            <div class="content-type-selector">
              <button
                :class="[
                  'type-btn',
                  { active: newMemo.contentType === 'markdown' },
                ]"
                @click="newMemo.contentType = 'markdown'"
              >
                <i class="fab fa-markdown"></i>
                Markdown
              </button>
              <button
                :class="[
                  'type-btn',
                  { active: newMemo.contentType === 'html' },
                ]"
                @click="newMemo.contentType = 'html'"
              >
                <i class="fas fa-code"></i>
                富文本
              </button>
            </div>
          </div>
          <div class="form-group">
            <label>内容</label>
            <textarea
              v-model="newMemo.content"
              :placeholder="
                newMemo.contentType === 'markdown'
                  ? '支持Markdown语法...'
                  : '支持HTML标签...'
              "
              class="form-textarea"
              rows="10"
            ></textarea>
          </div>
          <div class="form-group">
            <label>标签 (用逗号分隔)</label>
            <input
              v-model="newMemo.tagsInput"
              type="text"
              placeholder="工作,重要,紧急"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>优先级</label>
            <select v-model="newMemo.priority" class="form-select">
              <option value="0">普通</option>
              <option value="1">重要</option>
              <option value="2">紧急</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showAddMemoModal = false" class="btn-secondary">
            取消
          </button>
          <button @click="createMemo" class="btn-primary">创建</button>
        </div>
      </div>
    </div>

    <!-- 新建任务清单模态框 -->
    <div
      v-if="showAddTaskModal"
      class="modal-overlay"
      @click="showAddTaskModal = false"
    >
      <div class="modal-content memo-modal" @click.stop>
        <div class="modal-header">
          <h3>新建任务清单</h3>
          <button @click="showAddTaskModal = false" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>标题</label>
            <input
              v-model="newTaskList.title"
              type="text"
              placeholder="请输入任务清单标题"
              class="form-input"
            />
          </div>
          <div class="form-group">
            <label>描述</label>
            <textarea
              v-model="newTaskList.description"
              placeholder="任务清单描述（可选）"
              class="form-textarea"
              rows="3"
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="showAddTaskModal = false" class="btn-secondary">
            取消
          </button>
          <button @click="createTaskList" class="btn-primary">创建</button>
        </div>
      </div>
    </div>

    <!-- 备忘录编辑器 -->
    <MemoEditor
      v-if="showMemoEditor && editingMemo"
      :memo="editingMemo"
      @close="onMemoEditorClose"
      @saved="onMemoSaved"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, nextTick } from "vue";
import { useRouter } from "vue-router";
import MemoEditor from "../components/MemoEditor.vue";
import { buildApiUrl } from "../config/index.js";

const router = useRouter();

// 响应式数据
const currentRoomId = ref(null);
const roomInput = ref("");
const recentRooms = ref([]);
const memos = ref([]);
const stats = ref({
  totalMemos: 0,
  taskListCount: 0,
  completedTasks: 0,
  totalTasks: 0,
  completionRate: 0,
});

const searchQuery = ref("");
const viewMode = ref("all");
const showAddMemoModal = ref(false);
const showAddTaskModal = ref(false);
const showMemoEditor = ref(false);
const editingMemo = ref(null);

// 新建备忘录数据
const newMemo = reactive({
  title: "",
  content: "",
  contentType: "markdown",
  tagsInput: "",
  priority: 0,
});

// 新建任务清单数据
const newTaskList = reactive({
  title: "",
  description: "",
});

// 计算属性
const filteredMemos = computed(() => {
  let filtered = memos.value;

  // 按类型筛选
  if (viewMode.value === "memo") {
    filtered = filtered.filter((memo) => !memo.is_task_list);
  } else if (viewMode.value === "task") {
    filtered = filtered.filter((memo) => memo.is_task_list);
  }

  // 按搜索查询筛选
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(
      (memo) =>
        memo.title.toLowerCase().includes(query) ||
        memo.content.toLowerCase().includes(query) ||
        (memo.tags &&
          memo.tags.some((tag) => tag.toLowerCase().includes(query)))
    );
  }

  return filtered;
});

// 方法
const initializeRoom = async () => {
  const savedRoomId = localStorage.getItem("currentMemoRoomId");
  if (savedRoomId) {
    currentRoomId.value = savedRoomId;
    await loadData();
  }
  await loadRecentRooms();
};

const loadRecentRooms = async () => {
  try {
    const response = await fetch(buildApiUrl("/api/memo/rooms"));
    const result = await response.json();
    if (result.success) {
      recentRooms.value = result.data.slice(0, 5);
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
    const response = await fetch(buildApiUrl(`/api/memo/room/${roomId}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomName: `备忘录房间${roomId}` }),
    });

    const result = await response.json();
    if (result.success) {
      currentRoomId.value = roomId;
      localStorage.setItem("currentMemoRoomId", roomId);
      roomInput.value = "";
      await loadData();
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
  localStorage.removeItem("currentMemoRoomId");
  loadRecentRooms();
};

const loadData = async () => {
  if (!currentRoomId.value) return;

  try {
    // 加载备忘录
    const memosResponse = await fetch(
      buildApiUrl(`/api/memo/items/${currentRoomId.value}`)
    );
    const memosResult = await memosResponse.json();
    if (memosResult.success) {
      memos.value = memosResult.data;
    }

    // 加载统计
    const statsResponse = await fetch(
      buildApiUrl(`/api/memo/stats/${currentRoomId.value}`)
    );
    const statsResult = await statsResponse.json();
    if (statsResult.success) {
      stats.value = statsResult.data;
    }
  } catch (error) {
    console.error("加载数据失败:", error);
  }
};

const createMemo = async () => {
  if (!newMemo.title.trim()) {
    alert("请输入备忘录标题");
    return;
  }

  try {
    const tags = newMemo.tagsInput
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag);

    const response = await fetch(buildApiUrl("/api/memo/items"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uuid: Date.now() + Math.random().toString(36).substr(2, 9),
        roomId: currentRoomId.value,
        title: newMemo.title,
        content: newMemo.content,
        contentType: newMemo.contentType,
        isTaskList: false,
        tags,
        priority: newMemo.priority,
      }),
    });

    const result = await response.json();
    if (result.success) {
      await loadData();
      showAddMemoModal.value = false;
      resetNewMemo();
      alert("备忘录创建成功");
    } else {
      alert("创建失败: " + result.message);
    }
  } catch (error) {
    console.error("创建备忘录失败:", error);
    alert("创建失败，请检查网络连接");
  }
};

const createTaskList = async () => {
  if (!newTaskList.title.trim()) {
    alert("请输入任务清单标题");
    return;
  }

  try {
    const response = await fetch(buildApiUrl("/api/memo/items"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        uuid: Date.now() + Math.random().toString(36).substr(2, 9),
        roomId: currentRoomId.value,
        title: newTaskList.title,
        content: newTaskList.description,
        contentType: "markdown",
        isTaskList: true,
        tags: [],
        priority: 0,
      }),
    });

    const result = await response.json();
    if (result.success) {
      await loadData();
      showAddTaskModal.value = false;
      resetNewTaskList();
      alert("任务清单创建成功");
    } else {
      alert("创建失败: " + result.message);
    }
  } catch (error) {
    console.error("创建任务清单失败:", error);
    alert("创建失败，请检查网络连接");
  }
};

const editMemo = (memo) => {
  editingMemo.value = memo;
  showMemoEditor.value = true;
};

const togglePin = async (memo) => {
  try {
    const response = await fetch(buildApiUrl(`/api/memo/item/${memo.uuid}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...memo,
        isPinned: !memo.is_pinned,
      }),
    });

    const result = await response.json();
    if (result.success) {
      await loadData();
    } else {
      alert("操作失败: " + result.message);
    }
  } catch (error) {
    console.error("切换置顶失败:", error);
    alert("操作失败，请检查网络连接");
  }
};

const deleteMemo = async (memo) => {
  if (!confirm(`确定要删除备忘录"${memo.title}"吗？`)) {
    return;
  }

  try {
    const response = await fetch(buildApiUrl(`/api/memo/item/${memo.uuid}`), {
      method: "DELETE",
    });

    const result = await response.json();
    if (result.success) {
      await loadData();
      alert("删除成功");
    } else {
      alert("删除失败: " + result.message);
    }
  } catch (error) {
    console.error("删除备忘录失败:", error);
    alert("删除失败，请检查网络连接");
  }
};

const toggleTaskInPreview = async (task, memo) => {
  try {
    const response = await fetch(buildApiUrl("/api/memo/task"), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: task.id,
        isCompleted: !task.is_completed,
      }),
    });

    const result = await response.json();
    if (result.success) {
      // 更新本地任务状态
      task.is_completed = !task.is_completed;
      task.completed_at = task.is_completed ? new Date().toISOString() : null;

      // 重新加载数据以更新统计信息
      await loadData();
    } else {
      alert("操作失败: " + result.message);
    }
  } catch (error) {
    console.error("切换任务状态失败:", error);
    alert("操作失败，请检查网络连接");
  }
};

const renderMarkdown = (content) => {
  // 简单的Markdown渲染（生产环境建议使用marked库）
  return content
    .replace(/### (.*)/g, "<h3>$1</h3>")
    .replace(/## (.*)/g, "<h2>$1</h2>")
    .replace(/# (.*)/g, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/\n/g, "<br>");
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return "刚刚";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`;

  return date.toLocaleDateString();
};

const goBack = () => {
  if (window.history.length > 1) {
    router.go(-1);
  } else {
    router.push("/");
  }
};

const resetNewMemo = () => {
  newMemo.title = "";
  newMemo.content = "";
  newMemo.contentType = "markdown";
  newMemo.tagsInput = "";
  newMemo.priority = 0;
};

const resetNewTaskList = () => {
  newTaskList.title = "";
  newTaskList.description = "";
};

const onMemoEditorClose = () => {
  showMemoEditor.value = false;
  editingMemo.value = null;
};

const onMemoSaved = (updatedMemo) => {
  // 更新本地数据
  const index = memos.value.findIndex((m) => m.uuid === updatedMemo.uuid);
  if (index > -1) {
    memos.value[index] = updatedMemo;
  }
  // 重新加载数据以确保同步
  loadData();
};

// 生命周期
onMounted(() => {
  initializeRoom();
});
</script>

<script>
export default {
  components: {
    MemoEditor,
  },
};
</script>

<style scoped>
/* 基础样式 */
.memo-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  padding: 20px;
}

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
  background: white;
  border-radius: 12px;
  padding: 30px;
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

/* 主界面样式 */
.memo-header {
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
  border: 1px solid #ddd;
  border-radius: 8px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.back-btn:hover {
  border-color: #667eea;
  color: #667eea;
  transform: translateX(-2px);
}

.memo-header h1 {
  margin: 0;
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(45deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 操作栏 */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  gap: 20px;
}

.room-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

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

.add-buttons {
  display: flex;
  gap: 10px;
  flex-shrink: 0;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.btn-add:hover {
  background: #5a67d8;
  transform: translateY(-1px);
}

.view-controls {
  display: flex;
  gap: 5px;
  flex-shrink: 0;
}

.view-btn {
  padding: 8px 16px;
  background: white;
  border: 1px solid #ddd;
  border-radius: 6px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.view-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.view-btn.active {
  background: #667eea;
  border-color: #667eea;
  color: white;
}

/* 搜索和控制栏 */
.search-control-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.search-box {
  position: relative;
  flex: 1;
  min-width: 200px;
}

.search-box i {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 16px;
}

.search-input {
  width: 100%;
  padding: 12px 16px 12px 48px;
  border: 2px solid #e1e5e9;
  border-radius: 25px;
  font-size: 16px;
  background: white;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

/* 统计栏 */
.stats-bar {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #666;
  font-size: 14px;
}

.stat-item i {
  color: #667eea;
  font-size: 16px;
}

/* 备忘录列表 */
.memo-list {
  display: grid;
  gap: 20px;
}

.memo-item {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
  border-left: 4px solid transparent;
}

.memo-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.memo-item.pinned {
  border-left-color: #ffa726;
  background: linear-gradient(to right, #fff8e1, white);
}

.memo-header-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 15px;
}

.memo-title-section {
  flex: 1;
}

.memo-title {
  margin: 0 0 8px 0;
  color: #2d3748;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.pin-icon {
  color: #ffa726;
}

.memo-type-icon {
  color: #667eea;
}

.memo-meta {
  display: flex;
  align-items: center;
  gap: 15px;
}

.memo-date {
  color: #999;
  font-size: 12px;
}

.memo-tags {
  display: flex;
  gap: 5px;
}

.tag {
  padding: 2px 8px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  font-size: 11px;
}

.memo-actions {
  display: flex;
  gap: 5px;
}

.action-btn {
  padding: 6px;
  background: none;
  border: none;
  border-radius: 4px;
  color: #999;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f5f5f5;
  color: #667eea;
}

.action-btn.danger:hover {
  color: #e53e3e;
}

.pin-active {
  color: #ffa726 !important;
}

.pin-inactive {
  color: #999 !important;
  opacity: 0.6;
}

.pin-inactive:hover {
  color: #ffa726 !important;
  opacity: 1;
}

/* 内容预览 */
.memo-content-preview {
  color: #666;
  line-height: 1.6;
}

.markdown-preview {
  margin-bottom: 10px;
}

.content-more {
  color: #999;
  font-style: italic;
}

/* 任务清单预览 */
.task-list-preview {
  margin-top: 10px;
}

.task-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.task-item-preview {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.task-item-preview:hover {
  background-color: #f8f9fa;
}

.task-item-preview.completed .task-content {
  text-decoration: line-through;
  color: #999;
}

.task-checkbox-btn {
  background: none;
  border: none;
  padding: 4px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.task-checkbox-btn:hover {
  background-color: #e3f2fd;
  transform: scale(1.1);
}

.task-checkbox-btn.completed:hover {
  background-color: #e8f5e8;
}

.task-checkbox {
  color: #667eea;
  font-size: 16px;
  transition: color 0.2s;
}

.task-checkbox-btn.completed .task-checkbox {
  color: #4caf50;
}

.task-content {
  flex: 1;
  color: #333;
  cursor: pointer;
  padding: 4px 0;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.task-content:hover {
  background-color: #f0f0f0;
  padding-left: 8px;
}

.task-completed-time {
  color: #4caf50;
  font-size: 12px;
  opacity: 0.8;
}

.task-more {
  color: #999;
  font-size: 12px;
  font-style: italic;
  margin-top: 5px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.view-all-btn {
  background: none;
  border: 1px solid #ddd;
  color: #667eea;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.view-all-btn:hover {
  background-color: #667eea;
  color: white;
}

.empty-task-list {
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: #999;
  font-style: italic;
  padding: 20px 0;
}

.add-task-btn {
  background: none;
  border: 1px dashed #ddd;
  color: #667eea;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.add-task-btn:hover {
  background-color: #667eea;
  color: white;
  border-style: solid;
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: 20px;
  color: #ddd;
}

.empty-state h3 {
  margin: 0 0 10px 0;
  color: #666;
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
  max-height: 90vh;
  overflow-y: auto;
}

.memo-modal {
  max-width: 600px;
  width: 100%;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  color: #999;
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f5f5f5;
  color: #333;
}

.modal-body {
  padding: 30px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px 30px;
  border-top: 1px solid #eee;
}

/* 表单样式 */
.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 12px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.content-type-selector {
  display: flex;
  gap: 10px;
}

.type-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  background: white;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.type-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.type-btn.active {
  border-color: #667eea;
  background: #667eea;
  color: white;
}

/* 按钮样式 */
.btn-primary,
.btn-secondary {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.btn-primary {
  background: #667eea;
  color: white;
}

.btn-primary:hover {
  background: #5a67d8;
}

.btn-secondary {
  background: #f7fafc;
  color: #2d3748;
  border: 1px solid #e2e8f0;
}

.btn-secondary:hover {
  background: #edf2f7;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .memo-header h1 {
    font-size: 2rem;
  }

  .action-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 15px;
  }

  .room-section {
    justify-content: center;
  }

  .search-control-bar {
    flex-direction: column;
    gap: 15px;
  }

  .add-buttons,
  .view-controls {
    justify-content: center;
  }

  .stats-bar {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }

  .memo-header-item {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
  }

  .memo-actions {
    justify-content: flex-end;
  }

  .memo-modal {
    max-width: 95vw;
  }
}
</style>
