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
          v-for="(log, index) in battleLogs" 
          :key="index" 
          :class="['log-entry', log.type]"
        >
          {{ log.text }}
        </div>
        <div v-if="battleLogs.length === 0" class="empty-logs">
          暂无战斗日志
        </div>
      </div>
      
      <!-- 测试按钮区域 -->
      <div class="battle-logs-controls">
        <button class="test-log-btn" @click="addTestLog">测试日志</button>
        <button class="clear-log-btn" @click="clearLogs">清空日志</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useGameStore, BattleLogMessage } from '@/store/gameStore';

interface BattleLog {
  text: string;
  type: 'info' | 'damage' | 'heal' | 'special';
}

const gameStore = useGameStore();
const battleLogs = ref<BattleLog[]>([]);
const isVisible = ref(true);
const logsContainer = ref<HTMLElement | null>(null);

// 添加日志
function addLog(text: string, type: BattleLog['type'] = 'info') {
  battleLogs.value.push({ text, type });
  // 限制日志数量
  if (battleLogs.value.length > 100) {
    battleLogs.value.shift();
  }
  // 滚动到底部
  scrollToBottom();
}

// 添加测试日志
function addTestLog() {
  addLog(`测试战斗日志 - ${new Date().toLocaleTimeString()}`, 'info');
  addLog('小恶魔 对 骷髅兵 造成了 2 点伤害', 'damage');
  addLog('骷髅兵 对 小恶魔 造成了 1 点伤害', 'damage');
  addLog('恶魔战士 恢复了 3 点生命值', 'heal');
  addLog('骷髅兵 被击败了!', 'special');
}

// 清空日志
function clearLogs() {
  battleLogs.value = [];
}

// 滚动到底部
function scrollToBottom() {
  setTimeout(() => {
    if (logsContainer.value) {
      logsContainer.value.scrollTop = logsContainer.value.scrollHeight;
    }
  }, 10);
}

// 监听gameStore中的战斗日志更新
watch(() => gameStore.battleLog, (newLog: BattleLogMessage | null) => {
  if (newLog) {
    addLog(newLog.text, newLog.type);
  }
}, { deep: true });

// 组件挂载时，添加一些初始日志
onMounted(() => {
  addLog('战斗日志组件已加载', 'info');
});

// 导出方法，允许其他组件调用
defineExpose({
  addLog
});
</script>

<style scoped>
.battle-logs-container {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 300px;
  background-color: rgba(0, 0, 0, 0.7);
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
  border-radius: 4px;
}

.battle-logs-content {
  display: flex;
  flex-direction: column;
  max-height: 300px;
}

.logs-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  max-height: 250px;
  color: #fff;
  font-size: 12px;
}

.log-entry {
  padding: 4px 8px;
  margin: 2px 0;
  border-radius: 4px;
  animation: fadeIn 0.3s ease-in;
  line-height: 1.3;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.log-entry.info {
  background-color: rgba(0, 100, 255, 0.2);
}

.log-entry.damage {
  background-color: rgba(255, 50, 50, 0.2);
}

.log-entry.heal {
  background-color: rgba(50, 255, 50, 0.2);
}

.log-entry.special {
  background-color: rgba(255, 255, 50, 0.2);
}

.empty-logs {
  text-align: center;
  padding: 20px;
  color: rgba(255, 255, 255, 0.5);
}

.battle-logs-controls {
  display: flex;
  padding: 8px;
  gap: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(0, 0, 0, 0.3);
}

.test-log-btn, .clear-log-btn {
  flex: 1;
  padding: 6px;
  background-color: rgba(50, 120, 200, 0.5);
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.clear-log-btn {
  background-color: rgba(200, 50, 50, 0.5);
}

.test-log-btn:hover {
  background-color: rgba(50, 120, 200, 0.7);
}

.clear-log-btn:hover {
  background-color: rgba(200, 50, 50, 0.7);
}
</style> 