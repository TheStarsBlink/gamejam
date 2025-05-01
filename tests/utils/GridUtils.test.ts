import { describe, it, expect } from 'vitest'
import { 
  createInitialGrid, 
  cellNumberToCoordinates, 
  getAdjacentCells,
  updateGridBonuses
} from '../../src/utils/GridUtils'
import { Unit } from '../../src/types/Unit'
import { CombatType, Direction, Faction, JobType } from '../../src/types/Enums'

describe('GridUtils', () => {
  describe('createInitialGrid', () => {
    it('应该创建一个包含9个格子的网格', () => {
      const grid = createInitialGrid()
      expect(grid.cells.length).toBe(9)
      
      // 验证每个格子的属性
      grid.cells.forEach((cell, index) => {
        expect(cell.id).toBe(index + 1)
        expect(cell.gridX).toBe(index % 3)
        expect(cell.gridY).toBe(Math.floor(index / 3))
        expect(cell.bonusAtk).toBe(0)
        expect(cell.bonusArmor).toBe(0)
        expect(cell.occupied).toBe(false)
      })
    })
  })

  describe('cellNumberToCoordinates', () => {
    it('应该正确转换单元格编号为坐标', () => {
      const testCases = [
        { input: 1, expected: { x: 0, y: 0 } },
        { input: 2, expected: { x: 1, y: 0 } },
        { input: 3, expected: { x: 2, y: 0 } },
        { input: 4, expected: { x: 0, y: 1 } },
        { input: 5, expected: { x: 1, y: 1 } },
        { input: 6, expected: { x: 2, y: 1 } },
        { input: 7, expected: { x: 0, y: 2 } },
        { input: 8, expected: { x: 1, y: 2 } },
        { input: 9, expected: { x: 2, y: 2 } }
      ]

      testCases.forEach(({ input, expected }) => {
        const result = cellNumberToCoordinates(input)
        expect(result).toEqual(expected)
      })
    })
  })

  describe('getAdjacentCells', () => {
    it('应该返回中心格子的所有相邻格子', () => {
      // 测试中心格子（5号格子）
      const adjacentTo5 = getAdjacentCells(5)
      expect(adjacentTo5.sort()).toEqual([2, 4, 6, 8].sort())
    })

    it('应该返回角落格子的相邻格子', () => {
      // 测试左上角（1号格子）
      const adjacentTo1 = getAdjacentCells(1)
      expect(adjacentTo1.sort()).toEqual([2, 4].sort())

      // 测试右上角（3号格子）
      const adjacentTo3 = getAdjacentCells(3)
      expect(adjacentTo3.sort()).toEqual([2, 6].sort())

      // 测试左下角（7号格子）
      const adjacentTo7 = getAdjacentCells(7)
      expect(adjacentTo7.sort()).toEqual([4, 8].sort())

      // 测试右下角（9号格子）
      const adjacentTo9 = getAdjacentCells(9)
      expect(adjacentTo9.sort()).toEqual([6, 8].sort())
    })
  })

  describe('updateGridBonuses', () => {
    it('应该正确计算同职业行列的加成', () => {
      const grid = createInitialGrid()
      const units: Unit[] = [
        {
          id: '1',
          name: '战士1',
          hp: 10,
          maxHp: 10,
          atk: 2,
          armor: 0,
          isAlive: true,
          faction: Faction.PLAYER,
          position: { cellNumber: 1, direction: Direction.DOWN },
          combatType: CombatType.MELEE,
          jobType: JobType.WARRIOR,
          traits: [],
          statusEffects: []
        },
        {
          id: '2',
          name: '战士2',
          hp: 10,
          maxHp: 10,
          atk: 2,
          armor: 0,
          isAlive: true,
          faction: Faction.PLAYER,
          position: { cellNumber: 2, direction: Direction.DOWN },
          combatType: CombatType.MELEE,
          jobType: JobType.WARRIOR,
          traits: [],
          statusEffects: []
        }
      ]

      const updatedGrid = updateGridBonuses(grid, units)
      
      // 验证同职业行的加成
      const cell1 = updatedGrid.cells.find(c => c.id === 1)
      const cell2 = updatedGrid.cells.find(c => c.id === 2)
      
      expect(cell1?.bonusAtk).toBeGreaterThan(0)
      expect(cell2?.bonusAtk).toBeGreaterThan(0)
    })

    it('应该正确计算不同职业行列的加成', () => {
      const grid = createInitialGrid()
      const units: Unit[] = [
        {
          id: '1',
          name: '战士',
          hp: 10,
          maxHp: 10,
          atk: 2,
          armor: 0,
          isAlive: true,
          faction: Faction.PLAYER,
          position: { cellNumber: 1, direction: Direction.DOWN },
          combatType: CombatType.MELEE,
          jobType: JobType.WARRIOR,
          traits: [],
          statusEffects: []
        },
        {
          id: '2',
          name: '法师',
          hp: 8,
          maxHp: 8,
          atk: 3,
          armor: 0,
          isAlive: true,
          faction: Faction.PLAYER,
          position: { cellNumber: 2, direction: Direction.DOWN },
          combatType: CombatType.RANGED,
          jobType: JobType.MAGE,
          traits: [],
          statusEffects: []
        }
      ]

      const updatedGrid = updateGridBonuses(grid, units)
      
      // 验证不同职业行的加成
      const cell1 = updatedGrid.cells.find(c => c.id === 1)
      const cell2 = updatedGrid.cells.find(c => c.id === 2)
      
      expect(cell1?.bonusArmor).toBeGreaterThan(0)
      expect(cell2?.bonusArmor).toBeGreaterThan(0)
    })
  })
}) 