// 简单的文本比对工具函数
export function simpleDiff(text1, text2) {
  const lines1 = text1.split('\n')
  const lines2 = text2.split('\n')
  const result = []
  
  let i = 0, j = 0
  
  while (i < lines1.length || j < lines2.length) {
    if (i < lines1.length && j < lines2.length && lines1[i] === lines2[j]) {
      result.push({ type: 'unchanged', value: lines1[i] })
      i++
      j++
    } else if (j < lines2.length && (i >= lines1.length || lines1[i] !== lines2[j])) {
      result.push({ type: 'added', value: lines2[j] })
      j++
    } else if (i < lines1.length && (j >= lines2.length || lines1[i] !== lines2[j])) {
      result.push({ type: 'removed', value: lines1[i] })
      i++
    }
  }
  
  return result
}

// 字符级别的简单比对 - 修复版本
export function simpleCharDiff(text1, text2) {
  const result = []
  const len1 = text1.length
  const len2 = text2.length
  let i = 0, j = 0
  
  while (i < len1 || j < len2) {
    // 找到下一个相同字符的位置
    let matchFound = false
    let matchLength = 0
    
    // 在当前位置寻找匹配
    if (i < len1 && j < len2 && text1[i] === text2[j]) {
      matchFound = true
      matchLength = 1
      
      // 继续寻找连续的匹配
      while (i + matchLength < len1 && j + matchLength < len2 && 
             text1[i + matchLength] === text2[j + matchLength]) {
        matchLength++
      }
    }
    
    if (matchFound) {
      // 添加匹配的部分
      result.push({ 
        type: 'unchanged', 
        value: text1.substring(i, i + matchLength) 
      })
      i += matchLength
      j += matchLength
    } else {
      // 没有匹配，需要处理差异
      let added = ''
      let removed = ''
      
      // 向前查找可能的匹配
      let foundMatch = false
      let searchRange = Math.min(10, Math.max(len1 - i, len2 - j)) // 限制搜索范围
      
      for (let offset = 1; offset <= searchRange; offset++) {
        // 检查跳过text1中的一个字符后是否有匹配
        if (i + offset < len1 && j < len2 && text1[i + offset] === text2[j]) {
          removed = text1.substring(i, i + offset)
          result.push({ type: 'removed', value: removed })
          i += offset
          foundMatch = true
          break
        }
        
        // 检查跳过text2中的一个字符后是否有匹配
        if (i < len1 && j + offset < len2 && text1[i] === text2[j + offset]) {
          added = text2.substring(j, j + offset)
          result.push({ type: 'added', value: added })
          j += offset
          foundMatch = true
          break
        }
      }
      
      // 如果没有找到匹配，则标记为删除和添加
      if (!foundMatch) {
        if (i < len1) {
          removed = text1[i]
          result.push({ type: 'removed', value: removed })
          i++
        }
        if (j < len2) {
          added = text2[j]
          result.push({ type: 'added', value: added })
          j++
        }
      }
    }
  }
  
  return result
}

// 更简单的字符级比对算法
export function simpleCharDiffV2(text1, text2) {
  const result = []
  const len1 = text1.length
  const len2 = text2.length
  let i = 0, j = 0
  
  while (i < len1 || j < len2) {
    if (i < len1 && j < len2 && text1[i] === text2[j]) {
      // 找到相同字符，收集连续的相同字符
      let unchanged = ''
      while (i < len1 && j < len2 && text1[i] === text2[j]) {
        unchanged += text1[i]
        i++
        j++
      }
      result.push({ type: 'unchanged', value: unchanged })
    } else {
      // 处理差异
      if (i < len1) {
        result.push({ type: 'removed', value: text1[i] })
        i++
      }
      if (j < len2) {
        result.push({ type: 'added', value: text2[j] })
        j++
      }
    }
  }
  
  return result
}

// 优化的字符级比对算法 - 更好的差异检测
export function optimizedCharDiff(text1, text2) {
  const result = []
  const len1 = text1.length
  const len2 = text2.length
  let i = 0, j = 0
  
  while (i < len1 || j < len2) {
    // 寻找最长公共子序列
    let maxMatch = 0
    let bestI = i
    let bestJ = j
    
    // 在当前位置附近寻找匹配
    const searchRange = Math.min(20, Math.max(len1 - i, len2 - j))
    
    for (let offset1 = 0; offset1 <= searchRange && i + offset1 < len1; offset1++) {
      for (let offset2 = 0; offset2 <= searchRange && j + offset2 < len2; offset2++) {
        let matchLength = 0
        while (i + offset1 + matchLength < len1 && 
               j + offset2 + matchLength < len2 && 
               text1[i + offset1 + matchLength] === text2[j + offset2 + matchLength]) {
          matchLength++
        }
        
        if (matchLength > maxMatch) {
          maxMatch = matchLength
          bestI = i + offset1
          bestJ = j + offset2
        }
      }
    }
    
    if (maxMatch > 0) {
      // 添加删除的部分
      if (bestI > i) {
        result.push({ 
          type: 'removed', 
          value: text1.substring(i, bestI) 
        })
      }
      
      // 添加新增的部分
      if (bestJ > j) {
        result.push({ 
          type: 'added', 
          value: text2.substring(j, bestJ) 
        })
      }
      
      // 添加匹配的部分
      result.push({ 
        type: 'unchanged', 
        value: text1.substring(bestI, bestI + maxMatch) 
      })
      
      i = bestI + maxMatch
      j = bestJ + maxMatch
    } else {
      // 没有找到匹配，逐字符处理
      if (i < len1) {
        result.push({ type: 'removed', value: text1[i] })
        i++
      }
      if (j < len2) {
        result.push({ type: 'added', value: text2[j] })
        j++
      }
    }
  }
  
  return result
} 