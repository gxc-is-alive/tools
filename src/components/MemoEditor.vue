<template>
  <div class="memo-editor-overlay" @click="$emit('close')">
    <div class="memo-editor-modal" @click.stop>
      <div class="modal-header">
        <h3>{{ isEditing ? "编辑备忘录" : "查看备忘录" }}</h3>
        <div class="header-actions">
          <button @click="toggleEditMode" class="edit-btn">
            <i :class="isEditing ? 'fas fa-eye' : 'fas fa-edit'"></i>
            {{ isEditing ? "预览" : "编辑" }}
          </button>
          <button @click="$emit('close')" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>

      <div class="modal-body">
        <!-- 编辑模式 -->
        <div v-if="isEditing" class="edit-mode">
          <div class="form-group">
            <label>标题</label>
            <input
              v-model="editData.title"
              type="text"
              class="form-input"
              placeholder="请输入标题"
            />
          </div>

          <div class="form-group">
            <label>内容类型</label>
            <div class="content-type-selector">
              <button
                :class="[
                  'type-btn',
                  { active: editData.contentType === 'markdown' },
                ]"
                @click="editData.contentType = 'markdown'"
              >
                <i class="fab fa-markdown"></i>
                Markdown
              </button>
              <button
                :class="[
                  'type-btn',
                  { active: editData.contentType === 'html' },
                ]"
                @click="editData.contentType = 'html'"
              >
                <i class="fas fa-code"></i>
                富文本
              </button>
            </div>
          </div>

          <div class="form-group">
            <label>内容</label>
            <div class="editor-container">
              <textarea
                v-model="editData.content"
                :placeholder="
                  editData.contentType === 'markdown'
                    ? '支持Markdown语法...'
                    : '支持HTML标签...'
                "
                class="form-textarea editor-textarea"
                rows="15"
              ></textarea>
              <div class="editor-toolbar">
                <button @click="insertMarkdown('**', '**')" title="粗体">
                  <i class="fas fa-bold"></i>
                </button>
                <button @click="insertMarkdown('*', '*')" title="斜体">
                  <i class="fas fa-italic"></i>
                </button>
                <button @click="insertMarkdown('`', '`')" title="代码">
                  <i class="fas fa-code"></i>
                </button>
                <button @click="insertMarkdown('# ', '')" title="标题">
                  <i class="fas fa-heading"></i>
                </button>
                <button @click="insertMarkdown('[', '](url)')" title="链接">
                  <i class="fas fa-link"></i>
                </button>
                <button @click="insertMarkdown('- ', '')" title="列表">
                  <i class="fas fa-list"></i>
                </button>
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>标签 (用逗号分隔)</label>
              <input
                v-model="editData.tagsInput"
                type="text"
                class="form-input"
                placeholder="工作,重要,紧急"
              />
            </div>
            <div class="form-group">
              <label>优先级</label>
              <select v-model="editData.priority" class="form-select">
                <option value="0">普通</option>
                <option value="1">重要</option>
                <option value="2">紧急</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input
                v-model="editData.isPinned"
                type="checkbox"
                class="form-checkbox"
              />
              <span class="checkmark"></span>
              置顶备忘录
            </label>
          </div>
        </div>

        <!-- 预览模式 -->
        <div v-else class="preview-mode">
          <div class="memo-header-preview">
            <h2 class="memo-title-preview">{{ memo.title }}</h2>
            <div class="memo-meta-preview">
              <span class="memo-date">{{ formatDate(memo.updated_at) }}</span>
              <div v-if="memo.tags && memo.tags.length" class="memo-tags">
                <span v-for="tag in memo.tags" :key="tag" class="tag">{{
                  tag
                }}</span>
              </div>
              <span
                v-if="memo.priority > 0"
                class="priority-badge"
                :class="getPriorityClass(memo.priority)"
              >
                {{ getPriorityText(memo.priority) }}
              </span>
            </div>
          </div>

          <div class="memo-content-preview">
            <div
              v-if="memo.content_type === 'markdown'"
              v-html="renderMarkdown(memo.content)"
              class="markdown-content"
            ></div>
            <div v-else v-html="memo.content" class="html-content"></div>
          </div>

          <!-- 任务清单显示 -->
          <div v-if="memo.is_task_list && memo.tasks" class="task-list-section">
            <h4>任务清单</h4>
            <div class="task-items">
              <div
                v-for="task in memo.tasks"
                :key="task.id"
                class="task-item"
                :class="{ completed: task.is_completed }"
              >
                <button
                  @click="toggleTask(task)"
                  class="task-checkbox-btn"
                  :class="{ completed: task.is_completed }"
                >
                  <i
                    :class="
                      task.is_completed
                        ? 'fas fa-check-square'
                        : 'far fa-square'
                    "
                  ></i>
                </button>
                <span class="task-content">{{ task.content }}</span>
                <button @click="deleteTask(task)" class="task-delete-btn">
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>

            <div class="add-task-section">
              <div class="add-task-input">
                <input
                  v-model="newTaskContent"
                  type="text"
                  placeholder="添加新任务..."
                  class="form-input"
                  @keyup.enter="addTask"
                />
                <button @click="addTask" class="btn-add-task">
                  <i class="fas fa-plus"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="btn-secondary">
          {{ isEditing ? "取消" : "关闭" }}
        </button>
        <button v-if="isEditing" @click="saveMemo" class="btn-primary">
          保存
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from "vue";
import { buildApiUrl } from "../config/index.js";

const props = defineProps({
  memo: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["close", "saved"]);

// 响应式数据
const isEditing = ref(false);
const newTaskContent = ref("");

const editData = reactive({
  title: "",
  content: "",
  contentType: "markdown",
  tagsInput: "",
  priority: 0,
  isPinned: false,
});

// 计算属性
const formattedTags = computed(() => {
  return editData.tagsInput
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag);
});

// 方法
const toggleEditMode = () => {
  if (isEditing.value) {
    // 从编辑模式切换到预览模式，重置数据
    initEditData();
  }
  isEditing.value = !isEditing.value;
};

const initEditData = () => {
  editData.title = props.memo.title;
  editData.content = props.memo.content;
  editData.contentType = props.memo.content_type || "markdown";
  editData.tagsInput = props.memo.tags ? props.memo.tags.join(", ") : "";
  editData.priority = props.memo.priority || 0;
  editData.isPinned = props.memo.is_pinned || false;
};

const insertMarkdown = (before, after) => {
  const textarea = document.querySelector(".editor-textarea");
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = editData.content.substring(start, end);

  const replacement = before + selectedText + after;
  editData.content =
    editData.content.substring(0, start) +
    replacement +
    editData.content.substring(end);

  nextTick(() => {
    textarea.focus();
    textarea.setSelectionRange(
      start + before.length,
      start + before.length + selectedText.length
    );
  });
};

const saveMemo = async () => {
  if (!editData.title.trim()) {
    alert("请输入标题");
    return;
  }

  try {
    const response = await fetch(
      buildApiUrl(`/api/memo/item/${props.memo.uuid}`),
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editData.title,
          content: editData.content,
          contentType: editData.contentType,
          tags: formattedTags.value,
          priority: editData.priority,
          isPinned: editData.isPinned,
        }),
      }
    );

    const result = await response.json();
    if (result.success) {
      emit("saved", result.data);
      isEditing.value = false;
      alert("保存成功");
    } else {
      alert("保存失败: " + result.message);
    }
  } catch (error) {
    console.error("保存备忘录失败:", error);
    alert("保存失败，请检查网络连接");
  }
};

const toggleTask = async (task) => {
  try {
    const response = await fetch(buildApiUrl(`/api/memo/task/${task.id}`), {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: task.content,
        isCompleted: !task.is_completed,
        orderIndex: task.order_index,
      }),
    });

    const result = await response.json();
    if (result.success) {
      task.is_completed = !task.is_completed;
    } else {
      alert("操作失败: " + result.message);
    }
  } catch (error) {
    console.error("切换任务状态失败:", error);
    alert("操作失败，请检查网络连接");
  }
};

const addTask = async () => {
  if (!newTaskContent.value.trim()) {
    return;
  }

  try {
    const response = await fetch(buildApiUrl("/api/memo/task"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        memoUuid: props.memo.uuid,
        content: newTaskContent.value,
        orderIndex: props.memo.tasks ? props.memo.tasks.length : 0,
      }),
    });

    const result = await response.json();
    if (result.success) {
      if (!props.memo.tasks) {
        props.memo.tasks = [];
      }
      props.memo.tasks.push(result.data);
      newTaskContent.value = "";
    } else {
      alert("添加失败: " + result.message);
    }
  } catch (error) {
    console.error("添加任务失败:", error);
    alert("添加失败，请检查网络连接");
  }
};

const deleteTask = async (task) => {
  if (!confirm("确定要删除这个任务吗？")) {
    return;
  }

  try {
    const response = await fetch(buildApiUrl(`/api/memo/task/${task.id}`), {
      method: "DELETE",
    });

    const result = await response.json();
    if (result.success) {
      const index = props.memo.tasks.findIndex((t) => t.id === task.id);
      if (index > -1) {
        props.memo.tasks.splice(index, 1);
      }
    } else {
      alert("删除失败: " + result.message);
    }
  } catch (error) {
    console.error("删除任务失败:", error);
    alert("删除失败，请检查网络连接");
  }
};

const renderMarkdown = (content) => {
  // 简单的Markdown渲染
  return content
    .replace(/### (.*)/g, "<h3>$1</h3>")
    .replace(/## (.*)/g, "<h2>$1</h2>")
    .replace(/# (.*)/g, "<h1>$1</h1>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/`(.*?)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>')
    .replace(/^- (.+)/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/s, "<ul>$1</ul>")
    .replace(/\n/g, "<br>");
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString();
};

const getPriorityClass = (priority) => {
  switch (priority) {
    case 1:
      return "priority-important";
    case 2:
      return "priority-urgent";
    default:
      return "";
  }
};

const getPriorityText = (priority) => {
  switch (priority) {
    case 1:
      return "重要";
    case 2:
      return "紧急";
    default:
      return "普通";
  }
};

// 生命周期
onMounted(() => {
  initEditData();
});
</script>

<style scoped>
.memo-editor-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 20px;
}

.memo-editor-modal {
  background: white;
  border-radius: 12px;
  max-width: 900px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid #eee;
  background: #f8f9fa;
}

.modal-header h3 {
  margin: 0;
  color: #333;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.edit-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.edit-btn:hover {
  background: #5a67d8;
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
  flex: 1;
  overflow-y: auto;
  padding: 30px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 20px 30px;
  border-top: 1px solid #eee;
  background: #f8f9fa;
}

/* 编辑模式样式 */
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

.form-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
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

.editor-container {
  position: relative;
}

.editor-textarea {
  resize: vertical;
  min-height: 200px;
  font-family: "Courier New", monospace;
}

.editor-toolbar {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 5px;
  background: rgba(255, 255, 255, 0.9);
  padding: 5px;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.editor-toolbar button {
  padding: 6px;
  background: none;
  border: none;
  border-radius: 4px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
}

.editor-toolbar button:hover {
  background: #f0f0f0;
  color: #333;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.form-checkbox {
  width: 18px;
  height: 18px;
  accent-color: #667eea;
}

/* 预览模式样式 */
.memo-header-preview {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.memo-title-preview {
  margin: 0 0 15px 0;
  color: #2d3748;
  font-size: 28px;
  font-weight: 700;
}

.memo-meta-preview {
  display: flex;
  align-items: center;
  gap: 15px;
  flex-wrap: wrap;
}

.memo-date {
  color: #999;
  font-size: 14px;
}

.memo-tags {
  display: flex;
  gap: 5px;
}

.tag {
  padding: 4px 8px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  font-size: 12px;
}

.priority-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.priority-important {
  background: #fff3cd;
  color: #856404;
}

.priority-urgent {
  background: #f8d7da;
  color: #721c24;
}

.memo-content-preview {
  line-height: 1.8;
  color: #333;
}

.markdown-content,
.html-content {
  font-size: 16px;
}

.markdown-content h1,
.markdown-content h2,
.markdown-content h3 {
  margin: 20px 0 10px 0;
  color: #2d3748;
}

.markdown-content code {
  background: #f1f3f4;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: "Courier New", monospace;
}

.markdown-content ul {
  padding-left: 20px;
}

.markdown-content a {
  color: #667eea;
  text-decoration: none;
}

.markdown-content a:hover {
  text-decoration: underline;
}

/* 任务清单样式 */
.task-list-section {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.task-list-section h4 {
  margin: 0 0 20px 0;
  color: #333;
  font-size: 18px;
}

.task-items {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8f9fa;
  border-radius: 8px;
  transition: all 0.2s;
}

.task-item:hover {
  background: #e9ecef;
}

.task-item.completed {
  opacity: 0.7;
}

.task-checkbox-btn {
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-size: 18px;
  transition: all 0.2s;
}

.task-checkbox-btn:hover {
  color: #5a67d8;
}

.task-checkbox-btn.completed {
  color: #28a745;
}

.task-content {
  flex: 1;
  color: #333;
}

.task-item.completed .task-content {
  text-decoration: line-through;
  color: #999;
}

.task-delete-btn {
  background: none;
  border: none;
  color: #dc3545;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  opacity: 0.7;
  transition: all 0.2s;
}

.task-delete-btn:hover {
  opacity: 1;
  background: #f8d7da;
}

.add-task-section {
  margin-top: 20px;
}

.add-task-input {
  display: flex;
  gap: 10px;
}

.btn-add-task {
  padding: 12px 16px;
  background: #667eea;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add-task:hover {
  background: #5a67d8;
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
  .memo-editor-modal {
    max-width: 95vw;
    max-height: 95vh;
  }

  .modal-header {
    padding: 15px 20px;
  }

  .modal-body {
    padding: 20px;
  }

  .modal-footer {
    padding: 15px 20px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .content-type-selector {
    flex-direction: column;
  }

  .memo-meta-preview {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .add-task-input {
    flex-direction: column;
  }
}
</style>
