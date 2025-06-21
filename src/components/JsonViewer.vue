<template>
  <div class="json-viewer">
    <JsonNode :node="data" :level="0" />
  </div>
</template>

<script setup>
import JsonNode from './JsonNode.vue';

defineProps({
  data: {
    type: [Object, Array, String, Number, Boolean, null],
    required: true,
  },
});
</script>

<style scoped>
.json-viewer {
  font-family: 'SF Mono', 'Courier New', Courier, monospace;
  font-size: 14px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 4px;
  color: #333;
  text-align: left;
  overflow-x: auto;
}
</style> 