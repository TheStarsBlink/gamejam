<template>
  <div id="game-main">
    <!-- 敌方单位区域 -->
    <div id="enemy-units" class="unit-area">
      <UnitCard 
        v-for="(unit, index) in gameStore.enemyUnits"
        :key="unit.id" 
        :unit="unit" 
        :is-player="false"
        :display-id="index + 1"
      />
    </div>
    
    <!-- 玩家单位区域 -->
    <div id="player-units" class="unit-area">
      <UnitCard 
        v-for="(unit, index) in gameStore.playerUnits"
        :key="unit.id" 
        :unit="unit" 
        :is-player="true"
        :display-id="index + 1"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '@/store/gameStore';
import UnitCard from './UnitCard.vue';

const gameStore = useGameStore();
</script>

<style scoped>
#game-main {
  display: flex;
  flex-direction: column;
  flex: 1;
  height: calc(100% - 160px); /* Header 60px, Hand 100px */
  padding: 10px;
  overflow-y: auto;
}

.unit-area {
  flex: 1;
  padding: 10px 0;
  display: flex;
  flex-wrap: wrap; /* 允许单位换行 */
  gap: 5px;
  align-content: flex-start; /* 使卡片从顶部开始排列 */
}

#enemy-units {
  border-bottom: 1px solid #333355;
}
</style> 