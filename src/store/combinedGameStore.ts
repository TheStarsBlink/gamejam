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
    traitNames?: { [key: string]: string }; // 特性的中文显示名称映射
    cellIndex: number;
    image?: string;
    number?: number; // 数独格子的数字值
    armor?: number;  // 添加护甲属性
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

// 战斗日志消息类型
export interface BattleLogMessage {
  text: string;
  type: 'info' | 'damage' | 'heal' | 'special';
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

    // 战斗日志
    const battleLog = ref<BattleLogMessage | null>(null);
    const battleLogHistory = ref<BattleLogMessage[]>([]);

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
            { id: '106', name: '火焰风暴', description: '对所有敌方单位造成2点伤害', type: 'spell', cost: 1, value: 0, rarity: 'rare', image: 'assets/firestorm.svg' },
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
        // 如果牌库没牌，就不抽了
        if (deck.value.length === 0) {
            showMessage('牌库已空！')
            return
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
        
        // 从手牌中移除
        const playedCard = hand.value.splice(cardIndex, 1)[0]
        
        // 根据卡牌类型执行不同逻辑
        if (card.type === 'unit') {
            deployUnit(card, cellIndex)
            // 单位牌直接加入弃牌堆，但保留其他手牌
            discard.value.push(playedCard)
        } else if (card.type === 'spell') {
            if (cellIndex !== -1) {
                // 目标法术
                useSpell(card, cellIndex)
            } else {
                // 全局法术
                useGlobalSpell(card)
            }
            
            // 法术牌使用后，将所有手牌（包括刚打出的）放入弃牌堆
            discard.value.push(playedCard)
            if (hand.value.length > 0) {
                discard.value.push(...hand.value)
                hand.value = []
                showMessage('剩余手牌已放入弃牌堆')
            }
        }
        
        // 自动结束回合
        if (phase.value === 'deployment') {
            saveGameState() // 保存游戏状态
            startNextTurn()
        }
        
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
        
        // 创建玩家单位
        const unit: Unit = {
            id: `player_${Date.now()}_${cellIndex}`,
            name: card.name,
            atk: card.atk || 1,
            hp: card.hp || 1,
            maxHp: card.hp || 1,
            traits: [],
            traitNames: {
                'row_buffed': '行数独加成',
                'col_buffed': '列数独加成',
                'region_buffed': '区域数独加成'
            },
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
        
        // 检查数独条件并应用buff
        checkSudokuAndApplyBuffs();
        
        if (grid.value[cellIndex].unit) {
            saveGameState(); // 部署单位后保存
        }
    }
    
    // 检查数独条件并应用buff
    function checkSudokuAndApplyBuffs() {
        // 检查所有行
        for (let row = 0; row < 9; row++) {
            const rowUnits = getRowUnits(row);
            if (isValidSudokuUnits(rowUnits)) {
                applyBuffToRow(row);
            }
        }

        // 检查所有列
        for (let col = 0; col < 9; col++) {
            const colUnits = getColUnits(col);
            if (isValidSudokuUnits(colUnits)) {
                applyBuffToCol(col);
            }
        }

        // 检查所有3x3区域
        for (let region = 0; region < 9; region++) {
            const regionUnits = getRegionUnits(region);
            if (isValidSudokuUnits(regionUnits)) {
                applyBuffToRegion(region);
            }
        }
    }

    // 获取一行中的所有单位
    function getRowUnits(row: number): Unit[] {
        const units: Unit[] = [];
        for (let col = 0; col < 9; col++) {
            const cell = grid.value[row * 9 + col];
            if (cell.unit && cell.unit.number && cell.unit.number > 0) {
                units.push(cell.unit);
            }
        }
        return units;
    }

    // 获取一列中的所有单位
    function getColUnits(col: number): Unit[] {
        const units: Unit[] = [];
        for (let row = 0; row < 9; row++) {
            const cell = grid.value[row * 9 + col];
            if (cell.unit && cell.unit.number && cell.unit.number > 0) {
                units.push(cell.unit);
            }
        }
        return units;
    }

    // 获取一个3x3区域中的所有单位
    function getRegionUnits(region: number): Unit[] {
        const units: Unit[] = [];
        const startRow = Math.floor(region / 3) * 3;
        const startCol = (region % 3) * 3;

        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const cell = grid.value[(startRow + i) * 9 + (startCol + j)];
                if (cell.unit && cell.unit.number && cell.unit.number > 0) {
                    units.push(cell.unit);
                }
            }
        }
        return units;
    }

    // 检查一组单位是否满足数独条件（数字1-9不重复）
    function isValidSudokuUnits(units: Unit[]): boolean {
        // 获取所有单位的数字
        const numbers = units.map(unit => unit.number || 0).filter(n => n > 0);
        
        // 检查是否有重复数字
        const uniqueNumbers = new Set(numbers);
        
        // 检查数字是否在1-9范围内
        const isValidRange = numbers.every(n => n !== undefined && n >= 1 && n <= 9);
        
        // 输出调试信息
        console.log('检查单位数字:', numbers);
        console.log('唯一数字数量:', uniqueNumbers.size);
        console.log('数字范围有效:', isValidRange);
        
        // 返回true条件：
        // 1. 必须有9个不同的数字（严格遵循数独规则）
        // 2. 所有数字都在1-9范围内
        // 3. 没有重复数字
        const isValid = numbers.length === 9 && 
                       uniqueNumbers.size === 9 && 
                       isValidRange;

        if (isValid) {
            console.log('满足数独条件！数字:', numbers.sort((a, b) => a - b).join(', '));
        } else {
            console.log('不满足数独条件。原因:',
                numbers.length !== 9 ? '数字不足9个' :
                uniqueNumbers.size !== 9 ? '有重复数字' :
                !isValidRange ? '数字超出范围' : '未知原因'
            );
        }
        
        return isValid;
    }

    // 为一行的单位添加buff
    function applyBuffToRow(row: number) {
        const units = getRowUnits(row);
        const numbers = units
            .map(u => u.number || 0)
            .filter((n): n is number => n > 0)
            .sort((a, b) => a - b)
            .join(', ');
        for (const unit of units) {
            applyBuff(unit, 'row');
        }
        addBattleLog(`第${row + 1}行完成数独 [${numbers}]，单位获得行buff加成！`, 'special');
    }

    // 为一列的单位添加buff
    function applyBuffToCol(col: number) {
        const units = getColUnits(col);
        const numbers = units
            .map(u => u.number || 0)
            .filter((n): n is number => n > 0)
            .sort((a, b) => a - b)
            .join(', ');
        for (const unit of units) {
            applyBuff(unit, 'col');
        }
        addBattleLog(`第${col + 1}列完成数独 [${numbers}]，单位获得列buff加成！`, 'special');
    }

    // 为3x3区域的单位添加buff
    function applyBuffToRegion(region: number) {
        const units = getRegionUnits(region);
        const numbers = units
            .map(u => u.number || 0)
            .filter((n): n is number => n > 0)
            .sort((a, b) => a - b)
            .join(', ');
        for (const unit of units) {
            applyBuff(unit, 'region');
        }
        addBattleLog(`第${region + 1}个3x3区域完成数独 [${numbers}]，单位获得区域buff加成！`, 'special');
    }

    // 为单位添加buff
    function applyBuff(unit: Unit, type: 'row' | 'col' | 'region') {
        // 检查是否为玩家单位
        if (!unit.id.startsWith('player_')) {
            return; // 如果不是玩家单位，直接返回，不应用buff
        }

        // 统一的buff效果：+10生命值，+2护甲
        unit.maxHp += 10;
        unit.hp += 10;
        
        // 初始化护甲属性（如果不存在）
        if (!unit.armor) {
            unit.armor = 0;
        }
        unit.armor += 2;

        // 确保生命值不超过最大生命值
        if (unit.hp > unit.maxHp) {
            unit.hp = unit.maxHp;
        }

        // 添加buff特效标记，使用中文描述
        const buffName = type === 'row' ? '行数独加成' : 
                        type === 'col' ? '列数独加成' : 
                        '区域数独加成';
        
        const buffKey = `${type}_buffed`;
        
        // 初始化特性名称映射（如果不存在）
        if (!unit.traitNames) {
            unit.traitNames = {};
        }
        
        // 添加特性和其中文名称
        if (!unit.traits.includes(buffKey)) {
            unit.traits.push(buffKey);
            unit.traitNames[buffKey] = buffName;
        }

        showMessage(`${unit.name} 获得了${buffName}！生命值+10，护甲+2`);
    }
    
    // 获取单位特性的显示名称
    function getTraitDisplayName(unit: Unit, trait: string): string {
        if (unit.traitNames && unit.traitNames[trait]) {
            return unit.traitNames[trait];
        }
        
        // 默认的特性名称映射
        const defaultTraitNames: { [key: string]: string } = {
            'row_buffed': '行数独加成',
            'col_buffed': '列数独加成',
            'region_buffed': '区域数独加成'
        };
        
        return defaultTraitNames[trait] || trait;
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
                // 添加法术伤害日志
                addBattleLog(`使用 ${card.name} 对 ${targetCell.unit.name} 造成了 ${damage} 点伤害`, 'damage');
                
                // 检查敌方单位是否死亡
                if (targetCell.unit.hp <= 0) {
                    addBattleLog(`${targetCell.unit.name} 被消灭了！`, 'special');
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
                    addBattleLog(`使用 ${card.name} 治疗了 ${targetCell.unit.name} ${healing} 点生命值`, 'heal');
                } else if (card.description.includes('增强')) {
                    targetCell.unit.atk += card.value
                    showMessage(`增强了 ${targetCell.unit.name} ${card.value} 点攻击力`)
                    addBattleLog(`使用 ${card.name} 增强了 ${targetCell.unit.name} ${card.value} 点攻击力`, 'special');
                }
            }
        }
        
        if (card.name === '治疗术') {
            const targetUnit = grid.value[targetIndex].unit;
            if (targetUnit) {
                const healAmount = card.value;
                targetUnit.hp = Math.min(targetUnit.hp + healAmount, targetUnit.maxHp);
                addBattleLog(`${targetUnit.name} 恢复了 ${healAmount} 点生命值`, 'heal');
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
            traitNames: {
                'row_buffed': '行数独加成',
                'col_buffed': '列数独加成',
                'region_buffed': '区域数独加成'
            },
            cellIndex: cellIndex,
            image: 'assets/neutral.svg',
            number: cellValue || 0
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
            // 使用所有空格子，但仍然应用区域限制
            generateEnemiesWithRegionLimit(levelConfig, allEmptyCells);
            return;
        }
        
        // 使用带数字的格子来生成敌人，应用区域限制
        generateEnemiesWithRegionLimit(levelConfig, availableCells);
    }
    
    // 获取单元格所在的3x3区域索引（0-8）
    function getRegionIndex(cellIndex: number): number {
        const row = Math.floor(cellIndex / 9);
        const col = cellIndex % 9;
        return Math.floor(row / 3) * 3 + Math.floor(col / 3);
    }

    // 带区域限制的敌人生成
    function generateEnemiesWithRegionLimit(levelConfig: LevelConfig, availableCells: Cell[]) {
        if (!levelConfig || !levelConfig.enemies || levelConfig.enemies.length === 0) {
            console.error('关卡配置错误或没有敌人配置');
            return;
        }

        // 初始化9个区域的敌人计数
        const regionCounts = new Array(9).fill(0);
        
        // 随机打乱可用格子
        const shuffledCells = [...availableCells].sort(() => Math.random() - 0.5);
        
        // 创建敌人单位
        let enemyCount = 0;
        let enemyIndex = 0;

        // 第一轮：确保每个区域至少有2个敌人（如果有足够的格子和敌人配置）
        for (let region = 0; region < 9; region++) {
            const regionCells = shuffledCells.filter(cell => getRegionIndex(cell.index) === region);
            const minEnemies = Math.min(2, regionCells.length, levelConfig.enemies.length - enemyIndex);
            
            for (let i = 0; i < minEnemies; i++) {
                if (enemyIndex >= levelConfig.enemies.length) break;
                
                const cell = regionCells[i];
                if (!cell) continue;

                createEnemyInCell(levelConfig.enemies[enemyIndex], cell);
                regionCounts[region]++;
                enemyCount++;
                enemyIndex++;
            }
        }

        // 第二轮：在允许的范围内（最多4个）添加剩余的敌人
        while (enemyIndex < levelConfig.enemies.length) {
            const remainingCells = shuffledCells.filter(cell => {
                const region = getRegionIndex(cell.index);
                return !cell.occupied && regionCounts[region] < 4;
            });

            if (remainingCells.length === 0) break;

            const cell = remainingCells[0];
            const region = getRegionIndex(cell.index);

            createEnemyInCell(levelConfig.enemies[enemyIndex], cell);
            regionCounts[region]++;
            enemyCount++;
            enemyIndex++;
        }

        console.log(`为关卡 ${currentLevel.value} (${levelConfig.name}) 实际生成了 ${enemyCount} 个敌人`);
        console.log('各区域敌人数量:', regionCounts);
        
        // 显示关卡名称
        showMessage(`第${currentLevel.value}关: ${levelConfig.name} - 敌人数量: ${enemyCount}`);
    }

    // 在指定格子创建敌人
    function createEnemyInCell(enemyConfig: any, cell: Cell) {
        const enemyId = `enemy_${currentLevel.value}_${enemyUnits.value.length}_${Date.now()}`;
        
        // 找到格子在数独中的行列位置
        const row = Math.floor(cell.index / 9);
        const col = cell.index % 9;
        
        // 获取该位置的数独数字
        const cellValue = sudokuPuzzle.value[row][col];
        
        // 创建敌人单位
        const enemy = {
            id: enemyId,
            name: enemyConfig.name,
            hp: enemyConfig.hp || 1,
            maxHp: enemyConfig.hp || 1,
            atk: enemyConfig.atk || 1,
            traits: [],
            traitNames: {
                'row_buffed': '行数独加成',
                'col_buffed': '列数独加成',
                'region_buffed': '区域数独加成'
            },
            cellIndex: cell.index,
            image: enemyConfig.image || 'assets/enemy_default.svg',
            number: cellValue || 0
        };
        
        enemyUnits.value.push(enemy);
        
        // 标记格子为已占用，并设置单位
        grid.value[cell.index].occupied = true;
        grid.value[cell.index].unit = enemy;
        
        console.log(`在格子 ${cell.index} (行${row}列${col}) 放置敌人 ${enemy.name}，格子数值: ${cellValue}`);
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
    
    // 结束回合
    function endTurn() {
        if (phase.value === 'deployment') {
            const cardsDiscarded = discardHand();
            if (cardsDiscarded > 0) {
              showMessage('剩余手牌已放入弃牌堆');
            }
            saveGameState(); // 结束部署回合时保存
            startNextTurn();
        } else {
            // 如果不是部署阶段，可能需要处理其他逻辑或只是忽略
            console.warn(`endTurn called during unexpected phase: ${phase.value}`);
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
    
    // 开始战斗阶段
    function startBattlePhase() {
        phase.value = 'battle';
        showMessage('战斗开始！');
        // 添加战斗开始的日志
        addBattleLog('战斗开始！', 'special');
        
        // 执行战斗逻辑
        saveGameState();
        executeBattle();
    }
    
    // 执行战斗
    function executeBattle() {
        // 添加战斗开始日志
        addBattleLog('战斗开始! 详细过程如下:', 'special');
        
        // 列出所有参战单位的初始状态
        addBattleLog('我方单位:', 'info');
        playerUnits.value.forEach(unit => {
            addBattleLog(`${unit.name}: 攻击力(${unit.atk}), 生命值(${unit.hp}/${unit.maxHp})`, 'info');
        });
        
        addBattleLog('敌方单位:', 'info');
        enemyUnits.value.forEach(unit => {
            addBattleLog(`${unit.name}: 攻击力(${unit.atk}), 生命值(${unit.hp}/${unit.maxHp})`, 'info');
        });
        
        addBattleLog('--- 战斗开始 ---', 'special');
        
        // 创建战斗单位顺序列表 (简单地将双方单位合并后打乱顺序模拟回合制战斗)
        const allUnits = [...playerUnits.value, ...enemyUnits.value].sort(() => Math.random() - 0.5);
        
        // 每个单位行动一次
        for (let i = 0; i < allUnits.length; i++) {
            const attacker = allUnits[i];
            
            // 跳过已经死亡的单位
            if (attacker.hp <= 0) continue;
            
            // 确定攻击目标
            let targets = attacker.id.startsWith('player') ? 
                enemyUnits.value.filter(unit => unit.hp > 0) : 
                playerUnits.value.filter(unit => unit.hp > 0);
            
            // 如果没有目标则跳过
            if (targets.length === 0) {
                addBattleLog(`${attacker.name}(攻击力${attacker.atk}, 生命值${attacker.hp}) 没有找到目标`, 'info');
                continue;
            }
            
            // 随机选择一个目标
            const target = targets[Math.floor(Math.random() * targets.length)];
            
            // 计算基础伤害
            const baseAttack = attacker.atk;
            
            // 计算实际伤害（考虑护甲等因素）
            let actualDamage = baseAttack;
            
            // 如果目标有护甲属性
            if (target.armor && target.armor > 0) {
                const absorbedDamage = Math.min(target.armor, actualDamage);
                actualDamage -= absorbedDamage;
                // 如果需要消耗护甲，可以在这里更新
                // target.armor -= absorbedDamage;
            }
            
            // 记录攻击前的状态
            const originalHp = target.hp;
            
            // 应用伤害
            target.hp -= actualDamage;
            
            // 确保生命值不低于0
            if (target.hp < 0) target.hp = 0;
            
            // 记录攻击过程
            addBattleLog(
                `${attacker.name}(攻击力${attacker.atk}, 生命值${attacker.hp}) 攻击 ${target.name}, 造成${actualDamage}点伤害, ${target.name}生命值从${originalHp}降至${target.hp}`, 
                'damage'
            );
            
            // 检查目标是否死亡
            if (target.hp <= 0) {
                addBattleLog(`${target.name} 被击败！`, 'special');
                removeUnit(target.id);
            }
        }
        
        addBattleLog('--- 战斗结束 ---', 'special');
        
        // 检查战斗结果
        if (enemyUnits.value.length === 0) {
            addBattleLog('战斗胜利！所有敌人已被击败', 'special');
            handleVictory();
        } else if (playerUnits.value.length === 0) {
            addBattleLog('战斗失败！所有玩家单位已被击败', 'special');
            handleDefeat();
        } else {
            // 如果双方都有存活单位，则显示战斗未结束
            addBattleLog('战斗结束，战场上仍有存活单位:', 'info');
            
            // 列出所有存活单位的状态
            if (playerUnits.value.length > 0) {
                addBattleLog('我方存活单位:', 'info');
                playerUnits.value.forEach(unit => {
                    addBattleLog(`${unit.name}: 生命值(${unit.hp}/${unit.maxHp})`, 'info');
                });
            }
            
            if (enemyUnits.value.length > 0) {
                addBattleLog('敌方存活单位:', 'info');
                enemyUnits.value.forEach(unit => {
                    addBattleLog(`${unit.name}: 生命值(${unit.hp}/${unit.maxHp})`, 'info');
                });
            }
        }
    }
    
    // 处理胜利
    function handleVictory() {
        phase.value = 'victory';
        
        // 添加战斗胜利的日志
        addBattleLog('恭喜！战斗胜利！', 'special');
        
        // 获取奖励
        const level = getLevel(currentLevel.value);
        if (level && level.rewards) {
            if (level.rewards.gold) {
                player.value.gold += level.rewards.gold;
                showMessage(`获得 ${level.rewards.gold} 金币！`);
                addBattleLog(`获得了 ${level.rewards.gold} 金币奖励！`, 'special');
            }
        }
        
        showMessage('恭喜！你赢得了战斗！');
        
        // 检查是否有下一关
        const hasNextLevel = getLevel(currentLevel.value + 1) !== undefined;
        
        // 如果有下一关，准备进入下一关
        if (hasNextLevel) {
            showMessage('准备进入下一关...');
            addBattleLog('准备进入下一关...', 'info');
            setTimeout(() => {
                currentLevel.value++;
                prepareNextBattle();
            }, 2000);
        } else {
            showMessage('恭喜！你通关了所有关卡！');
            addBattleLog('恭喜！你通关了所有关卡！', 'special');
        }
        
        saveGameState();
    }
    
    // 处理失败
    function handleDefeat() {
        phase.value = 'defeat';
        
        showMessage('你被击败了...');
        addBattleLog('你被击败了...', 'damage');
        addBattleLog('战斗失败，即将重新开始游戏', 'info');
        
        // 游戏失败，3秒后重新开始，强制重置游戏
        localStorage.removeItem('sudokuGameState');
        setTimeout(() => {
            startNewGame(true);
        }, 3000);
    }
    
    // 准备下一关战斗
    function prepareNextBattle() {
        // 记录进入下一关的日志
        addBattleLog(`开始准备第 ${currentLevel.value} 关战斗`, 'info');
        
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
            addBattleLog(`进入第${currentLevel.value}关: ${levelConfig.name}`, 'special');
        } else {
            showMessage(`第${currentLevel.value}关开始！`);
            addBattleLog(`进入第${currentLevel.value}关！`, 'special');
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

    // 添加战斗日志
    function addBattleLog(text: string, type: BattleLogMessage['type'] = 'info') {
        console.log(`[BattleLog] ${type}: ${text}`);
        
        const message: BattleLogMessage = { text, type };
        battleLog.value = message;
        battleLogHistory.value.push(message);
        
        // 如果历史记录超过100条，移除最旧的
        if (battleLogHistory.value.length > 100) {
            battleLogHistory.value.shift();
        }
        
        // 确保消息被添加到历史记录中
        console.log(`当前战斗日志数量: ${battleLogHistory.value.length}`);
    }

    // 添加测试战斗日志 - 用于调试
    function addTestBattleLogs() {
        console.log("添加测试战斗日志");
        addBattleLog("测试战斗开始", "special");
        addBattleLog("小恶魔 对 骷髅兵 造成了 2 点伤害", "damage");
        addBattleLog("骷髅兵 对 小恶魔 造成了 1 点伤害", "damage");
        addBattleLog("恶魔战士 恢复了 3 点生命值", "heal");
        
        // 记录当前日志历史数量
        console.log(`当前战斗日志数量: ${battleLogHistory.value.length}`);
        console.log(battleLogHistory.value);
    }

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
        startBattlePhase,
        executeBattle,
        handleVictory,
        handleDefeat,
        prepareNextBattle,
        spawnEnemies,
        
        // 数据持久化方法
        saveGameState,
        loadGameState,
        battleLog,
        battleLogHistory,
        addBattleLog,
        addTestBattleLogs,
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