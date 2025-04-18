<template>
  <div class="game-start-overlay" v-if="!gameStarted">
    <div class="game-start-container">
      <h1>数独卡牌游戏</h1>
      <button class="start-button" @click="startGame">游戏开始!</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useGameStore } from '../store/gameStore';

const gameStore = useGameStore();
const gameStarted = ref(false);

function validateEnemyUnits() {
  if (gameStore.enemyUnits.length === 0) {
    console.warn('没有生成敌人，尝试再次初始化');
    gameStore.startNewGame();
    
    // 再次检查
    setTimeout(() => {
      if (gameStore.enemyUnits.length === 0) {
        console.error('敌人生成失败，尝试手动调用敌人生成函数');
        // 修复方法：如果没有对应导出，可能需要额外刷新
        gameStore.showMessage('正在初始化游戏...请稍等');
      } else {
        console.log('成功生成敌人:', gameStore.enemyUnits.length);
      }
    }, 500);
  } else {
    console.log('成功生成敌人:', gameStore.enemyUnits.length);
  }
}

function startGame() {
  gameStarted.value = true;
  
  // 初始化游戏
  gameStore.startNewGame();
  
  // 检查敌人是否生成
  setTimeout(validateEnemyUnits, 100);
  
  console.log("游戏已初始化，开始关卡:", gameStore.currentLevel);
}

// 页面加载时初始化 (预加载游戏资源)
onMounted(() => {
  console.log("GameStart组件已加载");
});
</script>

<style scoped>
.game-start-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.game-start-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: #1a1a2e;
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
}

h1 {
  color: white;
  margin-bottom: 2rem;
  font-size: 2rem;
  text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
}

.start-button {
  padding: 0.8rem 2rem;
  font-size: 1.2rem;
  background-color: #ff5555;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 0 10px rgba(255, 85, 85, 0.5);
}

.start-button:hover {
  background-color: #ff3333;
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(255, 85, 85, 0.7);
}
</style> 