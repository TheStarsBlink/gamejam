<template>
  <div class="game-start-overlay" v-if="!gameStarted">
    <div class="game-start-container">
      <h1>数独卡牌游戏</h1>
      <button v-if="hasSavedGame" class="continue-button" @click="continueGame">继续游戏</button>
      <button class="start-button" @click="startGame">新游戏</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useSudokuGameStore } from '../store/combinedGameStore';

defineOptions({
  name: 'GameStart'
});

const store = useSudokuGameStore();
const gameStarted = ref(false);
const hasSavedGame = ref(false);

function validateEnemyUnits() {
  if (store.enemyUnits.length === 0) {
    console.warn('没有生成敌人，尝试再次初始化');
    store.startNewGame(true);
    
    // 再次检查
    setTimeout(() => {
      if (store.enemyUnits.length === 0) {
        console.error('敌人生成失败，尝试手动调用敌人生成函数');
        // 修复方法：如果没有对应导出，可能需要额外刷新
        store.showMessage('正在初始化游戏...请稍等');
      } else {
        console.log('成功生成敌人:', store.enemyUnits.length);
      }
    }, 500);
  } else {
    console.log('成功生成敌人:', store.enemyUnits.length);
  }
}

// 开始新游戏
function startGame() {
  gameStarted.value = true;
  
  // 初始化游戏，传递true表示强制重置游戏状态
  store.startNewGame(true);
  
  // 检查敌人是否生成
  setTimeout(validateEnemyUnits, 100);
  
  console.log("新游戏已初始化，开始关卡:", store.currentLevel);
}

// 继续游戏
function continueGame() {
  gameStarted.value = true;
  
  // 加载保存的游戏状态
  const success = store.startNewGame(false);
  
  if (!success) {
    console.error("加载存档失败，开始新游戏");
    store.startNewGame(true);
    
    // 检查敌人是否生成
    setTimeout(validateEnemyUnits, 100);
  } else {
    console.log("继续游戏成功，当前关卡:", store.currentLevel);
    console.log("玩家单位数:", store.playerUnits.length);
    console.log("敌人单位数:", store.enemyUnits.length);
  }
}

// 页面加载时初始化 (预加载游戏资源)
onMounted(() => {
  console.log("GameStart组件已加载");
  
  // 检查是否有保存的游戏状态
  try {
    const savedState = localStorage.getItem('sudokuGameState');
    if (savedState) {
      const state = JSON.parse(savedState);
      hasSavedGame.value = true;
      console.log("发现已保存的游戏进度，关卡:", state.currentLevel);
    }
  } catch (error) {
    console.error("检查存档状态时出错:", error);
  }
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
  background-color: rgba(20, 20, 40, 0.9);
  padding: 30px 50px;
  border-radius: 10px;
  text-align: center;
  border: 2px solid #55aaff;
  box-shadow: 0 0 20px rgba(85, 170, 255, 0.5);
}

h1 {
  color: #55aaff;
  margin-bottom: 30px;
  text-shadow: 0 0 10px rgba(85, 170, 255, 0.7);
}

.start-button, .continue-button {
  background-color: #333355;
  color: white;
  border: 2px solid #55aaff;
  padding: 12px 24px;
  font-size: 18px;
  border-radius: 5px;
  cursor: pointer;
  margin: 10px;
  min-width: 150px;
  transition: all 0.3s ease;
}

.start-button:hover, .continue-button:hover {
  background-color: #55aaff;
  transform: scale(1.05);
}

.continue-button {
  background-color: #225533;
  border-color: #55dd77;
}

.continue-button:hover {
  background-color: #55dd77;
}
</style> 