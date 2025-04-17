/**
 * Player 类 - 玩家信息管理
 * 
 * 封装玩家的属性和行为，如生命值、能量、护甲等
 */

export class Player {
  private _hp: number = 30;
  private _maxHp: number = 30;
  private _atk: number = 2;
  private _armor: number = 0;
  private _gold: number = 0;
  private _energy: number = 3;
  private _maxEnergy: number = 3;

  /**
   * 重置玩家状态为默认值
   */
  public reset(): void {
    this._hp = 30;
    this._maxHp = 30;
    this._atk = 2;
    this._armor = 0;
    this._gold = 0;
    this._energy = 3;
    this._maxEnergy = 3;
  }

  /**
   * 消耗能量
   * @param amount 要消耗的能量数量
   * @returns 是否成功消耗
   */
  public useEnergy(amount: number): boolean {
    if (this._energy >= amount) {
      this._energy -= amount;
      return true;
    }
    return false;
  }

  /**
   * 恢复能量到最大值
   */
  public resetEnergy(): void {
    this._energy = this._maxEnergy;
  }

  /**
   * 增加玩家最大能量
   * @param amount 增加的能量上限
   */
  public increaseMaxEnergy(amount: number): void {
    this._maxEnergy += amount;
    this._energy = this._maxEnergy;
  }

  /**
   * 受到伤害
   * @param damage 伤害值
   * @returns 实际受到的伤害
   */
  public takeDamage(damage: number): number {
    // 护甲减伤
    let actualDamage = damage;
    
    if (this._armor > 0) {
      const absorbedDamage = Math.min(this._armor, damage);
      this._armor -= absorbedDamage;
      actualDamage -= absorbedDamage;
    }
    
    // 应用伤害
    if (actualDamage > 0) {
      this._hp = Math.max(0, this._hp - actualDamage);
    }
    
    return actualDamage;
  }

  /**
   * 恢复生命值
   * @param amount 要恢复的生命值
   */
  public heal(amount: number): void {
    this._hp = Math.min(this._maxHp, this._hp + amount);
  }

  /**
   * 增加护甲
   * @param amount 增加的护甲值
   */
  public addArmor(amount: number): void {
    this._armor += amount;
  }

  /**
   * 增加金币
   * @param amount 增加的金币数量
   */
  public addGold(amount: number): void {
    this._gold += amount;
  }

  /**
   * 消费金币
   * @param amount 要消费的金币数量
   * @returns 是否成功消费
   */
  public spendGold(amount: number): boolean {
    if (this._gold >= amount) {
      this._gold -= amount;
      return true;
    }
    return false;
  }

  /**
   * 检查玩家是否已死亡
   */
  public isDead(): boolean {
    return this._hp <= 0;
  }

  // Getters and setters
  get hp(): number { return this._hp; }
  get maxHp(): number { return this._maxHp; }
  get atk(): number { return this._atk; }
  get armor(): number { return this._armor; }
  get gold(): number { return this._gold; }
  get energy(): number { return this._energy; }
  get maxEnergy(): number { return this._maxEnergy; }
  
  set hp(value: number) { this._hp = Math.max(0, Math.min(this._maxHp, value)); }
  set maxHp(value: number) { this._maxHp = value; this._hp = Math.min(this._hp, this._maxHp); }
  set atk(value: number) { this._atk = value; }
  set armor(value: number) { this._armor = Math.max(0, value); }
} 