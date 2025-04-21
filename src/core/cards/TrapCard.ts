/**
 * TrapCard 类 - 陷阱卡牌
 * 
 * 表示一种特殊类型的卡牌，可以在满足特定条件时自动触发效果
 */

import { Card, CardRarity } from '../Card';
import { GameManager } from '../GameManager';

// 陷阱触发类型枚举
export enum TriggerType {
  TURN_START = 'turn_start',   // 回合开始时触发
  TURN_END = 'turn_end',       // 回合结束时触发
  BATTLE_START = 'battle_start', // 战斗开始时触发
  BATTLE_END = 'battle_end',   // 战斗结束时触发
  CARD_PLAYED = 'card_played', // 打出卡牌时触发
  UNIT_DEPLOY = 'unit_deploy', // 部署单位时触发
  UNIT_DEATH = 'unit_death',   // 单位死亡时触发
  DAMAGE_TAKEN = 'damage_taken', // 受到伤害时触发
}

export class TrapCard extends Card {
  private _triggerType: TriggerType;
  private _duration: number; // 持续回合数
  private _effect: (data?: any) => void; // 陷阱效果函数
  
  constructor(
    id: string,
    name: string,
    description: string,
    cost: number,
    rarity: CardRarity,
    image: string,
    triggerType: TriggerType,
    duration: number,
    effect: (data?: any) => void
  ) {
    super(id, name, description, cost, 'trap', rarity, image, 0);
    this._triggerType = triggerType;
    this._duration = duration;
    this._effect = effect;
  }
  
  /**
   * 添加陷阱到游戏中
   * 会注册到GameManager的陷阱列表中
   */
  public deploy(): void {
    // 添加到陷阱列表
    GameManager.getInstance().addTrap(this);
  }
  
  /**
   * 触发陷阱效果
   * @param data 触发时的相关数据
   */
  public trigger(data?: any): void {
    // 执行效果
    this._effect(data);
    
    // 如果是一次性陷阱，使用后移除
    if (this._duration <= 0) {
      this.remove();
    }
  }
  
  /**
   * 移除陷阱
   */
  public remove(): void {
    GameManager.getInstance().removeTrap(this);
  }
  
  /**
   * 减少持续时间
   * @returns 减少后的持续时间
   */
  public decreaseDuration(): number {
    this._duration = Math.max(0, this._duration - 1);
    return this._duration;
  }
  
  /**
   * 复制卡牌
   * @returns 一个新的TrapCard实例，具有相同的属性
   */
  public clone(): TrapCard {
    return new TrapCard(
      this.id,
      this.name,
      this.description,
      this.cost,
      this.rarity,
      this.image,
      this._triggerType,
      this._duration,
      this._effect
    );
  }
  
  // Getters
  get triggerType(): TriggerType { return this._triggerType; }
  get duration(): number { return this._duration; }
  
  // Setters
  set duration(value: number) { this._duration = Math.max(0, value); }
} 