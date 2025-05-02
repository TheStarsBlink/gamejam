import { describe, it, expect, vi } from 'vitest'
import { 
  createInitialDeck, 
  shuffleDeck, 
  drawCards, 
  createUnitFromCard, 
  findCardById,
  getMinionCards,
  getUnitEffectiveStats
} from '../../src/utils/CardUtils'
import { Direction, Faction, JobType, Trait } from '../../src/types/Enums'
import { UnitType } from '../../src/types/GameTypes'

// 模拟卡牌模块
vi.mock('../../src/cards/MinionCards', () => ({
  minionCards: [
    { id: 'minion1', name: '随从1', rarity: 'common', type: 'unit' },
    { id: 'minion2', name: '随从2', rarity: 'common', type: 'unit' },
    { id: 'minion3', name: '随从3', rarity: 'rare', type: 'unit' }
  ]
}))

vi.mock('../../src/cards/SpellCards', () => ({
  spellCards: [
    { id: 'spell1', name: '法术1', rarity: 'common', type: 'spell' },
    { id: 'spell2', name: '法术2', rarity: 'common', type: 'spell' },
    { id: 'spell3', name: '法术3', rarity: 'rare', type: 'spell' }
  ]
}))

vi.mock('../../src/cards/BuffCards', () => ({
  buffCards: [
    { id: 'buff1', name: '增益1', rarity: 'common', type: 'buff' },
    { id: 'buff2', name: '增益2', rarity: 'common', type: 'buff' },
    { id: 'buff3', name: '增益3', rarity: 'rare', type: 'buff' }
  ]
}))

describe('CardUtils', () => {
  describe('createInitialDeck', () => {
    it('应该创建一个包含基础卡牌的初始牌库', () => {
      const deck = createInitialDeck()
      
      // 检查牌库不为空
      expect(deck.length).toBeGreaterThan(0)
      
      // 检查牌库中应该只包含普通稀有度的卡牌
      expect(deck.every(card => card.rarity === 'common')).toBe(true)
      
      // 检查牌库包含不同类型的卡牌
      const unitCards = deck.filter(card => card.type === 'unit')
      const spellCards = deck.filter(card => card.type === 'spell')
      const buffCards = deck.filter(card => card.type === 'buff')
      
      expect(unitCards.length).toBeGreaterThan(0)
      expect(spellCards.length).toBeGreaterThan(0)
      expect(buffCards.length).toBeGreaterThan(0)
    })
  })

  describe('shuffleDeck', () => {
    it('应该随机打乱牌库', () => {
      const deck = [
        { id: '1', name: '卡牌1', type: 'unit' },
        { id: '2', name: '卡牌2', type: 'spell' },
        { id: '3', name: '卡牌3', type: 'buff' },
        { id: '4', name: '卡牌4', type: 'unit' },
        { id: '5', name: '卡牌5', type: 'spell' }
      ]
      const originalDeckOrder = [...deck]
      
      const shuffled = shuffleDeck(deck)
      
      // 检查洗牌后的牌库长度不变
      expect(shuffled.length).toBe(deck.length)
      
      // 检查洗牌后的牌库包含原来的所有卡牌
      originalDeckOrder.forEach(card => {
        expect(shuffled.some(c => c.id === card.id)).toBe(true)
      })
      
      // 检查洗牌是否正常（顺序是否可能改变）
      // 注意：理论上洗牌后可能和原来顺序相同，但概率极低
      let changed = false
      for (let i = 0; i < deck.length; i++) {
        if (originalDeckOrder[i].id !== shuffled[i].id) {
          changed = true
          break
        }
      }
      expect(changed).toBe(true)
      
      // 检查原始牌库是否不变
      expect(deck).toEqual(originalDeckOrder)
    })
  })

  describe('drawCards', () => {
    it('应该从牌库中抽取指定数量的牌', () => {
      const deck = [
        { id: '1', name: '卡牌1', type: 'unit' },
        { id: '2', name: '卡牌2', type: 'spell' },
        { id: '3', name: '卡牌3', type: 'buff' },
        { id: '4', name: '卡牌4', type: 'unit' },
        { id: '5', name: '卡牌5', type: 'spell' }
      ]
      
      const result = drawCards(deck, 3)
      
      // 验证抽到的牌
      expect(result.drawnCards.length).toBe(3)
      expect(result.drawnCards[0].id).toBe('1')
      expect(result.drawnCards[1].id).toBe('2')
      expect(result.drawnCards[2].id).toBe('3')
      
      // 验证剩余的牌库
      expect(result.remainingDeck.length).toBe(2)
      expect(result.remainingDeck[0].id).toBe('4')
      expect(result.remainingDeck[1].id).toBe('5')
      
      // 确保原始牌库没有被修改
      expect(deck.length).toBe(5)
    })
    
    it('当抽牌数量超过牌库数量时，应该返回全部牌库', () => {
      const deck = [
        { id: '1', name: '卡牌1', type: 'unit' },
        { id: '2', name: '卡牌2', type: 'spell' }
      ]
      
      const result = drawCards(deck, 5)
      
      expect(result.drawnCards.length).toBe(2)
      expect(result.remainingDeck.length).toBe(0)
    })
  })

  describe('createUnitFromCard', () => {
    it('应该根据随从卡创建单位', () => {
      const card = {
        id: 'test-card',
        name: '测试随从',
        type: 'unit',
        unitType: UnitType.FRIENDLY,
        jobType: JobType.WARRIOR,
        hp: 5,
        atk: 3,
        armor: 1,
        traits: [Trait.DOUBLE_ATTACK],
        traitValues: { [Trait.DOUBLE_ATTACK]: 1 },
        imagePath: '/path/to/image.png'
      }
      
      const cellNumber = 5
      const direction = Direction.DOWN
      
      const unit = createUnitFromCard(card, cellNumber, direction)
      
      // 检查基本属性
      expect(unit.name).toBe(card.name)
      expect(unit.hp).toBe(card.hp)
      expect(unit.maxHp).toBe(card.hp)
      expect(unit.atk).toBe(card.atk)
      expect(unit.baseAtk).toBe(card.atk)
      expect(unit.armor).toBe(card.armor)
      expect(unit.baseArmor).toBe(card.armor)
      expect(unit.faction).toBe(Faction.PLAYER)
      expect(unit.unitType).toBe(card.unitType)
      expect(unit.jobType).toBe(card.jobType)
      
      // 检查位置
      expect(unit.position.cellNumber).toBe(cellNumber)
      expect(unit.position.direction).toBe(direction)
      expect(unit.position.gridX).toBe(1) // (5-1) % 3 = 1
      expect(unit.position.gridY).toBe(1) // Math.floor((5-1) / 3) = 1
      
      // 检查特性
      expect(unit.traits).toContain(Trait.DOUBLE_ATTACK)
      expect(unit.traitValues[Trait.DOUBLE_ATTACK]).toBe(1)
      
      // 检查其他属性
      expect(unit.isAlive).toBe(true)
      expect(unit.hasAttacked).toBe(false)
      expect(unit.statusEffects).toEqual([])
      expect(unit.imagePath).toBe(card.imagePath)
      
      // 检查ID生成
      expect(unit.id).toContain('unit_')
    })
  })

  describe('findCardById', () => {
    it('应该能够根据ID查找到卡牌', () => {
      const card = findCardById('minion1')
      expect(card).toBeDefined()
      expect(card?.id).toBe('minion1')
      expect(card?.name).toBe('随从1')
      
      const spellCard = findCardById('spell2')
      expect(spellCard).toBeDefined()
      expect(spellCard?.id).toBe('spell2')
      
      const buffCard = findCardById('buff3')
      expect(buffCard).toBeDefined()
      expect(buffCard?.id).toBe('buff3')
    })
    
    it('当ID不存在时，应该返回undefined', () => {
      const card = findCardById('non-existent-id')
      expect(card).toBeUndefined()
    })
  })

  describe('getMinionCards', () => {
    it('应该筛选出随从卡牌', () => {
      const cards = [
        { id: '1', type: 'unit' },
        { id: '2', type: 'spell' },
        { id: '3', type: 'unit' },
        { id: '4', type: 'buff' },
        { id: '5', type: 'unit' }
      ]
      
      const minionCards = getMinionCards(cards as any)
      
      expect(minionCards.length).toBe(3)
      expect(minionCards[0].id).toBe('1')
      expect(minionCards[1].id).toBe('3')
      expect(minionCards[2].id).toBe('5')
    })
    
    it('当没有随从卡牌时，应该返回空数组', () => {
      const cards = [
        { id: '1', type: 'spell' },
        { id: '2', type: 'buff' }
      ]
      
      const minionCards = getMinionCards(cards as any)
      expect(minionCards.length).toBe(0)
    })
  })

  describe('getUnitEffectiveStats', () => {
    it('应该计算单位的实际属性值（考虑格子加成）', () => {
      const unit = {
        baseAtk: 3,
        baseArmor: 1,
        faction: Faction.PLAYER,
        traits: [],
        statusEffects: [],
        position: { cellNumber: 5 }
      } as any
      
      const allUnits: any[] = []
      const cellBonusAtk = 2
      const cellBonusArmor = 1
      
      const stats = getUnitEffectiveStats(unit, allUnits, cellBonusAtk, cellBonusArmor)
      
      expect(stats.atk).toBe(5) // 3 + 2
      expect(stats.armor).toBe(2) // 1 + 1
    })
    
    it('应该考虑相邻单位的增幅效果', () => {
      const unit = {
        baseAtk: 3,
        baseArmor: 1,
        faction: Faction.PLAYER,
        traits: [],
        statusEffects: [],
        position: { cellNumber: 5 }
      } as any
      
      const adjacentUnit = {
        faction: Faction.PLAYER,
        traits: [Trait.AMPLIFY],
        traitValues: { [Trait.AMPLIFY]: 2 },
        isAlive: true,
        position: { cellNumber: 4 } // 相邻格子
      } as any
      
      const allUnits = [adjacentUnit]
      
      const stats = getUnitEffectiveStats(unit, allUnits)
      
      expect(stats.atk).toBe(5) // 3 + 2(增幅)
      expect(stats.armor).toBe(1) // 未变
    })
    
    it('应该计算单位的实际属性值（考虑状态效果）', () => {
      const unit = {
        baseAtk: 3,
        baseArmor: 1,
        faction: Faction.PLAYER,
        traits: [],
        statusEffects: [
          { name: '力量强化', value: 2 },
          { name: '护甲强化', value: 1 }
        ],
        position: { cellNumber: 5 }
      } as any
      
      const allUnits: any[] = []
      
      const stats = getUnitEffectiveStats(unit, allUnits)
      
      expect(stats.atk).toBe(5) // 3 + 2(状态效果)
      expect(stats.armor).toBe(2) // 1 + 1(状态效果)
    })
    
    it('应该综合考虑所有加成', () => {
      const unit = {
        baseAtk: 3,
        baseArmor: 1,
        faction: Faction.PLAYER,
        traits: [],
        statusEffects: [
          { name: '力量强化', value: 2 }
        ],
        position: { cellNumber: 5 }
      } as any
      
      const adjacentUnit = {
        faction: Faction.PLAYER,
        traits: [Trait.AMPLIFY],
        traitValues: { [Trait.AMPLIFY]: 1 },
        isAlive: true,
        position: { cellNumber: 4 } // 相邻格子
      } as any
      
      const allUnits = [adjacentUnit]
      const cellBonusAtk = 1
      const cellBonusArmor = 1
      
      const stats = getUnitEffectiveStats(unit, allUnits, cellBonusAtk, cellBonusArmor)
      
      expect(stats.atk).toBe(7) // 3(基础) + 1(格子) + 2(状态) + 1(增幅)
      expect(stats.armor).toBe(2) // 1(基础) + 1(格子)
    })
  })
}) 