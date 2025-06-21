<template>
  <div class="json-node">
    <div 
      class="toggler-line" 
      :class="{ 'is-object-or-array': isObjectOrArray }"
      @click="toggle"
    >
      <div class="indent-guide" :style="{ 'margin-left': level * 20 + 'px' }"></div>
      
      <span v-if="isObjectOrArray" class="toggler">
        <i :class="['fas', isOpen ? 'fa-chevron-down' : 'fa-chevron-right']"></i>
      </span>
      
      <span class="key" v-if="nodeKey">"{{ nodeKey }}"</span>
      <span class="colon" v-if="nodeKey">:</span>
      
      <span v-if="isObjectOrArray">
        {{ Array.isArray(node) ? '[' : '{' }}
        <span v-if="!isOpen" class="collapsed-preview">
          ... {{ Object.keys(node).length }} items ...
        </span>
      </span>

      <span v-else :class="valueClass(node)">{{ JSON.stringify(node) }}</span>
    </div>

    <div v-if="isObjectOrArray && isOpen" class="children">
      <JsonNode 
        v-for="(value, key) in node" 
        :key="key"
        :node="value" 
        :level="level + 1"
        :node-key="key"
      />
    </div>

    <div v-if="isObjectOrArray && isOpen" class="closing-bracket" :style="{ 'margin-left': level * 20 + 'px' }">
      {{ Array.isArray(node) ? ']' : '}' }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

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
    default: null
  }
});

const isOpen = ref(props.level < 2); // 默认展开前两层

const isObjectOrArray = computed(() => {
  return typeof props.node === 'object' && props.node !== null;
});

const toggle = () => {
  if (isObjectOrArray.value) {
    isOpen.value = !isOpen.value;
  }
};

const valueClass = (value) => {
  const type = typeof value;
  if (type === 'string') return 'string';
  if (type === 'number') return 'number';
  if (type === 'boolean') return 'boolean';
  if (value === null) return 'null';
  return '';
};
</script>

<style scoped>
.json-node {
  position: relative;
  font-family: 'SF Mono', 'Courier New', Courier, monospace;
}

.toggler-line {
  display: flex;
  align-items: center;
  position: relative;
}

.is-object-or-array {
  cursor: pointer;
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
}
.toggler .fas {
  font-size: 10px;
}
.toggler:hover {
  color: #000;
}
.is-object-or-array:not(.is-open) .toggler {
  transform: rotate(-90deg);
}

.key {
  color: #9b2323; /* key color */
  font-weight: bold;
}
.colon {
  margin: 0 5px;
}
.collapsed-preview {
  color: #999;
  font-style: italic;
  margin-left: 10px;
}

.children {
  position: relative;
  padding-left: 20px;
  border-left: 1px dotted #ccc;
}

.closing-bracket {
  padding-left: 20px;
}

.string {
  color: #0d820d; /* 绿色 for strings */
}
.number {
  color: #2a00ff; /* 蓝色 for numbers */
}
.boolean {
  color: #a31515; /* 深红色 for booleans */
}
.null {
  color: #999;
  font-weight: bold;
}
</style> 