<template>
  <div :class="['unit-card', { player: isPlayer, enemy: !isPlayer }]">
    <div class="unit-name">{{ unit.name }} (ID: {{ displayId }})</div>
    <div class="unit-stats">攻击力: {{ unit.atk }}, 生命值: {{ unit.hp }}/{{ unit.maxHp }}</div>
    <div v-if="unit.traits && unit.traits.length > 0" class="unit-traits">
      特性: {{ unit.traits.join(', ') }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, computed } from 'vue';

interface Unit {
  id: number;
  name: string;
  atk: number;
  hp: number;
  maxHp: number;
  traits: string[];
}

const props = defineProps<{ 
  unit: Unit;
  isPlayer: boolean;
  displayId: number | string; // 用于显示的ID（可能是索引+1）
}>();

</script>

<style scoped>
.unit-card {
  margin: 5px;
  padding: 8px;
  border-radius: 5px;
  font-size: 12px;
  min-width: 150px;
}

.unit-card.player {
  background-color: #224455;
}

.unit-card.enemy {
  background-color: #552233;
}

.unit-name {
  font-weight: bold;
  margin-bottom: 5px;
}
</style> 