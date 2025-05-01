<template>
  <div id="game-board">
    <!-- 游戏开始界面 -->
    <GameStart />
    
    <!-- 游戏顶部信息栏 -->
    <GameHeader />

    <!-- 游戏主区域 (棋盘) -->
    <GameBoard />

    <!-- 玩家手牌区域 -->
    <CardHand />

    <!-- 底部控制区域 -->
    <GameControls />

    <!-- 游戏消息提示 -->
    <GameMessage v-if="store.message" :message="store.message" />
    
    <!-- 战斗日志 -->
    <BattleLogs />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useSudokuGameStore } from './store/combinedGameStore';
import GameHeader from './components/GameHeader.vue';
import GameBoard from './components/GameBoard.vue';
import CardHand from './components/CardHand.vue';
import GameControls from './components/GameControls.vue';
import GameMessage from './components/GameMessage.vue';
import GameStart from './components/GameStart.vue';
import BattleLogs from './components/BattleLogs.vue';

const store = useSudokuGameStore();

// 不再自动初始化游戏，而是通过GameStart组件的按钮触发
// onMounted(() => {
//   // 初始化游戏
//   store.startNewGame();
// });

defineOptions({
  name: 'App'
});
</script>

<style scoped>
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
</style> 