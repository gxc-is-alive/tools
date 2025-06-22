<template>
  <div class="search-section">
    <div class="search-wrapper">
      <div class="search-engine-selector">
        <button 
          :class="{ active: searchEngine === 'google' }" 
          @click="setSearchEngine('google')"
          title="使用 Google 搜索"
        >
          <img src="/google-icon.svg" alt="Google" class="engine-icon">
        </button>
        <button 
          :class="{ active: searchEngine === 'baidu' }" 
          @click="setSearchEngine('baidu')"
          title="使用百度搜索"
        >
          <img src="/baidu-icon.svg" alt="Baidu" class="engine-icon">
        </button>
      </div>
      <form class="search-bar" @submit.prevent="performSearch">
        <input 
          type="text" 
          v-model.trim="query" 
          placeholder="探索网络..." 
          class="search-input"
          autofocus
        >
        <button type="submit" class="search-button" title="搜索">
          <i class="fas fa-search"></i>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const query = ref('');
const searchEngine = ref('google'); // Default search engine

const setSearchEngine = (engine) => {
  searchEngine.value = engine;
};

const performSearch = () => {
  if (!query.value) return;

  const urls = {
    google: `https://www.google.com/search?q=${encodeURIComponent(query.value)}`,
    baidu: `https://www.baidu.com/s?wd=${encodeURIComponent(query.value)}`,
  };

  window.open(urls[searchEngine.value], '_blank', 'noopener,noreferrer');
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
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  border: 1px solid #e2e8f0;
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

.search-input {
  flex: 1;
  border: none;
  outline: none;
  padding: 0 20px;
  font-size: 16px;
  background-color: transparent;
  color: #333;
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

/* 响应式设计 */
@media (max-width: 768px) {
  .search-section {
    max-width: 95%;
    padding: 3rem 0.5rem 1.5rem;
  }
  
  .search-wrapper {
    padding: 10px;
  }
  
  .search-engine-selector {
    padding-right: 10px;
  }
  
  .search-engine-selector button {
    padding: 8px;
  }
  
  .engine-icon {
    width: 20px;
    height: 20px;
  }
  
  .search-input {
    padding: 0 16px;
    font-size: 15px;
  }
  
  .search-button {
    width: 44px;
    height: 44px;
  }
}
</style> 