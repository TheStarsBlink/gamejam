import { CombatType, Direction, Faction, JobType, Trait } from './Enums';
import { GridPosition } from './Config';
import { UnitType } from '../utils/GameRules';

/**
 * 单位接口定义
 * 包含单位类型、编号、生命值、攻击力等属性
 */
export interface GameUnit {
    // 单位ID
    id: string;
    
    // 单位名称
    name: string;
    
    // 单位类型：中立、友方、敌方
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
    
    // 单位特殊能力
    abilities?: string[];
    
    // 单位描述
    description?: string;
}

// 添加战斗单位接口
export interface Unit {
    id: string;
    name: string;
    faction: Faction;
    unitType: UnitType;
    combatType: CombatType; // 添加战斗类型：近战或远程
    jobType: JobType;
    hp: number;
    maxHp: number;
    atk: number;
    baseAtk: number;
    armor: number;
    baseArmor: number;
    position: {
        gridX: number;
        gridY: number;
        cellNumber: number;
        direction: Direction;
    };
    traits: Trait[];
    traitValues: { [key in Trait]?: number };
    statusEffects: StatusEffect[];
    hasAttacked: boolean;
    isAlive: boolean;
    imagePath: string;
}

// 状态效果接口
export interface StatusEffect {
    name: string;
    duration: number; // 持续回合数
    value: number; // 效果数值
    description: string;
    onApply: (unit: GameUnit) => void; // 应用效果时的回调
    onRemove: (unit: GameUnit) => void; // 效果结束时的回调
    onTurnStart?: (unit: GameUnit) => void; // 回合开始时触发
    onTurnEnd?: (unit: GameUnit) => void; // 回合结束时触发
    onAttack?: (unit: GameUnit, target: GameUnit) => void; // 攻击时触发
    onDefend?: (unit: GameUnit, attacker: GameUnit) => void; // 防御时触发
} 