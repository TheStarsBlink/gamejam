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

/**
 * 关卡配置接口
 */
export interface LevelConfig {
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
    const neutralUnits: Unit[] = [];
    
    // 初始化区域状态，注意区域索引从0开始存储
    const regions = Array(9).fill(null).map(() => ({
        enemies: [] as Unit[],
        neutrals: [] as Unit[],
        usedCells: new Set<number>()
    }));

    // 计算格子所属的区域（返回1-9）
    function calculateRegion(cellIndex: number): number {
        const row = Math.floor(cellIndex / 9);
        const col = cellIndex % 9;
        
        const regionRow = Math.floor(row / 3);
        const regionCol = Math.floor(col / 3);
        const region = regionRow * 3 + regionCol + 1;
        
        console.log(`格子 ${cellIndex} (行${row},列${col}) 属于区域 ${region}`);
        return region;
    }

    // 获取区域内的所有格子
    function getCellsInRegion(region: number): number[] {
        const cells: number[] = [];
        const regionRow = Math.floor((region - 1) / 3);
        const regionCol = (region - 1) % 3;
        
        const startRow = regionRow * 3;
        const startCol = regionCol * 3;
        
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                const row = startRow + r;
                const col = startCol + c;
                const index = row * 9 + col;
                cells.push(index);
            }
        }
        
        return cells;
    }

    // 检查格子是否可用
    function isCellAvailable(cellIndex: number, region: number): boolean {
        if (cellIndex < 0 || cellIndex >= grid.length) return false;
        const cell = grid[cellIndex];
        if (!cell) return false;
        
        // 检查格子是否已被占用
        const isAvailable = !cell.occupied && 
                          !regions[region - 1].usedCells.has(cellIndex) && 
                          cell.value > 0;
        
        if (!isAvailable) {
            console.log(`格子 ${cellIndex} 不可用: ${cell.occupied ? '已占用' : ''}${regions[region - 1].usedCells.has(cellIndex) ? '已在本轮使用' : ''}${cell.value <= 0 ? '无数值' : ''}`);
        }
        
        return isAvailable;
    }

    // 处理每个区域
    for (let region = 1; region <= 9; region++) {
        console.log(`\n开始处理区域 ${region}`);
        
        // 获取区域内所有可用格子
        const regionCells = getCellsInRegion(region);
        const availableCells = regionCells.filter(cellIndex => isCellAvailable(cellIndex, region));
        
        if (availableCells.length === 0) {
            console.log(`区域 ${region} 没有可用格子，跳过`);
            continue;
        }

        // 随机打乱可用格子
        const shuffledCells = [...availableCells].sort(() => Math.random() - 0.5);

        // 确保每个区域有2-4个敌人
        const minEnemies = 2;
        const maxEnemies = Math.min(4, shuffledCells.length);
        const enemyCount = Math.min(maxEnemies, Math.max(minEnemies, Math.floor(Math.random() * 3) + 2));
        
        console.log(`区域 ${region} 计划生成 ${enemyCount} 个敌人（最小${minEnemies}，最大${maxEnemies}）`);

        // 生成敌人
        for (let i = 0; i < enemyCount && i < shuffledCells.length; i++) {
            const cellIndex = shuffledCells[i];
            if (cellIndex === undefined) break;

            // 检查区域内的敌人数量是否已达到上限
            if (regions[region - 1].enemies.length >= 4) {
                console.log(`区域 ${region} 敌人数量已达到上限 4，停止生成`);
                break;
            }

            const enemyConfig = level.enemies[Math.floor(Math.random() * level.enemies.length)];
            const enemyUnit: Unit = {
                id: `enemy_${levelId}_${region}_${i}_${Date.now()}`,
                name: enemyConfig.name,
                hp: enemyConfig.hp,
                maxHp: enemyConfig.hp,
                atk: enemyConfig.atk,
                traits: [],
                cellIndex: cellIndex,
                image: enemyConfig.image
            };

            enemyUnits.push(enemyUnit);
            regions[region - 1].enemies.push(enemyUnit);
            regions[region - 1].usedCells.add(cellIndex);
            grid[cellIndex].occupied = true;
            grid[cellIndex].unit = enemyUnit;

            console.log(`在区域 ${region} 格子 ${cellIndex} 生成敌人: ${enemyUnit.name}`);
        }

        // 剩余的格子用于生成中立单位（0-2个）
        const remainingCells = shuffledCells.filter(cell => !regions[region - 1].usedCells.has(cell));
        
        if (remainingCells.length > 0) {
            const maxNeutrals = Math.min(2, remainingCells.length);
            const neutralCount = Math.floor(Math.random() * (maxNeutrals + 1)); // 0 到 maxNeutrals 之间
            
            console.log(`区域 ${region} 计划生成 ${neutralCount} 个中立单位（最大${maxNeutrals}）`);

            for (let i = 0; i < neutralCount; i++) {
                const cellIndex = remainingCells[i];
                if (cellIndex === undefined) break;

                const neutralUnit: Unit = {
                    id: `neutral_${levelId}_${region}_${i}_${Date.now()}`,
                    name: "中立单位",
                    hp: 5,
                    maxHp: 5,
                    atk: 2,
                    traits: [],
                    cellIndex: cellIndex,
                    image: 'assets/neutral.png'
                };

                neutralUnits.push(neutralUnit);
                regions[region - 1].neutrals.push(neutralUnit);
                regions[region - 1].usedCells.add(cellIndex);
                grid[cellIndex].occupied = true;
                grid[cellIndex].unit = neutralUnit;

                console.log(`在区域 ${region} 格子 ${cellIndex} 生成中立单位`);
            }
        }
    }

    // 打印最终状态
    console.log('\n=== 生成完成，最终状态 ===');
    regions.forEach((region, index) => {
        console.log(`区域 ${index + 1}:`);
        console.log(`  敌人 (${region.enemies.length}): ${region.enemies.map(e => e.name).join(', ')}`);
        console.log(`  中立 (${region.neutrals.length}): ${region.neutrals.map(n => n.name).join(', ')}`);
        console.log(`  使用的格子: ${[...region.usedCells].join(', ')}`);
    });

    return [...enemyUnits, ...neutralUnits];
}

/**
 * 获取当前关卡总数
 * @returns 关卡总数
 */
export function getTotalLevels(): number {
    return levels.length;
} 