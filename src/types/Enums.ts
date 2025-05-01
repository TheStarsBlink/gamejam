/**
 * 游戏中使用的枚举类型
 */

// 卡牌类型
export type CardType = 'unit' | 'spell' | 'buff';

// 派系
export enum Faction {
    PLAYER = '玩家',
    ENEMY = '敌人',
    NEUTRAL = '中立'
}

// 单位类型
export type UnitType = 'friendly' | 'enemy' | 'neutral';

// 战斗类型
export enum CombatType {
    MELEE = 'melee',
    RANGED = 'ranged'
}

// 工作/职业类型
export enum JobType {
    WARRIOR = '战士',
    MAGE = '法师',
    ARCHER = '弓箭手',
    DEMON = '恶魔',
    UNDEAD = '亡灵',
    HUMAN = '人类',
    ELF = '精灵',
    BEAST = '野兽',
    MECHANICAL = '机械',
    ELEMENTAL = '元素'
}

// 特质/特性
export enum Trait {
    HEALING = '治疗',
    AMPLIFY = '增幅',
    HASTE = '急速',
    TOUGH = '坚韧',
    FLYING = '飞行',
    RANGED = '远程',
    MAGIC = '魔法',
    SHIELD = '护盾',
    POISON = '毒性',
    REGENERATION = '再生',
    DOUBLE_ATTACK = '双重攻击',
    PIERCE = '穿透',
    BACKSTAB = '背刺',
    DEATHRATTLE = '亡语',
    COUNTER = '反击'
}

// 方向
export enum Direction {
    UP = '上',
    RIGHT = '右',
    DOWN = '下',
    LEFT = '左'
}

// 稀有度
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

// 游戏状态
export enum GameState {
    DEPLOYMENT = '部署',
    BATTLE = '战斗',
    VICTORY = '胜利',
    DEFEAT = '失败'
}

// 事件类型
export enum EventType {
    RESCUE = '救援',
    BUILD = '建造',
    TRAIN = '训练',
    DEFEND = '防守',
    ATTACK = '攻击',
    EXPLORE = '探索',
    TRADE = '交易',
    REST = '休息',
    AMBUSH = '伏击'
} 