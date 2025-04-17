import { SpellCard } from '../types/Card';
import { CardType, CardRarity } from '../types/GameTypes';

// 基础法术卡数据
export const spellCards: SpellCard[] = [
    {
        id: 'spell_001',
        name: '火球术',
        description: '对指定格子上的敌方单位造成3点伤害。',
        type: 'spell',
        cost: 2,
        image: 'fireball',
        rarity: 'common',
        imagePath: 'assets/images/spells/fireball.png',
        damage: 3,
        effect: (targetId?: number) => {
            // 具体实现会在BattleScene中处理
            console.log(`对格子${targetId}释放火球术`);
        }
    },
    {
        id: 'spell_002',
        name: '治疗术',
        description: '恢复指定格子上的友方单位3点生命值。',
        type: 'spell',
        cost: 2,
        image: 'healing',
        rarity: 'common',
        imagePath: 'assets/images/spells/healing.png',
        healing: 3,
        effect: (targetId?: number) => {
            // 具体实现会在BattleScene中处理
            console.log(`对格子${targetId}释放治疗术`);
        }
    },
    {
        id: 'spell_003',
        name: '群体治疗',
        description: '恢复所有友方单位2点生命值。',
        type: 'spell',
        cost: 3,
        image: 'mass_healing',
        rarity: 'rare',
        imagePath: 'assets/images/spells/mass_healing.png',
        healing: 2,
        effect: () => {
            // 具体实现会在BattleScene中处理
            console.log('释放群体治疗');
        }
    },
    {
        id: 'spell_004',
        name: '冰冻术',
        description: '冻结指定格子上的敌方单位，使其无法行动1回合。',
        type: 'spell',
        cost: 3,
        image: 'freeze',
        rarity: 'rare',
        imagePath: 'assets/images/spells/freeze.png',
        duration: 1,
        effect: (targetId?: number) => {
            // 具体实现会在BattleScene中处理
            console.log(`对格子${targetId}释放冰冻术`);
        }
    },
    {
        id: 'spell_005',
        name: '毒雾术',
        description: '对指定格子及其相邻格子的敌方单位施加中毒效果，每回合造成1点伤害，持续2回合。',
        type: 'spell',
        cost: 4,
        image: 'poison',
        rarity: 'epic',
        imagePath: 'assets/images/spells/poison_cloud.png',
        damage: 1,
        duration: 2,
        effect: (targetId?: number) => {
            // 具体实现会在BattleScene中处理
            console.log(`对格子${targetId}释放毒雾术`);
        }
    }
]; 