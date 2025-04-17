<template>
  <div 
    ref="cardRef"
    class="card" 
    :class="{ 'selectable': selectable, 'selected': selected }"
    @click="handleClick"
    :style="{
      transform: `scale(${scale}) translateY(${translateY}px)`,
      zIndex: zIndex
    }"
  >
    <div class="card-cost">{{ card.cost }}</div>
    <div class="card-image" :style="{ backgroundImage: `url(${card.image})` }"></div>
    <div class="card-name">{{ card.name }}</div>
    <div class="card-description">{{ card.description }}</div>
    <div class="card-stats">
      <span v-if="card.attack !== undefined">攻击: {{ card.attack }}</span>
      <span v-if="card.health !== undefined">生命: {{ card.health }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineProps, defineEmits } from 'vue';
import { useElementHover, useTransition } from '@vueuse/core';
import type { Card as CardType } from '../types/card';

const props = defineProps<{
  card: CardType;
  selectable: boolean;
  selected?: boolean;
}>();

const emit = defineEmits<{
  (e: 'click', card: CardType): void
}>();

const cardRef = ref<HTMLElement | null>(null);
const isHovered = useElementHover(cardRef);

// 使用useTransition创建平滑的缩放动画
const hoverScale = useTransition(computed(() => isHovered.value ? 1.05 : 1), {
  duration: 200,
  transition: 'ease-in-out',
});

// 使用useTransition创建平滑的上移动画
const hoverTranslateY = useTransition(computed(() => isHovered.value ? -10 : 0), {
  duration: 200,
  transition: 'ease-in-out',
});

// 计算z-index使悬停的卡牌显示在其他卡牌之上
const zIndex = computed(() => isHovered.value ? 10 : 1);

// 实际应用的缩放值，选中状态也有缩放效果
const scale = computed(() => {
  if (props.selected) {
    return 1.1; // 选中时的缩放
  }
  return hoverScale.value;
});

// 实际应用的Y轴偏移
const translateY = computed(() => {
  if (props.selected) {
    return -15; // 选中时的上移
  }
  return hoverTranslateY.value;
});

const handleClick = () => {
  if (props.selectable) {
    emit('click', props.card);
  }
};
</script>

<style scoped>
.card {
  width: 180px;
  height: 250px;
  border-radius: 10px;
  background-color: #f0f0f0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  display: flex;
  flex-direction: column;
  padding: 10px;
  margin: 0 5px;
  position: relative;
  transition: box-shadow 0.2s;
  user-select: none;
}

.selectable {
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0, 100, 255, 0.3);
}

.selected {
  box-shadow: 0 0 0 2px gold, 0 4px 10px rgba(0, 0, 0, 0.3);
}

.card-cost {
  position: absolute;
  top: -5px;
  left: -5px;
  width: 30px;
  height: 30px;
  background-color: #4466aa;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  z-index: 1;
}

.card-image {
  height: 100px;
  background-size: cover;
  background-position: center;
  border-radius: 5px;
  margin-bottom: 8px;
}

.card-name {
  font-weight: bold;
  margin-bottom: 5px;
  font-size: 14px;
}

.card-description {
  font-size: 12px;
  flex-grow: 1;
  color: #555;
}

.card-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  font-weight: bold;
}
</style> 