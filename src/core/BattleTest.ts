/**
 * 战斗系统测试文件
 * 
 * 用于测试和演示区域战斗的逻辑
 * 
 * 你可以在浏览器控制台中通过以下方式运行测试:
 * import("./src/core/BattleTest.js").then(module => module.default());
 * 
 * 或者访问 /src/BattleTestPage.html 页面点击"开始测试"按钮
 */

import { EventSystem } from './events/EventSystem';
import { GridSystem } from './GridSystem';
import { BattleManager, BattleUnit } from './BattleManager';
import { Player } from './Player';

/**
 * 简单的测试函数，创建一个战斗场景并执行
 */
export function testBattle(): void {
  console.log("开始战斗测试...");
  
  // 创建事件系统
  const eventSystem = new EventSystem();
  
  // 创建网格系统
  const gridSystem = new GridSystem();
  
  // 创建战斗管理器
  const battleManager = new BattleManager(eventSystem, gridSystem);
  
  // 监听战斗日志事件
  eventSystem.on('battle_log', (log: string) => {
    // 实际游戏中可以将日志显示在UI上
    // 这里为了测试简单，我们不做额外处理，因为BattleManager已经输出到控制台了
  });
  
  // 重置战场
  battleManager.reset();
  
  // 添加玩家单位
  const playerUnits: BattleUnit[] = [
    { 
      id: 'player1', 
      name: '战士', 
      number: 1, 
      hp: 10, 
      maxHp: 10, 
      attack: 3, 
      isPlayerUnit: true 
    },
    { 
      id: 'player2', 
      name: '弓箭手', 
      number: 3, 
      hp: 7, 
      maxHp: 7, 
      attack: 4, 
      isPlayerUnit: true 
    },
    { 
      id: 'player3', 
      name: '法师', 
      number: 7, 
      hp: 5, 
      maxHp: 5, 
      attack: 6, 
      isPlayerUnit: true 
    }
  ];
  
  // 将玩家单位添加到战场
  playerUnits.forEach(unit => battleManager.addPlayerUnit(unit));
  
  // 生成敌人 (假设是第1关)
  battleManager.spawnEnemies(1);
  
  // 创建一个简单的玩家对象用于测试
  const player = new Player();
  
  // 输出战前状态
  console.log("\n初始战场状态：");
  console.log("玩家单位：");
  playerUnits.forEach(unit => {
    console.log(`  ${unit.name}：编号=${unit.number}, 生命=${unit.hp}/${unit.maxHp}, 攻击=${unit.attack}`);
  });
  
  console.log("敌方单位：");
  battleManager.enemyUnits.forEach(unit => {
    console.log(`  ${unit.name}：编号=${unit.number}, 生命=${unit.hp}/${unit.maxHp}, 攻击=${unit.attack}`);
  });
  
  console.log("\n执行战斗过程...\n");
  
  // 执行战斗
  battleManager.executeBattle(player);
  
  console.log("\n战斗测试完成！");
}

// 如果直接运行此文件，则执行测试
if (require.main === module) {
  testBattle();
}

// 导出测试函数，方便在其他地方调用
export default testBattle; 