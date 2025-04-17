<template>
  <div id="card-area">
    <PlayerCard 
      v-for="(card, index) in gameStore.hand"
      :key="card.id + '-' + index" 
      :card="card"
      @play="playCard(index)"
    />
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '@/store/gameStore';
import PlayerCard from './PlayerCard.vue';

const gameStore = useGameStore();

function playCard(index: number) {
  // 调用store中的action来打出卡牌
  gameStore.playCard(index);
}
</script>

<style scoped>
#card-area {
  width: 100%;
  height: 120px; /* 稍微增加手牌区域高度 */
  background-color: #1a1a36;
  border-top: 2px solid #333355;
  display: flex;
  justify-content: center;
  gap: 10px;
  padding: 10px;
  overflow-x: auto;
  align-items: center; /* 卡牌垂直居中 */
}
</style> 