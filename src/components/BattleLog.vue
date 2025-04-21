<template>
  <div class="battle-log">
    <div class="battle-log-header">战斗记录</div>
    <div class="battle-log-content" ref="messageList">
      <div 
        v-for="(message, index) in gameStore.battleLogHistory" 
        :key="index"
        :class="['message', message.type]"
      >
        {{ message.text }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useGameStore } from '@/store/gameStore';

const gameStore = useGameStore();
const messageList = ref<HTMLElement | null>(null);

// 在组件挂载时添加测试消息
onMounted(() => {
  // 添加测试消息
  console.log("战斗日志组件已挂载");
  gameStore.addBattleLog("测试消息 - 战斗日志组件已挂载", "info");
  gameStore.addBattleLog("测试伤害消息", "damage");
  gameStore.addBattleLog("测试治疗消息", "heal");
  gameStore.addBattleLog("测试特殊消息", "special");
  
  const scrollToBottom = () => {
    if (messageList.value) {
      messageList.value.scrollTop = messageList.value.scrollHeight;
    }
  };
  
  // 创建一个 MutationObserver 来监听内容变化
  const observer = new MutationObserver(scrollToBottom);
  
  if (messageList.value) {
    observer.observe(messageList.value, {
      childList: true,
      subtree: true
    });
  }
  
  // 组件卸载时停止监听
  onUnmounted(() => {
    observer.disconnect();
  });
});
</script>

<style scoped>
.battle-log {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  overflow: hidden;
}

.battle-log-header {
  padding: 8px 12px;
  background-color: rgba(0, 0, 0, 0.3);
  color: #fff;
  font-weight: bold;
  font-size: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.battle-log-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  font-size: 12px;
  color: #fff;
  scrollbar-width: thin;
  scrollbar-color: #666 #333;
}

.battle-log-content::-webkit-scrollbar {
  width: 4px;
}

.battle-log-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.battle-log-content::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 2px;
}

.message {
  padding: 4px 8px;
  margin: 2px 0;
  border-radius: 4px;
  line-height: 1.3;
  animation: fadeIn 0.3s ease-in;
  white-space: pre-wrap;
  word-break: break-all;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.message.info {
  background-color: rgba(0, 100, 255, 0.15);
}

.message.damage {
  background-color: rgba(255, 50, 50, 0.15);
}

.message.heal {
  background-color: rgba(50, 255, 50, 0.15);
}

.message.special {
  background-color: rgba(255, 255, 50, 0.15);
}
</style> 