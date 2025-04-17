/**
 * 关卡管理器
 * 定义各个关卡的敌人配置、数独难度等
 */
import { SudokuGenerator } from '../utils/SudokuGenerator';
import type { Cell, Unit } from '../store/combinedGameStore';

// 敌方单位配置接口
interface EnemyConfig {
  name: string;
    hp: number;
  atk: number;
  image?: string;
  position?: number; // 初始位置，如果指定则会放置在特定格子，否则随机放置
}

// 关卡配置接口
interface LevelConfig {
  id: number;
  name: string;
  description: string;
  sudokuDifficulty: number; // 0-1之间，数值越大越难
  enemies: EnemyConfig[];   // 关卡中的敌人
  rewards?: {              // 通关奖励
    gold?: number;
    cards?: string[];
  };
}

// 定义所有关卡
const levels: LevelConfig[] = [
    // 关卡 1
  {
    id: 1,
        name: '新手村',
        description: '最简单的开始',
        sudokuDifficulty: 0.1,
    enemies: [
            { name: '小史莱姆', hp: 5, atk: 1, image: 'assets/slime.svg' },
            { name: '小史莱姆', hp: 5, atk: 1, image: 'assets/slime.svg' },
            { name: '小史莱姆', hp: 5, atk: 1, image: 'assets/slime.svg' },
            { name: '小史莱姆', hp: 5, atk: 1, image: 'assets/slime.svg' },
            { name: '小史莱姆', hp: 5, atk: 1, image: 'assets/slime.svg' },
            { name: '史莱姆', hp: 7, atk: 2, image: 'assets/slime-medium.svg' },
            { name: '史莱姆', hp: 7, atk: 2, image: 'assets/slime-medium.svg' },
            { name: '史莱姆', hp: 7, atk: 2, image: 'assets/slime-medium.svg' },
            { name: '史莱姆', hp: 7, atk: 2, image: 'assets/slime-medium.svg' },
            { name: '史莱姆', hp: 7, atk: 2, image: 'assets/slime-medium.svg' },
            { name: '哥布林', hp: 6, atk: 3, image: 'assets/goblin.svg' },
            { name: '哥布林', hp: 6, atk: 3, image: 'assets/goblin.svg' },
            { name: '哥布林', hp: 6, atk: 3, image: 'assets/goblin.svg' },
            { name: '哥布林', hp: 6, atk: 3, image: 'assets/goblin.svg' },
            { name: '哥布林', hp: 6, atk: 3, image: 'assets/goblin.svg' },
            { name: '哥布林射手', hp: 4, atk: 4, image: 'assets/goblin-archer.svg' },
            { name: '哥布林射手', hp: 4, atk: 4, image: 'assets/goblin-archer.svg' },
            { name: '哥布林射手', hp: 4, atk: 4, image: 'assets/goblin-archer.svg' },
            { name: '食人魔', hp: 12, atk: 3, image: 'assets/ogre.svg' },
            { name: '食人魔', hp: 12, atk: 3, image: 'assets/ogre.svg' },
            { name: '食人魔', hp: 12, atk: 3, image: 'assets/ogre.svg' },
            { name: '骷髅兵', hp: 8, atk: 2, image: 'assets/skeleton.svg' },
            { name: '骷髅兵', hp: 8, atk: 2, image: 'assets/skeleton.svg' },
            { name: '骷髅兵', hp: 8, atk: 2, image: 'assets/skeleton.svg' },
            { name: '骷髅兵', hp: 8, atk: 2, image: 'assets/skeleton.svg' },
            { name: '骷髅兵', hp: 8, atk: 2, image: 'assets/skeleton.svg' },
            { name: '骷髅射手', hp: 6, atk: 3, image: 'assets/skeleton-archer.svg' },
            { name: '骷髅射手', hp: 6, atk: 3, image: 'assets/skeleton-archer.svg' },
            { name: '骷髅射手', hp: 6, atk: 3, image: 'assets/skeleton-archer.svg' },
            { name: '骷髅法师', hp: 4, atk: 5, image: 'assets/skeleton-mage.svg' },
            { name: '骷髅法师', hp: 4, atk: 5, image: 'assets/skeleton-mage.svg' },
            { name: '地精头目', hp: 15, atk: 5, image: 'assets/goblin-boss.svg' },
            { name: '巨型史莱姆', hp: 20, atk: 3, image: 'assets/slime-boss.svg' },
            { name: '骷髅王', hp: 18, atk: 6, image: 'assets/skeleton-king.svg' },
            { name: '地下城守卫', hp: 25, atk: 7, image: 'assets/dungeon-guardian.svg' }
    ],
    rewards: {
            gold: 10
    }
  },
    // 关卡 2
  {
    id: 2,
        name: '恶魔森林入口',
        description: '稍微强一点的敌人',
        sudokuDifficulty: 0.2,
        enemies: [
            { name: '小恶魔', hp: 8, atk: 2, image: 'assets/demon.svg' },
            { name: '小恶魔', hp: 8, atk: 2, image: 'assets/demon.svg' },
            { name: '恶魔战士', hp: 12, atk: 3, image: 'assets/demon-warrior.svg' }
        ],
        rewards: {
            gold: 20
        }
    },
    // 更多关卡...
    {
        id: 3,
        name: '恶魔森林深处',
        description: '强大的恶魔等待着你',
        sudokuDifficulty: 0.3,
    enemies: [
            { name: '恶魔守卫', hp: 20, atk: 2, image: 'assets/demon-guard.svg' },
            { name: '恶魔法师', hp: 10, atk: 4, image: 'assets/demon-mage.svg' },
            { name: '恶魔领主', hp: 25, atk: 5, image: 'assets/demon-lord.svg' }
    ],
    rewards: {
            gold: 50,
            // cards: ['rare_card_id'] // 示例稀有卡牌奖励
    }
  }
];

/**
 * 根据关卡ID获取关卡配置
 * @param levelId 关卡ID
 * @returns 对应的关卡配置，如果找不到则返回 undefined
 */
export function getLevel(levelId: number): LevelConfig | undefined {
    return levels.find(level => level.id === levelId);
}

/**
 * 为指定关卡生成敌人单位列表
 * @param levelId 关卡ID
 * @param grid 棋盘格子数据，用于查找可用的位置
 * @returns 生成的敌方单位列表
 */
export function generateEnemiesForLevel(levelId: number, grid: Cell[]): Unit[] {
  const level = getLevel(levelId);
    if (!level) {
        console.error(`无法找到关卡配置: ${levelId}`);
        return [];
    }

    const enemyUnits: Unit[] = [];
    const availableCells = grid.filter(cell => !cell.occupied && cell.value === 0); // 只在空地生成敌人

    level.enemies.forEach((enemyConfig, index) => {
        let cellIndex = -1;

        if (enemyConfig.position !== undefined && !grid[enemyConfig.position].occupied) {
            // 如果指定了位置且未被占用
            cellIndex = enemyConfig.position;
    } else {
            // 否则，随机选择一个可用的空格子
            if (availableCells.length > 0) {
                const randomIndex = Math.floor(Math.random() * availableCells.length);
                cellIndex = availableCells[randomIndex].index;
                availableCells.splice(randomIndex, 1); // 移除已选格子，防止重复
    } else {
                console.warn(`关卡 ${levelId}: 没有足够的空地生成敌人 ${enemyConfig.name}`);
                return; // 跳过这个敌人
            }
        }

        if (cellIndex !== -1) {
            const enemyUnit: Unit = {
                id: `enemy_${levelId}_${index}_${Date.now()}`,
                name: enemyConfig.name,
                hp: enemyConfig.hp,
                maxHp: enemyConfig.hp,
                atk: enemyConfig.atk,
                traits: [],
          cellIndex: cellIndex,
                image: enemyConfig.image
        };
            enemyUnits.push(enemyUnit);
        
            // 更新格子占用状态
        grid[cellIndex].occupied = true;
            grid[cellIndex].unit = enemyUnit;
      } else {
             console.warn(`关卡 ${levelId}: 无法为敌人 ${enemyConfig.name} 找到位置`);
        }
    });

    return enemyUnits;
}

/**
 * 获取当前关卡总数
 * @returns 关卡总数
 */
export function getTotalLevels(): number {
    return levels.length;
} 