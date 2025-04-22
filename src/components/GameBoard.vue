<template>
  <div class="game-board-container">
    <!-- 数独区域指示器 - 固定显示在右侧 -->
    <div class="region-indicator" v-if="showRegionInfo">
      <div class="region-title">
        区域信息
        <button class="close-region-btn" @click="showRegionInfo = false">×</button>
      </div>
      <div class="region-content">
        <div v-if="selectedRegion !== null" class="region-info">
          当前选中: 第 {{ selectedRegion }} 区域
        </div>
        <div class="region-grid">
          <div 
            v-for="i in 9" 
            :key="i-1"
            class="region-cell" 
            :class="{ 'active': selectedRegion === i }"
            @click="handleRegionSelect(i)"
          >
            {{ i }}
          </div>
        </div>
        
        <!-- 区域统计信息 -->
        <div v-if="selectedRegion !== null" class="region-stats">
          <div class="region-data">
            <span class="label">格子数量:</span>
            <span class="value">9</span>
          </div>
          <div class="region-data">
            <span class="label">敌人数量:</span>
            <span class="value">{{ countEnemiesInRegion(selectedRegion) }}</span>
          </div>
          <div class="region-data">
            <span class="label">我方单位:</span>
            <span class="value">{{ countPlayerUnitsInRegion(selectedRegion) }}</span>
          </div>
          <div class="region-data">
            <span class="label">数字和:</span>
            <span class="value">{{ calculateRegionSum(selectedRegion) }}</span>
          </div>
          <div class="region-data">
            <span class="label">区域位置:</span>
            <span class="value">{{ getRegionPosition(selectedRegion) }}</span>
          </div>
          
          <!-- 战斗结果提示 -->
          <div v-if="battleResult" class="battle-result" :class="{'battle-success': battleResult.includes('胜利')}">
            {{ battleResult }}
          </div>
          
          <!-- 区域战斗按钮 -->
          <button 
            v-if="countEnemiesInRegion(selectedRegion) > 0 && countPlayerUnitsInRegion(selectedRegion) > 0" 
            class="battle-btn"
            @click="startRegionBattle(selectedRegion)"
            :disabled="isBattling"
          >
            {{ isBattling ? '战斗中...' : '开始战斗' }} ({{ countEnemiesInRegion(selectedRegion) }}个敌人)
          </button>
          <div v-else-if="countEnemiesInRegion(selectedRegion) === 0" class="empty-region-msg">
            此区域没有敌人
          </div>
          <div v-else class="empty-region-msg">
            此区域没有我方单位，无法战斗
          </div>
        </div>
      </div>
    </div>
    
    <!-- 显示区域信息的按钮 - 当区域信息被隐藏时显示 -->
    <button v-if="!showRegionInfo" class="show-region-btn" @click="showRegionInfo = true">
      显示区域信息
    </button>
    
    <!-- 数独棋盘区域 - 始终在中央 -->
    <div class="sudoku-grid">
      <!-- 游戏状态调试信息 -->
      <div class="debug-info" v-if="showDebugInfo">
        <div>当前关卡: {{ gameStore.currentLevel }}</div>
        <div>敌人数量: {{ gameStore.enemyUnits.length }}</div>
        <div>格子总数: {{ gameStore.grid.length }}</div>
        <div>已占用格子: {{ gameStore.grid.filter(c => c.occupied).length }}</div>
        <div>含单位格子: {{ gameStore.grid.filter(c => c.unit).length }}</div>
        
        <!-- 敌人单位列表 -->
        <div v-if="gameStore.enemyUnits.length > 0">
          <div class="debug-section-title">敌人列表:</div>
          <div v-for="(enemy, index) in gameStore.enemyUnits" :key="enemy.id" class="debug-enemy">
            {{ index+1 }}. {{ enemy.name }} ({{ enemy.atk }}/{{ enemy.hp }}) 
            位置: {{ enemy.cellIndex }} 
            数字: {{ enemy.number }}
          </div>
        </div>
        
        <button @click="forceRefresh">强制刷新</button>
        <button @click="showDebugInfo = false">关闭调试</button>
      </div>
      
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
            <div class="unit-number">{{ cell.unit.number }}</div>
            <div class="unit-stats-wrapper" v-if="!isNeutralUnit(cell.unit)">
              <div class="unit-stats">{{ cell.unit.atk }}/{{ cell.unit.hp }}</div>
            </div>
            <div class="unit-name">{{ cell.unit.name }}</div>
          </div>
          
          <!-- 空格子 -->
          <div v-else class="cell-empty">
            <div v-if="cell.value > 0" class="cell-value">{{ cell.value }}</div>
          </div>
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
import type { Card } from '../types/Card';

const gameStore = useGameStore();
const selectedUnit = ref<Unit | null>(null);
const showDebugInfo = ref(true); // 显示调试信息
const showRegionInfo = ref(true); // 显示区域信息
const selectedRegion = ref<number | null>(null); // 选中的3x3区域索引（1-9）
const battleResult = ref<string | null>(null); // 战斗结果提示
const isBattling = ref(false); // 战斗状态

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
  // 玩家单位的ID是卡牌ID加时间戳，而不是以'player'开头
  // 检查单位是否存在于playerUnits数组中
  return gameStore.playerUnits.some((playerUnit: Unit) => playerUnit.id === unit.id);
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

// 处理区域选择
function handleRegionSelect(regionIndex: number) {
  if (regionIndex >= 1 && regionIndex <= 9) {
    selectedRegion.value = regionIndex;
    console.log("选择了区域:", regionIndex);
    
    // 检查并输出该区域的敌人和我方单位数量
    const enemyCount = countEnemiesInRegion(regionIndex);
    const playerCount = countPlayerUnitsInRegion(regionIndex);
    console.log(`区域${regionIndex}中敌人数量: ${enemyCount}, 我方单位数量: ${playerCount}`);
    
    // 清除上一次的战斗结果
    battleResult.value = null;
  }
}

// 处理格子点击
function handleCellClick(cell: Cell) {
  // 更新选中的区域
  const region = calculateRegion(cell.index);
  console.log("点击格子:", cell.index, "所在区域:", region);
  selectedRegion.value = region;
  
  // 检查并输出该区域的敌人和我方单位数量
  const enemyCount = countEnemiesInRegion(region);
  const playerCount = countPlayerUnitsInRegion(region);
  console.log(`区域${region}中敌人数量: ${enemyCount}, 我方单位数量: ${playerCount}`);
  
  // 清除上一次的战斗结果
  battleResult.value = null;
  
  // 如果有选中的卡牌且格子可选，则打出卡牌
  if (gameStore.selectedCard && isSelectable(cell)) {
    const cardIndex = gameStore.hand.findIndex((c: Card) => c.id === gameStore.selectedCard?.id);
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
  
  const cell = gameStore.grid.find((c: Cell) => c.index === unit.cellIndex);
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

// 强制刷新游戏
function forceRefresh() {
  const currentLevel = gameStore.currentLevel;
  console.log("强制刷新游戏，当前关卡:", currentLevel);
  
  // 重新初始化游戏
  gameStore.startNewGame();
}

// 根据格子索引计算所在的3x3区域
function calculateRegion(cellIndex: number): number {
  // 格子行列
  const row = Math.floor(cellIndex / 9);
  const col = cellIndex % 9;
  
  // 将9x9网格分为3x3的区域
  // 区域编号对应界面显示：
  // 1 2 3
  // 4 5 6
  // 7 8 9
  const regionRow = Math.floor(row / 3);
  const regionCol = Math.floor(col / 3);
  
  // 计算区域索引 (1-9)
  const region = regionRow * 3 + regionCol + 1;
  
  console.log(`格子 ${cellIndex} (行${row},列${col}) 属于区域 ${region}`);
  return region;
}

// 计算区域统计信息
function countEnemiesInRegion(regionIndex: number): number {
  if (regionIndex === null) return 0;
  
  // 获取区域内的所有格子索引
  const cellIndices: number[] = [];
  // 将区域编号转换为0-8范围
  const region = regionIndex - 1;
  const startRow = Math.floor(region / 3) * 3;
  const startCol = (region % 3) * 3;
  
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const cellIndex = (startRow + r) * 9 + (startCol + c);
      cellIndices.push(cellIndex);
    }
  }
  
  // 使用格子索引直接检查敌方单位
  const enemyUnitsCount = gameStore.grid
    .filter((c: Cell) => cellIndices.includes(c.index) && c.unit && isEnemyUnit(c.unit))
    .length;
  
  return enemyUnitsCount;
}

// 计算区域内的我方单位数量
function countPlayerUnitsInRegion(regionIndex: number): number {
  if (regionIndex === null) return 0;
  
  console.log("检查区域" + regionIndex + "内的我方单位");
  
  // 获取区域内的所有格子索引
  const cellIndices: number[] = [];
  // 将区域编号转换为0-8范围
  const region = regionIndex - 1;
  const startRow = Math.floor(region / 3) * 3;
  const startCol = (region % 3) * 3;
  
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const cellIndex = (startRow + r) * 9 + (startCol + c);
      cellIndices.push(cellIndex);
    }
  }
  
  // 使用格子索引直接检查我方单位
  const playerUnitsCount = gameStore.grid
    .filter((c: Cell) => cellIndices.includes(c.index) && c.unit && isPlayerUnit(c.unit))
    .length;
  
  console.log("区域" + regionIndex + "内我方单位数量:", playerUnitsCount);
  console.log("区域" + regionIndex + "包含格子:", cellIndices.join(", "));
  
  return playerUnitsCount;
}

function getRegionPosition(regionIndex: number): string {
  if (regionIndex === null) return '';
  
  // 将区域编号转换为0-8范围后计算行列位置
  const region = regionIndex - 1;
  const regionRow = Math.floor(region / 3) + 1; // 1-3行
  const regionCol = (region % 3) + 1; // 1-3列
  
  return `${regionRow}行${regionCol}列`;
}

function calculateRegionSum(regionIndex: number): number {
  if (regionIndex === null) return 0;
  const regionCells = gameStore.grid.filter((c: Cell) => calculateRegion(c.index) === regionIndex);
  return regionCells.reduce((sum: number, cell: Cell) => sum + (cell.value || 0), 0);
}

// 开始区域战斗
function startRegionBattle(regionIndex: number) {
  if (isBattling.value) return;
  
  console.log("尝试开始区域战斗:", regionIndex);
  
  // 验证区域索引是否有效
  if (regionIndex < 1 || regionIndex > 9) {
    console.error("无效的区域索引:", regionIndex);
    battleResult.value = "无效的区域";
    return;
  }
  
  isBattling.value = true;
  battleResult.value = null;
  
  // 获取区域内的所有格子索引
  const cellIndices: number[] = [];
  const startRow = Math.floor((regionIndex - 1) / 3) * 3;
  const startCol = ((regionIndex - 1) % 3) * 3;
  
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const cellIndex = (startRow + r) * 9 + (startCol + c);
      cellIndices.push(cellIndex);
    }
  }
  
  console.log("区域" + regionIndex + "包含格子:", cellIndices.join(", "));
  
  // 获取区域内的所有单位
  const regionCells = gameStore.grid.filter((c: Cell) => cellIndices.includes(c.index));
  
  console.log("区域内格子数量:", regionCells.length);
  
  const enemyUnits = regionCells
    .filter((c: Cell) => c.unit && isEnemyUnit(c.unit))
    .map((c: Cell) => c.unit!);
  
  // 获取区域内的玩家单位
  const playerUnitsInRegion = regionCells
    .filter((c: Cell) => c.unit && isPlayerUnit(c.unit))
    .map((c: Cell) => c.unit!);
  
  console.log("区域内敌人数量:", enemyUnits.length);
  console.log("区域内玩家单位数量:", playerUnitsInRegion.length);
  
  if (enemyUnits.length === 0) {
    battleResult.value = "没有敌人可以战斗";
    isBattling.value = false;
    return;
  }
  
  if (playerUnitsInRegion.length === 0) {
    battleResult.value = "此区域没有我方单位，无法战斗";
    isBattling.value = false;
    return;
  }
  
  // 计算战斗力
  const enemyPower = enemyUnits.reduce((total: number, unit: Unit) => total + unit.atk + unit.hp, 0);
  const playerPower = playerUnitsInRegion.reduce((total: number, unit: Unit) => total + unit.atk + unit.hp, 0);
  
  console.log("战斗开始:", regionIndex);
  console.log("敌人战斗力:", enemyPower, "玩家战斗力:", playerPower);
  
  // 添加战斗开始的日志
  gameStore.addBattleLog(`区域${regionIndex}战斗开始！`, 'special');
  
  // 记录参战单位
  gameStore.addBattleLog(`敌方单位: ${enemyUnits.map((u: Unit) => u.name).join('、')}`, 'info');
  gameStore.addBattleLog(`我方单位: ${playerUnitsInRegion.map((u: Unit) => u.name).join('、')}`, 'info');
  
  // 修改这里，分别记录战斗力和单位实际攻击力
  gameStore.addBattleLog(`敌方战斗力: ${enemyPower}，我方战斗力: ${playerPower}`, 'info');
  
  // 添加实际攻击力的日志记录
  gameStore.addBattleLog(`敌方单位攻击力: ${enemyUnits.map((u: Unit) => `${u.name}(${u.atk})`).join('、')}`, 'info');
  gameStore.addBattleLog(`我方单位攻击力: ${playerUnitsInRegion.map((u: Unit) => `${u.name}(${u.atk})`).join('、')}`, 'info');
  
  // 模拟战斗过程
  // 简化的战斗系统，基于单位战斗力的比较
  setTimeout(() => {
    if (playerPower >= enemyPower) {
      // 详细记录战斗过程
      gameStore.addBattleLog(`战斗详细过程：`, 'info');
      
      // 创建战斗单位顺序列表 (简单地将双方单位合并后打乱顺序模拟回合制战斗)
      const allUnits = [...playerUnitsInRegion, ...enemyUnits].sort(() => Math.random() - 0.5);
      
      // 每个单位行动一次
      for (let i = 0; i < allUnits.length; i++) {
        const attacker = allUnits[i];
        
        // 跳过已经死亡的单位
        if (attacker.hp <= 0) continue;
        
        // 确定攻击目标
        let targets = attacker.id.startsWith('player') ? 
            enemyUnits.filter(unit => unit.hp > 0) : 
            playerUnitsInRegion.filter(unit => unit.hp > 0);
        
        // 如果没有目标则跳过
        if (targets.length === 0) {
          gameStore.addBattleLog(`${attacker.name}(攻击力${attacker.atk}, 生命值${attacker.hp}) 没有找到目标`, 'info');
          continue;
        }
        
        // 随机选择一个目标
        const target = targets[Math.floor(Math.random() * targets.length)];
        
        // 记录攻击前的状态
        const originalHp = target.hp;
        
        // 计算伤害 (可以加入更复杂的伤害计算逻辑)
        const damage = attacker.atk;
        
        // 应用伤害
        target.hp = Math.max(0, target.hp - damage);
        
        // 记录攻击过程
        gameStore.addBattleLog(
          `${attacker.name}(攻击力${attacker.atk}, 生命值${attacker.hp}) 攻击 ${target.name}, 造成${damage}点伤害, ${target.name}生命值从${originalHp}降至${target.hp}`, 
          'damage'
        );
        
        // 检查目标是否死亡
        if (target.hp <= 0) {
          gameStore.addBattleLog(`${target.name} 被击败！`, 'special');
        }
      }
      
      // 玩家胜利，移除所有敌人
      for (const enemy of enemyUnits) {
        if (enemy.cellIndex !== undefined) {
          // 找到敌人所在的格子
          const cell = gameStore.grid.find((c: Cell) => c.index === enemy.cellIndex);
          if (cell) {
            cell.unit = undefined;
            cell.occupied = false;
          }
        }
      }
      
      // 从敌人列表中移除已击败的敌人
      gameStore.enemyUnits = gameStore.enemyUnits.filter(
        (enemy: Unit) => !enemyUnits.some((u: Unit) => u.id === enemy.id)
      );
      
      // 设置战斗结果
      battleResult.value = `胜利！击败了${enemyUnits.length}个敌人`;
      
      // 记录胜利日志
      gameStore.addBattleLog(`战斗胜利！我方击败了${enemyUnits.length}个敌人`, 'special');
    } else {
      // 详细记录战斗过程
      gameStore.addBattleLog(`战斗详细过程：`, 'info');
      
      // 创建战斗单位顺序列表 (简单地将双方单位合并后打乱顺序模拟回合制战斗)
      const allUnits = [...playerUnitsInRegion, ...enemyUnits].sort(() => Math.random() - 0.5);
      
      // 每个单位行动一次
      for (let i = 0; i < allUnits.length; i++) {
        const attacker = allUnits[i];
        
        // 跳过已经死亡的单位
        if (attacker.hp <= 0) continue;
        
        // 确定攻击目标
        let targets = attacker.id.startsWith('player') ? 
            enemyUnits.filter(unit => unit.hp > 0) : 
            playerUnitsInRegion.filter(unit => unit.hp > 0);
        
        // 如果没有目标则跳过
        if (targets.length === 0) {
          gameStore.addBattleLog(`${attacker.name}(攻击力${attacker.atk}, 生命值${attacker.hp}) 没有找到目标`, 'info');
          continue;
        }
        
        // 随机选择一个目标
        const target = targets[Math.floor(Math.random() * targets.length)];
        
        // 记录攻击前的状态
        const originalHp = target.hp;
        
        // 计算伤害 (可以加入更复杂的伤害计算逻辑)
        const damage = attacker.atk;
        
        // 应用伤害
        target.hp = Math.max(0, target.hp - damage);
        
        // 记录攻击过程
        gameStore.addBattleLog(
          `${attacker.name}(攻击力${attacker.atk}, 生命值${attacker.hp}) 攻击 ${target.name}, 造成${damage}点伤害, ${target.name}生命值从${originalHp}降至${target.hp}`, 
          'damage'
        );
        
        // 检查目标是否死亡
        if (target.hp <= 0) {
          gameStore.addBattleLog(`${target.name} 被击败！`, 'special');
        }
      }
      
      // 玩家失败，区域内的玩家单位损失一定生命值
      for (const unit of playerUnitsInRegion) {
        const originalHp = unit.hp;
        // 计算实际伤害，这里简化为1，可以根据需要调整
        const actualDamage = 1; 
        unit.hp = Math.max(1, unit.hp - actualDamage); // 确保不会死亡，最低为1
        if (unit.hp != originalHp) {
          gameStore.addBattleLog(`战斗失败导致 ${unit.name} 受到额外伤害，生命值从 ${originalHp} 降至 ${unit.hp}`, 'damage');
        }
      }
      battleResult.value = "失败！您的单位受到了伤害";
      
      // 记录失败日志
      gameStore.addBattleLog(`战斗失败！我方单位受到了伤害`, 'special');
    }
    
    // 记录战斗结束
    gameStore.addBattleLog(`区域${regionIndex}战斗结束！`, 'special');
    
    isBattling.value = false;
  }, 1000); // 1秒后显示结果
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

/* 调试信息 */
.debug-info {
  position: absolute;
  bottom: 10px; /* 改为底部显示 */
  left: 10px;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 10px;
  border-radius: 5px;
  color: white;
  font-size: 12px;
  z-index: 100;
  max-height: 250px; /* 减小最大高度 */
  overflow-y: auto;
  max-width: 280px;
}

.debug-section-title {
  font-weight: bold;
  margin-top: 8px;
  margin-bottom: 4px;
  border-bottom: 1px solid rgba(255,255,255,0.3);
}

.debug-enemy {
  font-size: 11px;
  padding: 2px 0;
  border-bottom: 1px dashed rgba(255,255,255,0.1);
}

.debug-info button {
  margin-top: 10px;
  margin-right: 5px;
  padding: 5px 10px;
  background-color: #ff5555;
  color: white;
  border: none;
  border-radius: 3px;
  cursor: pointer;
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

/* 区域指示器 */
.region-indicator {
  position: fixed;
  top: 80px;
  right: 20px;
  width: 170px;
  background-color: rgba(30, 30, 50, 0.95);
  border: 1px solid #555;
  border-radius: 8px;
  padding: 12px;
  color: white;
  z-index: 10;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.6);
  max-height: 300px;
  overflow-y: auto;
}

.region-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 12px;
  text-align: center;
  padding-bottom: 8px;
  border-bottom: 2px solid #555;
  color: #55aaff; /* 添加颜色 */
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.close-region-btn {
  width: 20px;
  height: 20px;
  background: none;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  color: rgba(255, 255, 255, 0.7);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  line-height: 1;
  padding: 0;
}

.close-region-btn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

/* 显示区域信息按钮 */
.show-region-btn {
  position: fixed;
  top: 100px;
  right: 20px;
  padding: 8px 12px;
  background-color: rgba(30, 30, 50, 0.8);
  color: white;
  border: 1px solid #555;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  z-index: 10;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
  transition: all 0.2s ease;
}

.show-region-btn:hover {
  background-color: rgba(85, 170, 255, 0.6);
  border-color: #55aaff;
}

.region-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.region-info {
  margin-bottom: 10px;
  text-align: center;
  font-size: 15px;
  padding: 5px;
  background-color: rgba(85, 170, 255, 0.2);
  border-radius: 5px;
  border: 1px solid rgba(85, 170, 255, 0.3);
}

.region-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 3px;
  width: 130px;
  height: 130px;
  margin: 5px auto 12px;
  border: 1px solid #444;
  padding: 3px;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 5px;
}

.region-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(60, 60, 100, 0.3);
  border: 1px solid #555;
  font-size: 18px;
  transition: all 0.2s ease;
  cursor: pointer;
}

.region-cell:hover {
  background-color: rgba(85, 170, 255, 0.3);
}

.region-cell.active {
  background-color: rgba(85, 170, 255, 0.7);
  border-color: #55aaff;
  box-shadow: 0 0 8px rgba(85, 170, 255, 0.8);
  color: white;
  font-weight: bold;
}

/* 区域统计信息 */
.region-stats {
  margin-top: 10px;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 5px;
  padding: 8px;
  border: 1px solid #444;
}

.region-data {
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
  font-size: 13px;
}

.region-data .label {
  font-weight: normal;
  color: #aaa;
}

.region-data .value {
  font-weight: bold;
  color: #fff;
}

/* 区域战斗按钮 */
.battle-btn {
  margin-top: 10px;
  padding: 8px 12px;
  background-color: rgba(30, 30, 50, 0.8);
  color: white;
  border: 1px solid #555;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  z-index: 10;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
  transition: all 0.2s ease;
}

.battle-btn:hover {
  background-color: rgba(85, 170, 255, 0.6);
  border-color: #55aaff;
}

.empty-region-msg {
  margin-top: 10px;
  text-align: center;
  font-size: 14px;
  color: #aaa;
}

.battle-result {
  margin-top: 10px;
  text-align: center;
  font-size: 14px;
  color: #fff;
  padding: 5px;
  border-radius: 5px;
  background-color: rgba(255, 0, 0, 0.8);
}

.battle-result.battle-success {
  background-color: rgba(0, 255, 0, 0.8);
}
</style>