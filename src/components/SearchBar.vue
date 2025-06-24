<template>
  <div class="search-section">
    <div class="search-wrapper">
      <div class="search-engine-selector">
        <button
          :class="{ active: searchEngine === 'google' }"
          @click="setSearchEngine('google')"
          title="使用 Google 搜索"
        >
          <img src="/google-icon.svg" alt="Google" class="engine-icon" />
        </button>
        <button
          :class="{ active: searchEngine === 'baidu' }"
          @click="setSearchEngine('baidu')"
          title="使用百度搜索"
        >
          <img src="/baidu-icon.svg" alt="Baidu" class="engine-icon" />
        </button>
      </div>
      <form class="search-bar" @submit.prevent="performSearch">
        <div class="input-container">
          <input
            ref="searchInput"
            type="text"
            v-model.trim="query"
            placeholder="搜索内容或输入网址..."
            class="search-input"
            @input="onInputChange"
            @focus="handleFocus"
            @blur="handleBlur"
            @keydown="handleKeydown"
            autocomplete="off"
          />

          <!-- 建议下拉框 -->
          <div
            v-if="
              showSuggestions &&
              query.trim() &&
              (filteredSuggestions.length || query.trim())
            "
            class="suggestions-dropdown"
          >
            <div v-if="filteredSuggestions.length" class="suggestions-header">
              <div class="suggestion-types">
                <span v-if="searchSuggestions.length" class="suggestion-type">
                  <i class="fas fa-search"></i> 搜索建议
                </span>
                <span v-if="historySuggestions.length" class="suggestion-type">
                  <i class="fas fa-history"></i> 历史记录
                </span>
                <span v-if="bookmarkSuggestions.length" class="suggestion-type">
                  <i class="fas fa-bookmark"></i> 书签
                </span>
              </div>
            </div>
            <div
              v-if="!filteredSuggestions.length && query.trim()"
              class="no-suggestions"
            >
              <i class="fas fa-search suggestion-icon"></i>
              <span>按回车搜索 "{{ query }}"</span>
            </div>
            <div
              v-for="(suggestion, index) in filteredSuggestions"
              :key="index"
              :class="[
                'suggestion-item',
                { active: selectedSuggestionIndex === index },
              ]"
              @click="selectSuggestion(suggestion)"
            >
              <i
                :class="getSuggestionIcon(suggestion.type)"
                class="suggestion-icon"
              ></i>
              <div class="suggestion-content">
                <div class="suggestion-title">{{ suggestion.title }}</div>
                <div v-if="suggestion.url" class="suggestion-url">
                  {{ suggestion.url }}
                </div>
              </div>
              <div
                v-if="suggestion.type === 'history'"
                class="suggestion-actions"
              >
                <button
                  @click.stop="removeFromHistory(suggestion)"
                  class="remove-btn"
                  title="从历史记录中删除"
                >
                  <i class="fas fa-times"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
        <button
          type="submit"
          :class="['search-button', { focused: isSearchFocused }]"
          title="搜索"
        >
          <i class="fas fa-search"></i>
        </button>
      </form>

      <!-- 书签管理按钮 -->
      <div class="bookmark-controls">
        <button
          @click="showBookmarkModal = true"
          class="bookmark-btn"
          title="书签管理"
        >
          <i class="fas fa-bookmark"></i>
        </button>
      </div>
    </div>

    <!-- 书签管理模态框 -->
    <div
      v-if="showBookmarkModal"
      class="modal-overlay"
      @click="showBookmarkModal = false"
    >
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>书签管理</h3>
          <button @click="showBookmarkModal = false" class="close-btn">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="modal-body">
          <!-- 书签导入 -->
          <div class="bookmark-section">
            <h4>导入书签</h4>
            <div class="import-controls">
              <input
                ref="fileInput"
                type="file"
                accept=".html"
                @change="handleFileImport"
                style="display: none"
              />
              <button @click="$refs.fileInput.click()" class="btn-primary">
                <i class="fas fa-upload"></i>
                导入HTML文件
              </button>
              <span class="import-help"
                >支持Chrome、Firefox等浏览器导出的书签文件</span
              >
            </div>
          </div>

          <!-- 书签操作 -->
          <div class="bookmark-section">
            <h4>操作</h4>
            <div class="operation-controls">
              <button @click="exportBookmarks" class="btn-secondary">
                <i class="fas fa-download"></i>
                导出书签
              </button>
              <button @click="clearBookmarks" class="btn-danger">
                <i class="fas fa-trash"></i>
                清空书签
              </button>
              <button @click="mergeBookmarks" class="btn-success">
                <i class="fas fa-merge"></i>
                合并重复项
              </button>
            </div>
          </div>

          <!-- 文件夹操作 -->
          <div class="bookmark-section">
            <h4>文件夹操作</h4>
            <div class="folder-controls">
              <button @click="expandAllFolders" class="btn-outline">
                <i class="fas fa-expand-arrows-alt"></i>
                全部展开
              </button>
              <button @click="collapseAllFolders" class="btn-outline">
                <i class="fas fa-compress-arrows-alt"></i>
                全部折叠
              </button>
            </div>
          </div>

          <!-- 书签列表 -->
          <div class="bookmark-section">
            <h4>已保存的书签 ({{ bookmarks.length }})</h4>
            <div class="bookmark-list">
              <!-- 按文件夹分组显示 -->
              <div
                v-for="(folderData, folderName) in groupedBookmarks"
                :key="folderName"
                class="folder-group"
              >
                <div class="folder-header" @click="toggleFolder(folderName)">
                  <i
                    :class="[
                      'fas',
                      folderExpanded[folderName]
                        ? 'fa-folder-open'
                        : 'fa-folder',
                    ]"
                  ></i>
                  <span class="folder-name">{{ folderName || "未分类" }}</span>
                  <span class="folder-count">({{ folderData.length }})</span>
                  <i
                    :class="[
                      'fas',
                      'folder-toggle',
                      folderExpanded[folderName]
                        ? 'fa-chevron-down'
                        : 'fa-chevron-right',
                    ]"
                  ></i>
                </div>
                <div v-show="folderExpanded[folderName]" class="folder-content">
                  <div
                    v-for="bookmark in folderData"
                    :key="bookmark.id"
                    class="bookmark-item"
                  >
                    <div class="bookmark-info">
                      <div class="bookmark-title">{{ bookmark.title }}</div>
                      <div class="bookmark-url">{{ bookmark.url }}</div>
                    </div>
                    <div class="bookmark-actions">
                      <button
                        @click="openBookmark(bookmark)"
                        class="action-btn"
                        title="打开"
                      >
                        <i class="fas fa-external-link-alt"></i>
                      </button>
                      <button
                        @click="removeBookmark(bookmark)"
                        class="action-btn remove"
                        title="删除"
                      >
                        <i class="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from "vue";

const query = ref("");
const searchEngine = ref("google");
const showSuggestions = ref(false);
const selectedSuggestionIndex = ref(-1);
const showBookmarkModal = ref(false);
const searchInput = ref(null);
const isSearchFocused = ref(false);

// 数据存储
const searchHistory = ref([]);
const bookmarks = ref([]);

// 建议相关状态
const searchSuggestions = ref([]);
const historySuggestions = ref([]);
const bookmarkSuggestions = ref([]);

// 文件夹展开状态
const folderExpanded = ref({});

// 初始化
onMounted(async () => {
  loadSearchHistory();
  loadBookmarks();

  // 自动聚焦搜索框
  await nextTick();
  if (searchInput.value) {
    searchInput.value.focus();
  }

  // 如果没有历史记录，添加一些示例数据
  if (searchHistory.value.length === 0) {
    const sampleHistory = [
      {
        id: 1,
        query: "Vue.js 教程",
        url: "https://cn.vuejs.org/",
        timestamp: Date.now() - 86400000,
      },
      {
        id: 2,
        query: "JavaScript",
        url: "https://developer.mozilla.org/zh-CN/docs/Web/JavaScript",
        timestamp: Date.now() - 172800000,
      },
    ];
    searchHistory.value = sampleHistory;
    localStorage.setItem("searchHistory", JSON.stringify(searchHistory.value));
  }

  // 如果没有书签，添加一些示例数据
  if (bookmarks.value.length === 0) {
    const sampleBookmarks = [
      {
        id: 1,
        title: "Vue.js 官网",
        url: "https://cn.vuejs.org/",
        folder: "开发工具",
        addDate: Date.now(),
      },
      {
        id: 2,
        title: "GitHub",
        url: "https://github.com",
        folder: "开发工具",
        addDate: Date.now(),
      },
      {
        id: 3,
        title: "MDN Web Docs",
        url: "https://developer.mozilla.org/",
        folder: "文档",
        addDate: Date.now(),
      },
      {
        id: 4,
        title: "百度",
        url: "https://www.baidu.com",
        folder: "", // 未分类书签
        addDate: Date.now(),
      },
      {
        id: 5,
        title: "Google",
        url: "https://www.google.com",
        folder: "", // 未分类书签
        addDate: Date.now(),
      },
    ];
    bookmarks.value = sampleBookmarks;
    localStorage.setItem("bookmarks", JSON.stringify(bookmarks.value));
  }

  // 初始化建议
  updateSuggestions();

  // 添加全局键盘快捷键监听
  document.addEventListener("keydown", handleGlobalKeydown);
});

onUnmounted(() => {
  // 移除全局键盘事件监听器
  document.removeEventListener("keydown", handleGlobalKeydown);
});

// 计算属性
const filteredSuggestions = computed(() => {
  const all = [
    ...searchSuggestions.value,
    ...historySuggestions.value,
    ...bookmarkSuggestions.value,
  ];
  return all.slice(0, 8); // 限制显示数量
});

const displayBookmarks = computed(() => {
  return bookmarks.value.slice(0, 50); // 限制显示数量
});

// 按文件夹分组的书签
const groupedBookmarks = computed(() => {
  const groups = {};

  bookmarks.value.forEach((bookmark) => {
    const folderName = bookmark.folder || "";
    if (!groups[folderName]) {
      groups[folderName] = [];
    }
    groups[folderName].push(bookmark);
  });

  // 按文件夹名称排序，未分类放在最后
  const sortedGroups = {};
  const sortedKeys = Object.keys(groups).sort((a, b) => {
    if (a === "") return 1; // 未分类放最后
    if (b === "") return -1;
    return a.localeCompare(b);
  });

  sortedKeys.forEach((key) => {
    sortedGroups[key] = groups[key];
    // 初始化文件夹展开状态
    if (!(key in folderExpanded.value)) {
      folderExpanded.value[key] = true; // 默认展开
    }
  });

  // 调试信息
  console.log("分组结果:", sortedGroups);
  console.log("文件夹列表:", sortedKeys);
  console.log("未分类书签数量:", groups[""] ? groups[""].length : 0);

  // 额外调试：显示每个分组的详细信息
  Object.keys(groups).forEach((folderName) => {
    const displayName = folderName === "" ? "未分类" : folderName;
    console.log(`📁 ${displayName}: ${groups[folderName].length} 个书签`);
    if (folderName === "") {
      console.log(
        "未分类书签详情:",
        groups[folderName].map((b) => b.title)
      );
    }
  });

  return sortedGroups;
});

// 搜索引擎设置
const setSearchEngine = (engine) => {
  searchEngine.value = engine;
  localStorage.setItem("searchEngine", engine);
};

// URL验证
const isValidUrl = (string) => {
  const urlPattern =
    /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/i;
  const domainPattern = /^[\da-z\.-]+\.[a-z\.]{2,6}$/i;

  if (string.startsWith("http://") || string.startsWith("https://")) {
    return urlPattern.test(string);
  }
  return domainPattern.test(string);
};

// 输入变化处理
const onInputChange = () => {
  updateSuggestions();
  // 根据输入内容控制建议显示
  if (query.value.trim()) {
    showSuggestions.value = true;
  } else {
    showSuggestions.value = false;
  }
};

// 更新建议
const updateSuggestions = () => {
  const searchTerm = query.value.toLowerCase().trim();

  if (!searchTerm) {
    // 没有输入时清空所有建议
    historySuggestions.value = [];
    bookmarkSuggestions.value = [];
    searchSuggestions.value = [];
    return;
  }

  // 有输入时进行过滤
  // 历史记录建议
  historySuggestions.value = searchHistory.value
    .filter(
      (item) =>
        item.query.toLowerCase().includes(searchTerm) ||
        (item.url && item.url.toLowerCase().includes(searchTerm))
    )
    .slice(0, 3)
    .map((item) => ({
      type: "history",
      title: item.query,
      url: item.url,
      data: item,
    }));

  // 书签建议
  bookmarkSuggestions.value = bookmarks.value
    .filter(
      (bookmark) =>
        bookmark.title.toLowerCase().includes(searchTerm) ||
        bookmark.url.toLowerCase().includes(searchTerm)
    )
    .slice(0, 3)
    .map((bookmark) => ({
      type: "bookmark",
      title: bookmark.title,
      url: bookmark.url,
      data: bookmark,
    }));

  // 搜索建议
  if (searchTerm.length > 0) {
    searchSuggestions.value = [
      {
        type: "search",
        title: `搜索 "${query.value}"`,
        url: null,
        data: { query: query.value },
      },
    ];
  } else {
    searchSuggestions.value = [];
  }
};

// 获取建议图标
const getSuggestionIcon = (type) => {
  switch (type) {
    case "history":
      return "fas fa-history";
    case "bookmark":
      return "fas fa-bookmark";
    case "search":
      return "fas fa-search";
    default:
      return "fas fa-globe";
  }
};

// 全局键盘快捷键处理
const handleGlobalKeydown = (e) => {
  // Ctrl+F 或 Cmd+F 聚焦搜索框
  if ((e.ctrlKey || e.metaKey) && e.key === "f") {
    e.preventDefault();
    if (searchInput.value) {
      searchInput.value.focus();
      searchInput.value.select(); // 选中所有文本
    }
    return;
  }

  // ESC 清空搜索并失去焦点
  if (e.key === "Escape" && document.activeElement === searchInput.value) {
    query.value = "";
    showSuggestions.value = false;
    searchInput.value.blur();
    return;
  }
};

// 键盘导航
const handleKeydown = (e) => {
  if (!showSuggestions.value || !filteredSuggestions.value.length) return;

  switch (e.key) {
    case "ArrowDown":
      e.preventDefault();
      e.stopPropagation();
      selectedSuggestionIndex.value = Math.min(
        selectedSuggestionIndex.value + 1,
        filteredSuggestions.value.length - 1
      );
      scrollToSelectedSuggestion();
      break;
    case "ArrowUp":
      e.preventDefault();
      e.stopPropagation();
      selectedSuggestionIndex.value = Math.max(
        selectedSuggestionIndex.value - 1,
        -1
      );
      scrollToSelectedSuggestion();
      break;
    case "Enter":
      if (selectedSuggestionIndex.value >= 0) {
        e.preventDefault();
        e.stopPropagation();
        selectSuggestion(
          filteredSuggestions.value[selectedSuggestionIndex.value]
        );
      }
      break;
    case "Escape":
      e.preventDefault();
      e.stopPropagation();
      showSuggestions.value = false;
      selectedSuggestionIndex.value = -1;
      searchInput.value.blur();
      break;
  }
};

// 滚动到选中的建议项
const scrollToSelectedSuggestion = () => {
  nextTick(() => {
    if (selectedSuggestionIndex.value >= 0) {
      const suggestionsList = document.querySelector(".suggestions-dropdown");
      const selectedItem = document.querySelector(".suggestion-item.active");

      if (suggestionsList && selectedItem) {
        // 计算相对位置，手动控制滚动，避免影响页面
        const containerTop = suggestionsList.scrollTop;
        const containerHeight = suggestionsList.clientHeight;
        const itemTop = selectedItem.offsetTop;
        const itemHeight = selectedItem.offsetHeight;

        // 检查是否需要滚动
        if (itemTop < containerTop) {
          // 选中项在可视区域上方，滚动到顶部
          suggestionsList.scrollTo({
            top: itemTop,
            behavior: "smooth",
          });
        } else if (itemTop + itemHeight > containerTop + containerHeight) {
          // 选中项在可视区域下方，滚动到底部
          suggestionsList.scrollTo({
            top: itemTop + itemHeight - containerHeight,
            behavior: "smooth",
          });
        }
      }
    }
  });
};

// 选择建议
const selectSuggestion = (suggestion) => {
  if (suggestion.type === "bookmark") {
    openUrl(suggestion.url);
  } else if (suggestion.type === "history") {
    if (suggestion.url) {
      openUrl(suggestion.url);
    } else {
      query.value = suggestion.title;
      performSearch();
    }
  } else {
    query.value = suggestion.title.replace('搜索 "', "").replace('"', "");
    performSearch();
  }
  closeSuggestions();
};

// 获得焦点处理
const handleFocus = () => {
  isSearchFocused.value = true;
  // 只有在有内容时才显示建议
  if (query.value.trim()) {
    showSuggestions.value = true;
  }
};

// 失去焦点处理
const handleBlur = () => {
  isSearchFocused.value = false;
  setTimeout(() => {
    showSuggestions.value = false;
    selectedSuggestionIndex.value = -1;
  }, 150);
};

// 关闭建议
const closeSuggestions = () => {
  showSuggestions.value = false;
  selectedSuggestionIndex.value = -1;
};

// 执行搜索
const performSearch = () => {
  if (!query.value) return;

  // 检查是否是URL
  if (isValidUrl(query.value)) {
    let url = query.value;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    openUrl(url);
    return;
  }

  // 执行搜索
  const urls = {
    google: `https://www.google.com/search?q=${encodeURIComponent(
      query.value
    )}`,
    baidu: `https://www.baidu.com/s?wd=${encodeURIComponent(query.value)}`,
  };

  const searchUrl = urls[searchEngine.value];
  openUrl(searchUrl);

  // 保存到历史记录
  saveToHistory({ query: query.value, url: searchUrl });
  closeSuggestions();
};

// 打开URL
const openUrl = (url) => {
  window.open(url, "_blank", "noopener,noreferrer");
  saveToHistory({ query: query.value || url, url });
};

// 保存搜索历史
const saveToHistory = (item) => {
  const historyItem = {
    ...item,
    timestamp: Date.now(),
    id: Date.now() + Math.random(),
  };

  // 去重
  const existingIndex = searchHistory.value.findIndex(
    (h) => h.query === item.query && h.url === item.url
  );

  if (existingIndex >= 0) {
    searchHistory.value.splice(existingIndex, 1);
  }

  searchHistory.value.unshift(historyItem);

  // 限制历史记录数量
  if (searchHistory.value.length > 100) {
    searchHistory.value = searchHistory.value.slice(0, 100);
  }

  localStorage.setItem("searchHistory", JSON.stringify(searchHistory.value));
};

// 从历史记录中删除
const removeFromHistory = (suggestion) => {
  const index = searchHistory.value.findIndex(
    (h) => h.id === suggestion.data.id
  );
  if (index >= 0) {
    searchHistory.value.splice(index, 1);
    localStorage.setItem("searchHistory", JSON.stringify(searchHistory.value));
    updateSuggestions();
  }
};

// 加载搜索历史
const loadSearchHistory = () => {
  try {
    const saved = localStorage.getItem("searchHistory");
    if (saved) {
      searchHistory.value = JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load search history:", e);
  }

  // 加载搜索引擎设置
  const savedEngine = localStorage.getItem("searchEngine");
  if (savedEngine) {
    searchEngine.value = savedEngine;
  }
};

// 书签相关功能
const loadBookmarks = () => {
  try {
    const saved = localStorage.getItem("bookmarks");
    if (saved) {
      bookmarks.value = JSON.parse(saved);
    }
  } catch (e) {
    console.error("Failed to load bookmarks:", e);
  }
};

const saveBookmarks = () => {
  localStorage.setItem("bookmarks", JSON.stringify(bookmarks.value));
};

// 处理文件导入
const handleFileImport = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      parseBookmarksHTML(e.target.result);
    } catch (err) {
      alert("书签文件解析失败，请确保文件格式正确");
      console.error("Bookmark import error:", err);
    }
  };
  reader.readAsText(file);
};

// 解析书签HTML
const parseBookmarksHTML = (html) => {
  const newBookmarks = [];
  let folderStack = []; // 用于处理嵌套文件夹
  let currentFolder = ""; // 当前所在文件夹

  console.log("开始解析书签文件...");

  // 使用更可靠的逐行解析方法
  const lines = html.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // 检测文件夹开始（H3 标签）
    const folderMatch = line.match(/<H3[^>]*>(.*?)<\/H3>/i);
    if (folderMatch) {
      const folderName = folderMatch[1].trim();

      // 跳过顶级的"书签栏"文件夹，将其内容视为根目录
      if (
        folderName === "书签栏" ||
        folderName === "Bookmarks Bar" ||
        folderName === "Bookmarks"
      ) {
        console.log(`跳过顶级文件夹: "${folderName}"`);
        folderStack.push("ROOT"); // 标记为根目录
        continue;
      }

      // 保存当前文件夹到堆栈
      folderStack.push(currentFolder);
      currentFolder = folderName;
      console.log(
        `进入文件夹: "${currentFolder}" (堆栈深度: ${folderStack.length})`
      );
      continue;
    }

    // 检测文件夹结束（</DL> 标签）
    if (line.includes("</DL>")) {
      // 退出当前文件夹
      if (folderStack.length > 0) {
        const previousFolder = folderStack.pop();
        if (previousFolder === "ROOT") {
          currentFolder = "";
          console.log(`退出根目录，当前文件夹: "未分类"`);
        } else {
          currentFolder = previousFolder;
          console.log(`退出文件夹，返回到: "${currentFolder || "未分类"}"`);
        }
      } else {
        currentFolder = "";
        console.log(`退出到根目录（未分类）`);
      }
      continue;
    }

    // 检测书签（A 标签）
    const linkMatch = line.match(/<A\s+HREF="([^"]+)"[^>]*>(.*?)<\/A>/i);
    if (linkMatch) {
      const url = linkMatch[1];
      const title = linkMatch[2].trim();

      // 提取 ADD_DATE 属性
      const addDateMatch = line.match(/ADD_DATE="(\d+)"/i);
      const addDate = addDateMatch
        ? parseInt(addDateMatch[1]) * 1000
        : Date.now();

      const bookmark = {
        id: Date.now() + Math.random(),
        title: title || url,
        url: url,
        folder: currentFolder, // 这里 currentFolder 可能是空字符串，这是正常的
        addDate: addDate,
      };

      newBookmarks.push(bookmark);
      console.log(
        `添加书签: "${title}" -> "${
          currentFolder || "未分类"
        }" (当前文件夹状态: "${currentFolder}", 堆栈深度: ${
          folderStack.length
        })`
      );

      // 额外调试信息
      if (currentFolder === "") {
        console.log(`⚠️ 发现未分类书签: ${title}`);
      }
    }
  }

  // 如果上面的方法没有找到书签，尝试DOM解析作为备用
  if (newBookmarks.length === 0) {
    console.log("逐行解析失败，尝试DOM解析...");
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      const links = doc.querySelectorAll("A[href]");

      for (const link of links) {
        if (link.href && link.href.startsWith("http")) {
          // 查找前面的 H3 作为文件夹名
          let folder = "";
          let parent = link.parentElement;

          while (parent && parent !== doc.body) {
            const h3 = parent.querySelector("H3");
            if (h3) {
              folder = h3.textContent.trim();
              break;
            }
            parent = parent.parentElement;
          }

          const bookmark = {
            id: Date.now() + Math.random(),
            title: link.textContent.trim() || link.href,
            url: link.href,
            folder: folder,
            addDate: link.getAttribute("ADD_DATE")
              ? parseInt(link.getAttribute("ADD_DATE")) * 1000
              : Date.now(),
          };
          newBookmarks.push(bookmark);
        }
      }
    } catch (error) {
      console.error("DOM解析也失败:", error);
    }
  }

  if (newBookmarks.length === 0) {
    alert("未找到有效的书签数据");
    return [];
  }

  // 打印调试信息
  console.log(`解析到 ${newBookmarks.length} 个书签`);
  console.log(
    "书签详情:",
    newBookmarks.slice(0, 5).map((b) => ({ title: b.title, folder: b.folder }))
  );

  // 合并到现有书签
  const existingUrls = new Set(bookmarks.value.map((b) => b.url));
  const uniqueBookmarks = newBookmarks.filter((b) => !existingUrls.has(b.url));

  bookmarks.value.push(...uniqueBookmarks);
  saveBookmarks();

  alert(
    `成功导入 ${uniqueBookmarks.length} 个书签（共找到 ${newBookmarks.length} 个书签，包含文件夹结构）`
  );

  return newBookmarks;
};

// 导出书签
const exportBookmarks = () => {
  if (bookmarks.value.length === 0) {
    alert("没有书签可导出");
    return;
  }

  let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`;

  // 按文件夹分组
  const folders = {};
  const noFolder = [];

  bookmarks.value.forEach((bookmark) => {
    if (bookmark.folder && bookmark.folder.trim()) {
      if (!folders[bookmark.folder]) {
        folders[bookmark.folder] = [];
      }
      folders[bookmark.folder].push(bookmark);
    } else {
      noFolder.push(bookmark);
    }
  });

  // 生成HTML - 按文件夹名排序
  const sortedFolders = Object.keys(folders).sort();
  sortedFolders.forEach((folderName) => {
    html += `    <DT><H3 ADD_DATE="${Math.floor(
      Date.now() / 1000
    )}" LAST_MODIFIED="${Math.floor(Date.now() / 1000)}">${folderName}</H3>\n`;
    html += `    <DD><DL><p>\n`;
    folders[folderName].forEach((bookmark) => {
      const addDate = bookmark.addDate
        ? Math.floor(bookmark.addDate / 1000)
        : Math.floor(Date.now() / 1000);
      html += `        <DT><A HREF="${bookmark.url}" ADD_DATE="${addDate}">${bookmark.title}</A>\n`;
    });
    html += `    </DL><p>\n`;
  });

  // 无文件夹的书签
  if (noFolder.length > 0) {
    noFolder.forEach((bookmark) => {
      const addDate = bookmark.addDate
        ? Math.floor(bookmark.addDate / 1000)
        : Math.floor(Date.now() / 1000);
      html += `    <DT><A HREF="${bookmark.url}" ADD_DATE="${addDate}">${bookmark.title}</A>\n`;
    });
  }

  html += "</DL><p>";

  // 下载文件
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bookmarks_${new Date().toISOString().split("T")[0]}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  alert(
    `成功导出 ${bookmarks.value.length} 个书签，包含 ${sortedFolders.length} 个文件夹`
  );
};

// 清空书签
const clearBookmarks = () => {
  if (confirm("确定要清空所有书签吗？此操作不可恢复。")) {
    bookmarks.value = [];
    saveBookmarks();
  }
};

// 合并重复书签
const mergeBookmarks = () => {
  const seen = new Set();
  const unique = [];

  bookmarks.value.forEach((bookmark) => {
    if (!seen.has(bookmark.url)) {
      seen.add(bookmark.url);
      unique.push(bookmark);
    }
  });

  const removedCount = bookmarks.value.length - unique.length;
  bookmarks.value = unique;
  saveBookmarks();

  alert(`已删除 ${removedCount} 个重复书签`);
};

// 打开书签
const openBookmark = (bookmark) => {
  openUrl(bookmark.url);
  showBookmarkModal.value = false;
};

// 删除书签
const removeBookmark = (bookmark) => {
  const index = bookmarks.value.findIndex((b) => b.id === bookmark.id);
  if (index >= 0) {
    bookmarks.value.splice(index, 1);
    saveBookmarks();
  }
};

// 切换文件夹展开状态
const toggleFolder = (folderName) => {
  folderExpanded.value[folderName] = !folderExpanded.value[folderName];
};

// 展开所有文件夹
const expandAllFolders = () => {
  Object.keys(groupedBookmarks.value).forEach((folderName) => {
    folderExpanded.value[folderName] = true;
  });
};

// 折叠所有文件夹
const collapseAllFolders = () => {
  Object.keys(groupedBookmarks.value).forEach((folderName) => {
    folderExpanded.value[folderName] = false;
  });
};
</script>

<style scoped>
.search-section {
  padding: 4rem 1rem 2rem;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
}

.search-wrapper {
  display: flex;
  align-items: center;
  background-color: white;
  border-radius: 50px;
  padding: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  position: relative;
}

.search-engine-selector {
  display: flex;
  padding-right: 12px;
  border-right: 1px solid #e2e8f0;
}

.search-engine-selector button {
  background: none;
  border: none;
  cursor: pointer;
  padding: 10px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.search-engine-selector button:hover {
  background-color: #f8f9fa;
}

.search-engine-selector button.active {
  background-color: #e9ecef;
}

.engine-icon {
  width: 22px;
  height: 22px;
}

.search-bar {
  flex: 1;
  display: flex;
  align-items: center;
}

.input-container {
  flex: 1;
  position: relative;
}

.search-input {
  width: 100%;
  border: none;
  outline: none;
  padding: 0 20px;
  font-size: 16px;
  background-color: transparent;
  color: #333;
  transition: all 0.2s ease;
}

.search-input:focus {
  background-color: rgba(102, 126, 234, 0.05);
}

.search-input::placeholder {
  color: #aaa;
}

.search-button {
  background: #667eea;
  color: white;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s ease;
}

.search-button:hover {
  background: #5a67d8;
}

.search-button.focused {
  background: #5a67d8;
  transform: scale(1.05);
}

.bookmark-controls {
  padding-left: 12px;
}

.bookmark-btn {
  background: #f09317;
  border: none;
  cursor: pointer;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  color: white;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(240, 147, 23, 0.3);
  transition: all 0.3s ease;
}

.bookmark-btn:hover {
  background: #e6840f;
  color: white;
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(240, 147, 23, 0.4);
}

/* 建议下拉框 */
.suggestions-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  border: 1px solid #e2e8f0;
  z-index: 1000;
  max-height: 400px;
  overflow-y: auto;
  margin-top: 8px;
}

.suggestions-header {
  padding: 12px 16px 8px;
  font-size: 12px;
  color: #666;
  font-weight: 500;
  border-bottom: 1px solid #f1f5f9;
}

.suggestion-types {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.suggestion-type {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #667eea;
}

.no-suggestions {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: #718096;
  font-size: 14px;
}

.suggestion-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f8fafc;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: background-color 0.2s;
}

.suggestion-item:last-child {
  border-bottom: none;
}

.suggestion-item:hover,
.suggestion-item.active {
  background-color: #f8fafc;
}

.suggestion-icon {
  color: #667eea;
  width: 16px;
  flex-shrink: 0;
}

.suggestion-content {
  flex: 1;
  min-width: 0;
}

.suggestion-title {
  font-weight: 500;
  color: #1a202c;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggestion-url {
  font-size: 12px;
  color: #718096;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.suggestion-actions {
  display: flex;
  gap: 4px;
}

.remove-btn {
  background: none;
  border: none;
  color: #e53e3e;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  opacity: 0.7;
  transition: all 0.2s;
}

.remove-btn:hover {
  opacity: 1;
  background-color: #fed7d7;
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
  max-width: 800px;
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
  font-size: 20px;
  color: #1a202c;
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

.bookmark-section {
  margin-bottom: 32px;
}

.bookmark-section h4 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #2d3748;
}

.import-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.import-help {
  font-size: 12px;
  color: #718096;
}

.operation-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.folder-controls {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.btn-outline {
  padding: 8px 16px;
  border: 2px solid #667eea;
  background: transparent;
  color: #667eea;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.btn-outline:hover {
  background: #667eea;
  color: white;
  transform: translateY(-1px);
}

.btn-primary,
.btn-secondary,
.btn-danger,
.btn-success {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
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

.btn-danger {
  background: #e53e3e;
  color: white;
}

.btn-danger:hover {
  background: #c53030;
}

.btn-success {
  background: #38a169;
  color: white;
}

.btn-success:hover {
  background: #2f855a;
}

.bookmark-list {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.folder-group {
  border-bottom: 1px solid #f1f5f9;
}

.folder-group:last-child {
  border-bottom: none;
}

.folder-header {
  padding: 12px 16px;
  background: #f8fafc;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background-color 0.2s;
  border-bottom: 1px solid #e2e8f0;
}

.folder-header:hover {
  background: #f1f5f9;
}

.folder-name {
  font-weight: 500;
  color: #2d3748;
  flex: 1;
}

.folder-count {
  font-size: 12px;
  color: #718096;
}

.folder-toggle {
  font-size: 10px;
  color: #a0aec0;
  transition: transform 0.2s;
}

.folder-content {
  background: white;
}

.bookmark-item {
  padding: 12px 16px;
  border-bottom: 1px solid #f8fafc;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-left: 20px;
  position: relative;
}

.bookmark-item:last-child {
  border-bottom: none;
}

.bookmark-item:before {
  content: "";
  position: absolute;
  left: -12px;
  top: 50%;
  width: 8px;
  height: 1px;
  background: #e2e8f0;
}

.bookmark-info {
  flex: 1;
  min-width: 0;
}

.bookmark-title {
  font-weight: 500;
  color: #1a202c;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bookmark-url {
  font-size: 12px;
  color: #667eea;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.bookmark-folder {
  font-size: 11px;
  color: #718096;
  background: #f7fafc;
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
}

.bookmark-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 6px;
  border-radius: 4px;
  color: #718096;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f7fafc;
  color: #2d3748;
}

.action-btn.remove:hover {
  background: #fed7d7;
  color: #e53e3e;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .search-section {
    max-width: 95%;
    padding: 3rem 0.5rem 1.5rem;
  }

  .search-wrapper {
    padding: 10px;
    flex-direction: column;
    gap: 10px;
  }

  .search-engine-selector,
  .bookmark-controls {
    border: none;
    padding: 0;
  }

  .search-bar {
    width: 100%;
  }

  .search-input {
    padding: 0 16px;
    font-size: 15px;
  }

  .modal-content {
    margin: 10px;
    max-height: calc(100vh - 20px);
  }

  .modal-body {
    padding: 16px;
  }

  .operation-controls,
  .import-controls {
    flex-direction: column;
    align-items: stretch;
  }

  .bookmark-item {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    margin-left: 10px;
  }

  .bookmark-item:before {
    width: 4px;
    left: -8px;
  }

  .bookmark-actions {
    justify-content: flex-end;
  }

  .folder-header {
    padding: 10px 12px;
  }

  .folder-name {
    font-size: 14px;
  }
}
</style>
