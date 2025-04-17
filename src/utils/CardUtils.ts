import { Card, MinionCard } from '../types/Card';
import { Direction, Faction, JobType, Trait } from '../types/Enums';
import { CardType, UnitType } from '../types/GameTypes';
import { GameUnit as Unit } from '../types/Unit';
import { minionCards } from '../cards/MinionCards';
import { spellCards } from '../cards/SpellCards';
import { buffCards } from '../cards/BuffCards';

// 创建初始牌库
export const createInitialDeck = (): Card[] => {
    const deck: Card[] = [];
    
    // 添加一些基础卡牌
    deck.push(...minionCards.filter(card => card.rarity === 'common').slice(0, 5));
    deck.push(...spellCards.filter(card => card.rarity === 'common').slice(0, 2));
    deck.push(...buffCards.filter(card => card.rarity === 'common').slice(0, 2));
    
    return deck;
};

// 洗牌算法
export const shuffleDeck = (deck: Card[]): Card[] => {
    const shuffled = [...deck];
    
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    return shuffled;
};

// 从牌库抽牌
export const drawCards = (deck: Card[], count: number): { drawnCards: Card[], remainingDeck: Card[] } => {
    const drawnCards = deck.slice(0, Math.min(count, deck.length));
    const remainingDeck = deck.slice(Math.min(count, deck.length));
    
    return { drawnCards, remainingDeck };
};

// 根据随从卡创建单位
export const createUnitFromCard = (
    card: MinionCard, 
    cellNumber: number, 
    direction: Direction
): Unit => {
    return {
        id: `unit_${Math.random().toString(36).substr(2, 9)}`,
        name: card.name,
        faction: Faction.PLAYER,
        unitType: card.unitType,
        jobType: card.jobType,
        hp: card.hp,
        maxHp: card.hp,
        atk: card.atk,
        baseAtk: card.atk,
        armor: card.armor,
        baseArmor: card.armor,
        position: {
            gridX: (cellNumber - 1) % 3,
            gridY: Math.floor((cellNumber - 1) / 3),
            cellNumber,
            direction
        },
        traits: [...card.traits],
        traitValues: { ...card.traitValues },
        statusEffects: [],
        hasAttacked: false,
        isAlive: true,
        imagePath: card.imagePath
    };
};

// 根据卡牌ID查找卡牌
export const findCardById = (id: string): Card | undefined => {
    return [...minionCards, ...spellCards, ...buffCards].find(card => card.id === id);
};

// 筛选随从卡
export const getMinionCards = (cards: Card[]): MinionCard[] => {
    return cards.filter(card => card.type === 'unit') as MinionCard[];
};

// 获取单位的增益效果后的属性
export const getUnitEffectiveStats = (
    unit: Unit, 
    allUnits: Unit[], 
    cellBonusAtk: number = 0, 
    cellBonusArmor: number = 0
): { atk: number, armor: number } => {
    let effectiveAtk = unit.baseAtk + cellBonusAtk;
    let effectiveArmor = unit.baseArmor + cellBonusArmor;
    
    // 检查相邻单位的增幅效果
    const adjacentUnits = getAdjacentUnits(unit, allUnits);
    
    adjacentUnits.forEach(adjacentUnit => {
        if (
            adjacentUnit.faction === unit.faction && 
            adjacentUnit.traits.includes(Trait.AMPLIFY)
        ) {
            const amplifyValue = adjacentUnit.traitValues[Trait.AMPLIFY] || 1;
            effectiveAtk += amplifyValue;
        }
    });
    
    // 应用状态效果
    unit.statusEffects.forEach(effect => {
        if (effect.name === '力量强化') {
            effectiveAtk += effect.value;
        } else if (effect.name === '护甲强化') {
            effectiveArmor += effect.value;
        }
    });
    
    return { atk: effectiveAtk, armor: effectiveArmor };
};

// 获取相邻单位
const getAdjacentUnits = (unit: Unit, allUnits: Unit[]): Unit[] => {
    const cellNumber = unit.position.cellNumber;
    const adjacentCellNumbers = [
        cellNumber > 3 ? cellNumber - 3 : null, // 上
        cellNumber % 3 !== 0 ? cellNumber + 1 : null, // 右
        cellNumber < 7 ? cellNumber + 3 : null, // 下
        cellNumber % 3 !== 1 ? cellNumber - 1 : null // 左
    ].filter(cell => cell !== null) as number[];
    
    return allUnits.filter(u => 
        u.isAlive && 
        adjacentCellNumbers.includes(u.position.cellNumber)
    );
};