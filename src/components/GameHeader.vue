<template>
  <div class="game-header">
    <!-- 左侧游戏信息 -->
    <div class="game-info">
      <div class="turn-info">回合: {{ store.turn }}</div>
      <div class="phase-info">阶段: {{ phaseText }}</div>
      <div class="battle-info">战斗: {{ store.currentBattle }}</div>
      
    </div>
    
    <!-- 中间玩家信息 -->
    <div class="player-stats">
      <div class="level-info">关卡 {{ store.currentLevel }}</div>
      <div class="stat-label">
        HP: {{ store.player.hp }}/{{ store.player.maxHp }} | 
        ATK: {{ store.player.atk }} | 
        护甲: {{ store.player.armor }}
      </div>
      <div class="health-bar">
        <div class="health-fill" :style="{ width: `${(store.player.hp / store.player.maxHp) * 100}%` }"></div>
        <span>{{ store.player.hp }}/{{ store.player.maxHp }}</span>
      </div>
    </div>
    
    <!-- 右侧资源信息 -->
    <div class="resources">
      <div class="energy">
        <span class="energy-label">能量:</span>
        <span class="energy-value">{{ store.player.energy }}/{{ store.player.maxEnergy }}</span>
      </div>
      <div class="deck-info">
        <span class="deck-label">牌库:</span>
        <span class="deck-value">{{ store.deck.length }}</span>
      </div>
      <div class="gold-info">
        <span class="gold-label">金币:</span>
        <span class="gold-value">{{ store.player.gold }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useSudokuGameStore } from '../store/combinedGameStore';

defineOptions({
  name: 'GameHeader'
});

const store = useSudokuGameStore();

// 将阶段文本转换为中文
const phaseText = computed(() => {
  switch (store.phase) {
    case 'deployment': return '部署';
    case 'battle': return '战斗';
    case 'victory': return '胜利';
    case 'defeat': return '失败';
    default: return '未知';
  }
});
</script>

<style scoped>
.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #111127;
  padding: 10px 20px;
  border-bottom: 2px solid #333;
  color: #fff;
  height: 100px;
}

.game-info, .resources {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 150px;
}

.game-info {
  text-align: left;
}

.resources {
  text-align: right;
}

.player-stats {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
}

.stat-label {
  font-size: 16px;
  font-weight: bold;
}

.turn-info, .phase-info, .battle-info,
.energy, .deck-info, .gold-info {
  font-size: 14px;
}

.health-bar {
  width: 70%;
  height: 18px;
  background-color: #444;
  border-radius: 9px;
  overflow: hidden;
  position: relative;
}

.health-fill {
  height: 100%;
  background: linear-gradient(to right, #f55, #f33);
  transition: width 0.3s ease;
}

.health-bar span {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  text-align: center;
  line-height: 18px;
  font-size: 12px;
  font-weight: bold;
  color: white;
  text-shadow: 1px 1px 1px black;
}

.energy-value, .deck-value, .gold-value {
  font-weight: bold;
  margin-left: 4px;
}

.energy-value {
  color: #55aaff;
}

.gold-value {
  color: #ffcc33;
}

.level-info {
  font-size: 20px;
  font-weight: bold;
  margin-bottom: 5px;
  color: white;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
}
</style> 