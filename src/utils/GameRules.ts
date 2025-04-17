/**
 * 游戏规则工具类
 * 包含单位规则、牌库规则和战斗规则的定义和相关逻辑
 */

import { Card } from '../types/Card';
import { Unit } from '../types/Unit';

export enum UnitType {
  NEUTRAL = 'neutral',
  FRIENDLY = 'friendly',
  ENEMY = 'enemy'
}

export class GameRules {
  /**
   * 判断单位的战斗顺序
   * 按照角色数字编号来判断，多个数字编号按最小算，相同数字编号按我方-中立-敌方算
   * @param units 需要排序的单位数组
   * @returns 排序后的单位数组
   */
  static sortUnitsByBattleOrder(units: Unit[]): Unit[] {
    return [...units].sort((a, b) => {
      // 获取最小编号
      const aMinNumber = Math.min(...a.numbers);
      const bMinNumber = Math.min(...b.numbers);
      
      // 先按最小编号排序
      if (aMinNumber !== bMinNumber) {
        return aMinNumber - bMinNumber;
      }
      
      // 如果最小编号相同，按照类型排序：我方 - 中立 - 敌方
      const typeOrder = {
        [UnitType.FRIENDLY]: 0,
        [UnitType.NEUTRAL]: 1, 
        [UnitType.ENEMY]: 2
      };
      
      return typeOrder[a.type] - typeOrder[b.type];
    });
  }
  
  /**
   * 检查单位是否可以放置在指定位置
   * @param board 当前棋盘状态
   * @param row 行
   * @param col 列
   * @returns 是否可以放置
   */
  static canPlaceUnit(board: (Unit | null)[][], row: number, col: number): boolean {
    // 检查是否超出边界
    if (row < 0 || row >= 9 || col < 0 || col >= 9) {
      return false;
    }
    
    // 检查是否已被敌方单位或中立单位占据
    const existingUnit = board[row][col];
    if (existingUnit && (existingUnit.type === UnitType.ENEMY || existingUnit.type === UnitType.NEUTRAL)) {
      return false;
    }
    
    return true;
  }
  
  /**
   * 抽牌规则：从牌库中抽取指定数量的牌
   * @param deck 牌库
   * @param count 抽牌数量，默认为3
   * @returns 抽取的牌数组
   */
  static drawCards(deck: Card[], count: number = 3): Card[] {
    // 如果牌库为空，返回空数组
    if (deck.length === 0) {
      return [];
    }
    
    // 抽取指定数量的牌或者牌库中剩余的所有牌
    const actualCount = Math.min(count, deck.length);
    return deck.splice(0, actualCount);
  }
  
  /**
   * 打牌规则：使用一张牌，丢弃其他两张
   * @param hand 手牌
   * @param selectedIndex 选择使用的牌的索引
   * @param discard 弃牌堆
   * @returns 使用的牌
   */
  static playCard(hand: Card[], selectedIndex: number, discard: Card[]): Card | null {
    if (selectedIndex < 0 || selectedIndex >= hand.length) {
      return null;
    }
    
    // 使用选中的牌
    const playedCard = hand[selectedIndex];
    
    // 将其他牌放入弃牌堆
    for (let i = 0; i < hand.length; i++) {
      if (i !== selectedIndex) {
        discard.push(hand[i]);
      }
    }
    
    // 清空手牌
    hand.length = 0;
    
    return playedCard;
  }
  
  /**
   * 补牌规则：战斗结束后，将弃牌堆洗入牌库
   * @param deck 牌库
   * @param discard 弃牌堆
   */
  static refillDeck(deck: Card[], discard: Card[]): void {
    // 随机打乱弃牌堆
    const shuffledDiscard = this.shuffleArray([...discard]);
    
    // 将弃牌堆的牌添加到牌库底部
    deck.push(...shuffledDiscard);
    
    // 清空弃牌堆
    discard.length = 0;
  }
  
  /**
   * 随机打乱数组
   * @param array 需要打乱的数组
   * @returns 打乱后的新数组
   */
  static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
} 