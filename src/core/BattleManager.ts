/**
 * BattleManager 类 - 战斗管理器
 * 
 * 负责处理战斗逻辑，包括行动顺序计算、攻击处理、战斗结算等
 */

import { EventSystem } from './events/EventSystem';
import { GridSystem } from './GridSystem';
import { Player } from './Player';
import { TriggerType } from './cards/TrapCard';
import { GameManager } from './GameManager';

// 战斗单位接口，表示参与战斗的单位
export interface BattleUnit {
  id: string;          // 单位唯一ID
  name: string;        // 单位名称
  number: number;      // 单位数字编号（用于决定行动顺序）
  hp: number;          // 当前生命值
  maxHp: number;       // 最大生命值
  attack: number;      // 攻击力
  isPlayerUnit: boolean; // 是否是玩家单位（用于区分敌我）
  isAlive: boolean;    // 是否存活
  // 可以根据需要添加更多属性，如技能、防御力等
}

export class BattleManager {
  private _eventSystem: EventSystem;
  private _gridSystem: GridSystem;
  private _playerUnits: BattleUnit[] = [];  // 玩家单位列表
  private _enemyUnits: BattleUnit[] = [];   // 敌方单位列表
  private _battleOrder: BattleUnit[] = [];  // 战斗顺序列表
  private _battleLogs: string[] = [];       // 战斗日志
  
  constructor(eventSystem: EventSystem, gridSystem: GridSystem) {
    this._eventSystem = eventSystem;
    this._gridSystem = gridSystem;
  }
  
  /**
   * 清空战场单位
   */
  public reset(): void {
    this._playerUnits = [];
    this._enemyUnits = [];
    this._battleOrder = [];
    this._battleLogs = [];
  }
  
  /**
   * 添加战斗日志
   * @param log 日志内容
   */
  private addBattleLog(log: string): void {
    // 添加时间戳
    const timestamp = new Date().toLocaleTimeString();
    const formattedLog = `[${timestamp}] ${log}`;
    
    // 保存日志
    this._battleLogs.push(formattedLog);
    
    // 输出到控制台
    console.log(formattedLog);
    
    // 触发日志事件，可以被UI监听并显示
    this._eventSystem.emit('battle_log', formattedLog);
  }
  
  /**
   * 根据当前关卡生成敌人
   * @param level 当前关卡
   */
  public spawnEnemies(level: number): void {
    // 清空之前的敌人
    this._enemyUnits = [];
    
    this.addBattleLog(`开始生成第${level}关的敌人单位...`);
    
    // 根据关卡生成不同的敌人
    // 这里仅示例，实际游戏中可能有更复杂的敌人生成逻辑
    switch(level) {
      case 1:
        // 第一关：3个弱小敌人
        this._enemyUnits.push(
          { id: 'enemy1', name: '小怪1', number: 2, hp: 3, maxHp: 3, attack: 1, isPlayerUnit: false, isAlive: true },
          { id: 'enemy2', name: '小怪2', number: 5, hp: 4, maxHp: 4, attack: 1, isPlayerUnit: false, isAlive: true },
          { id: 'enemy3', name: '小怪3', number: 8, hp: 3, maxHp: 3, attack: 2, isPlayerUnit: false, isAlive: true }
        );
        break;
      case 2:
        // 第二关：4个中等强度敌人
        this._enemyUnits.push(
          { id: 'enemy1', name: '中等怪物1', number: 1, hp: 5, maxHp: 5, attack: 2, isPlayerUnit: false, isAlive: true },
          { id: 'enemy2', name: '中等怪物2', number: 3, hp: 4, maxHp: 4, attack: 3, isPlayerUnit: false, isAlive: true },
          { id: 'enemy3', name: '中等怪物3', number: 6, hp: 6, maxHp: 6, attack: 2, isPlayerUnit: false, isAlive: true },
          { id: 'enemy4', name: '中等怪物4', number: 9, hp: 5, maxHp: 5, attack: 3, isPlayerUnit: false, isAlive: true }
        );
        break;
      case 3:
        // 第三关：boss和小怪
        this._enemyUnits.push(
          { id: 'minion1', name: '精英怪1', number: 2, hp: 6, maxHp: 6, attack: 3, isPlayerUnit: false, isAlive: true },
          { id: 'boss', name: 'Boss', number: 5, hp: 12, maxHp: 12, attack: 4, isPlayerUnit: false, isAlive: true },
          { id: 'minion2', name: '精英怪2', number: 8, hp: 6, maxHp: 6, attack: 3, isPlayerUnit: false, isAlive: true }
        );
        break;
      default:
        // 默认生成一些基础敌人
        this._enemyUnits.push(
          { id: 'enemy1', name: '敌人1', number: 3, hp: 4, maxHp: 4, attack: 2, isPlayerUnit: false, isAlive: true },
          { id: 'enemy2', name: '敌人2', number: 6, hp: 4, maxHp: 4, attack: 2, isPlayerUnit: false, isAlive: true }
        );
    }
    
    // 记录生成的敌人信息
    this.addBattleLog(`成功生成${this._enemyUnits.length}个敌人：`);
    this._enemyUnits.forEach(enemy => {
      this.addBattleLog(`  - ${enemy.name}：编号=${enemy.number}, 生命=${enemy.hp}/${enemy.maxHp}, 攻击=${enemy.attack}`);
    });
    
    // 通知事件系统敌人已生成
    this._eventSystem.emit('enemies_spawned', this._enemyUnits);
  }
  
  /**
   * 添加玩家单位到战场
   * @param unit 要添加的玩家单位
   */
  public addPlayerUnit(unit: BattleUnit): void {
    this._playerUnits.push(unit);
    
    // 记录添加的玩家单位信息
    this.addBattleLog(`添加玩家单位：${unit.name}，编号=${unit.number}, 生命=${unit.hp}/${unit.maxHp}, 攻击=${unit.attack}`);
    
    // 通知事件系统玩家单位已添加
    this._eventSystem.emit('player_unit_added', unit);
  }
  
  /**
   * 执行战斗逻辑
   * @param player 玩家对象，用于更新玩家状态
   */
  public executeBattle(player: Player): void {
    this.addBattleLog('------- 战斗开始 -------');
    
    // 触发战斗开始事件
    GameManager.getInstance().triggerTraps(TriggerType.BATTLE_START);
    
    // 计算战斗顺序
    this.calculateBattleOrder();
    
    // 在事件系统中发布战斗开始事件
    this._eventSystem.emit('battle_started', { playerUnits: this._playerUnits, enemyUnits: this._enemyUnits });
    
    // 依次执行单位行动
    this.executeBattleRounds();
    
    // 检查战斗结果
    this.checkBattleResult(player);
    
    this.addBattleLog('------- 战斗结束 -------');
    
    // 触发战斗结束事件
    GameManager.getInstance().triggerTraps(TriggerType.BATTLE_END);
    
    // 打印完整战斗日志
    this.printBattleSummary();
  }
  
  /**
   * 计算战斗顺序：按照单位的数字编号从小到大排序
   */
  private calculateBattleOrder(): void {
    // 合并所有单位
    const allUnits = [...this._playerUnits, ...this._enemyUnits];
    
    this.addBattleLog('计算战斗顺序...');
    
    // 按照数字编号从小到大排序
    this._battleOrder = allUnits.sort((a, b) => a.number - b.number);
    
    // 记录排序后的战斗顺序
    this.addBattleLog('战斗顺序确定：');
    this._battleOrder.forEach((unit, index) => {
      const unitType = unit.isPlayerUnit ? '玩家' : '敌方';
      this.addBattleLog(`  ${index+1}. ${unitType}单位 ${unit.name}（编号=${unit.number}）`);
    });
    
    // 触发战斗顺序确定事件
    this._eventSystem.emit('battle_order_calculated', this._battleOrder);
  }
  
  /**
   * 执行战斗回合
   */
  private executeBattleRounds(): void {
    this.addBattleLog('开始执行战斗回合...');
    
    // 遍历战斗顺序列表，执行每个单位的行动
    for (const unit of this._battleOrder) {
      // 跳过已经死亡的单位
      if (unit.hp <= 0) {
        this.addBattleLog(`${unit.name} 已经战败，跳过其行动`);
        continue;
      }
      
      const unitType = unit.isPlayerUnit ? '玩家' : '敌方';
      this.addBattleLog(`轮到 ${unitType}单位 ${unit.name}（编号=${unit.number}）行动`);
      
      // 触发单位行动开始事件
      this._eventSystem.emit('unit_action_start', unit);
      
      // 执行攻击
      this.executeUnitAttack(unit);
      
      // 触发单位行动结束事件
      this._eventSystem.emit('unit_action_end', unit);
      
      // 检查战斗是否已经结束（所有敌人死亡或所有玩家单位死亡）
      if (this.checkBattleFinished()) {
        this.addBattleLog('战斗提前结束，某一方已全部战败');
        break;
      }
    }
  }
  
  /**
   * 执行单位攻击
   * @param attacker 攻击单位
   */
  private executeUnitAttack(attacker: BattleUnit): void {
    // 确定攻击目标
    const target = this.selectTarget(attacker);
    
    // 如果没有有效目标，跳过攻击
    if (!target) {
      this.addBattleLog(`${attacker.name} 没有找到有效的攻击目标`);
      return;
    }
    
    const attackerType = attacker.isPlayerUnit ? '玩家' : '敌方';
    const targetType = target.isPlayerUnit ? '玩家' : '敌方';
    
    this.addBattleLog(`${attackerType}单位 ${attacker.name} 攻击 ${targetType}单位 ${target.name}`);
    
    // 计算伤害
    const baseAttack = attacker.attack;
    
    // 记录目标当前生命值
    const originalHp = target.hp;
    
    // 计算实际伤害（考虑护甲等因素）
    // 这里简化处理，实际情况可能更复杂
    let actualDamage = baseAttack;
    
    // 应用护甲减伤（如果目标有护甲属性）
    if (target.armor !== undefined && target.armor > 0) {
      const absorbedDamage = Math.min(target.armor, actualDamage);
      actualDamage -= absorbedDamage;
      // 如果有护甲系统，这里可以更新护甲值
      // target.armor -= absorbedDamage;
    }
    
    // 应用伤害
    target.hp -= actualDamage;
    
    // 确保生命值不会低于0，并设置死亡状态
    if (target.hp <= 0) {
        target.hp = 0;
        target.isAlive = false;
        this.addBattleLog(`${target.name} 被击败！`);
        
        // 触发单位死亡事件
        this._eventSystem.emit('unit_death', target);
    } else {
        // 记录攻击结果，使用实际伤害值
        this.addBattleLog(`${attacker.name} 造成 ${actualDamage} 点伤害，${target.name} 生命值从 ${originalHp} 降至 ${target.hp}`);
    }
    
    // 触发攻击事件
    this._eventSystem.emit('unit_attack', {
        attacker, 
        target, 
        damage: actualDamage,
        targetRemainHp: target.hp
    });
  }
  
  /**
   * 选择攻击目标
   * @param attacker 攻击单位
   * @returns 选中的目标，如果没有有效目标则返回null
   */
  private selectTarget(attacker: BattleUnit): BattleUnit | null {
    // 根据攻击者类型选择不同阵营的目标
    const possibleTargets = attacker.isPlayerUnit ? this._enemyUnits : this._playerUnits;
    
    // 筛选出存活的目标
    const aliveTargets = possibleTargets.filter(unit => unit.hp > 0);
    
    // 如果没有存活目标，返回null
    if (aliveTargets.length === 0) return null;
    
    // 这里可以实现更复杂的目标选择逻辑，例如:
    // - 随机选择
    // - 选择生命值最低的
    // - 选择攻击力最高的
    // - 等等
    
    // 简单起见，这里选择第一个存活的目标
    return aliveTargets[0];
  }
  
  /**
   * 检查战斗是否已经结束
   * @returns 如果战斗已结束返回true，否则返回false
   */
  private checkBattleFinished(): boolean {
    // 检查敌人是否全部死亡
    const allEnemiesDead = this._enemyUnits.every(unit => unit.hp <= 0);
    
    // 检查玩家单位是否全部死亡
    const allPlayerUnitsDead = this._playerUnits.every(unit => unit.hp <= 0);
    
    // 如果任一条件满足，战斗结束
    return allEnemiesDead || allPlayerUnitsDead;
  }
  
  /**
   * 检查战斗结果
   * @param player 玩家对象，用于更新玩家状态
   */
  private checkBattleResult(player: Player): void {
    // 检查敌人是否全部死亡
    const allEnemiesDead = this._enemyUnits.every(unit => unit.hp <= 0);
    
    if (allEnemiesDead) {
      // 玩家获胜
      this.addBattleLog('战斗胜利！所有敌人已被击败');
      GameManager.getInstance().handleVictory();
    } else {
      // 检查玩家单位是否全部死亡
      const allPlayerUnitsDead = this._playerUnits.every(unit => unit.hp <= 0);
      
      if (allPlayerUnitsDead) {
        // 玩家失败
        this.addBattleLog('战斗失败！所有玩家单位已被击败');
        GameManager.getInstance().handleDefeat();
      } else {
        // 战斗未决出胜负，可能是平局或者需要继续战斗
        this.addBattleLog('战斗回合结束，未分出胜负');
        // 这里可以添加额外的处理逻辑
      }
    }
  }
  
  /**
   * 打印战斗总结
   */
  private printBattleSummary(): void {
    console.log('\n========= 战斗总结 =========');
    console.log('存活的玩家单位:');
    const alivePlayerUnits = this._playerUnits.filter(unit => unit.hp > 0);
    if (alivePlayerUnits.length === 0) {
      console.log('  无');
    } else {
      alivePlayerUnits.forEach(unit => {
        console.log(`  - ${unit.name}: 剩余生命 ${unit.hp}/${unit.maxHp}`);
      });
    }
    
    console.log('存活的敌方单位:');
    const aliveEnemyUnits = this._enemyUnits.filter(unit => unit.hp > 0);
    if (aliveEnemyUnits.length === 0) {
      console.log('  无');
    } else {
      aliveEnemyUnits.forEach(unit => {
        console.log(`  - ${unit.name}: 剩余生命 ${unit.hp}/${unit.maxHp}`);
      });
    }
    
    console.log('\n战斗日志:');
    this._battleLogs.forEach(log => console.log(log));
    console.log('============================');
  }
  
  /**
   * 获取当前玩家单位列表
   */
  get playerUnits(): BattleUnit[] {
    return this._playerUnits;
  }
  
  /**
   * 获取当前敌方单位列表
   */
  get enemyUnits(): BattleUnit[] {
    return this._enemyUnits;
  }
  
  /**
   * 获取当前战斗顺序
   */
  get battleOrder(): BattleUnit[] {
    return this._battleOrder;
  }
  
  /**
   * 获取战斗日志
   */
  get battleLogs(): string[] {
    return this._battleLogs;
  }
} 