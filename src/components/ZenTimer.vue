<template>
  <div class="zen-timer-widget" :class="{ 'is-open': isOpen }">
    <div class="timer-toggle" @click="togglePanel" title="禅模式">
      <i class="fas fa-stopwatch"></i>
    </div>

    <div class="timer-panel">
      <div class="panel-header">
        <h3>禅模式</h3>
        <button class="close-btn" @click="togglePanel">&times;</button>
      </div>
      <div class="panel-body">
        <div class="timer-main-content">
          <div class="timer-display" @click="editTime" v-if="!isEditing">
            <span>{{ formattedTime }}</span>
          </div>
          <input
            v-else
            ref="timeInput"
            type="number"
            class="time-input"
            v-model="inputMinutes"
            @blur="finishEditing"
            @keyup.enter="finishEditing"
          />
        </div>

        <div class="timer-actions">
          <div class="preset-buttons" v-if="!isRunning && !isPaused">
            <button @click="setTimer(20)">20m</button>
            <button @click="setTimer(25)">25m</button>
            <button @click="setTimer(30)">30m</button>
            <button @click="setTimer(45)">45m</button>
            <button @click="setTimer(60)">60m</button>
          </div>
          <div class="controls">
            <button v-if="!isRunning" @click="startTimer" :disabled="timeLeft === 0" class="start-btn">
              <i class="fas fa-play"></i>
            </button>
            <button v-if="isRunning && !isPaused" @click="pauseTimer" class="pause-btn">
              <i class="fas fa-pause"></i>
            </button>
            <button v-if="isPaused" @click="resumeTimer" class="resume-btn">
              <i class="fas fa-play"></i>
            </button>
            <button @click="resetTimer" :disabled="timeLeft === initialTime" class="reset-btn">
              <i class="fas fa-undo"></i>
            </button>
          </div>
        </div>
      </div>
      <audio ref="notificationSound" src="/notification.mp3" preload="auto"></audio>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted, nextTick } from 'vue';

const isOpen = ref(false);
const initialTime = ref(25 * 60);
const timeLeft = ref(initialTime.value);
const isRunning = ref(false);
const isPaused = ref(false);
const isEditing = ref(false);
const inputMinutes = ref(25);
const timeInput = ref(null);
const timerId = ref(null);
const notificationSound = ref(null);
const originalTitle = document.title;

const togglePanel = () => {
  isOpen.value = !isOpen.value;
};

const formattedTime = computed(() => {
  const minutes = Math.floor(timeLeft.value / 60);
  const seconds = timeLeft.value % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
});

const editTime = async () => {
  if (isRunning.value) return;
  isEditing.value = true;
  await nextTick();
  timeInput.value?.focus();
};

const finishEditing = () => {
  isEditing.value = false;
  const newMinutes = parseInt(inputMinutes.value, 10);
  if (!isNaN(newMinutes) && newMinutes > 0) {
    setTimer(newMinutes);
  } else {
    inputMinutes.value = Math.floor(initialTime.value / 60); // Reset input if invalid
  }
};

const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    alert('此浏览器不支持桌面通知');
    return;
  }
  if (Notification.permission !== 'granted') {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      alert('您拒绝了通知权限，时间结束后将无法收到桌面提醒。');
    }
  }
};

const setTimer = (minutes) => {
  if (isRunning.value) return;
  inputMinutes.value = minutes;
  initialTime.value = minutes * 60;
  timeLeft.value = initialTime.value;
};

const startTimer = () => {
  requestNotificationPermission();
  isRunning.value = true;
  isPaused.value = false;
  
  timerId.value = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--;
      document.title = `${formattedTime.value} - 专注中...`;
    } else {
      finishTimer();
    }
  }, 1000);
};

const pauseTimer = () => {
  clearInterval(timerId.value);
  isPaused.value = true;
  document.title = `(已暂停) ${originalTitle}`;
};

const resumeTimer = () => {
  isPaused.value = false;
  startTimer(); // Re-uses the start logic
};

const resetTimer = () => {
  clearInterval(timerId.value);
  isRunning.value = false;
  isPaused.value = false;
  timeLeft.value = initialTime.value;
  document.title = originalTitle;
};

const finishTimer = () => {
  clearInterval(timerId.value);
  isRunning.value = false;
  document.title = `时间到！ - ${originalTitle}`;

  // 桌面通知
  new Notification('时间到！', {
    body: '专注时间已结束，休息一下吧！',
    icon: '/favicon.ico' 
  });

  // 播放声音
  notificationSound.value?.play();

  // 恢复默认时间
  setTimeout(() => {
      resetTimer();
  }, 3000);
};

onUnmounted(() => {
  clearInterval(timerId.value);
  document.title = originalTitle; // 组件卸载时恢复标题
});
</script>

<style scoped>
.zen-timer-widget {
  position: fixed;
  bottom: 170px; /* Position above the other widgets */
  right: 30px;
  z-index: 998;
  /* border: 5px solid red; --- Removing DEBUGGING BORDER --- */
}

.timer-toggle {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #f39c12, #e67e22);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  transition: all 0.3s ease;
}

.timer-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(0,0,0,0.3);
}

.timer-panel {
  position: absolute;
  bottom: 70px;
  right: 0;
  width: 320px;
  background-color: white;
  border-radius: 15px;
  box-shadow: 0 5px 25px rgba(0,0,0,0.2);
  transform: translateY(20px) scale(0.95);
  opacity: 0;
  visibility: hidden;
  transition: all 0.3s ease;
  transform-origin: bottom right;
}

.zen-timer-widget.is-open .timer-panel {
  transform: translateY(0) scale(1);
  opacity: 1;
  visibility: visible;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #f0f0f0;
  background-color: #f8f9fa;
  border-radius: 15px 15px 0 0;
}

.panel-header h3 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #aaa;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #e9ecef;
  color: #333;
}

.panel-body {
  padding: 25px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 25px;
}

.timer-main-content {
  text-align: center;
}

.timer-display, .time-input {
  font-family: 'Roboto Mono', monospace;
  font-size: 56px;
  font-weight: 500;
  color: #333;
  cursor: pointer;
}

.time-input { 
  width: 160px; 
  border: none;
  outline: none;
  background: transparent;
  text-align: center;
  border-bottom: 2px solid #ddd;
  transition: border-color 0.3s ease;
}
.time-input:focus {
  border-color: #e67e22;
}

.timer-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  width: 100%;
}

.preset-buttons, .controls {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 10px;
}

.preset-buttons button {
  padding: 7px 15px;
  border: none;
  background: #f1f3f5;
  border-radius: 16px; /* Pill shape */
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  color: #495057;
  transition: all 0.2s ease;
}

.preset-buttons button:hover {
  background: #e9ecef;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.05);
}

.controls button {
  width: 44px;
  height: 44px;
  font-size: 16px;
  padding: 8px;
  border: 1px solid transparent;
  border-radius: 50%; /* Make them circular */
  display: flex;
  align-items: center;
  justify-content: center;
}

.controls button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #e9ecef !important;
  color: #aaa !important;
  border-color: #e9ecef !important;
}

.start-btn { background: #28a745 !important; color: white; }
.start-btn:hover { background: #218838 !important; }

.pause-btn { background: #ffc107 !important; color: #212529; }
.pause-btn:hover { background: #e0a800 !important; }

.resume-btn { background: #17a2b8 !important; color: white; }
.resume-btn:hover { background: #138496 !important; }

.reset-btn { background: #f1f3f5 !important; color: #555; border: 1px solid #dee2e6 !important;}
.reset-btn:hover { background: #e9ecef !important; }

@media (max-width: 480px) {
  .zen-timer-widget {
    right: 15px;
    bottom: 155px;
  }
  .timer-toggle {
    width: 50px;
    height: 50px;
  }
  .timer-panel {
    width: calc(100vw - 30px);
    right: -15px;
    bottom: 60px;
  }
  .timer-display, .time-input {
    font-size: 48px;
  }
}
</style> 