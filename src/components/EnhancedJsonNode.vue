<template>
  <div class="enhanced-json-node">
    <div
      class="toggler-line"
      :class="{ 'is-object-or-array': isObjectOrArray }"
    >
      <div
        class="indent-guide"
        :style="{ 'margin-left': level * 20 + 'px' }"
      ></div>

      <span v-if="isObjectOrArray" class="toggler" @click="toggle">
        <i
          :class="['fas', isOpen ? 'fa-chevron-down' : 'fa-chevron-right']"
        ></i>
      </span>

      <span class="key" v-if="nodeKey">"{{ nodeKey }}"</span>
      <span class="colon" v-if="nodeKey">:</span>

      <span v-if="isObjectOrArray" class="object-array-wrapper">
        {{ Array.isArray(node) ? "[" : "{" }}
        <span v-if="!isOpen" class="collapsed-preview">
          ... {{ Object.keys(node).length }} items ...
        </span>
        <button
          v-if="isOpen"
          class="copy-btn"
          @click="copyValue"
          :title="'复制此' + (Array.isArray(node) ? '数组' : '对象')"
        >
          <i class="fas fa-copy"></i>
        </button>
      </span>

      <span v-else class="value-wrapper">
        <span :class="valueClass(node)">{{ formatValue(node) }}</span>
        <button
          class="copy-btn"
          @click="copyValue"
          :title="'复制值: ' + formatValue(node)"
        >
          <i class="fas fa-copy"></i>
        </button>
      </span>
    </div>

    <div v-if="isObjectOrArray && isOpen" class="children">
      <EnhancedJsonNode
        v-for="(value, key) in node"
        :key="key"
        :node="value"
        :level="level + 1"
        :node-key="key"
        ref="childNodes"
      />
    </div>

    <div
      v-if="isObjectOrArray && isOpen"
      class="closing-bracket"
      :style="{ 'margin-left': level * 20 + 'px' }"
    >
      {{ Array.isArray(node) ? "]" : "}" }}
      <button
        class="copy-btn"
        @click="copyValue"
        :title="'复制此' + (Array.isArray(node) ? '数组' : '对象')"
      >
        <i class="fas fa-copy"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  node: {
    type: [Object, Array, String, Number, Boolean, null],
    required: true,
  },
  level: {
    type: Number,
    default: 0,
  },
  nodeKey: {
    type: [String, Number],
    default: null,
  },
});

const isOpen = ref(props.level < 2); // 默认展开前两层
const childNodes = ref([]);

const isObjectOrArray = computed(() => {
  return typeof props.node === "object" && props.node !== null;
});

const toggle = () => {
  if (isObjectOrArray.value) {
    isOpen.value = !isOpen.value;
  }
};

const expandAll = () => {
  if (isObjectOrArray.value) {
    isOpen.value = true;
    // 递归展开所有子节点
    if (childNodes.value) {
      childNodes.value.forEach((child) => {
        if (child && typeof child.expandAll === "function") {
          child.expandAll();
        }
      });
    }
  }
};

const collapseAll = () => {
  if (isObjectOrArray.value) {
    isOpen.value = false;
    // 递归折叠所有子节点
    if (childNodes.value) {
      childNodes.value.forEach((child) => {
        if (child && typeof child.collapseAll === "function") {
          child.collapseAll();
        }
      });
    }
  }
};

const valueClass = (value) => {
  const type = typeof value;
  if (type === "string") return "string";
  if (type === "number") return "number";
  if (type === "boolean") return "boolean";
  if (value === null) return "null";
  return "";
};

const formatValue = (value) => {
  return JSON.stringify(value);
};

const copyValue = async () => {
  try {
    const valueStr = JSON.stringify(props.node, null, 2);
    await navigator.clipboard.writeText(valueStr);

    // 触发全局复制成功提示
    const event = new CustomEvent("json-copied", {
      detail: { message: "已复制到剪贴板" },
    });
    window.dispatchEvent(event);
  } catch (err) {
    console.error("复制失败:", err);
    const event = new CustomEvent("json-copied", {
      detail: { message: "复制失败" },
    });
    window.dispatchEvent(event);
  }
};

defineExpose({
  expandAll,
  collapseAll,
});
</script>

<style scoped>
.enhanced-json-node {
  position: relative;
  font-family: "SF Mono", "Courier New", Courier, monospace;
}

.toggler-line {
  display: flex;
  align-items: center;
  position: relative;
  padding: 2px 0;
}

.toggler-line:hover {
  background-color: rgba(0, 123, 255, 0.05);
}

.indent-guide {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  border-left: 1px dotted #ccc;
}

.toggler {
  display: inline-block;
  width: 20px;
  text-align: center;
  color: #666;
  transition: transform 0.1s ease;
  cursor: pointer;
  user-select: none;
}

.toggler .fas {
  font-size: 10px;
}

.toggler:hover {
  color: #000;
  background-color: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
}

.key {
  color: #9b2323;
  font-weight: bold;
  user-select: text;
}

.colon {
  margin: 0 5px;
}

.collapsed-preview {
  color: #999;
  font-style: italic;
  margin-left: 10px;
}

.object-array-wrapper,
.value-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.copy-btn {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
  font-size: 10px;
  opacity: 0;
  transition: all 0.2s ease;
}

.toggler-line:hover .copy-btn,
.closing-bracket:hover .copy-btn {
  opacity: 1;
}

.copy-btn:hover {
  background-color: rgba(0, 123, 255, 0.1);
  color: #007bff;
}

.copy-btn:active {
  background-color: rgba(0, 123, 255, 0.2);
}

.children {
  position: relative;
  padding-left: 20px;
  border-left: 1px dotted #ccc;
}

.closing-bracket {
  padding-left: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.closing-bracket:hover {
  background-color: rgba(0, 123, 255, 0.05);
}

.string {
  color: #0d820d;
  user-select: text;
}

.number {
  color: #2a00ff;
  user-select: text;
}

.boolean {
  color: #a31515;
  user-select: text;
}

.null {
  color: #999;
  font-weight: bold;
  user-select: text;
}

/* 复制成功动画 */
@keyframes copy-success {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

.copy-btn.copied {
  animation: copy-success 0.3s ease;
  color: #28a745;
}
</style>
