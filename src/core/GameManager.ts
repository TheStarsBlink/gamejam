/**
 * GameManager 类 - 游戏核心控制类
 * 
 * 该类为单例模式，负责管理游戏的整体状态和流程，
 * 包括游戏初始化、回合进行、阶段转换等核心逻辑
 */

import { Player } from './Player';
import { DeckManager } from './DeckManager';
import { GridSystem } from './GridSystem';
import { BattleManager } from './BattleManager';
import { EventSystem } from './events/EventSystem';
import { TrapCard, TriggerType } from './cards/TrapCard';

// 游戏阶段枚举
export enum GamePhase {
  DEPLOYMENT = 'deployment',
  BATTLE = 'battle', 
  VICTORY = 'victory',
  DEFEAT = 'defeat'
}

export class GameManager {
  private static instance: GameManager;
  
  // 游戏核心状态
  private _turn: number = 1;
  private _phase: GamePhase = GamePhase.DEPLOYMENT;
  private _currentLevel: number = 1;
  private _message: string | null = null;
  private messageTimeoutId: number | null = null;
  
  // 游戏核心系统
  private _player: Player;
  private _deckManager: DeckManager;
  private _gridSystem: GridSystem;
  private _battleManager: BattleManager;
  private _eventSystem: EventSystem;
  private _activeTraps: TrapCard[] = []; // 当前激活的陷阱卡牌列表

  // 私有构造函数，确保单例模式
  private constructor() {
    this._eventSystem = new EventSystem();
    this._player = new Player();
    this._deckManager = new DeckManager(this._eventSystem);
    this._gridSystem = new GridSystem();
    this._battleManager = new BattleManager(this._eventSystem, this._gridSystem);
  }

  /**
   * 获取GameManager实例
   */
  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  /**
   * 初始化新游戏
   */
  public startNewGame(): void {
    // 重置游戏状态
    this._turn = 1;
    this._phase = GamePhase.DEPLOYMENT;
    this._currentLevel = 1;
    
    // 初始化玩家
    this._player.reset();
    
    // 初始化牌库
    this._deckManager.initializeDeck();
    
    // 初始化棋盘
    this._gridSystem.reset(this._currentLevel);
    
    // 生成敌人
    this._battleManager.spawnEnemies(this._currentLevel);
    
    // 抽初始手牌
    this._deckManager.drawCards(3);
    
    // 清空陷阱列表
    this._activeTraps = [];
    
    // 通知游戏开始
    this.showMessage('游戏开始！');
  }

  /**
   * 结束当前回合
   */
  public endTurn(): void {
    if (this._phase === GamePhase.DEPLOYMENT) {
      // 将剩余手牌放入弃牌堆
      const remainingCards = this._deckManager.discardHand();
      if (remainingCards > 0) {
        this.showMessage('剩余手牌已放入弃牌堆');
      }
      
      // 处理回合结束触发的陷阱
      this.triggerTraps(TriggerType.TURN_END);
      
      // 减少所有陷阱的持续时间
      this.decreaseTrapsDuration();
      
      // 直接进入下一回合
      this.startNextTurn();
    }
  }

  /**
   * 开始战斗阶段
   */
  public startBattlePhase(): void {
    this._phase = GamePhase.BATTLE;
    this.showMessage('战斗开始！');
    
    // 执行战斗
    this._battleManager.executeBattle(this._player);
  }

  /**
   * 开始下一回合
   */
  private startNextTurn(): void {
    this._turn++;
    this._phase = GamePhase.DEPLOYMENT;
    
    // 恢复能量
    this._player.resetEnergy();
    
    // 抽牌
    this._deckManager.drawCards(3);
    
    // 处理回合开始触发的陷阱
    this.triggerTraps(TriggerType.TURN_START);
    
    this.showMessage(`回合 ${this._turn} 开始`);
  }

  /**
   * 处理战斗胜利
   */
  public handleVictory(): void {
    this._phase = GamePhase.VICTORY;
    this.showMessage('恭喜！你赢得了战斗！');
    
    // TODO: 处理奖励等逻辑
    
    // 如果有下一关，准备进入下一关
    if (this._currentLevel < 3) { // 假设总共有3关
      this.showMessage('准备进入下一关...');
      setTimeout(() => {
        this._currentLevel++;
        this.prepareNextBattle();
      }, 2000);
    } else {
      this.showMessage('恭喜！你通关了所有关卡！');
    }
  }

  /**
   * 处理战斗失败
   */
  public handleDefeat(): void {
    this._phase = GamePhase.DEFEAT;
    this.showMessage('你被击败了...');
    
    // 游戏结束，3秒后重新开始
    setTimeout(() => {
      this.startNewGame();
    }, 3000);
  }

  /**
   * 准备下一关战斗
   */
  private prepareNextBattle(): void {
    this._phase = GamePhase.DEPLOYMENT;
    this._turn = 1;
    
    // 恢复玩家能量
    this._player.resetEnergy();
    
    // 重置棋盘
    this._gridSystem.reset(this._currentLevel);
    
    // 生成新的敌人
    this._battleManager.spawnEnemies(this._currentLevel);
    
    // 抽牌
    this._deckManager.drawCards(3);
    
    // 清空陷阱列表
    this._activeTraps = [];
    
    this.showMessage('准备好迎接新的挑战！');
  }

  /**
   * 显示游戏消息
   * @param message 要显示的消息
   * @param duration 消息显示时间（毫秒）
   */
  public showMessage(message: string, duration: number = 3000): void {
    this._message = message;
    
    // 清除之前的计时器
    if (this.messageTimeoutId !== null) {
      clearTimeout(this.messageTimeoutId);
    }
    
    // 设置新的计时器
    this.messageTimeoutId = window.setTimeout(() => {
      this._message = null;
      this.messageTimeoutId = null;
    }, duration) as unknown as number;
    
    // 触发消息事件
    this._eventSystem.emit('message', message);
  }

  /**
   * 添加陷阱卡到激活列表
   * @param trap 陷阱卡实例
   */
  public addTrap(trap: TrapCard): void {
    this._activeTraps.push(trap);
    
    // 通知陷阱添加事件
    this._eventSystem.emit('trap_deployed', trap);
  }

  /**
   * 从激活列表中移除陷阱卡
   * @param trap 要移除的陷阱卡
   */
  public removeTrap(trap: TrapCard): void {
    const index = this._activeTraps.indexOf(trap);
    if (index !== -1) {
      this._activeTraps.splice(index, 1);
      
      // 通知陷阱移除事件
      this._eventSystem.emit('trap_removed', trap);
    }
  }

  /**
   * 根据触发类型触发所有符合条件的陷阱
   * @param triggerType 触发类型
   * @param triggerData 触发相关数据（可选）
   */
  public triggerTraps(triggerType: TriggerType, triggerData?: any): void {
    // 复制陷阱列表，因为在触发过程中可能会移除陷阱
    const traps = [...this._activeTraps];
    
    for (const trap of traps) {
      if (trap.triggerType === triggerType) {
        trap.trigger(triggerData);
      }
    }
  }

  /**
   * 减少所有陷阱的持续时间
   */
  private decreaseTrapsDuration(): void {
    // 复制陷阱列表，因为在减少持续时间过程中可能会移除陷阱
    const traps = [...this._activeTraps];
    
    for (const trap of traps) {
      trap.decreaseDuration();
    }
  }

  // Getters
  get turn(): number { return this._turn; }
  get phase(): GamePhase { return this._phase; }
  get currentLevel(): number { return this._currentLevel; }
  get message(): string | null { return this._message; }
  get player(): Player { return this._player; }
  get deckManager(): DeckManager { return this._deckManager; }
  get gridSystem(): GridSystem { return this._gridSystem; }
  get battleManager(): BattleManager { return this._battleManager; }
  get eventSystem(): EventSystem { return this._eventSystem; }
  get activeTraps(): TrapCard[] { return this._activeTraps; }
} 