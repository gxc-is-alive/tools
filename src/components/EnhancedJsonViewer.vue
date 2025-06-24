<template>
  <div class="enhanced-json-viewer">
    <EnhancedJsonNode :node="data" :level="0" ref="rootNode" />
  </div>
</template>

<script setup>
import { ref } from "vue";
import EnhancedJsonNode from "./EnhancedJsonNode.vue";

defineProps({
  data: {
    type: [Object, Array, String, Number, Boolean, null],
    required: true,
  },
});

const rootNode = ref(null);

const expandAll = () => {
  if (rootNode.value) {
    rootNode.value.expandAll();
  }
};

const collapseAll = () => {
  if (rootNode.value) {
    rootNode.value.collapseAll();
  }
};

defineExpose({
  expandAll,
  collapseAll,
});
</script>

<style scoped>
.enhanced-json-viewer {
  font-family: "SF Mono", "Courier New", Courier, monospace;
  font-size: 14px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  color: #333;
  text-align: left;
  overflow-x: auto;
}
</style>
