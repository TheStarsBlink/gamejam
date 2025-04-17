/**
 * Card 类 - 卡牌基类
 * 
 * 所有卡牌类型的基类，定义共有属性和方法
 */

export type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type CardType = 'unit' | 'spell' | 'buff';

export abstract class Card {
  private _id: string;
  private _name: string;
  private _description: string;
  private _cost: number;
  private _type: CardType;
  private _rarity: CardRarity;
  private _image: string;
  private _value: number;
  
  constructor(
    id: string,
    name: string,
    description: string,
    cost: number,
    type: CardType,
    rarity: CardRarity,
    image: string,
    value: number
  ) {
    this._id = id;
    this._name = name;
    this._description = description;
    this._cost = cost;
    this._type = type;
    this._rarity = rarity;
    this._image = image;
    this._value = value;
  }
  
  /**
   * 卡牌使用效果，由子类实现
   * @param targetIndex 目标索引（可选，-1表示无目标）
   * @returns 是否使用成功
   */
  public abstract play(targetIndex?: number): boolean;
  
  /**
   * 检查卡牌在指定位置是否可以使用
   * @param targetIndex 目标索引（可选）
   * @returns 是否可以使用
   */
  public abstract canPlay(targetIndex?: number): boolean;
  
  /**
   * 获取卡牌副本
   */
  public abstract clone(): Card;
  
  /**
   * 创建卡牌的JSON表示，用于序列化
   */
  public toJSON(): object {
    return {
      id: this._id,
      name: this._name,
      description: this._description,
      cost: this._cost,
      type: this._type,
      rarity: this._rarity,
      image: this._image,
      value: this._value
    };
  }
  
  // Getters
  get id(): string { return this._id; }
  get name(): string { return this._name; }
  get description(): string { return this._description; }
  get cost(): number { return this._cost; }
  get type(): CardType { return this._type; }
  get rarity(): CardRarity { return this._rarity; }
  get image(): string { return this._image; }
  get value(): number { return this._value; }
} 