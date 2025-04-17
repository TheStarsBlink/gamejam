/**
 * SpellCard 类 - 法术卡牌
 * 
 * 表示可以产生即时效果的法术卡牌
 */

import { Card, CardRarity, CardType } from '../Card';
import { GameManager } from '../GameManager';

export enum TargetType {
  NONE = 'none',       // 无需目标
  ALLIED = 'allied',   // 友方单位
  ENEMY = 'enemy',     // 敌方单位
  ALL = 'all',         // 所有单位
  GRID = 'grid'        // 棋盘格子
}

export class SpellCard extends Card {
  private _targetType: TargetType;
  private _effectHandler: (targetIndex?: number) => boolean;
  
  constructor(
    id: string,
    name: string,
    description: string,
    cost: number,
    rarity: CardRarity,
    image: string,
    targetType: TargetType,
    effectHandler: (targetIndex?: number) => boolean
  ) {
    super(id, name, description, cost, 'spell', rarity, image, 0);
    this._targetType = targetType;
    this._effectHandler = effectHandler;
  }
  
  /**
   * 使用法术卡牌
   * @param targetIndex 目标索引（如果需要的话）
   * @returns 是否成功使用
   */
  public play(targetIndex?: number): boolean {
    if (!this.canPlay(targetIndex)) {
      return false;
    }
    
    const gameManager = GameManager.getInstance();
    const player = gameManager.player;
    
    // 消耗能量
    if (!player.useEnergy(this.cost)) {
      gameManager.showMessage('能量不足！');
      return false;
    }
    
    // 执行法术效果
    const success = this._effectHandler(targetIndex);
    
    if (success) {
      // 显示法术使用消息
      gameManager.showMessage(`使用了 ${this.name}`);
    }
    
    return success;
  }
  
  /**
   * 检查是否可以使用该法术
   * @param targetIndex 目标索引（如果需要的话）
   * @returns 是否可以使用
   */
  public canPlay(targetIndex?: number): boolean {
    const gameManager = GameManager.getInstance();
    
    // 检查游戏阶段是否允许使用法术
    if (gameManager.phase !== 'deployment' && gameManager.phase !== 'battle') {
      return false;
    }
    
    // 检查玩家能量是否足够
    if (gameManager.player.energy < this.cost) {
      return false;
    }
    
    // 检查目标是否合法
    if (this._targetType !== TargetType.NONE && targetIndex === undefined) {
      return false;
    }
    
    // 法术需要目标，检查目标是否合法
    if (targetIndex !== undefined) {
      const gridSystem = gameManager.gridSystem;
      
      // 根据目标类型检查是否合法
      switch (this._targetType) {
        case TargetType.ALLIED:
          return gridSystem.hasAlliedUnitAt(targetIndex);
        case TargetType.ENEMY:
          return gridSystem.hasEnemyUnitAt(targetIndex);
        case TargetType.ALL:
          return gridSystem.hasUnitAt(targetIndex);
        case TargetType.GRID:
          return gridSystem.isValidGridIndex(targetIndex);
        default:
          return true;
      }
    }
    
    return true;
  }
  
  /**
   * 创建卡牌的克隆
   * @returns 新的卡牌实例
   */
  public clone(): Card {
    return new SpellCard(
      this.id + '_' + Date.now(), // 创建唯一ID
      this.name,
      this.description,
      this.cost,
      this.rarity,
      this.image,
      this._targetType,
      this._effectHandler
    );
  }
  
  /**
   * 重写toJSON方法，添加法术特有属性
   */
  public toJSON(): object {
    return {
      ...super.toJSON(),
      targetType: this._targetType
    };
  }
  
  // Getters
  get targetType(): TargetType { return this._targetType; }
} 