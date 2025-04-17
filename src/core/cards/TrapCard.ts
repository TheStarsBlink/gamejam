/**
 * TrapCard 类 - 陷阱卡牌
 * 
 * 表示可以放置在棋盘上等待触发条件的陷阱卡牌
 */

import { Card, CardRarity } from '../Card';
import { GameManager } from '../GameManager';

// 陷阱触发类型
export enum TriggerType {
  ENEMY_DEPLOY = 'enemy_deploy',   // 敌人部署单位时
  ENEMY_ATTACK = 'enemy_attack',   // 敌人攻击时
  TURN_START = 'turn_start',       // 回合开始时
  TURN_END = 'turn_end',           // 回合结束时
  DAMAGE_TAKEN = 'damage_taken'    // 受到伤害时
}

export class TrapCard extends Card {
  private _triggerType: TriggerType;
  private _duration: number;        // 持续回合数，-1表示永久
  private _currentDuration: number; // 当前剩余回合数
  private _gridPosition: number | null = null;
  private _effectHandler: (triggerData?: any) => boolean;
  private _isActive: boolean = false;
  
  constructor(
    id: string,
    name: string,
    description: string,
    cost: number,
    rarity: CardRarity,
    image: string,
    triggerType: TriggerType,
    duration: number,
    effectHandler: (triggerData?: any) => boolean
  ) {
    super(id, name, description, cost, 'trap', rarity, image, 0);
    this._triggerType = triggerType;
    this._duration = duration;
    this._currentDuration = duration;
    this._effectHandler = effectHandler;
  }
  
  /**
   * 部署陷阱卡到棋盘
   * @param gridIndex 格子索引
   * @returns 是否成功部署
   */
  public play(gridIndex: number): boolean {
    if (!this.canPlay(gridIndex)) {
      return false;
    }
    
    const gameManager = GameManager.getInstance();
    const player = gameManager.player;
    
    // 消耗能量
    if (!player.useEnergy(this.cost)) {
      gameManager.showMessage('能量不足！');
      return false;
    }
    
    // 部署陷阱
    this._gridPosition = gridIndex;
    this._isActive = true;
    this._currentDuration = this._duration;
    
    // 将陷阱添加到游戏管理器的陷阱列表中
    gameManager.addTrap(this);
    
    // 显示部署消息
    gameManager.showMessage(`部署了陷阱 ${this.name}`);
    
    return true;
  }
  
  /**
   * 检查是否可以部署陷阱
   * @param gridIndex 格子索引
   * @returns 是否可以部署
   */
  public canPlay(gridIndex: number): boolean {
    const gameManager = GameManager.getInstance();
    
    // 检查游戏阶段是否允许部署陷阱
    if (gameManager.phase !== 'deployment') {
      return false;
    }
    
    // 检查玩家能量是否足够
    if (gameManager.player.energy < this.cost) {
      return false;
    }
    
    // 检查格子是否有效
    const gridSystem = gameManager.gridSystem;
    if (!gridSystem.isValidGridIndex(gridIndex)) {
      return false;
    }
    
    // 检查格子是否为空
    if (gridSystem.hasUnitAt(gridIndex) || gridSystem.hasTrapAt(gridIndex)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 触发陷阱效果
   * @param triggerData 触发时的相关数据
   * @returns 是否成功触发
   */
  public trigger(triggerData?: any): boolean {
    if (!this._isActive) {
      return false;
    }
    
    const success = this._effectHandler(triggerData);
    
    if (success) {
      const gameManager = GameManager.getInstance();
      gameManager.showMessage(`触发了陷阱 ${this.name}！`);
      
      // 如果是一次性陷阱，触发后移除
      if (this._duration === 1) {
        this.deactivate();
      }
    }
    
    return success;
  }
  
  /**
   * 减少陷阱持续时间
   */
  public decreaseDuration(): void {
    // 永久陷阱不减少持续时间
    if (this._duration === -1) return;
    
    this._currentDuration--;
    
    // 持续时间结束，移除陷阱
    if (this._currentDuration <= 0) {
      this.deactivate();
    }
  }
  
  /**
   * 停用陷阱
   */
  public deactivate(): void {
    if (!this._isActive) return;
    
    this._isActive = false;
    this._gridPosition = null;
    
    // 从游戏管理器中移除
    const gameManager = GameManager.getInstance();
    gameManager.removeTrap(this);
  }
  
  /**
   * 创建卡牌的克隆
   * @returns 新的卡牌实例
   */
  public clone(): Card {
    return new TrapCard(
      this.id + '_' + Date.now(), // 创建唯一ID
      this.name,
      this.description,
      this.cost,
      this.rarity,
      this.image,
      this._triggerType,
      this._duration,
      this._effectHandler
    );
  }
  
  /**
   * 重写toJSON方法，添加陷阱特有属性
   */
  public toJSON(): object {
    return {
      ...super.toJSON(),
      triggerType: this._triggerType,
      duration: this._duration,
      currentDuration: this._currentDuration,
      gridPosition: this._gridPosition,
      isActive: this._isActive
    };
  }
  
  // Getters
  get triggerType(): TriggerType { return this._triggerType; }
  get duration(): number { return this._duration; }
  get currentDuration(): number { return this._currentDuration; }
  get gridPosition(): number | null { return this._gridPosition; }
  get isActive(): boolean { return this._isActive; }
} 