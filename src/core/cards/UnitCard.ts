/**
 * UnitCard 类 - 单位卡牌
 * 
 * 表示可部署在棋盘上的单位卡牌
 */

import { Card, CardRarity, CardType } from '../Card';
import { GameManager } from '../GameManager';

export class UnitCard extends Card {
  private _hp: number;
  private _maxHp: number;
  private _atk: number;
  private _traits: string[] = [];
  
  constructor(
    id: string,
    name: string,
    description: string,
    cost: number,
    rarity: CardRarity,
    image: string,
    hp: number,
    atk: number,
    traits: string[] = []
  ) {
    super(id, name, description, cost, 'unit', rarity, image, 0);
    this._hp = hp;
    this._maxHp = hp;
    this._atk = atk;
    this._traits = traits;
  }
  
  /**
   * 部署单位到棋盘
   * @param targetIndex 目标格子索引
   * @returns 是否部署成功
   */
  public play(targetIndex?: number): boolean {
    if (targetIndex === undefined || !this.canPlay(targetIndex)) {
      return false;
    }
    
    const gameManager = GameManager.getInstance();
    const player = gameManager.player;
    const gridSystem = gameManager.gridSystem;
    
    // 消耗能量
    if (!player.useEnergy(this.cost)) {
      gameManager.showMessage('能量不足！');
      return false;
    }
    
    // 部署单位到目标格子
    const success = gridSystem.deployUnit(this, targetIndex);
    
    if (success) {
      // 显示部署消息
      gameManager.showMessage(`部署了 ${this.name}`);
    }
    
    return success;
  }
  
  /**
   * 检查是否可以在目标格子部署单位
   * @param targetIndex 目标格子索引
   * @returns 是否可以部署
   */
  public canPlay(targetIndex?: number): boolean {
    if (targetIndex === undefined) {
      return false;
    }
    
    const gameManager = GameManager.getInstance();
    
    // 检查游戏阶段是否为部署阶段
    if (gameManager.phase !== 'deployment') {
      return false;
    }
    
    // 检查玩家能量是否足够
    if (gameManager.player.energy < this.cost) {
      return false;
    }
    
    // 检查目标格子是否可用
    return gameManager.gridSystem.canDeployUnitAt(targetIndex);
  }
  
  /**
   * 创建卡牌的克隆
   * @returns 新的卡牌实例
   */
  public clone(): Card {
    return new UnitCard(
      this.id + '_' + Date.now(), // 创建唯一ID
      this.name,
      this.description,
      this.cost,
      this.rarity,
      this.image,
      this._hp,
      this._atk,
      [...this._traits]
    );
  }
  
  /**
   * 重写toJSON方法，添加单位特有属性
   */
  public toJSON(): object {
    return {
      ...super.toJSON(),
      hp: this._hp,
      maxHp: this._maxHp,
      atk: this._atk,
      traits: this._traits
    };
  }
  
  // Getters
  get hp(): number { return this._hp; }
  get maxHp(): number { return this._maxHp; }
  get atk(): number { return this._atk; }
  get traits(): string[] { return [...this._traits]; }
  
  // Setters
  set hp(value: number) { this._hp = Math.max(0, Math.min(this._maxHp, value)); }
  set maxHp(value: number) { this._maxHp = value; this._hp = Math.min(this._hp, this._maxHp); }
  set atk(value: number) { this._atk = value; }
} 