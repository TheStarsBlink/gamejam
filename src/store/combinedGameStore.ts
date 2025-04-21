import { defineStore } from 'pinia'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Card, MinionCard, SpellCard, BuffCard } from '../types/Card'
import { SudokuGenerator } from '../utils/SudokuGenerator'
import { generateEnemiesForLevel, getLevel, LevelConfig } from '../levels/levelManager'

/**
 * 本文件合并了两个游戏存储：
 * 1. 数独卡牌游戏 (sudokuGameStore)
 * 2. 普通卡牌游戏 (cardGameStore)
 */

// ----- 数独卡牌游戏 -----

// 单位类型
export interface Unit {
    id: string;
    name: string;
    atk: number;
    hp: number;
    maxHp: number;
    traits: string[];
    cellIndex: number;
    image?: string;
    number?: number; // 数独格子的数字值
}

// 棋盘格子类型
export interface Cell {
    index: number;
    occupied: boolean;
    unit?: Unit;
    bonuses?: {
        atk?: number;
        hp?: number;
        defense?: number;
    }
    value: number;
}

// 数独游戏存储
export const useSudokuGameStore = defineStore('sudokuGame', () => {
    // 游戏状态
    const turn = ref(1)
    const phase = ref<'deployment' | 'battle' | 'victory' | 'defeat'>('deployment')
    const currentBattle = ref(1)
    const completedBattles = ref(0)
    const message = ref<string | null>(null)
    let messageTimeoutId: number | null = null
    const currentLevel = ref(1) // 当前关卡ID

    // 玩家状态
    const player = ref({
        hp: 30,
        maxHp: 30,
        atk: 2,
        armor: 0,
        gold: 0,
        energy: 1,
        maxEnergy: 1
    })

    // 卡牌管理
    const deck = ref<Card[]>([])
    const hand = ref<Card[]>([])
    const discard = ref<Card[]>([])
    const selectedCard = ref<Card | null>(null)

    // 数独数据
    const sudokuPuzzle = ref<number[][]>([])
    const sudokuSolution = ref<number[][]>([])

    // 棋盘与单位
    const grid = ref<Cell[]>(Array(81).fill(null).map((_, i) => ({ 
        index: i, 
        occupied: false,
        value: 0
    })))
    const playerUnits = ref<Unit[]>([])
    const enemyUnits = ref<Unit[]>([])

    // 游戏初始化，返回是否成功
    function startNewGame(forceReset: boolean = false): boolean {
        // 如果不是强制重置，则尝试从本地存储加载游戏状态
        if (!forceReset && loadGameState()) {
            showMessage('已恢复游戏进度！')
            return true; // 成功加载存档
        }

        // 如果强制重置或没有存储的游戏状态，则重置所有状态
        turn.value = 1
        phase.value = 'deployment'
        currentBattle.value = 1
        completedBattles.value = 0
        currentLevel.value = 1 // 从第一关开始
        
        player.value = {
            hp: 30,
            maxHp: 30,
            atk: 2,
            armor: 0,
            gold: 0,
            energy: 1,
            maxEnergy: 1
        }
        
        // 生成新的数独谜题
        const levelConfig = getLevel(currentLevel.value);
        if (levelConfig) {
            generateSudokuPuzzle(levelConfig.sudokuDifficulty);
        } else {
            // 使用默认难度
            generateSudokuPuzzle(0.3);
            console.warn(`未找到关卡${currentLevel.value}的配置，使用默认难度`);
        }
        
        // 清空棋盘和单位，使用resetGrid函数
        resetGrid();
        
        playerUnits.value = []
        enemyUnits.value = []
        
        // 初始化牌库并抽初始手牌
        initializeDeck()
        drawCards(3)
        
        // 初始化敌人，使用新的敌人生成机制
        spawnEnemies()
        
        showMessage('游戏开始！')
        
        // 保存游戏状态
        saveGameState()
        
        return false; // 返回false表示这是一个新游戏，而不是加载存档
    }
    
    // 生成数独谜题
    function generateSudokuPuzzle(difficulty: number = 0.3) {
        const generator = new SudokuGenerator()
        const { puzzle, solution } = generator.generate(difficulty)
        sudokuPuzzle.value = puzzle
        sudokuSolution.value = solution
    }
    
    // 初始化牌库
    function initializeDeck() {
        const initialDeck: Card[] = [
            // 单位牌 - 15张
            { id: '1', name: '小恶魔', description: '召唤一个2/2的小恶魔', type: 'unit', cost: 1, rarity: 'common', image: 'assets/demon.svg', value: 2, hp: 2, atk: 2 },
            { id: '2', name: '恶魔战士', description: '召唤一个3/3的恶魔战士', type: 'unit', cost: 1, rarity: 'common', image: 'assets/demon-warrior.svg', value: 3, hp: 3, atk: 3 },
            { id: '3', name: '地狱犬', description: '召唤一个2/3的地狱犬', type: 'unit', cost: 1, rarity: 'common', image: 'assets/hellhound.svg', value: 3, hp: 3, atk: 2 },
            { id: '4', name: '骷髅兵', description: '召唤一个1/4的骷髅兵', type: 'unit', cost: 1, rarity: 'common', image: 'assets/skeleton.svg', value: 1, hp: 4, atk: 1 },
            { id: '5', name: '恶魔射手', description: '召唤一个3/2的恶魔射手', type: 'unit', cost: 1, rarity: 'common', image: 'assets/demon-archer.svg', value: 3, hp: 2, atk: 3 },
            { id: '6', name: '幽灵', description: '召唤一个2/2的幽灵', type: 'unit', cost: 1, rarity: 'common', image: 'assets/ghost.svg', value: 2, hp: 2, atk: 2 },
            { id: '7', name: '恶魔巫师', description: '召唤一个1/5的恶魔巫师', type: 'unit', cost: 1, rarity: 'uncommon', image: 'assets/demon-mage.svg', value: 4, hp: 5, atk: 1 },
            { id: '8', name: '地狱领主', description: '召唤一个4/4的地狱领主', type: 'unit', cost: 1, rarity: 'rare', image: 'assets/demon-lord.svg', value: 6, hp: 4, atk: 4 },
            { id: '9', name: '地狱骑士', description: '召唤一个3/5的地狱骑士', type: 'unit', cost: 1, rarity: 'rare', image: 'assets/hell-knight.svg', value: 6, hp: 5, atk: 3 },
            { id: '10', name: '恶魔守卫', description: '召唤一个2/6的恶魔守卫', type: 'unit', cost: 1, rarity: 'uncommon', image: 'assets/demon-guard.svg', value: 5, hp: 6, atk: 2 },
            { id: '11', name: '骨龙', description: '召唤一个5/5的骨龙', type: 'unit', cost: 1, rarity: 'epic', image: 'assets/bone-dragon.svg', value: 8, hp: 5, atk: 5 },
            { id: '12', name: '血魔', description: '召唤一个3/7的血魔', type: 'unit', cost: 1, rarity: 'rare', image: 'assets/blood-demon.svg', value: 7, hp: 7, atk: 3 },
            { id: '13', name: '死亡骑士', description: '召唤一个4/6的死亡骑士', type: 'unit', cost: 1, rarity: 'epic', image: 'assets/death-knight.svg', value: 8, hp: 6, atk: 4 },
            { id: '14', name: '炼狱魔君', description: '召唤一个6/6的炼狱魔君', type: 'unit', cost: 1, rarity: 'legendary', image: 'assets/inferno-lord.svg', value: 9, hp: 6, atk: 6 },
            { id: '15', name: '远古恶魔', description: '召唤一个8/8的远古恶魔', type: 'unit', cost: 1, rarity: 'legendary', image: 'assets/ancient-demon.svg', value: 9, hp: 8, atk: 8 },
            
            // 法术牌 - 10张
            { id: '101', name: '火球术', description: '对目标造成3点伤害', type: 'spell', cost: 1, value: 3, rarity: 'common', image: 'assets/fireball.svg' },
            { id: '102', name: '治疗术', description: '治疗友方单位3点生命', type: 'spell', cost: 1, value: 3, rarity: 'common', image: 'assets/heal.svg' },
            { id: '103', name: '闪电箭', description: '对目标造成2点伤害', type: 'spell', cost: 1, value: 2, rarity: 'common', image: 'assets/lightning.svg' },
            { id: '104', name: '强化术', description: '增强友方单位2点攻击力', type: 'spell', cost: 1, value: 2, rarity: 'common', image: 'assets/buff.svg' },
            { id: '105', name: '护甲术', description: '获得3点护甲', type: 'spell', cost: 1, value: 3, rarity: 'common', image: 'assets/armor.svg' },
            { id: '106', name: '火焰风暴', description: '对所有敌方单位造成2点伤害', type: 'spell', cost: 1, rarity: 'rare', image: 'assets/firestorm.svg' },
            { id: '107', name: '急速抽牌', description: '抽2张牌', type: 'spell', cost: 1, value: 2, rarity: 'uncommon', image: 'assets/draw.svg' },
            { id: '108', name: '熔岩爆裂', description: '对目标造成5点伤害', type: 'spell', cost: 1, value: 5, rarity: 'uncommon', image: 'assets/lava-burst.svg' },
            { id: '109', name: '群体治疗', description: '治疗所有友方单位2点生命', type: 'spell', cost: 1, value: 2, rarity: 'rare', image: 'assets/mass-heal.svg' },
            { id: '110', name: '神圣之力', description: '增强所有友方单位1点攻击力', type: 'spell', cost: 1, value: 1, rarity: 'rare', image: 'assets/holy-power.svg' },
            
            // 增益牌 - 5张
            { id: '201', name: '急速符文', description: '获得1点能量', type: 'buff', cost: 1, value: 1, rarity: 'uncommon', image: 'assets/energy-rune.svg' },
            { id: '202', name: '战斗怒吼', description: '本回合内，所有友方单位+1攻击力', type: 'buff', cost: 1, value: 1, rarity: 'uncommon', image: 'assets/battle-cry.svg' },
            { id: '203', name: '神圣护盾', description: '获得5点护甲', type: 'buff', cost: 1, value: 5, rarity: 'rare', image: 'assets/divine-shield.svg' },
            { id: '204', name: '法力涌动', description: '抽3张牌', type: 'buff', cost: 1, value: 3, rarity: 'rare', image: 'assets/mana-surge.svg' },
            { id: '205', name: '魔法增幅', description: '本回合内，所有法术效果+2', type: 'buff', cost: 1, value: 2, rarity: 'epic', image: 'assets/spell-amplify.svg' }
        ]
        
        deck.value = [...initialDeck]
        shuffleDeck()
        
        hand.value = []
        discard.value = []
    }
    
    // 洗牌
    function shuffleDeck() {
        for (let i = deck.value.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck.value[i], deck.value[j]] = [deck.value[j], deck.value[i]];
        }
    }
    
    // 抽牌
    function drawCards(count: number) {
        if (deck.value.length === 0 && discard.value.length > 0) {
            // 如果牌库空了，但弃牌堆有牌，则将弃牌堆洗入牌库
            shuffleDiscardIntoDeck()
        }
        
        // 确定实际能抽到的卡牌数
        const actualCount = Math.min(count, deck.value.length)
        
        // 抽牌
        for (let i = 0; i < actualCount; i++) {
            const card = deck.value.pop()
            if (card) {
                hand.value.push(card)
            }
        }
        
        // 更新UI状态
        updateGameEngine()
    }
    
    // 出牌
    function playCard(cardIndex: number, cellIndex: number) {
        if (cardIndex < 0 || cardIndex >= hand.value.length) return

        const card = hand.value[cardIndex]
        
        // 检查能量是否足够
        if (card.cost > player.value.energy) {
            showMessage('能量不足！')
            return
        }
        
        // 使用能量
        player.value.energy -= card.cost
        
        // 根据卡牌类型执行不同逻辑
        if (card.type === 'unit') {
            deployUnit(card, cellIndex)
        } else if (card.type === 'spell') {
            if (cellIndex !== -1) {
                // 目标法术
                useSpell(card, cellIndex)
            } else {
                // 全局法术
                useGlobalSpell(card)
            }
        }
        
        // 从手牌中移除
        const playedCard = hand.value.splice(cardIndex, 1)[0]
        
        // 加入弃牌堆
        discard.value.push(playedCard)
        
        // 更新UI状态
        updateGameEngine()
    }
    
    // 部署单位
    function deployUnit(card: Card, cellIndex: number) {
        // 确保卡牌是单位类型
        if (card.type !== 'unit' || !('hp' in card) || !('atk' in card)) return
        
        // 获取格子
        const cell = grid.value[cellIndex]
        
        // 如果格子已占用，则不能部署
        if (cell.occupied) {
            showMessage('不能在此格子部署单位！')
            return
        }
        
        // 找到格子在数独中的行列位置
        const row = Math.floor(cellIndex / 9);
        const col = cellIndex % 9;
        
        const unit: Unit = {
            id: card.id + Date.now(),
            name: card.name,
            hp: card.hp ?? 1,
            maxHp: card.hp ?? 1,
            atk: card.atk ?? 1,
            traits: [],
            cellIndex: cellIndex,
            image: card.image,
            number: card.value || 0 
        }
        
        // 添加到玩家单位
        playerUnits.value.push(unit)
        
        // 更新格子状态
        grid.value[cellIndex].occupied = true
        grid.value[cellIndex].unit = unit
        
        console.log(`玩家在格子 ${cellIndex} (行${row}列${col}) 部署单位 ${unit.name}，单位自带数字: ${unit.number}`);
        
        if (grid.value[cellIndex].unit) {
          saveGameState(); // 部署单位后保存状态
        }
    }
    
    // 使用法术
    function useSpell(card: Card, targetIndex: number) {
        const targetCell = grid.value[targetIndex]
        
        if (card.value !== undefined) {
            if (targetCell.unit && targetCell.unit.id.startsWith('enemy')) {
                // 对敌方单位施放
                const damage = card.value
                targetCell.unit.hp -= damage
                
                showMessage(`对 ${targetCell.unit.name} 造成了 ${damage} 点伤害`)
                
                // 检查敌方单位是否死亡
                if (targetCell.unit.hp <= 0) {
                    removeUnit(targetCell.unit.id)
                    showMessage(`${targetCell.unit.name} 被消灭了！`)
                }
            } else if (targetCell.unit && targetCell.unit.id.startsWith('player')) {
                // 对友方单位施放(治疗或增益)
                // 根据卡牌描述决定效果
                if (card.description.includes('治疗')) {
                    const healing = card.value
                    targetCell.unit.hp = Math.min(targetCell.unit.hp + healing, targetCell.unit.maxHp)
                    showMessage(`治疗了 ${targetCell.unit.name} ${healing} 点生命`)
                } else if (card.description.includes('增强')) {
                    targetCell.unit.atk += card.value
                    showMessage(`增强了 ${targetCell.unit.name} ${card.value} 点攻击力`)
                }
            }
        }
    }
    
    // 使用全局法术
    function useGlobalSpell(card: Card) {
        if (card.description.includes('护甲') && card.value !== undefined) {
            player.value.armor += card.value
            showMessage(`获得了 ${card.value} 点护甲`)
        } else if (card.description.includes('抽牌') && card.value !== undefined) {
            drawCards(card.value)
            showMessage(`抽取了 ${card.value} 张牌`)
        } else if (card.description.includes('群体伤害') && card.value !== undefined) {
            // 对所有敌方单位造成伤害
            for (const unit of enemyUnits.value) {
                unit.hp -= card.value
                if (unit.hp <= 0) {
                    removeUnit(unit.id)
                }
            }
            
            // 移除死亡单位
            enemyUnits.value = enemyUnits.value.filter(unit => unit.hp > 0)
            
            showMessage(`对所有敌人造成了 ${card.value} 点伤害`)
        }
    }
    
    // 移除单位
    function removeUnit(unitId: string) {
        // 从玩家单位移除
        const playerUnitIndex = playerUnits.value.findIndex(u => u.id === unitId)
        if (playerUnitIndex >= 0) {
            const unit = playerUnits.value[playerUnitIndex]
            playerUnits.value.splice(playerUnitIndex, 1)
            
            // 在原位置创建中立单位
            createNeutralUnit(unit.cellIndex, grid.value[unit.cellIndex].value)
            return
        }
        
        // 从敌方单位移除
        const enemyUnitIndex = enemyUnits.value.findIndex(u => u.id === unitId)
        if (enemyUnitIndex >= 0) {
            const unit = enemyUnits.value[enemyUnitIndex]
            const cellIndex = unit.cellIndex
            enemyUnits.value.splice(enemyUnitIndex, 1)
            
            // 在原位置创建中立单位
            createNeutralUnit(cellIndex, grid.value[cellIndex].value)
            return
        }
    }
    
    // 创建中立单位替代死亡单位
    function createNeutralUnit(cellIndex: number, cellValue: number) {
        // 清空对应格子原有单位
        const cell = grid.value[cellIndex];
        
        // 创建一个中立单位，保留数字
        const neutralUnit: Unit = {
            id: `neutral_${Date.now()}_${cellIndex}`,
            name: "残骸",
            hp: 1,
            maxHp: 1,
            atk: 0,
            traits: [],
            cellIndex: cellIndex,
            image: 'assets/neutral.svg', // 可以添加一个中立单位的图片
            number: cellValue || 0 // 将格子的数独数字赋给中立单位
        };
        
        // 更新格子状态
        cell.unit = neutralUnit;
        cell.occupied = true;
        
        console.log(`在格子 ${cellIndex} 创建中立单位，格子数值: ${cellValue}`);
    }
    
    // 生成敌人
    function spawnEnemies() {
        // 使用关卡管理器生成敌方单位
        const levelConfig = getLevel(currentLevel.value);
        if (!levelConfig) {
            console.error(`无法找到关卡配置: ${currentLevel.value}`);
            return;
        }
        
        // 先清空现有敌人
        enemyUnits.value = [];
        
        // 获取空格子（更改为选择有数字的格子，数独值大于0的格子）
        const availableCells = grid.value.filter(cell => !cell.occupied && cell.value > 0);
        
        if (availableCells.length === 0) {
            console.warn('没有可用的格子来放置敌人，尝试使用所有空格子');
            // 退化方案：使用所有未占用格子
            const allEmptyCells = grid.value.filter(cell => !cell.occupied);
            if (allEmptyCells.length === 0) {
                console.error('棋盘上没有可用格子！');
                return;
            }
            // 使用所有空格子
            generateEnemiesOnCells(levelConfig, allEmptyCells);
            return;
        }
        
        // 使用带数字的格子来生成敌人
        generateEnemiesOnCells(levelConfig, availableCells);
    }
    
    // 重置棋盘
    function resetGrid() {
        // 确保数独谜题已经生成
        if (!sudokuPuzzle.value || !sudokuPuzzle.value.length) {
            console.error('数独谜题未生成，无法重置棋盘');
            return;
        }
        
        // 创建新的网格数组
        grid.value = [];
        
        // 填充网格
        for (let i = 0; i < 81; i++) {
            const row = Math.floor(i / 9);
            const col = i % 9;
            
            // 从数独谜题中获取对应位置的值
            const puzzleValue = sudokuPuzzle.value[row][col];
            
            // 添加到网格
            grid.value.push({ 
                index: i, 
                occupied: false,
                value: puzzleValue // 数独值
            });
        }
        
        // 调试输出网格信息
        const nonZeroCount = grid.value.filter(cell => cell.value > 0).length;
        const zeroCount = grid.value.filter(cell => cell.value === 0).length;
        console.log(`网格初始化完成：共${grid.value.length}格，${nonZeroCount}个数字格，${zeroCount}个空格`);
    }
    
    // 辅助函数：在指定格子上生成敌人
    function generateEnemiesOnCells(levelConfig: LevelConfig, availableCells: Cell[]) {
        if (!levelConfig || !levelConfig.enemies || levelConfig.enemies.length === 0) {
            console.error('关卡配置错误或没有敌人配置');
            return;
        }
        
        if (!availableCells || availableCells.length === 0) {
            console.error('没有可用格子来放置敌人');
            return;
        }
        
        // 随机洗牌可用格子，确保敌人位置随机
        const shuffledCells = [...availableCells].sort(() => Math.random() - 0.5);
        
        // 计算要生成的敌人数量，不能超过可用格子数
        const enemiesToGenerate = Math.min(levelConfig.enemies.length, shuffledCells.length);
        
        // 确认生成数量
        console.log(`关卡 ${currentLevel.value} 配置的敌人总数: ${levelConfig.enemies.length}`);
        console.log(`可用格子数量: ${shuffledCells.length}`);
        console.log(`将生成 ${enemiesToGenerate} 个敌人`);
        
        // 创建敌人单位
        let enemyCount = 0;
        
        for (let i = 0; i < enemiesToGenerate; i++) {
            try {
                const enemyConfig = levelConfig.enemies[i];
                const cellToUse = shuffledCells[i];
                
                if (!cellToUse) {
                    console.warn(`没有足够的格子放置第${i+1}个敌人`);
                    continue;
                }
                
                // 创建唯一ID
                const enemyId = `enemy_${currentLevel.value}_${i}_${Date.now()}`;
                
                // 找到格子在数独中的行列位置
                const row = Math.floor(cellToUse.index / 9);
                const col = cellToUse.index % 9;
                
                // 获取该位置的数独数字
                const cellValue = sudokuPuzzle.value[row][col];
                
                // 创建敌人单位，并将数独数字赋给敌人
                const enemyUnit: Unit = {
                    id: enemyId,
                    name: enemyConfig.name,
                    hp: enemyConfig.hp,
                    maxHp: enemyConfig.hp,
                    atk: enemyConfig.atk,
                    traits: [],
                    cellIndex: cellToUse.index,
                    image: enemyConfig.image || 'assets/enemy_default.svg',
                    number: cellValue || 0
                };
                
                // 将敌人添加到敌人数组
                enemyUnits.value.push(enemyUnit);
                
                // 标记格子为已占用，并设置单位
                grid.value[cellToUse.index].occupied = true;
                grid.value[cellToUse.index].unit = enemyUnit;
                
                enemyCount++;
                
                console.log(`在格子 ${cellToUse.index} (行${row}列${col}) 放置敌人 ${enemyUnit.name}，格子数值: ${cellValue}`);
            } catch (error) {
                console.error(`生成第${i+1}个敌人时出错:`, error);
            }
        }
        
        // 打印敌人数量信息
        console.log(`为关卡 ${currentLevel.value} (${levelConfig.name}) 实际生成了 ${enemyCount} 个敌人`);
        
        // 显示关卡名称
        showMessage(`第${currentLevel.value}关: ${levelConfig.name} - 敌人数量: ${enemyCount}`);
    }
    
    // 结束回合
    function endTurn() {
        if (phase.value === 'deployment') {
            // 将所有剩余手牌放入弃牌堆
            if (hand.value.length > 0) {
                discard.value.push(...hand.value);
                hand.value = [];
                showMessage('剩余手牌已放入弃牌堆');
            }
            
            // 直接进入下一回合，跳过战斗阶段
            saveGameState();
            startNextTurn();
        }
    }
    
    // 开始下一回合
    function startNextTurn() {
        // 增加回合计数
        turn.value++;
        
        // 回复能量
        player.value.energy = player.value.maxEnergy;
        
        // 抽新的手牌
        drawCards(3);
        
        showMessage(`第 ${turn.value} 回合开始！`);
    }
    
    // 执行战斗
    function executeBattle() {
        // 简化的战斗逻辑实现
        // ...
    }
    
    // 处理胜利
    function handleVictory() {
        phase.value = 'victory';
        
        // 获取奖励
        const level = getLevel(currentLevel.value);
        if (level && level.rewards) {
            if (level.rewards.gold) {
                player.value.gold += level.rewards.gold;
                showMessage(`获得 ${level.rewards.gold} 金币！`);
            }
        }
        
        showMessage('恭喜！你赢得了战斗！');
        
        // 检查是否有下一关
        const hasNextLevel = getLevel(currentLevel.value + 1) !== undefined;
        
        // 如果有下一关，准备进入下一关
        if (hasNextLevel) {
            showMessage('准备进入下一关...');
            setTimeout(() => {
                currentLevel.value++;
                prepareNextBattle();
            }, 2000);
        } else {
            showMessage('恭喜！你通关了所有关卡！');
        }
        
        saveGameState();
    }
    
    // 处理失败
    function handleDefeat() {
        phase.value = 'defeat';
        showMessage('你被击败了...');
        
        // 游戏失败，3秒后重新开始，强制重置游戏
        localStorage.removeItem('sudokuGameState');
        setTimeout(() => {
            startNewGame(true);
        }, 3000);
    }
    
    // 准备下一关战斗
    function prepareNextBattle() {
        // 重置游戏状态准备下一关
        phase.value = 'deployment';
        turn.value = 1;
        currentBattle.value++;
        
        // 回复玩家能量
        player.value.energy = player.value.maxEnergy;
        
        // 生成新的数独谜题，使用当前关卡的难度设置
        const levelConfig = getLevel(currentLevel.value);
        if (levelConfig) {
            generateSudokuPuzzle(levelConfig.sudokuDifficulty);
        } else {
            // 使用默认难度
            generateSudokuPuzzle(0.3 + currentLevel.value * 0.05); // 随关卡增加难度
            console.warn(`未找到关卡${currentLevel.value}的配置，使用默认难度`);
        }
        
        // 清空棋盘和单位，并设置数独数字
        resetGrid();
        
        playerUnits.value = [];
        enemyUnits.value = [];
        
        // 清空手牌和弃牌堆，重新抽初始手牌
        hand.value = [];
        discard.value = [];
        drawCards(3);
        
        // 初始化敌人
        spawnEnemies();
        
        // 显示关卡信息
        if (levelConfig) {
            showMessage(`第${currentLevel.value}关: ${levelConfig.name}`);
        } else {
            showMessage(`第${currentLevel.value}关开始！`);
        }
    }
    
    // 将弃牌堆洗入牌库
    function shuffleDiscardIntoDeck() {
        deck.value.push(...discard.value)
        discard.value = []
        shuffleDeck()
        
        showMessage('弃牌堆已洗入牌库！')
        updateGameEngine()
    }
    
    // 更新游戏引擎状态，用于UI显示
    function updateGameEngine() {
        if (!window.gameEngine) return
        
        // 检查gameEngine是否有gameState属性或updateGameState方法
        const gameState = {
            player: {
                health: player.value.hp,
                maxHealth: player.value.maxHp,
                mana: player.value.energy,
                maxMana: player.value.maxEnergy,
                hand: hand.value,
                deck: deck.value.length,
                discard: discard.value.length
            },
            enemy: {
                health: 100,
                maxHealth: 100
            },
            battle: {
                currentTurn: turn.value,
                activePlayer: phase.value
            }
        }
        
        // 尝试使用updateGameState方法
        if (typeof window.gameEngine.updateGameState === 'function') {
            window.gameEngine.updateGameState(gameState)
        } 
        // 回退到直接设置gameState属性
        else if (window.gameEngine) {
            // 使用类型断言来避免类型错误
            (window.gameEngine as any).gameState = gameState
        }
    }
    
    // 显示消息
    function showMessage(msg: string, duration = 3000) {
        message.value = msg
        
        // 清除之前的计时器
        if (messageTimeoutId !== null) {
            clearTimeout(messageTimeoutId)
        }
        
        // 设置新的计时器
        messageTimeoutId = window.setTimeout(() => {
            message.value = null
            messageTimeoutId = null
        }, duration) as unknown as number
    }
    
    // 计算属性：可用格子
    const availableCells = computed(() => {
        return grid.value.filter(cell => !cell.occupied)
    })
    
    // 计算属性：敌人HP百分比
    const enemyHpPercent = computed(() => {
        if (enemyUnits.value.length === 0) return 0
        
        // 简化：只显示第一个敌人的生命值
        const enemy = enemyUnits.value[0]
        return (enemy.hp / enemy.maxHp) * 100
    })
    
    // 保存游戏状态到本地存储
    function saveGameState() {
        try {
            // 增加日志，显示当前要保存的单位数量
            console.log(`准备保存游戏状态... 玩家单位: ${playerUnits.value.length}, 敌人单位: ${enemyUnits.value.length}`);
            
            const gameState = {
                turn: turn.value,
                phase: phase.value,
                currentBattle: currentBattle.value,
                completedBattles: completedBattles.value,
                currentLevel: currentLevel.value,
                player: player.value,
                sudokuPuzzle: sudokuPuzzle.value,
                sudokuSolution: sudokuSolution.value,
                // 保存格子信息，包括占用状态和数值
                grid: grid.value.map(cell => ({
                    index: cell.index,
                    occupied: cell.occupied,
                    value: cell.value,
                    // 不保存unit对象，因为这会在playerUnits中保存
                })),
                // 保存完整的牌库、手牌和弃牌堆状态
                playerUnits: playerUnits.value,
                enemyUnits: enemyUnits.value,
                deck: deck.value,
                hand: hand.value,
                discard: discard.value
            };
            
            localStorage.setItem('sudokuGameState', JSON.stringify(gameState));
            console.log(`游戏状态已保存。玩家单位: ${gameState.playerUnits.length}, 敌人单位: ${gameState.enemyUnits.length}`);
            return true;
        } catch (error) {
            console.error('保存游戏状态失败:', error);
            return false;
        }
    }
    
    // 从本地存储加载游戏状态
    function loadGameState(): boolean {
        try {
            const savedState = localStorage.getItem('sudokuGameState');
            if (!savedState) {
                console.log("没有找到存档。");
                return false;
            }
            
            console.log("开始加载游戏状态...");
            const gameState = JSON.parse(savedState);
            
            // --- 恢复核心状态 ---
            turn.value = gameState.turn;
            phase.value = gameState.phase;
            currentBattle.value = gameState.currentBattle;
            completedBattles.value = gameState.completedBattles;
            currentLevel.value = gameState.currentLevel;
            player.value = gameState.player;
            sudokuPuzzle.value = gameState.sudokuPuzzle;
            sudokuSolution.value = gameState.sudokuSolution;
            
            // --- 恢复牌库状态 ---
            deck.value = gameState.deck || [];
            hand.value = gameState.hand || [];
            discard.value = gameState.discard || [];
            selectedCard.value = null; // 重置选中卡牌

            // --- 恢复棋盘和单位状态 ---
            
            // 1. 恢复基础格子信息 (value, occupied - 稍后根据单位重置)
            const initialGrid = Array(81).fill(null).map((_, i) => ({
                index: i,
                occupied: false, // 先设为false，后面根据单位重新设置
                value: 0,
                unit: undefined // 确保清空旧的unit引用
            }));
            if (gameState.grid) {
                for (let i = 0; i < gameState.grid.length; i++) {
                    if (initialGrid[i]) { // 检查是否存在
                        initialGrid[i].value = gameState.grid[i]?.value || 0;
                    }
                }
            }
            grid.value = initialGrid;

            // 2. 恢复单位列表
            playerUnits.value = gameState.playerUnits || [];
            enemyUnits.value = gameState.enemyUnits || [];

            console.log(`尝试加载 ${playerUnits.value.length} 玩家单位和 ${enemyUnits.value.length} 敌人单位`);

            // 3. 重新建立格子与单位的链接，并设置occupied状态
            const linkUnitToCell = (unit: Unit) => {
                if (unit.cellIndex !== undefined && unit.cellIndex >= 0 && unit.cellIndex < 81) {
                    const cell = grid.value[unit.cellIndex];
                    if (cell) {
                        cell.unit = unit;
                        cell.occupied = true; // 标记格子为占用
                        console.log(`链接单位 ${unit.name} (ID: ${unit.id}) 到格子 ${cell.index}`);
                    } else {
                        console.warn(`加载时未找到单位 ${unit.name} (ID: ${unit.id}) 的目标格子: ${unit.cellIndex}`);
                    }
                } else {
                    console.warn(`加载时单位 ${unit.name} (ID: ${unit.id}) 的 cellIndex 无效: ${unit.cellIndex}`);
                }
            };

            playerUnits.value.forEach(linkUnitToCell);
            enemyUnits.value.forEach(linkUnitToCell);

            const linkedPlayerUnits = grid.value.filter(c => c.unit && playerUnits.value.some(pu => pu.id === c.unit?.id)).length;
            const linkedEnemyUnits = grid.value.filter(c => c.unit && enemyUnits.value.some(eu => eu.id === c.unit?.id)).length;
            console.log(`成功链接了 ${linkedPlayerUnits} 个玩家单位和 ${linkedEnemyUnits} 个敌人单位到棋盘`);

            showMessage('游戏状态已加载');
            console.log('游戏状态加载完成, 当前关卡:', currentLevel.value);
            console.log(`牌库: ${deck.value.length}, 手牌: ${hand.value.length}, 弃牌: ${discard.value.length}`);
            return true;
        } catch (error) {
            console.error('加载游戏状态失败:', error);
            // 如果加载失败，清除可能损坏的存档
            localStorage.removeItem('sudokuGameState'); 
            return false;
        }
    }
    
    // 丢弃手牌
    function discardHand() {
        const cardsDiscarded = hand.value.length;
        if (cardsDiscarded > 0) {
            discard.value.push(...hand.value);
            hand.value = [];
        }
        return cardsDiscarded;
    }

    // 选择卡牌
    function selectCard(cardId: string | null) {
        if (cardId === null) {
            selectedCard.value = null;
            return;
        }
        
        selectedCard.value = hand.value.find(card => card.id === cardId) || null;
    }
    
    // --- 生命周期钩子，用于自动保存 ---
    const saveBeforeUnload = () => {
      console.log('页面即将卸载，尝试保存游戏状态...');
      saveGameState();
    };

    onMounted(() => {
        window.addEventListener('beforeunload', saveBeforeUnload);
    });

    onUnmounted(() => {
        window.removeEventListener('beforeunload', saveBeforeUnload);
        // 可选：组件卸载时也保存一次，以防万一
        saveGameState();
    });

    return {
        // 状态
        turn,
        phase,
        currentBattle,
        completedBattles,
        message,
        currentLevel,
        player,
        
        deck,
        hand,
        discard,
        selectedCard,
        
        sudokuPuzzle,
        sudokuSolution,
        
        grid,
        playerUnits,
        enemyUnits,
        
        availableCells,
        enemyHpPercent,
        
        // 方法
        startNewGame,
        generateSudokuPuzzle,
        resetGrid,
        initializeDeck,
        drawCards,
        shuffleDeck,
        discardHand,
        selectCard,
        playCard,
        deployUnit,
        useSpell,
        useGlobalSpell,
        removeUnit,
        shuffleDiscardIntoDeck,
        updateGameEngine,
        showMessage,
        endTurn,
        startNextTurn,
        executeBattle,
        handleVictory,
        handleDefeat,
        prepareNextBattle,
        spawnEnemies,
        
        // 数据持久化方法
        saveGameState,
        loadGameState
    }
})

// ----- 普通卡牌游戏 -----

export const useCardGameStore = defineStore('cardGame', () => {
  // 玩家状态
  const playerHealth = ref(30);
  const playerMaxHealth = ref(30);
  const playerMana = ref(0);
  const playerMaxMana = ref(10);
  const playerHand = ref<Card[]>([]);
  const playerDeck = ref<Card[]>([]);
  const playerDiscardPile = ref<Card[]>([]);

  // 敌人状态
  const enemyHealth = ref(30);
  const enemyMaxHealth = ref(30);
  const enemyIntent = ref<{ type: string; value: number }>({ type: 'attack', value: 5 });

  // 游戏阶段
  const currentPhase = ref<'draw' | 'play' | 'enemy' | 'end'>('draw');
  const currentTurn = ref(1);
  const isCardBeingPlayed = ref(false);
  const gameMessage = ref('');

  // 计算属性
  const currentMana = computed(() => playerMana.value);
  const playerHealthPercentage = computed(() => (playerHealth.value / playerMaxHealth.value) * 100);
  const enemyHealthPercentage = computed(() => (enemyHealth.value / enemyMaxHealth.value) * 100);

  // 抽牌方法
  const drawCard = (count: number = 1) => {
    for (let i = 0; i < count; i++) {
      if (playerDeck.value.length === 0) {
        shuffleDiscardIntoDeck();
        if (playerDeck.value.length === 0) break; // 如果洗牌后牌库仍为空，则停止抽牌
      }
      
      const drawnCard = playerDeck.value.pop();
      if (drawnCard) {
        playerHand.value.push(drawnCard);
      }
    }
  };

  // 将弃牌堆洗入牌库
  const shuffleDiscardIntoDeck = () => {
    playerDeck.value = [...playerDiscardPile.value].sort(() => Math.random() - 0.5);
    playerDiscardPile.value = [];
    gameMessage.value = '弃牌堆已洗入牌库';
  };

  // 出牌方法
  const playCard = (card: Card) => {
    isCardBeingPlayed.value = true;
    gameMessage.value = `打出 ${card.name}`;
    
    // 从手牌中移除该牌
    const cardIndex = playerHand.value.findIndex(c => c.id === card.id);
    if (cardIndex !== -1) {
      playerHand.value.splice(cardIndex, 1);
    }
    
    // 支付法力值
    playerMana.value -= card.cost;
    
    // 执行卡牌效果
    applyCardEffect(card);
    
    // 将卡牌放入弃牌堆
    playerDiscardPile.value.push(card);
    
    // 延迟后重置出牌状态
    setTimeout(() => {
      isCardBeingPlayed.value = false;
    }, 500);
  };

  // 应用卡牌效果
  const applyCardEffect = (card: Card) => {
    if (card.type === 'spell') {
      // 处理法术卡
      const spellCard = card as SpellCard;
      if (spellCard.damage) {
        // 伤害法术
        enemyHealth.value = Math.max(0, enemyHealth.value - spellCard.damage);
      } else if (spellCard.healing) {
        // 治疗法术
        playerHealth.value = Math.min(playerMaxHealth.value, playerHealth.value + spellCard.healing);
      } else if (card.description.includes('抽牌')) {
        // 抽牌法术
        drawCard(card.value);
      }
    } else if (card.type === 'unit') {
      // 处理随从卡（这里简化为造成伤害）
      if (card.atk) {
        enemyHealth.value = Math.max(0, enemyHealth.value - card.atk);
      }
    }
    
    // 检查敌人是否被击败
    if (enemyHealth.value <= 0) {
      endBattle(true);
    }
  };

  // 结束战斗
  const endBattle = (playerWon: boolean) => {
    if (playerWon) {
      gameMessage.value = '战斗胜利！';
    } else {
      gameMessage.value = '战斗失败！';
    }
  };

  // 初始化游戏
  const initGame = () => {
    // 重置所有状态
    playerHealth.value = 30;
    playerMaxHealth.value = 30;
    playerMana.value = 3;
    playerMaxMana.value = 3;
    currentTurn.value = 1;
    
    // 初始化牌库（简单示例）
    playerDeck.value = generateInitialDeck();
    playerHand.value = [];
    playerDiscardPile.value = [];
    
    // 初始化敌人
    enemyHealth.value = 30;
    enemyMaxHealth.value = 30;
    updateEnemyIntent();
    
    // 开始第一个回合
    drawCard(5);
    currentPhase.value = 'play';
    gameMessage.value = '游戏开始！';
  };

  // 生成初始牌库
  const generateInitialDeck = (): Card[] => {
    const deck: Card[] = [];
    
    // 生成10张攻击牌
    for (let i = 0; i < 10; i++) {
      deck.push({
        id: `attack-${i}`,
        name: '打击',
        description: '造成5点伤害',
        cost: 1,
        type: 'spell',
        value: 0,
        damage: 5,
        rarity: 'common',
        image: '/images/cards/attack.png'
      } as SpellCard);
    }
    
    // 生成5张防御牌
    for (let i = 0; i < 5; i++) {
      deck.push({
        id: `defense-${i}`,
        name: '防御',
        description: '回复5点生命',
        cost: 1,
        type: 'spell',
        value: 0,
        healing: 5,
        rarity: 'common',
        image: '/images/cards/defense.png'
      } as SpellCard);
    }
    
    // 添加一些特殊牌
    deck.push({
      id: 'skill-draw',
      name: '急速思考',
      description: '抽2张牌',
      cost: 1,
      type: 'spell',
      value: 2,
      rarity: 'uncommon',
      image: '/images/cards/draw.png'
    });
    
    // 随机打乱牌库顺序
    return deck.sort(() => Math.random() - 0.5);
  };

  // 更新敌人意图
  const updateEnemyIntent = () => {
    // 这里简单实现，随机选择攻击或防御
    const intentTypes = ['attack', 'defend'];
    const type = intentTypes[Math.floor(Math.random() * intentTypes.length)];
    const value = type === 'attack' ? Math.floor(Math.random() * 8) + 3 : Math.floor(Math.random() * 5) + 2;
    
    enemyIntent.value = { type, value };
  };

  // 开始玩家回合与结束玩家回合方法 (简化)
  const startPlayerTurn = () => {
    currentPhase.value = 'play';
    drawCard(5);
  };
  
  const endPlayerTurn = () => {
    currentPhase.value = 'enemy';
  };

  return {
    // 状态
    playerHealth,
    playerMaxHealth,
    playerMana,
    playerMaxMana,
    playerHand,
    playerDeck,
    playerDiscardPile,
    enemyHealth,
    enemyMaxHealth,
    enemyIntent,
    currentPhase,
    currentTurn,
    isCardBeingPlayed,
    gameMessage,
    
    // 计算属性
    currentMana,
    playerHealthPercentage,
    enemyHealthPercentage,
    
    // 方法
    drawCard,
    playCard,
    startPlayerTurn,
    endPlayerTurn,
    initGame
  };
}); 