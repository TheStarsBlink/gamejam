<template>
  <div class="hand-container">
    <TransitionGroup 
      name="card-transition" 
      tag="div" 
      class="hand"
      :style="{ width: `${handWidth}px` }"
    >
      <Card
        v-for="(card, index) in cards"
        :key="card.id"
        :card="card"
        :selectable="canPlayCard(card)"
        :selected="selectedCardId === card.id"
        :style="getCardStyle(index)"
        @click="handleCardClick(card)"
      />
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useWindowSize, useMouseInElement } from '@vueuse/core';
import Card from './Card.vue';
import type { Card as CardType } from '../types/Card';
import { useCardGameStore as useGameStore } from '../store/combinedGameStore';

const props = defineProps<{
  cards: CardType[];
}>();

const gameStore = useGameStore();
const selectedCardId = ref<string | null>(null);

// 使用useWindowSize获取窗口尺寸，用于响应式布局
const { width: windowWidth } = useWindowSize();

// 计算手牌宽度，基于窗口宽度但有最小和最大限制
const handWidth = computed(() => {
  const baseWidth = Math.min(Math.max(windowWidth.value * 0.7, 500), 1200);
  return baseWidth;
});

// 手牌容器元素引用
const handRef = ref<HTMLElement | null>(null);

// 使用useMouseInElement监测鼠标在手牌区域内的位置
const { isOutside, elementX } = useMouseInElement(handRef);

// 卡牌的基本属性
const cardWidth = 180;
const cardMargin = 5;
const maxFanAngle = 30; // 扇形展开的最大角度
const verticalOffset = 40; // 扇形展开的垂直偏移

// 计算每张卡牌的样式和位置
const getCardStyle = (index: number) => {
  const totalCards = props.cards.length;
  if (totalCards === 0) return {};
  
  // 计算卡牌之间的间距
  const spacing = Math.min((handWidth.value - cardWidth) / Math.max(totalCards - 1, 1), cardWidth * 0.7);
  
  // 计算卡牌的旋转角度和位置
  const angle = maxFanAngle * (index / (totalCards - 1) - 0.5);
  const left = index * spacing + (handWidth.value - totalCards * spacing - cardWidth) / 2;
  
  // 计算卡牌的垂直偏移（扇形展开效果）
  const verticalPos = Math.abs(angle) * (verticalOffset / maxFanAngle);
  
  return {
    position: 'absolute',
    left: `${left}px`,
    transformOrigin: 'center bottom',
    transform: `rotate(${angle}deg) translateY(-${verticalPos}px)`,
    transition: 'all 0.3s ease-out',
    zIndex: index
  };
};

// 检查卡牌是否可以被打出
const canPlayCard = (card: CardType) => {
  return gameStore.currentPhase === 'play' && 
         gameStore.currentMana >= card.cost &&
         !gameStore.isCardBeingPlayed;
};

// 处理卡牌点击事件
const handleCardClick = (card: CardType) => {
  if (!canPlayCard(card)) return;
  
  if (selectedCardId.value === card.id) {
    // 如果已经选中了这张卡，则播放它
    gameStore.playCard(card);
    selectedCardId.value = null;
  } else {
    // 否则选中这张卡
    selectedCardId.value = card.id;
  }
};

// 当游戏阶段改变时清除选择
watch(() => gameStore.currentPhase, () => {
  selectedCardId.value = null;
});
</script>

<style scoped>
.hand-container {
  position: relative;
  height: 320px;
  margin: 0 auto;
  overflow: visible;
  perspective: 1000px;
}

.hand {
  position: relative;
  height: 100%;
  margin: 0 auto;
}

/* 卡牌进入/离开动画 */
.card-transition-enter-active {
  transition: all 0.5s ease;
}

.card-transition-leave-active {
  transition: all 0.3s ease;
  position: absolute;
}

.card-transition-enter-from {
  opacity: 0;
  transform: translateY(50px) scale(0.8);
}

.card-transition-leave-to {
  opacity: 0;
  transform: translateY(-100px) scale(0.8) rotate(10deg);
}
</style> 