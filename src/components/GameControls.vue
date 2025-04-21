<template>
  <div class="game-controls">
    <button 
      :disabled="!canEndTurn || isDeckEmpty" 
      @click="handleEndTurn"
      :class="{ 'disabled': !canEndTurn || isDeckEmpty }"
    >
      {{ buttonText }}
    </button>
  </div>
  
  <!-- 牌库为空时的提示 -->
  <div v-if="isDeckEmpty && gameStore.phase === 'deployment'" class="empty-deck-tip">
    牌库已空，无法继续抽牌
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGameStore } from '../store/gameStore';
import { useDebounceFn } from '@vueuse/core';

const gameStore = useGameStore();

// 检查是否可以结束回合
const canEndTurn = computed(() => {
  // 只有在部署阶段可以结束回合
  return gameStore.phase === 'deployment';
});

// 检查牌库是否为空
const isDeckEmpty = computed(() => {
  return gameStore.deck.length === 0;
});

// 按钮文本
const buttonText = computed(() => {
  // 如果还有能量，则显示"完成出牌"，否则显示"结束回合"
  if (gameStore.phase === 'deployment' && gameStore.player.energy > 0) {
    return '完成出牌';
  } else if (gameStore.phase === 'deployment') {
    return '结束回合';
  } else {
    return '战斗中...';
  }
});

// 使用VueUse的useDebounceFn防止按钮快速连点
const handleEndTurn = useDebounceFn(() => {
  if (canEndTurn.value) {
    if (isDeckEmpty.value) {
      gameStore.showMessage('牌库已空，无法继续抽牌');
      return;
    }
    gameStore.endTurn();
  }
}, 300); // 300ms防抖时间
</script>

<style scoped>
.game-controls {
  padding: 10px;
  display: flex;
  justify-content: center;
  gap: 20px; /* 在按钮之间添加间距 */
  margin-top: 15px;
}

button {
  background-color: #4CAF50;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

button:hover:not(.disabled) {
  background-color: #45a049;
}

button.disabled {
  background-color: #cccccc;
  color: #666666;
  cursor: not-allowed;
}

.empty-deck-tip {
  text-align: center;
  color: #e74c3c;
  background-color: rgba(231, 76, 60, 0.1);
  padding: 6px 10px;
  margin: 6px auto;
  border-radius: 4px;
  max-width: 300px;
  font-size: 14px;
}
</style> 