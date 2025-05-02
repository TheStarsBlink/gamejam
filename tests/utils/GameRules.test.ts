import { describe, it, expect } from 'vitest'
import { GameRules, UnitType } from '../../src/utils/GameRules'
import { Card } from '../../src/types/Card'
import { Unit } from '../../src/types/Unit'

describe('GameRules', () => {
  describe('sortUnitsByBattleOrder', () => {
    it('应该按照最小编号排序单位', () => {
      const units: any[] = [
        { numbers: [5, 6], type: UnitType.FRIENDLY },
        { numbers: [2, 3], type: UnitType.ENEMY },
        { numbers: [8, 9], type: UnitType.NEUTRAL }
      ]

      const sorted = GameRules.sortUnitsByBattleOrder(units)
      expect(sorted[0].numbers[0]).toBe(2) // 最小编号的应该排在前面
      expect(sorted[1].numbers[0]).toBe(5)
      expect(sorted[2].numbers[0]).toBe(8)
    })

    it('当最小编号相同时，应该按照类型排序：我方-中立-敌方', () => {
      const units: any[] = [
        { numbers: [5, 6], type: UnitType.ENEMY },
        { numbers: [5, 7], type: UnitType.NEUTRAL },
        { numbers: [5, 8], type: UnitType.FRIENDLY }
      ]

      const sorted = GameRules.sortUnitsByBattleOrder(units)
      expect(sorted[0].type).toBe(UnitType.FRIENDLY)
      expect(sorted[1].type).toBe(UnitType.NEUTRAL)
      expect(sorted[2].type).toBe(UnitType.ENEMY)
    })
  })

  describe('canPlaceUnit', () => {
    it('应该正确判断单位是否可以放置在指定位置', () => {
      const board: (any | null)[][] = Array(9).fill(null).map(() => Array(9).fill(null))
      
      // 设置一些已占用的格子
      board[1][1] = { type: UnitType.ENEMY }
      board[2][2] = { type: UnitType.NEUTRAL }
      board[3][3] = { type: UnitType.FRIENDLY }

      // 测试空格
      expect(GameRules.canPlaceUnit(board, 0, 0)).toBe(true)
      
      // 测试被敌方占据的格子
      expect(GameRules.canPlaceUnit(board, 1, 1)).toBe(false)
      
      // 测试被中立单位占据的格子
      expect(GameRules.canPlaceUnit(board, 2, 2)).toBe(false)
      
      // 测试被友方占据的格子（理论上应该可以覆盖，但根据实现可能会有不同）
      expect(GameRules.canPlaceUnit(board, 3, 3)).toBe(true)
      
      // 测试边界外的格子
      expect(GameRules.canPlaceUnit(board, -1, 0)).toBe(false)
      expect(GameRules.canPlaceUnit(board, 0, -1)).toBe(false)
      expect(GameRules.canPlaceUnit(board, 9, 0)).toBe(false)
      expect(GameRules.canPlaceUnit(board, 0, 9)).toBe(false)
    })
  })

  describe('drawCards', () => {
    it('应该从牌库中抽取指定数量的牌', () => {
      const deck: Card[] = [
        { id: '1', name: '卡牌1', type: 'unit' } as Card,
        { id: '2', name: '卡牌2', type: 'spell' } as Card,
        { id: '3', name: '卡牌3', type: 'buff' } as Card,
        { id: '4', name: '卡牌4', type: 'unit' } as Card,
        { id: '5', name: '卡牌5', type: 'spell' } as Card
      ]

      const drawnCards = GameRules.drawCards(deck, 3)
      expect(drawnCards.length).toBe(3)
      expect(drawnCards[0].id).toBe('1')
      expect(drawnCards[1].id).toBe('2')
      expect(drawnCards[2].id).toBe('3')
      
      // 牌库应该被修改
      expect(deck.length).toBe(2)
      expect(deck[0].id).toBe('4')
      expect(deck[1].id).toBe('5')
    })

    it('当牌库不足时，应该返回剩余的所有牌', () => {
      const deck: Card[] = [
        { id: '1', name: '卡牌1', type: 'unit' } as Card,
        { id: '2', name: '卡牌2', type: 'spell' } as Card
      ]

      const drawnCards = GameRules.drawCards(deck, 3)
      expect(drawnCards.length).toBe(2)
      expect(deck.length).toBe(0)
    })

    it('当牌库为空时，应该返回空数组', () => {
      const deck: Card[] = []
      const drawnCards = GameRules.drawCards(deck)
      expect(drawnCards.length).toBe(0)
    })
  })

  describe('playCard', () => {
    it('应该从手牌中打出一张牌并丢弃其他牌', () => {
      const hand: Card[] = [
        { id: '1', name: '卡牌1', type: 'unit' } as Card,
        { id: '2', name: '卡牌2', type: 'spell' } as Card,
        { id: '3', name: '卡牌3', type: 'buff' } as Card
      ]
      const discard: Card[] = []

      const playedCard = GameRules.playCard(hand, 1, discard)
      
      // 检查打出的牌
      expect(playedCard?.id).toBe('2')
      
      // 检查弃牌堆
      expect(discard.length).toBe(2)
      expect(discard[0].id).toBe('1')
      expect(discard[1].id).toBe('3')
      
      // 检查手牌应该为空
      expect(hand.length).toBe(0)
    })

    it('如果选择的索引无效，应该返回null', () => {
      const hand: Card[] = [
        { id: '1', name: '卡牌1', type: 'unit' } as Card,
        { id: '2', name: '卡牌2', type: 'spell' } as Card
      ]
      const discard: Card[] = []

      // 索引超出范围
      expect(GameRules.playCard(hand, 2, discard)).toBeNull()
      expect(GameRules.playCard(hand, -1, discard)).toBeNull()
      
      // 手牌和弃牌堆应该不变
      expect(hand.length).toBe(2)
      expect(discard.length).toBe(0)
    })
  })

  describe('refillDeck', () => {
    it('应该将弃牌堆的牌洗入牌库', () => {
      const deck: Card[] = [
        { id: '1', name: '卡牌1', type: 'unit' } as Card
      ]
      
      const discard: Card[] = [
        { id: '2', name: '卡牌2', type: 'spell' } as Card,
        { id: '3', name: '卡牌3', type: 'buff' } as Card
      ]

      // 备份弃牌堆数量，因为洗牌会随机排序
      const originalDiscardCount = discard.length
      const originalDeckCount = deck.length

      GameRules.refillDeck(deck, discard)
      
      // 检查牌库数量
      expect(deck.length).toBe(originalDeckCount + originalDiscardCount)
      
      // 检查弃牌堆应该为空
      expect(discard.length).toBe(0)
      
      // 检查原牌库中的牌仍然在牌库中
      expect(deck.some(card => card.id === '1')).toBe(true)
      
      // 检查弃牌堆中的牌现在在牌库中
      expect(deck.some(card => card.id === '2')).toBe(true)
      expect(deck.some(card => card.id === '3')).toBe(true)
    })
  })

  describe('shuffleArray', () => {
    it('应该打乱数组但保持数组元素不变', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      const originalArray = [...array]
      
      // 假设非常小的概率会随机成相同顺序，使用足够大的数组减少这种可能性
      const shuffled = GameRules.shuffleArray(array)
      
      // 检查元素数量相同
      expect(shuffled.length).toBe(originalArray.length)
      
      // 检查所有原始元素都在洗牌后的数组中
      originalArray.forEach(element => {
        expect(shuffled.includes(element)).toBe(true)
      })
      
      // 检查是否进行了洗牌（元素顺序有变化）
      // 注意：理论上有极小概率洗牌后顺序不变，但实际上几乎不可能发生
      let hasChanged = false
      for (let i = 0; i < originalArray.length; i++) {
        if (originalArray[i] !== shuffled[i]) {
          hasChanged = true
          break
        }
      }
      expect(hasChanged).toBe(true)
      
      // 检查原始数组是否不变
      expect(array).toEqual(originalArray)
    })
  })
}) 