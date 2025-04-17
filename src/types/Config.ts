import { Card } from './Card';
import { Direction } from './Enums';

// 玩家状态
export interface Player {
    hp: number;
    maxHp: number;
    atk: number;
    gold: number;
}

// 游戏全局配置
export interface GameConfig {
    player: Player;
    deck: Card[];
    currentLevel: number;
    currentBattle: number;
    completedBattles: number;
}

// 单位位置
export interface GridPosition {
    gridX: number; // 0-2列
    gridY: number; // 0-2行
    cellNumber: number; // 1-9格子编号
    direction: Direction; // 单位朝向
}

// 地块属性
export interface Cell {
    id: number; // 1-9
    gridX: number; // 0-2
    gridY: number; // 0-2
    bonusAtk: number; // 攻击加成
    bonusArmor: number; // 护甲加成
    occupied: boolean; // 是否已被占用
    occupiedBy?: string; // 被哪个单位占用
}

// 地块布局
export interface GridLayout {
    cells: Cell[];
} 