<template>
  <div class="game-board-container">
    <!-- 数独棋盘区域 - 始终在中央 -->
    <div class="sudoku-grid">
      <!-- 9×9数独网格 -->
      <div class="sudoku-board">
        <div 
          v-for="cell in gameStore.grid" 
          :key="cell.index" 
          class="grid-cell" 
          :class="{ 
            'occupied': cell.occupied, 
            'highlighted': isHighlighted(cell),
            'selectable': isSelectable(cell),
            'enemy-target': cell.unit && isEnemyUnit(cell.unit) && isSpellTargeting(cell, 'enemy'),
            'friendly-target': cell.unit && isPlayerUnit(cell.unit) && isSpellTargeting(cell, 'friendly'),
            'has-number': cell.value > 0,
            'empty-cell': cell.value <= 0,
            'sudoku-border-right': (cell.index + 1) % 9 === 0 || (cell.index + 1) % 3 === 0,
            'sudoku-border-bottom': Math.floor(cell.index / 9) === 8 || Math.floor(cell.index / 9) % 3 === 2
          }"
          @click="handleCellClick(cell)"
        >
          <!-- 如果有单位，显示单位信息 -->
          <div v-if="cell.unit" class="cell-unit" :class="{ 
            'enemy-unit': isEnemyUnit(cell.unit),
            'neutral-unit': isNeutralUnit(cell.unit)
          }">
            <div  class="unit-number">{{ cell.value }}</div>
            <div class="unit-stats-wrapper" v-if="!isNeutralUnit(cell.unit)">
              <div class="unit-stats">{{ cell.unit.atk }}/{{ cell.unit.hp }}</div>
            </div>
            <div class="unit-name">{{ cell.unit.name }}</div>
          </div>
          
          <!-- 空格子 -->
          <div v-else class="cell-empty"></div>
        </div>
      </div>
    </div>
    
    <!-- 单位详情侧边栏 - 使用绝对定位覆盖在界面上 -->
    <div v-if="selectedUnit" class="unit-details-sidebar">
      <div class="sidebar-header">
        <h3>{{ selectedUnit.name }}</h3>
        <button class="close-btn" @click="selectedUnit = null">×</button>
      </div>
      <div class="unit-portrait">
        <div class="portrait-image" :style="unitPortraitStyle"></div>
        <div class="unit-number-large" v-if="selectedUnitNumber && selectedUnitNumber > 0">{{ selectedUnitNumber }}</div>
      </div>
      <div class="unit-info">
        <div class="info-row">
          <span class="label">攻击力:</span>
          <span class="value">{{ selectedUnit.atk }}</span>
        </div>
        <div class="info-row">
          <span class="label">生命值:</span>
          <span class="value">{{ selectedUnit.hp }}/{{ selectedUnit.maxHp }}</span>
        </div>
        <div class="health-bar">
          <div class="health-fill" :style="{ width: `${(selectedUnit.hp / selectedUnit.maxHp) * 100}%` }"></div>
        </div>
        <div class="info-row">
          <span class="label">特性:</span>
          <span class="traits">{{ selectedUnit.traits.join(', ') }}</span>
        </div>
        <div class="info-row" v-if="isEnemyUnit(selectedUnit)">
          <span class="label">类型:</span>
          <span class="type">敌方单位</span>
        </div>
        <div class="info-row" v-else-if="isPlayerUnit(selectedUnit)">
          <span class="label">类型:</span>
          <span class="type">友方单位</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useGameStore, Cell, Unit } from '../store/gameStore';

const gameStore = useGameStore();
const selectedUnit = ref<Unit | null>(null);

// 单位头像样式
const unitPortraitStyle = computed(() => {
  if (!selectedUnit.value || !selectedUnit.value.image) {
    return { backgroundColor: '#333' };
  }
  return { 
    backgroundImage: `url(${selectedUnit.value.image})`,
    backgroundSize: 'contain',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat'
  };
});

// 选中单位的数字
const selectedUnitNumber = computed(() => {
  if (!selectedUnit.value) return null;
  return getUnitCellValue(selectedUnit.value);
});

// 判断是否为敌方单位
function isEnemyUnit(unit: Unit): boolean {
  return unit.id.startsWith('enemy');
}

// 判断是否为玩家单位
function isPlayerUnit(unit: Unit): boolean {
  return unit.id.startsWith('player');
}

// 判断是否为中立单位
function isNeutralUnit(unit: Unit): boolean {
  return unit.id.startsWith('neutral');
}

// 判断格子是否被高亮（基于选中的卡牌）
function isHighlighted(cell: Cell): boolean {
  if (!gameStore.selectedCard) return false;
  
  // 对于单位卡，只高亮未被占用的格子（不再要求有数独数字）
  if (gameStore.selectedCard.type === 'unit') {
    return !cell.occupied;
  }
  
  // 对于法术卡，高亮规则取决于法术类型
  if (gameStore.selectedCard.type === 'spell') {
    // 如果是伤害法术，高亮有敌方单位的格子
    if (gameStore.selectedCard.description.includes('伤害') || 
        gameStore.selectedCard.description.includes('敌方')) {
      return !!cell.unit && isEnemyUnit(cell.unit);
    }
    
    // 如果是治疗或增强法术，高亮有友方单位的格子
    if (gameStore.selectedCard.description.includes('治疗') || 
        gameStore.selectedCard.description.includes('增强') ||
        gameStore.selectedCard.description.includes('友方')) {
      return !!cell.unit && isPlayerUnit(cell.unit);
    }
    
    // 如果是全局法术，不高亮任何格子
    return false;
  }
  
  return false;
}

// 判断格子是否可选择（与高亮逻辑类似，但可能有额外限制）
function isSelectable(cell: Cell): boolean {
  return isHighlighted(cell);
}

// 处理格子点击
function handleCellClick(cell: Cell) {
  // 如果有选中的卡牌且格子可选，则打出卡牌
  if (gameStore.selectedCard && isSelectable(cell)) {
    const cardIndex = gameStore.hand.findIndex(c => c.id === gameStore.selectedCard?.id);
    if (cardIndex !== -1) {
      gameStore.playCard(cardIndex, cell.index);
      gameStore.selectCard(null);
      return; // 打出卡牌后直接返回，不显示单位详情
    }
  }
  
  // 如果单元格有单位，则显示单位详情
  if (cell.unit) {
    selectedUnit.value = cell.unit;
    return;
  }
}

// 获取单位所在格子的数值
function getUnitCellValue(unit: Unit): number | null {
  if (!unit || unit.cellIndex === undefined || unit.cellIndex < 0) return null;
  
  const cell = gameStore.grid.find(c => c.index === unit.cellIndex);
  return cell ? cell.value : null;
}

// 检查单元格是否是特定类型的法术目标
function isSpellTargeting(cell: Cell, targetType: 'enemy' | 'friendly'): boolean {
  if (!gameStore.selectedCard || gameStore.selectedCard.type !== 'spell') return false;
  
  if (targetType === 'enemy') {
    return gameStore.selectedCard.description.includes('伤害') || 
           gameStore.selectedCard.description.includes('敌方');
  } else {
    return gameStore.selectedCard.description.includes('治疗') || 
           gameStore.selectedCard.description.includes('增强') ||
           gameStore.selectedCard.description.includes('友方');
  }
}
</script>

<style scoped>
/* 游戏棋盘容器 */
.game-board-container {
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  padding: 5px;
  background-color: var(--background-darker);
  position: relative;
  height: 100%;
  overflow: hidden;
}

/* 数独棋盘样式 */
.sudoku-grid {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.sudoku-board {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  grid-template-rows: repeat(9, 1fr);
  gap: 1px;
  background-color: #444;
  border: 3px solid #666;
  width: min(450px, 90vw); /* 响应式宽度，最大450px，最小为视口宽度的90% */
  height: min(450px, 90vw); /* 高度与宽度保持一致 */
  aspect-ratio: 1 / 1; /* 保持1:1比例 */
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
}

/* 单位详情侧边栏 - 绝对定位 */
.unit-details-sidebar {
  position: absolute;
  top: 0;
  left: 0;
  width: 230px;
  height: 100%;
  background-color: rgba(30, 30, 50, 0.9);
  border-right: 2px solid #555;
  padding: 15px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  transition: all 0.3s ease;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.4);
  z-index: 10;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  border-bottom: 1px solid #555;
  padding-bottom: 10px;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--text-color);
}

.close-btn {
  width: 24px;
  height: 24px;
  background: none;
  border: 1px solid #666;
  border-radius: 50%;
  color: #aaa;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  line-height: 1;
}

.close-btn:hover {
  color: #fff;
  border-color: #aaa;
}

.unit-portrait {
  width: 100%;
  height: 120px;
  margin-bottom: 15px;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid #555;
  position: relative;
}

.portrait-image {
  width: 100%;
  height: 100%;
  background-color: #333;
}

.unit-info {
  flex: 1;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.label {
  font-size: 14px;
  color: var(--text-muted);
  width: 80px;
}

.value {
  font-size: 16px;
  font-weight: bold;
  color: var(--text-color);
}

.traits {
  font-size: 14px;
  color: var(--accent-color);
}

.type {
  font-size: 14px;
  color: var(--primary-color);
}

.health-bar {
  width: 100%;
  height: 10px;
  background-color: #333;
  border-radius: 5px;
  overflow: hidden;
  margin: 5px 0 10px 0;
}

.health-fill {
  height: 100%;
  background-color: #f44;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.grid-cell {
  background-color: var(--background-light);
  border: 1px solid #444;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
  aspect-ratio: 1 / 1; /* 保证格子为正方形 */
  font-size: min(16px, 3vw); /* 响应式字体大小 */
}

.grid-cell:hover {
  box-shadow: 0 0 8px rgba(255,255,255,0.3);
  background-color: rgba(70, 70, 120, 0.5);
}

.grid-cell.occupied {
  background-color: rgba(85, 85, 170, 0.3);
}

.grid-cell.highlighted {
  border-color: #6e6;
  box-shadow: 0 0 12px rgba(85, 221, 85, 0.5);
  background-color: rgba(40, 100, 40, 0.3);
  z-index: 2;
}

.grid-cell.selectable {
  cursor: pointer;
}

.grid-cell:not(.selectable) {
  cursor: default;
}

/* 数独边框 */
.sudoku-border-right {
  border-right-width: 2px;
  border-right-color: #666;
}

.sudoku-border-bottom {
  border-bottom-width: 2px;
  border-bottom-color: #666;
}

.cell-index {
  font-size: 16px;
  color: rgba(255, 255, 255, 0.6);
  font-weight: bold;
}

.cell-empty {
  width: 100%;
  height: 100%;
}

.cell-value {
  font-size: min(22px, 4vw);
  font-weight: bold;
  color: var(--text-color);
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  width: 100%;
  height: 100%;
  font-size: min(14px, 2.5vw);
  background-color: rgba(85, 85, 170, 0.7);
  border-radius: 4px;
  position: relative;
  padding-top: 4px;
  box-shadow: 0 0 8px rgba(85, 85, 170, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.3);
  z-index: 3;
}

.cell-unit.enemy-unit {
  background-color: rgba(170, 85, 85, 0.7);
  box-shadow: 0 0 8px rgba(170, 85, 85, 0.5);
}

.cell-unit.neutral-unit {
  background-color: rgba(100, 100, 100, 0.5);
  box-shadow: 0 0 8px rgba(100, 100, 100, 0.4);
  opacity: 0.8;
}

.unit-number {
  position: absolute;
  top: 2px;
  left: 2px;
  font-size: min(12px, 2.5vw);
  font-weight: bold;
  color: rgba(255, 255, 255, 0.9);
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  min-width: 16px;
  min-height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  padding: 1px;
}

.cell-unit .unit-name {
  font-size: min(10px, 2vw);
  margin-bottom: 1px;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.8);
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 2px;
  padding: 1px 3px;
}

.cell-unit .unit-stats {
  font-size: min(14px, 2.5vw);
  margin-bottom: 1px;
  font-weight: bold;
  background-color: rgba(0, 0, 0, 0.4);
  border-radius: 3px;
  padding: 1px 4px;
  box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
}

.unit-number-large {
  position: absolute;
  top: 10px;
  right: 10px;
  font-size: 24px;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.9);
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  box-shadow: 0 0 8px rgba(0, 0, 0, 0.4);
  z-index: 2;
}

.grid-cell.has-number {
  background-color: rgba(60, 60, 90, 0.3);
}

.grid-cell:not(.has-number) {
  background-color: rgba(30, 30, 50, 0.2);
}

.unit-stats-wrapper {
  background-color: rgba(0, 0, 0, 0.6);
  border-radius: 4px;
  padding: 2px 5px;
  margin: 2px 0;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.5);
}

.grid-cell.empty-cell {
  background-color: rgba(20, 20, 30, 0.15); /* 更暗的背景色 */
}

.grid-cell.enemy-target {
  box-shadow: 0 0 15px rgba(255, 80, 80, 0.8);
  border: 2px solid #f55;
  z-index: 5;
}

.grid-cell.friendly-target {
  box-shadow: 0 0 15px rgba(80, 80, 255, 0.8);
  border: 2px solid #55f;
  z-index: 5;
}

.neutral-unit .unit-name {
  font-style: italic;
  opacity: 0.7;
}
</style>