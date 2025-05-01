import { describe, it, expect, beforeEach } from 'vitest'
import { SudokuGenerator } from '../../src/utils/SudokuGenerator'

describe('SudokuGenerator', () => {
  let generator: SudokuGenerator

  beforeEach(() => {
    generator = new SudokuGenerator()
  })

  describe('generate', () => {
    it('应该生成有效的9x9数独', () => {
      const { puzzle, solution } = generator.generate()
      
      // 验证尺寸
      expect(puzzle.length).toBe(9)
      expect(solution.length).toBe(9)
      puzzle.forEach(row => expect(row.length).toBe(9))
      solution.forEach(row => expect(row.length).toBe(9))

      // 验证数字范围
      puzzle.forEach(row => {
        row.forEach(num => {
          expect(num).toBeGreaterThanOrEqual(1)
          expect(num).toBeLessThanOrEqual(9)
        })
      })

      // 验证解答的有效性
      expect(SudokuGenerator.validateSudoku(solution)).toBe(true)
    })
  })

  describe('validateSudoku', () => {
    it('应该正确验证有效的数独', () => {
      const validGrid = [
        [5,3,4,6,7,8,9,1,2],
        [6,7,2,1,9,5,3,4,8],
        [1,9,8,3,4,2,5,6,7],
        [8,5,9,7,6,1,4,2,3],
        [4,2,6,8,5,3,7,9,1],
        [7,1,3,9,2,4,8,5,6],
        [9,6,1,5,3,7,2,8,4],
        [2,8,7,4,1,9,6,3,5],
        [3,4,5,2,8,6,1,7,9]
      ]
      expect(SudokuGenerator.validateSudoku(validGrid)).toBe(true)
    })

    it('应该检测出无效的数独（行重复）', () => {
      const invalidGrid = [
        [5,3,4,6,7,8,9,1,2],
        [5,7,2,1,9,5,3,4,8], // 第一个数字重复了5
        [1,9,8,3,4,2,5,6,7],
        [8,5,9,7,6,1,4,2,3],
        [4,2,6,8,5,3,7,9,1],
        [7,1,3,9,2,4,8,5,6],
        [9,6,1,5,3,7,2,8,4],
        [2,8,7,4,1,9,6,3,5],
        [3,4,5,2,8,6,1,7,9]
      ]
      expect(SudokuGenerator.validateSudoku(invalidGrid)).toBe(false)
    })

    it('应该检测出无效的数独（列重复）', () => {
      const invalidGrid = [
        [5,3,4,6,7,8,9,1,2],
        [6,7,2,1,9,5,3,4,8],
        [1,9,8,3,4,2,5,6,7],
        [8,5,9,7,6,1,4,2,3],
        [4,2,6,8,5,3,7,9,1],
        [7,1,3,9,2,4,8,5,6],
        [9,6,1,5,3,7,2,8,4],
        [2,8,7,4,1,9,6,3,5],
        [3,4,5,2,8,6,1,7,2] // 最后一个数字与第一行的2重复
      ]
      expect(SudokuGenerator.validateSudoku(invalidGrid)).toBe(false)
    })

    it('应该检测出无效的数独（3x3方格重复）', () => {
      const invalidGrid = [
        [5,3,4,6,7,8,9,1,2],
        [6,5,2,1,9,5,3,4,8], // 第二行第二个数字与第一行第一个数字在同一3x3方格中重复
        [1,9,8,3,4,2,5,6,7],
        [8,5,9,7,6,1,4,2,3],
        [4,2,6,8,5,3,7,9,1],
        [7,1,3,9,2,4,8,5,6],
        [9,6,1,5,3,7,2,8,4],
        [2,8,7,4,1,9,6,3,5],
        [3,4,5,2,8,6,1,7,9]
      ]
      expect(SudokuGenerator.validateSudoku(invalidGrid)).toBe(false)
    })
  })
}) 