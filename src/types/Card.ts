/**
 * 卡牌接口定义
 * 包含卡牌ID、名称、类型、效果等属性
 */
export interface Card {
    // 卡牌ID
    id: string;
    
    // 卡牌名称
    name: string;
    
    // 卡牌描述
    description: string;
    
    // 卡牌费用
    cost: number;
    
    // 卡牌类型（单位卡、法术卡等）
    type: 'unit' | 'spell' | 'buff';
    
    // 卡牌稀有度
    rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
    
    // 卡牌图像
    image: string;
    
    // 卡牌值
    value: number;
    
    // 单位卡特有属性
    hp?: number;
    atk?: number;
}

/**
 * 卡牌类型枚举
 */
export type CardType = 'unit' | 'spell' | 'buff';

/**
 * 卡牌稀有度枚举
 */
export type CardRarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

/**
 * 法术效果类型枚举
 */
export type SpellEffectType = 'damage' | 'heal' | 'buff' | 'debuff';

/**
 * 随从卡接口
 */
export interface MinionCard extends Card {
    type: 'unit';
    hp: number;
    atk: number;
    armor?: number;
    traits?: string[];
}

/**
 * 法术卡接口
 */
export interface SpellCard extends Card {
    type: 'spell';
    damage?: number;
    healing?: number;
    duration?: number;
    targetType?: 'single' | 'area' | 'all' | 'none';
}

/**
 * 强化卡接口
 */
export interface BuffCard extends Card {
    type: 'buff';
    atkBonus?: number;
    armorBonus?: number;
    hpBonus?: number;
    duration: number;
} 