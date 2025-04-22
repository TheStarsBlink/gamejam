const fs = require('fs');

/**
 * 战斗测试脚本
 * 
 * 这是一个简单的JavaScript测试文件，用于模拟战斗过程
 */

// 战斗单位类型
class BattleUnit {
  constructor(id, name, number, hp, maxHp, attack, isPlayerUnit) {
    this.id = id;
    this.name = name;
    this.number = number;
    this.hp = hp;
    this.maxHp = maxHp;
    this.attack = attack;
    this.isPlayerUnit = isPlayerUnit;
  }
}

// 战斗管理器
class BattleManager {
  constructor() {
    this.playerUnits = [];
    this.enemyUnits = [];
    this.battleOrder = [];
    this.battleLogs = [];
    this.logFile = 'src/battle_output.txt';

    // 创建或清空日志文件
    fs.writeFileSync(this.logFile, '===== 战斗测试日志 =====\n\n', 'utf8');
  }

  // 添加战斗日志
  addBattleLog(log) {
    const timestamp = new Date().toLocaleTimeString();
    const logWithTime = `[${timestamp}] ${log}`;
    this.battleLogs.push(logWithTime);
    console.log(logWithTime);
    
    // 将日志写入文件
    fs.appendFileSync(this.logFile, logWithTime + '\n', 'utf8');
  }

  // 添加玩家单位
  addPlayerUnit(unit) {
    this.playerUnits.push(unit);
    this.addBattleLog(`添加玩家单位: ${unit.name}, 生命=${unit.hp}/${unit.maxHp}, 攻击=${unit.attack}`);
  }

  // 添加敌人单位
  addEnemyUnit(unit) {
    this.enemyUnits.push(unit);
    this.addBattleLog(`添加敌方单位: ${unit.name}, 生命=${unit.hp}/${unit.maxHp}, 攻击=${unit.attack}`);
  }

  // 生成敌人
  spawnEnemies() {
    this.addBattleLog('开始生成敌人单位...');
    
    // 生成第一关敌人 - 提升敌人生命值，增加战斗复杂性
    this.enemyUnits = [
      new BattleUnit('enemy1', '小怪1', 2, 8, 8, 2, false),
      new BattleUnit('enemy2', '小怪2', 5, 10, 10, 3, false),
      new BattleUnit('enemy3', '小怪3', 8, 6, 6, 4, false)
    ];
    
    this.addBattleLog(`成功生成${this.enemyUnits.length}个敌人：`);
    this.enemyUnits.forEach(enemy => {
      this.addBattleLog(`  - ${enemy.name}：编号=${enemy.number}, 生命=${enemy.hp}/${enemy.maxHp}, 攻击=${enemy.attack}`);
    });
  }

  // 计算战斗顺序
  calculateBattleOrder() {
    this.battleOrder = [...this.playerUnits, ...this.enemyUnits].sort((a, b) => a.id - b.id);
    this.addBattleLog("计算战斗顺序:");
    this.battleOrder.forEach((unit, index) => {
      const unitType = this.playerUnits.includes(unit) ? "玩家单位" : "敌方单位";
      this.addBattleLog(`  ${index + 1}. ${unitType} ${unit.name} (ID: ${unit.id})`);
    });
  }

  // 选择攻击目标
  selectTarget(attacker) {
    const targets = attacker.isPlayerUnit ? this.enemyUnits : this.playerUnits;
    const aliveTargets = targets.filter(unit => unit.hp > 0);
    
    if (aliveTargets.length === 0) return null;
    
    // 更智能的目标选择逻辑：
    if (attacker.isPlayerUnit) {
      // 玩家优先攻击生命值低的敌人
      return aliveTargets.sort((a, b) => a.hp - b.hp)[0];
    } else {
      // 敌人优先攻击攻击力高的玩家单位
      return aliveTargets.sort((a, b) => b.attack - a.attack)[0];
    }
  }

  // 执行单位攻击
  executeUnitAttack(attacker) {
    const target = this.selectTarget(attacker);
    
    if (!target) {
      this.addBattleLog(`${attacker.name} 没有找到有效的攻击目标`);
      return;
    }
    
    const attackerType = attacker.isPlayerUnit ? '玩家' : '敌方';
    const targetType = target.isPlayerUnit ? '玩家' : '敌方';
    
    this.addBattleLog(`${attackerType}单位 ${attacker.name} 攻击 ${targetType}单位 ${target.name}`);
    
    const baseAttack = attacker.attack;
    const originalHp = target.hp;
    
    // 计算实际伤害（考虑防御等因素）
    let actualDamage = baseAttack;
    
    // 应用护甲/防御减伤（如果有）
    if (target.defense !== undefined && target.defense > 0) {
      const absorbedDamage = Math.min(target.defense, actualDamage);
      actualDamage -= absorbedDamage;
    }
    
    // 应用伤害
    target.hp -= actualDamage;
    
    if (target.hp < 0) target.hp = 0;
    
    this.addBattleLog(`${attacker.name} 造成 ${actualDamage} 点伤害，${target.name} 生命值从 ${originalHp} 降至 ${target.hp}`);
    
    if (target.hp <= 0) {
      this.addBattleLog(`${target.name} 被击败！`);
    }
  }

  // 检查战斗是否结束
  checkBattleFinished() {
    const allEnemiesDead = this.enemyUnits.every(unit => unit.hp <= 0);
    const allPlayerUnitsDead = this.playerUnits.every(unit => unit.hp <= 0);
    
    return allEnemiesDead || allPlayerUnitsDead;
  }

  // 执行战斗回合
  executeBattleRounds() {
    this.addBattleLog('开始执行战斗回合...');
    
    // 执行回合直到战斗结束
    let round = 1;
    
    while (!this.checkBattleFinished() && round <= 10) {
      this.addBattleLog(`\n============= 回合 ${round} =============`);
      
      // 显示当前单位状态
      this.addBattleLog("当前战场状态：");
      this.addBattleLog("玩家单位：");
      this.playerUnits.forEach(unit => {
        if (unit.hp > 0) {
          this.addBattleLog(`  ${unit.name}：生命=${unit.hp}/${unit.maxHp}, 攻击=${unit.attack}`);
        } else {
          this.addBattleLog(`  ${unit.name}：已战败`);
        }
      });
      
      this.addBattleLog("敌方单位：");
      this.enemyUnits.forEach(unit => {
        if (unit.hp > 0) {
          this.addBattleLog(`  ${unit.name}：生命=${unit.hp}/${unit.maxHp}, 攻击=${unit.attack}`);
        } else {
          this.addBattleLog(`  ${unit.name}：已战败`);
        }
      });
      
      // 遍历战斗顺序列表，执行每个单位的行动
      for (const unit of this.battleOrder) {
        // 跳过已经死亡的单位
        if (unit.hp <= 0) {
          this.addBattleLog(`${unit.name} 已经战败，跳过其行动`);
          continue;
        }
        
        const unitType = unit.isPlayerUnit ? '玩家' : '敌方';
        this.addBattleLog(`轮到 ${unitType}单位 ${unit.name}（编号=${unit.number}）行动`);
        
        this.executeUnitAttack(unit);
        
        if (this.checkBattleFinished()) {
          this.addBattleLog('战斗结束，某一方已全部战败');
          break;
        }
      }
      
      // 增加回合数
      round++;
      
      // 在回合结束时添加分隔符
      this.addBattleLog("=================================");
    }
    
    // 如果达到最大回合数但战斗还未结束
    if (!this.checkBattleFinished()) {
      this.addBattleLog('战斗已经进行了10个回合，强制结束');
    }
  }

  // 检查战斗结果
  checkBattleResult() {
    const allEnemiesDead = this.enemyUnits.every(unit => unit.hp <= 0);
    
    if (allEnemiesDead) {
      this.addBattleLog('战斗胜利！所有敌人已被击败');
    } else {
      const allPlayerUnitsDead = this.playerUnits.every(unit => unit.hp <= 0);
      
      if (allPlayerUnitsDead) {
        this.addBattleLog('战斗失败！所有玩家单位已被击败');
      } else {
        this.addBattleLog('战斗回合结束，未分出胜负');
      }
    }
  }

  // 打印战斗总结
  printBattleSummary() {
    console.log('\n========= 战斗总结 =========');
    
    console.log('存活的玩家单位:');
    const alivePlayerUnits = this.playerUnits.filter(unit => unit.hp > 0);
    if (alivePlayerUnits.length === 0) {
      console.log('  无');
    } else {
      alivePlayerUnits.forEach(unit => {
        console.log(`  - ${unit.name}: 剩余生命 ${unit.hp}/${unit.maxHp}`);
      });
    }
    
    console.log('\n存活的敌方单位:');
    const aliveEnemyUnits = this.enemyUnits.filter(unit => unit.hp > 0);
    if (aliveEnemyUnits.length === 0) {
      console.log('  无');
    } else {
      aliveEnemyUnits.forEach(unit => {
        console.log(`  - ${unit.name}: 剩余生命 ${unit.hp}/${unit.maxHp}`);
      });
    }
  }

  // 执行战斗
  executeBattle() {
    this.addBattleLog('------- 战斗开始 -------');
    
    this.calculateBattleOrder();
    this.executeBattleRounds();
    this.checkBattleResult();
    
    this.addBattleLog('------- 战斗结束 -------');
    
    this.printBattleSummary();
  }
}

// 运行测试
function runBattleTest() {
  console.log('===============================');
  console.log('区域战斗系统测试');
  console.log('===============================');
  
  const battleManager = new BattleManager();
  
  // 添加玩家单位
  const playerUnits = [
    new BattleUnit('player1', '战士', 1, 10, 10, 3, true),
    new BattleUnit('player2', '弓箭手', 3, 7, 7, 4, true),
    new BattleUnit('player3', '法师', 7, 5, 5, 6, true)
  ];
  
  // 将玩家单位添加到战场
  playerUnits.forEach(unit => battleManager.addPlayerUnit(unit));
  
  // 生成敌人
  battleManager.spawnEnemies();
  
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
  battleManager.executeBattle();
  
  console.log('\n===============================');
  console.log('测试完成');
  console.log('===============================');
}

// 运行测试
runBattleTest(); 