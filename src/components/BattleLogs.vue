<template>
  <div class="battle-logs-container">
    <div class="battle-logs-title">
      战斗日志
      <button class="close-logs-btn" @click="isVisible = false" v-if="isVisible">×</button>
      <button class="expand-logs-btn" @click="isVisible = true" v-else>+</button>
    </div>
    <div class="battle-logs-content" v-if="isVisible">
      <div class="logs-list" ref="logsContainer">
        <div 
          v-for="(log, index) in gameStore.battleLogHistory" 
          :key="index" 
          :class="['log-entry', log.type]"
        >
          {{ log.text }}
        </div>
        <div v-if="gameStore.battleLogHistory.length === 0" class="empty-logs">
          暂无战斗日志
        </div>
      </div>
      
      <!-- 控制按钮区域 -->
      <div class="battle-logs-controls">
        <button class="clear-log-btn" @click="clearLogs">清空日志</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useGameStore } from '@/store/gameStore';

const gameStore = useGameStore();
const isVisible = ref(true);
const logsContainer = ref<HTMLElement | null>(null);

// 清空日志
function clearLogs() {
  gameStore.battleLogHistory = [];
}

// 滚动到底部
function scrollToBottom() {
  setTimeout(() => {
    if (logsContainer.value) {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight;
    }
  }, 10);
}

// 组件挂载时初始化
onMounted(() => {
  // 监听日志变化，自动滚动到底部
  const observer = new MutationObserver(scrollToBottom);
  
  if (logsContainer.value) {
    observer.observe(logsContainer.value, {
      childList: true,
      subtree: true
    });
  }
  
  // 初始滚动到底部
  scrollToBottom();
});
</script>

<style scoped>
.battle-logs-container {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 350px;
  background-color: rgba(0, 0, 0, 0.8);
  border-radius: 5px;
  overflow: hidden;
  z-index: 1000;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.battle-logs-title {
  padding: 8px 12px;
  background-color: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.close-logs-btn, .expand-logs-btn {
  background: none;
  border: none;
  color: #fff;
  font-size: 18px;
  cursor: pointer;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.close-logs-btn:hover, .expand-logs-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.battle-logs-content {
  display: flex;
  flex-direction: column;
  max-height: 400px;
}

.logs-list {
  max-height: 350px;
  overflow-y: auto;
  padding: 8px;
  font-size: 13px;
  color: #fff;
  scrollbar-width: thin;
  scrollbar-color: #666 #333;
}

.logs-list::-webkit-scrollbar {
  width: 6px;
}

.logs-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.logs-list::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.log-entry {
  padding: 6px 10px;
  margin: 4px 0;
  border-radius: 4px;
  line-height: 1.4;
  animation: fadeIn 0.3s ease-in;
}

.empty-logs {
  text-align: center;
  padding: 20px;
  color: rgba(255, 255, 255, 0.5);
  font-style: italic;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.log-entry.info {
  background-color: rgba(0, 100, 255, 0.15);
  border-left: 3px solid rgba(0, 100, 255, 0.5);
}

.log-entry.damage {
  background-color: rgba(255, 50, 50, 0.15);
  border-left: 3px solid rgba(255, 50, 50, 0.5);
  font-weight: bold;
}

.log-entry.heal {
  background-color: rgba(50, 255, 50, 0.15);
  border-left: 3px solid rgba(50, 255, 50, 0.5);
}

.log-entry.special {
  background-color: rgba(255, 255, 50, 0.15);
  border-left: 3px solid rgba(255, 255, 50, 0.5);
  font-weight: bold;
}

.battle-logs-controls {
  display: flex;
  justify-content: center;
  padding: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.battle-logs-controls button {
  padding: 4px 10px;
  margin: 0 5px;
  background-color: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;
}

.battle-logs-controls button:hover {
  background-color: rgba(0, 0, 0, 0.5);
}

.clear-log-btn {
  background-color: rgba(255, 50, 50, 0.3) !important;
}

.clear-log-btn:hover {
  background-color: rgba(255, 50, 50, 0.5) !important;
}
</style> 