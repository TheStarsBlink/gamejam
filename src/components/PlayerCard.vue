<template>
  <div class="card" @click="playCard">
    <div class="card-title">{{ card.name }}</div>
    <div class="card-cost">({{ card.cost }})</div>
    <div class="card-desc">{{ card.description }}</div>
    <div v-if="card.atk !== undefined" class="card-stats">攻:{{ card.atk }}</div>
    <div v-if="card.hp !== undefined" class="card-stats">血:{{ card.hp }}</div>
    <div v-if="card.damage !== undefined" class="card-stats">伤:{{ card.damage }}</div>
    <div v-if="card.armor !== undefined" class="card-stats">甲:{{ card.armor }}</div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';

interface Card {
  id: number;
  name: string;
  description: string;
  type: string;
  cost: number;
  atk?: number;
  hp?: number;
  damage?: number;
  armor?: number;
}

const props = defineProps<{ card: Card }>();
const emit = defineEmits(['play']);

function playCard() {
  emit('play');
}
</script>

<style scoped>
.card {
  width: 100px;
  height: 100%;
  background-color: #554477;
  border: 1px solid #776699;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  padding: 5px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
  font-size: 11px;
  text-align: center;
}

.card:hover {
  transform: translateY(-10px) scale(1.05);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
}

.card-title {
  font-weight: bold;
  margin-bottom: 3px;
  font-size: 12px;
}

.card-cost {
    font-size: 10px;
    margin-bottom: 5px;
    color: #ccaaee;
}

.card-desc {
  flex-grow: 1;
  margin-bottom: 5px;
}

.card-stats {
  font-size: 10px;
  background-color: rgba(0,0,0,0.2);
  padding: 1px 3px;
  border-radius: 3px;
  margin-top: 2px;
}
</style> 