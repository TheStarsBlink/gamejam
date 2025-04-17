/**
 * 游戏类型定义
 * 统一导出类型，避免多重定义导致的类型冲突
 */
import { UnitType as GameRulesUnitType } from '../utils/GameRules';
import { Card, CardType, CardRarity, SpellEffectType } from '../types/Card';

// 导出统一的类型
export { Card, CardType, CardRarity, SpellEffectType };

// 单位类型导出 - 使用字符串联合类型避免冲突
export type UnitType = 'friendly' | 'enemy' | 'neutral';

/**
 * 数独单位接口
 */
export interface SudokuUnit {
  // 单位ID
  id: string;
  
  // 单位名称
  name: string;
  
  // 单位类型
  type: UnitType;
  
  // 数字编号（可以有多个）
  numbers: number[];
  
  // 当前生命值
  hp: number;
  
  // 最大生命值
  maxHp: number;
  
  // 攻击力
  attack: number;
  
  // 防御力
  defense: number;
  
  // 单位图像
  image: string;
  
  // 特殊能力
  abilities?: string[];
  
  // 单位描述
  description: string;
} 