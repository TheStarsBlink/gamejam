import { BuffCard } from '../types/Card';
import { CardType, CardRarity } from '../types/GameTypes';

// 基础强化卡数据
export const buffCards: BuffCard[] = [
    {
        id: 'buff_001',
        name: '力量强化',
        description: '使指定格子上的友方单位攻击力+2，持续2回合。',
        type: 'buff',
        cost: 1,
        image: 'strength',
        rarity: 'common',
        imagePath: 'assets/images/buffs/strength.png',
        atkBonus: 2,
        duration: 2,
        buffEffect: (targetId?: number) => {
            // 具体实现会在BattleScene中处理
            console.log(`对格子${targetId}施加力量强化`);
        }
    },
    {
        id: 'buff_002',
        name: '护甲强化',
        description: '使指定格子上的友方单位护甲+2，持续2回合。',
        type: 'buff',
        cost: 1,
        image: 'armor',
        rarity: 'common',
        imagePath: 'assets/images/buffs/armor.png',
        armorBonus: 2,
        duration: 2,
        buffEffect: (targetId?: number) => {
            // 具体实现会在BattleScene中处理
            console.log(`对格子${targetId}施加护甲强化`);
        }
    },
    {
        id: 'buff_003',
        name: '生命强化',
        description: '使指定格子上的友方单位最大生命值+3。',
        type: 'buff',
        cost: 2,
        image: 'health',
        rarity: 'rare',
        imagePath: 'assets/images/buffs/health.png',
        hpBonus: 3,
        duration: -1, // 永久效果
        buffEffect: (targetId?: number) => {
            // 具体实现会在BattleScene中处理
            console.log(`对格子${targetId}施加生命强化`);
        }
    },
    {
        id: 'buff_004',
        name: '保护罩',
        description: '为指定格子上的友方单位提供保护罩，免疫下一次伤害。',
        type: 'buff',
        cost: 2,
        image: 'shield',
        rarity: 'rare',
        imagePath: 'assets/images/buffs/shield.png',
        duration: 1,
        buffEffect: (targetId?: number) => {
            // 具体实现会在BattleScene中处理
            console.log(`对格子${targetId}施加保护罩`);
        }
    },
    {
        id: 'buff_005',
        name: '狂暴',
        description: '使指定格子上的友方单位攻击力+3，但每回合受到1点伤害，持续3回合。',
        type: 'buff',
        cost: 3,
        image: 'berserk',
        rarity: 'epic',
        imagePath: 'assets/images/buffs/berserk.png',
        atkBonus: 3,
        duration: 3,
        buffEffect: (targetId?: number) => {
            // 具体实现会在BattleScene中处理
            console.log(`对格子${targetId}施加狂暴`);
        }
    }
]; 