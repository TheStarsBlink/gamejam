<template>
  <div id="game-board">
    <!-- 游戏顶部信息栏 -->
    <GameHeader />

    <!-- 游戏主区域 (棋盘) -->
    <GameBoard />

    <!-- 玩家手牌区域 -->
    <CardHand />

    <!-- 底部控制区域 -->
    <GameControls />

    <!-- 游戏消息提示 -->
    <GameMessage v-if="gameStore.message" :message="gameStore.message" />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useGameStore } from './store/gameStore';
import GameHeader from './components/GameHeader.vue';
import GameBoard from './components/GameBoard.vue';
import CardHand from './components/CardHand.vue';
import GameControls from './components/GameControls.vue';
import GameMessage from './components/GameMessage.vue';

const gameStore = useGameStore();

onMounted(() => {
  // 初始化游戏
  gameStore.startNewGame();
});
</script>

<style>
/* 全局样式 */
:root {
  --primary-color: #ff5555;
  --primary-dark: #aa3333;
  --background-dark: #111127;
  --background-darker: #0a0a1a;
  --background-light: #22223b;
  --text-color: #ffffff;
  --text-muted: #aaaaaa;
  --accent-color: #55aaff;
}

html, body, #app, #game-board {
  width: 100%;
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
  background-color: var(--background-dark);
  color: var(--text-color);
  font-family: Arial, sans-serif;
  box-sizing: border-box;
}

*, *::before, *::after {
  box-sizing: inherit;
}

#game-board {
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100%;
  overflow: hidden;
}

/* 让GameBoard组件占据更多空间 */
#game-board > *:nth-child(2) {
  flex: 1;
  min-height: 0; /* 允许flex子项收缩 */
  display: flex;
  flex-direction: column;
}

/* 卡牌稀有度颜色 */
.card-common {
  border: 2px solid #aaa;
}

.card-uncommon {
  border: 2px solid #5d5;
  box-shadow: 0 4px 8px rgba(85,255,85,0.2);
}

.card-rare {
  border: 2px solid #55d;
  box-shadow: 0 4px 8px rgba(85,85,255,0.2);
}

.card-epic {
  border: 2px solid #c5c;
  box-shadow: 0 4px 8px rgba(204,85,204,0.2);
}

.card-legendary {
  border: 2px solid #fa0;
  box-shadow: 0 4px 8px rgba(255,170,0,0.3);
}

/* 动画效果 */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style> 