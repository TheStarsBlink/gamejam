<template>
  <div id="game-main">
    <div class="game-content">
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

    <!-- 右侧状态栏 -->
    <div class="game-sidebar">
      <!-- 游戏状态信息 -->
      <div class="status-info">
        <div class="info-item">格子数量: {{ totalCells }}</div>
        <div class="info-item">敌人数量: {{ gameStore.enemyUnits.length }}</div>
        <div class="info-item">我方单位: {{ gameStore.playerUnits.length }}</div>
        <div class="info-item">数字和: {{ totalValue }}</div>
        <div class="info-item">区域位置: {{ currentArea }}列</div>
        
        <!-- 测试按钮 -->
        <div class="test-button-group">
          <button class="test-btn" @click="addTestLog">测试单条日志</button>
          <button class="test-btn" @click="addTestBattleLogs">测试多条日志</button>
        </div>
      </div>

      <!-- 简易战斗日志 -->
      <div class="direct-battle-log">
        <div class="log-header">战斗日志</div>
        <div class="log-content">
          <div 
            v-for="(log, index) in battleLogs" 
            :key="index" 
            :class="['log-entry', log.type]"
          >
            {{ log.text }}
          </div>
        </div>
      </div>
      
      <!-- 显示历史记录信息 -->
      <div class="battle-log-info">
        战斗日志条数: {{ battleLogs.length }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGameStore } from '@/store/gameStore';
import { computed, ref } from 'vue';
import UnitCard from './UnitCard.vue';

// 自定义战斗日志实现
interface BattleLog {
  text: string;
  type: 'info' | 'damage' | 'heal' | 'special';
}

const gameStore = useGameStore();
const battleLogs = ref<BattleLog[]>([]);

// 计算属性
const totalCells = computed(() => gameStore.grid.length);
const totalValue = computed(() => {
  return gameStore.grid.reduce((sum, cell) => sum + (cell.value || 0), 0);
});
const currentArea = computed(() => {
  // 这里可以根据实际需求计算当前区域
  return '2行3';
});

// 添加测试战斗日志
function addTestLog() {
  console.log('添加测试战斗日志');
  addBattleLog("测试战斗日志 - " + new Date().toLocaleTimeString(), "info");
  addBattleLog("测试伤害消息", "damage");
  addBattleLog("测试治疗消息", "heal");
  addBattleLog("测试特殊事件", "special");
}

// 添加多条测试战斗日志
function addTestBattleLogs() {
  console.log("添加测试战斗日志集");
  addBattleLog("测试战斗开始", "special");
  addBattleLog("小恶魔 对 骷髅兵 造成了 2 点伤害", "damage");
  addBattleLog("骷髅兵 对 小恶魔 造成了 1 点伤害", "damage");
  addBattleLog("恶魔战士 恢复了 3 点生命值", "heal");
}

// 添加战斗日志
function addBattleLog(text: string, type: BattleLog['type'] = 'info') {
  battleLogs.value.push({ text, type });
  console.log(`[BattleLog] ${type}: ${text}`);
  
  // 如果历史记录超过50条，移除最旧的
  if (battleLogs.value.length > 50) {
    battleLogs.value.shift();
  }
}
</script>

<style scoped>
#game-main {
  display: flex;
  flex: 1;
  height: calc(100% - 160px); /* Header 60px, Hand 100px */
  padding: 10px;
  gap: 10px;
}

.game-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.game-sidebar {
  width: 250px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background-color: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  padding: 10px;
}

.status-info {
  background-color: rgba(0, 0, 0, 0.2);
  padding: 10px;
  border-radius: 6px;
}

.info-item {
  color: #fff;
  font-size: 14px;
  margin-bottom: 8px;
}

.direct-battle-log {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  overflow: hidden;
}

.log-header {
  padding: 8px 12px;
  background-color: rgba(0, 0, 0, 0.3);
  color: #fff;
  font-weight: bold;
  font-size: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.log-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
  max-height: 300px;
}

.log-entry {
  padding: 4px 8px;
  margin: 2px 0;
  border-radius: 4px;
  font-size: 12px;
  color: #fff;
  line-height: 1.3;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}

.log-entry.info {
  background-color: rgba(0, 100, 255, 0.15);
}

.log-entry.damage {
  background-color: rgba(255, 50, 50, 0.15);
}

.log-entry.heal {
  background-color: rgba(50, 255, 50, 0.15);
}

.log-entry.special {
  background-color: rgba(255, 255, 50, 0.15);
}

.battle-log-info {
  color: #fff;
  font-size: 12px;
  text-align: center;
  margin-top: 5px;
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

.test-button-group {
  display: flex;
  gap: 5px;
  margin-top: 10px;
}

.test-btn {
  flex: 1;
  padding: 5px;
  background-color: #4a5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.test-btn:hover {
  background-color: #5b6;
}
</style> 