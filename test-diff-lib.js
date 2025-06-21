// 测试diff库
const diff = require('diff');

console.log('diff库加载成功');
console.log('可用的方法:', Object.keys(diff));

// 测试文本比对
const text1 = 'Hello World\nThis is a test';
const text2 = 'Hello Universe\nThis is a test';

console.log('\n原始文本:', text1);
console.log('对比文本:', text2);

try {
  const result = diff.diffLines(text1, text2, { newlineIsToken: true });
  console.log('\n比对结果:');
  result.forEach((part, index) => {
    console.log(`${index}: ${part.added ? 'ADDED' : part.removed ? 'REMOVED' : 'UNCHANGED'} - "${part.value}"`);
  });
} catch (error) {
  console.error('比对失败:', error);
} 