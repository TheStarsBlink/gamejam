import { CombatType, Direction, Faction, JobType, Trait } from '../types/Enums';
import { Unit } from '../types/Unit';
import { UnitType } from '../utils/GameRules';

// 生成唯一ID的辅助函数
const generateId = (): string => {
    return `enemy_${Math.random().toString(36).substr(2, 9)}`;
};

// 基础敌人模板
export interface EnemyTemplate {
    name: string;
    hp: number;
    atk: number;
    armor: number;
    unitType: UnitType;
    combatType: CombatType;
    jobType: JobType;
    traits: Trait[];
    traitValues: { [key in Trait]?: number };
    imagePath: string;
}

// 敌人模板数据
export const enemyTemplates: { [key: string]: EnemyTemplate } = {
    SOLDIER: {
        name: '联军战士',
        hp: 4,
        atk: 2,
        armor: 1,
        unitType: UnitType.ENEMY,
        combatType: CombatType.MELEE,
        jobType: JobType.DEMON, // 职业类型在敌人中不重要，仅用于数据结构完整性
        traits: [],
        traitValues: {},
        imagePath: 'assets/images/enemies/soldier.png'
    },
    ARCHER: {
        name: '联军弓箭手',
        hp: 3,
        atk: 3,
        armor: 0,
        unitType: UnitType.ENEMY,
        combatType: CombatType.RANGED,
        jobType: JobType.DEMON,
        traits: [],
        traitValues: {},
        imagePath: 'assets/images/enemies/archer.png'
    },
    KNIGHT: {
        name: '联军骑士',
        hp: 5,
        atk: 3,
        armor: 2,
        unitType: UnitType.ENEMY,
        combatType: CombatType.MELEE,
        jobType: JobType.DEMON,
        traits: [Trait.COUNTER],
        traitValues: { [Trait.COUNTER]: 1 },
        imagePath: 'assets/images/enemies/knight.png'
    },
    CLERIC: {
        name: '联军牧师',
        hp: 3,
        atk: 1,
        armor: 0,
        unitType: UnitType.ENEMY,
        combatType: CombatType.RANGED,
        jobType: JobType.DEMON,
        traits: [Trait.HEALING],
        traitValues: { [Trait.HEALING]: 2 },
        imagePath: 'assets/images/enemies/cleric.png'
    },
    PALADIN: {
        name: '圣骑士',
        hp: 6,
        atk: 4,
        armor: 3,
        unitType: UnitType.ENEMY,
        combatType: CombatType.MELEE,
        jobType: JobType.DEMON,
        traits: [Trait.HEALING, Trait.SHIELD],
        traitValues: { [Trait.HEALING]: 1 },
        imagePath: 'assets/images/enemies/paladin.png'
    },
    ROYAL_GUARD: {
        name: '皇家盾卫',
        hp: 8,
        atk: 2,
        armor: 5,
        unitType: UnitType.ENEMY,
        combatType: CombatType.MELEE,
        jobType: JobType.DEMON,
        traits: [Trait.COUNTER],
        traitValues: { [Trait.COUNTER]: 2 },
        imagePath: 'assets/images/enemies/royal_guard.png'
    },
    ANGEL: {
        name: '天使战士',
        hp: 7,
        atk: 5,
        armor: 2,
        unitType: UnitType.ENEMY,
        combatType: CombatType.MELEE,
        jobType: JobType.DEMON,
        traits: [Trait.REGENERATION, Trait.PIERCE],
        traitValues: { [Trait.REGENERATION]: 1 },
        imagePath: 'assets/images/enemies/angel.png'
    },
    ARCHANGEL: {
        name: '大天使',
        hp: 10,
        atk: 6,
        armor: 4,
        unitType: UnitType.ENEMY,
        combatType: CombatType.RANGED,
        jobType: JobType.DEMON,
        traits: [Trait.HEALING, Trait.SHIELD, Trait.PIERCE],
        traitValues: { [Trait.HEALING]: 3 },
        imagePath: 'assets/images/enemies/archangel.png'
    }
};

// 创建敌人实例方法
export const createEnemy = (type: string, cellNumber: number, direction: Direction): Unit => {
    const template = enemyTemplates[type];
    
    if (!template) {
        throw new Error(`Enemy template ${type} not found`);
    }
    
    const enemy: Unit = {
        id: generateId(),
        name: template.name,
        faction: Faction.ENEMY,
        unitType: template.unitType,
        combatType: template.combatType,
        jobType: template.jobType,
        hp: template.hp,
        maxHp: template.hp,
        atk: template.atk,
        baseAtk: template.atk,
        armor: template.armor,
        baseArmor: template.armor,
        position: {
            gridX: (cellNumber - 1) % 3,
            gridY: Math.floor((cellNumber - 1) / 3),
            cellNumber: cellNumber,
            direction: direction
        },
        traits: [...template.traits],
        traitValues: { ...template.traitValues },
        statusEffects: [],
        hasAttacked: false,
        isAlive: true,
        imagePath: template.imagePath
    };
    
    return enemy;
};

// 关卡敌人波次配置
export interface EnemyWave {
    enemies: { type: string; position: number; direction: Direction }[];
}

// 普通战斗的敌人波次
export const normalBattleWaves: EnemyWave[] = [
    // 第一关普通战斗
    {
        enemies: [
            { type: 'SOLDIER', position: 1, direction: Direction.DOWN },
            { type: 'ARCHER', position: 2, direction: Direction.DOWN },
            { type: 'SOLDIER', position: 3, direction: Direction.DOWN }
        ]
    },
    {
        enemies: [
            { type: 'SOLDIER', position: 1, direction: Direction.DOWN },
            { type: 'SOLDIER', position: 2, direction: Direction.DOWN },
            { type: 'CLERIC', position: 5, direction: Direction.DOWN },
            { type: 'ARCHER', position: 9, direction: Direction.UP }
        ]
    },
    {
        enemies: [
            { type: 'KNIGHT', position: 1, direction: Direction.RIGHT },
            { type: 'ARCHER', position: 2, direction: Direction.DOWN },
            { type: 'SOLDIER', position: 3, direction: Direction.LEFT },
            { type: 'SOLDIER', position: 7, direction: Direction.UP },
            { type: 'CLERIC', position: 9, direction: Direction.UP }
        ]
    }
];

// BOSS战敌人波次
export const bossBattleWaves: EnemyWave[] = [
    // 第一关BOSS战
    {
        enemies: [
            { type: 'PALADIN', position: 5, direction: Direction.DOWN },
            { type: 'KNIGHT', position: 2, direction: Direction.DOWN },
            { type: 'CLERIC', position: 8, direction: Direction.UP },
            { type: 'ARCHER', position: 4, direction: Direction.RIGHT },
            { type: 'ARCHER', position: 6, direction: Direction.LEFT }
        ]
    }
]; 