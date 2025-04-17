<template>
  <div class="card-area">
    <!-- 牌库显示 -->
    <div class="deck-pile" @click="handleDeckClick">
      <div class="pile-count">{{ gameStore.deck.length }}</div>
      <div class="pile-label">牌库</div>
    </div>
    
    <div class="card-hand">
      <div
        v-for="card in gameStore.hand"
        :key="card.id"
        class="game-card"
        :class="{
          [`card-${card.rarity}`]: true,
          'selected': isSelected(card),
          'disabled': !canPlayCard(card),
          'enemy-target': isSelected(card) && isEnemyTargetSpell(card),
          'friendly-target': isSelected(card) && isFriendlyTargetSpell(card),
          'direct-cast': isSelected(card) && isDirectCastSpell(card)
        }"
        @click="selectCard(card)"
        @mousedown="handleCardMouseDown(card, $event)"
        @mousemove="handleCardMouseMove(card, $event)"
        @mouseup="handleCardMouseUp(card)"
        @mouseleave="handleCardMouseLeave(card)"
      >
        <div class="card-cost">{{ card.cost }}</div>
        <div class="card-name">{{ card.name }}</div>
        <div class="card-image" :style="cardImageStyle(card)"></div>
        <div class="card-description">{{ card.description }}</div>
        <div class="card-type">{{ getCardTypeText(card.type) }}</div>
        
        <!-- 法术牌提示图标 -->
        <div class="spell-indicator" v-if="card.type === 'spell'">
          <div class="spell-target-icon enemy" v-if="isEnemyTargetSpell(card)" title="对敌方释放">⚔️</div>
          <div class="spell-target-icon friendly" v-if="isFriendlyTargetSpell(card)" title="对友方释放">❤️</div>
          <div class="spell-target-icon direct" v-if="isDirectCastSpell(card)" title="直接释放">✨</div>
        </div>
      </div>
      
      <!-- 空手牌占位 -->
      <div v-if="gameStore.hand.length === 0" class="empty-hand-message">
        手牌为空
      </div>
    </div>
    
    <!-- 弃牌堆显示 -->
    <div class="discard-pile" @click="handleDiscardClick">
      <div class="pile-count">{{ gameStore.discard.length }}</div>
      <div class="pile-label">弃牌堆</div>
    </div>
    
    <!-- 牌库卡牌预览 -->
    <div class="card-preview-modal" v-if="showDeckCards" @click.self="showDeckCards = false">
      <div class="preview-header">牌库 ({{ gameStore.deck.length }})</div>
      <div class="preview-cards">
        <div v-if="gameStore.deck.length === 0" class="empty-pile-message">牌库已空</div>
        <div v-else v-for="card in gameStore.deck" :key="card.id" class="preview-card" :class="`card-${card.rarity}`">
          <div class="card-cost">{{ card.cost }}</div>
          <div class="card-name">{{ card.name }}</div>
          <div class="preview-image" :style="cardImageStyle(card)"></div>
          <div class="preview-description">{{ card.description }}</div>
          <div class="card-type">{{ getCardTypeText(card.type) }}</div>
          <div class="card-stats" v-if="card.type === 'unit'">
            攻击: {{ card.atk }} / 生命: {{ card.hp }}
          </div>
        </div>
      </div>
      <button class="close-preview" @click="showDeckCards = false">关闭</button>
    </div>
    
    <!-- 弃牌堆卡牌预览 -->
    <div class="card-preview-modal" v-if="showDiscardCards" @click.self="showDiscardCards = false">
      <div class="preview-header">弃牌堆 ({{ gameStore.discard.length }})</div>
      <div class="preview-cards">
        <div v-if="gameStore.discard.length === 0" class="empty-pile-message">弃牌堆为空</div>
        <div v-else v-for="card in gameStore.discard" :key="card.id" class="preview-card" :class="`card-${card.rarity}`">
          <div class="card-cost">{{ card.cost }}</div>
          <div class="card-name">{{ card.name }}</div>
          <div class="preview-image" :style="cardImageStyle(card)"></div>
          <div class="preview-description">{{ card.description }}</div>
          <div class="card-type">{{ getCardTypeText(card.type) }}</div>
          <div class="card-stats" v-if="card.type === 'unit'">
            攻击: {{ card.atk }} / 生命: {{ card.hp }}
          </div>
        </div>
      </div>
      <button class="close-preview" @click="showDiscardCards = false">关闭</button>
    </div>
    
    <!-- 移动法力水晶显示到右侧 -->
    <div class="mana-display">
      <div class="mana-crystals">
        <template v-for="i in maxMana" :key="i">
          <div :class="['mana-crystal', i <= currentMana ? 'active' : 'inactive']">
            <img src="../assets/mana-crystal.svg" alt="法力水晶" />
          </div>
        </template>
        <span class="mana-text">{{ currentMana }}/{{ maxMana }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useSudokuGameStore as useGameStore } from '../store/combinedGameStore';
import type { Card } from '../types/Card';

const gameStore = useGameStore();
const showDeckCards = ref(false);
const showDiscardCards = ref(false);
const dragStartY = ref(0);
const isDragging = ref(false);
const dragThreshold = 30; // 拖动多少像素触发直接释放法术

const currentMana = computed(() => gameStore.player.energy);
const maxMana = computed(() => gameStore.player.maxEnergy);

// 检查卡牌是否被选中
function isSelected(card: Card): boolean {
  return gameStore.selectedCard?.id === card.id;
}

// 检查卡牌是否可以打出
function canPlayCard(card: Card): boolean {
  return gameStore.phase === 'deployment' && gameStore.player.energy >= card.cost;
}

// 选择卡牌
function selectCard(card: Card) {
  if (!canPlayCard(card)) return;
  
  // 如果已经在拖动中，不处理点击事件
  if (isDragging.value) return;

  if (isSelected(card)) {
    // 如果已经选中，则取消选择
    gameStore.selectCard(null);
  } else {
    // 选择新卡牌
    gameStore.selectCard(card.id);
  }
}

// 处理鼠标按下
function handleCardMouseDown(card: Card, event: MouseEvent) {
  if (!canPlayCard(card)) return;
  
  // 记录开始拖动的Y坐标
  dragStartY.value = event.clientY;
  
  // 如果是直接释放类型的法术，开始追踪拖动
  if (card.type === 'spell' && isDirectCastSpell(card)) {
    isDragging.value = true;
    // 选中卡牌
    gameStore.selectCard(card.id);
  }
}

// 处理鼠标移动
function handleCardMouseMove(card: Card, event: MouseEvent) {
  if (!isDragging.value || !isSelected(card)) return;
  
  // 计算拖动距离
  const dragDistance = dragStartY.value - event.clientY;
  
  // 如果拖动距离超过阈值并且是直接释放类型的法术
  if (dragDistance > dragThreshold && isDirectCastSpell(card)) {
    // 找到卡牌索引
    const cardIndex = gameStore.hand.findIndex(c => c.id === card.id);
    if (cardIndex !== -1) {
      // 直接释放法术
      gameStore.playCard(cardIndex, -1);
      gameStore.selectCard(null);
      // 重置拖动状态
      isDragging.value = false;
    }
  }
}

// 处理鼠标释放
function handleCardMouseUp(card: Card) {
  isDragging.value = false;
}

// 处理鼠标离开
function handleCardMouseLeave(card: Card) {
  isDragging.value = false;
}

// 处理点击牌库
function handleDeckClick() {
  showDeckCards.value = !showDeckCards.value;
  if (showDeckCards.value) {
    showDiscardCards.value = false;
  }
}

// 处理点击弃牌堆
function handleDiscardClick() {
  showDiscardCards.value = !showDiscardCards.value;
  if (showDiscardCards.value) {
    showDeckCards.value = false;
  }
}

// 判断法术类型：对敌方释放
function isEnemyTargetSpell(card: Card): boolean {
  if (card.type !== 'spell') return false;
  return card.description.includes('伤害') || 
         card.description.includes('敌方') || 
         card.description.includes('对敌人');
}

// 判断法术类型：对友方释放
function isFriendlyTargetSpell(card: Card): boolean {
  if (card.type !== 'spell') return false;
  return card.description.includes('治疗') || 
         card.description.includes('增强') || 
         card.description.includes('友方');
}

// 判断法术类型：直接释放
function isDirectCastSpell(card: Card): boolean {
  if (card.type !== 'spell') return false;
  return !isEnemyTargetSpell(card) && !isFriendlyTargetSpell(card);
}

// 检查卡牌是否需要目标
function requiresTarget(card: Card): boolean {
  if (card.type === 'unit') return true;
  if (card.type === 'spell') {
    return isEnemyTargetSpell(card) || isFriendlyTargetSpell(card);
  }
  return false;
}

// 获取卡牌图片样式
function cardImageStyle(card: Card) {
  if (!card.image) return {};
  
  return {
    backgroundImage: `url(${card.image})`
  };
}

// 获取卡牌类型文本
function getCardTypeText(type: string): string {
  switch (type) {
    case 'unit': return '单位';
    case 'spell': return '法术';
    case 'buff': return '增益';
    default: return type;
  }
}
</script>

<style scoped>
.card-area {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #0a0a1a;
  border-top: 2px solid #333;
  min-height: 180px;
}

.card-hand {
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px;
  flex: 1;
  position: relative;
  width: 100%;
  padding-bottom: 2rem;
}

.deck-pile, .discard-pile {
  width: 80px;
  height: 120px;
  background: linear-gradient(to bottom, #333, #222);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  margin: 0 15px;
  cursor: pointer;
  box-shadow: 0 4px 8px rgba(0,0,0,0.5);
  transition: all 0.2s ease;
  position: relative;
}

.deck-pile {
  border: 2px solid #3a3;
}

.discard-pile {
  border: 2px solid #a33;
}

.deck-pile:hover, .discard-pile:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.7);
}

.pile-count {
  font-size: 24px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0,0,0,0.5);
}

.pile-label {
  font-size: 14px;
  color: #aaa;
  margin-top: 5px;
}

.game-card {
  width: 120px;
  height: 160px;
  background: linear-gradient(to bottom, #444, #333);
  border-radius: 10px;
  padding: 6px;
  position: relative;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
  user-select: none;
  transform-origin: center bottom;
}

.game-card:hover {
  transform: translateY(-15px) scale(1.05);
  box-shadow: 0 8px 16px rgba(0,0,0,0.4);
  z-index: 10;
}

.game-card.selected {
  transform: translateY(-20px) scale(1.1);
  box-shadow: 0 10px 20px rgba(85,221,85,0.4);
  z-index: 20;
}

/* 法术牌类型指示器 */
.game-card.enemy-target {
  box-shadow: 0 10px 20px rgba(255,50,50,0.6);
}

.game-card.friendly-target {
  box-shadow: 0 10px 20px rgba(50,50,255,0.6);
}

.game-card.direct-cast {
  box-shadow: 0 10px 20px rgba(255,255,50,0.6);
}

.game-card.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.game-card.disabled:hover {
  transform: none;
  box-shadow: 0 4px 8px rgba(0,0,0,0.3);
}

.spell-indicator {
  position: absolute;
  top: 5px;
  right: 5px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.spell-target-icon {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.spell-target-icon.enemy {
  background: linear-gradient(to bottom, #f55, #a33);
}

.spell-target-icon.friendly {
  background: linear-gradient(to bottom, #55f, #33a);
}

.spell-target-icon.direct {
  background: linear-gradient(to bottom, #ff5, #aa3);
}

.card-cost {
  position: absolute;
  top: 5px;
  left: 5px;
  width: 28px;
  height: 28px;
  background: linear-gradient(to bottom, #55f, #33d);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  box-shadow: 0 2px 3px rgba(0,0,0,0.3);
  font-size: 16px;
}

.card-name {
  text-align: center;
  margin-top: 12px;
  margin-bottom: 5px;
  font-weight: bold;
  font-size: 14px;
  padding: 0 5px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-image {
  height: 60px;
  margin: 3px auto;
  background-color: #222;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 5px;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
}

.card-description {
  font-size: 11px;
  text-align: center;
  padding: 5px;
  color: var(--text-muted);
  line-height: 1.3;
  height: 42px;
  overflow: hidden;
}

.card-type {
  font-size: 10px;
  text-align: center;
  color: #999;
  position: absolute;
  bottom: 5px;
  width: calc(100% - 16px);
}

.empty-hand-message {
  color: var(--text-muted);
  font-style: italic;
}

/* 卡牌预览模态窗 */
.card-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.preview-header {
  font-size: 24px;
  color: #fff;
  margin-bottom: 20px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.preview-cards {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 10px;
  max-width: 80%;
  max-height: 70vh;
  overflow-y: auto;
  padding: 15px;
  background-color: rgba(20, 20, 30, 0.8);
  border-radius: 10px;
}

.preview-card {
  width: 100px;
  height: 140px;
  background: linear-gradient(to bottom, #444, #333);
  border-radius: 8px;
  padding: 6px;
  position: relative;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  transition: all 0.2s ease;
}

.preview-card:hover {
  transform: scale(1.1);
  z-index: 10;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.5);
}

.preview-card .card-cost {
  top: 3px;
  left: 3px;
  width: 22px;
  height: 22px;
  font-size: 14px;
}

.preview-card .card-name {
  margin-top: 10px;
  font-size: 12px;
}

.preview-card .card-type {
  font-size: 9px;
  bottom: 3px;
}

.empty-pile-message {
  color: var(--text-muted);
  font-style: italic;
  padding: 20px;
}

.close-preview {
  margin-top: 20px;
  padding: 8px 16px;
  background: linear-gradient(to bottom, #555, #333);
  border: none;
  border-radius: 5px;
  color: #fff;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s ease;
}

.close-preview:hover {
  background: linear-gradient(to bottom, #666, #444);
  transform: translateY(-2px);
}

/* 卡牌稀有度样式 */
.card-common {
  border: 1px solid #aaa;
}

.card-uncommon {
  border: 1px solid #3a3;
}

.card-rare {
  border: 1px solid #33a;
}

.card-epic {
  border: 1px solid #a3a;
}

.card-legendary {
  border: 1px solid #aa3;
}

/* 牌库和弃牌堆稀有度指示器 */
.deck-pile::after, .discard-pile::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 8px;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    rgba(255, 255, 255, 0.05) 10px,
    rgba(255, 255, 255, 0.05) 20px
  );
  pointer-events: none;
}

.preview-image {
  height: 50px;
  margin: 3px auto;
  background-color: #222;
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  border-radius: 4px;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);
}

.preview-description {
  font-size: 9px;
  text-align: center;
  padding: 3px;
  color: var(--text-muted);
  line-height: 1.2;
  height: 30px;
  overflow: hidden;
}

.card-stats {
  font-size: 9px;
  color: #aaa;
  text-align: center;
  position: absolute;
  bottom: 15px;
  width: 100%;
  left: 0;
}

.mana-display {
  position: absolute;
  bottom: 10px;
  right: 10px; /* 移到右侧 */
  display: flex;
  justify-content: center;
  margin-top: 0.5rem;
  z-index: 10; /* 确保显示在其他元素上方 */
}

.mana-crystals {
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 1rem;
  padding: 0.3rem 1rem;
  display: flex;
  align-items: center;
  gap: 0.2rem;
  position: relative;
  box-shadow: 0 0 10px rgba(0, 195, 255, 0.3); /* 添加轻微发光效果 */
}

.mana-crystal {
  width: 1.5rem;
  height: 1.5rem;
  transition: all 0.2s ease;
}

.mana-crystal.inactive {
  opacity: 0.4;
  filter: grayscale(80%);
}

.mana-crystal img {
  width: 100%;
  height: 100%;
}

.mana-text {
  color: #00c3ff;
  font-weight: bold;
  font-size: 0.9rem;
  margin-left: 0.5rem;
  text-shadow: 0 0 4px rgba(0, 195, 255, 0.8);
}
</style> 