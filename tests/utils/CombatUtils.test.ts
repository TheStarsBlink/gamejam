import { describe, it, expect } from 'vitest'
import { handleAttack, selectTarget, getDirectionBetweenCells } from '../../src/utils/CombatUtils'
import { Unit } from '../../src/types/Unit'
import { CombatType, Direction, Faction, JobType, Trait } from '../../src/types/Enums'

describe('CombatUtils', () => {
  describe('handleAttack', () => {
    it('应该正确处理基础攻击', () => {
      const attacker: Unit = {
        id: '1',
        name: '战士',
        hp: 10,
        maxHp: 10,
        atk: 3,
        armor: 0,
        isAlive: true,
        faction: Faction.PLAYER,
        position: { cellNumber: 1, direction: Direction.DOWN },
        combatType: CombatType.MELEE,
        jobType: JobType.WARRIOR,
        traits: [],
        statusEffects: []
      }

      const target: Unit = {
        id: '2',
        name: '敌人',
        hp: 10,
        maxHp: 10,
        atk: 2,
        armor: 0,
        isAlive: true,
        faction: Faction.ENEMY,
        position: { cellNumber: 4, direction: Direction.UP },
        combatType: CombatType.MELEE,
        jobType: JobType.WARRIOR,
        traits: [],
        statusEffects: []
      }

      const result = handleAttack(attacker, target)
      expect(result.damage).toBe(3) // 基础伤害等于攻击力
      expect(result.target.hp).toBe(7) // 目标生命值减少
      expect(result.target.isAlive).toBe(true) // 目标仍然存活
    })

    it('应该正确处理护甲减伤', () => {
      const attacker: Unit = {
        id: '1',
        name: '战士',
        hp: 10,
        maxHp: 10,
        atk: 3,
        armor: 0,
        isAlive: true,
        faction: Faction.PLAYER,
        position: { cellNumber: 1, direction: Direction.DOWN },
        combatType: CombatType.MELEE,
        jobType: JobType.WARRIOR,
        traits: [],
        statusEffects: []
      }

      const target: Unit = {
        id: '2',
        name: '敌人',
        hp: 10,
        maxHp: 10,
        atk: 2,
        armor: 2,
        isAlive: true,
        faction: Faction.ENEMY,
        position: { cellNumber: 4, direction: Direction.UP },
        combatType: CombatType.MELEE,
        jobType: JobType.WARRIOR,
        traits: [],
        statusEffects: []
      }

      const result = handleAttack(attacker, target)
      expect(result.damage).toBe(1) // 3点伤害 - 2点护甲 = 1点实际伤害
      expect(result.target.hp).toBe(9)
      expect(result.target.armor).toBe(0) // 护甲被消耗
    })

    it('应该正确处理双重攻击特性', () => {
      const attacker: Unit = {
        id: '1',
        name: '双刀战士',
        hp: 10,
        maxHp: 10,
        atk: 2,
        armor: 0,
        isAlive: true,
        faction: Faction.PLAYER,
        position: { cellNumber: 1, direction: Direction.DOWN },
        combatType: CombatType.MELEE,
        jobType: JobType.WARRIOR,
        traits: [Trait.DOUBLE_ATTACK],
        statusEffects: []
      }

      const target: Unit = {
        id: '2',
        name: '敌人',
        hp: 10,
        maxHp: 10,
        atk: 2,
        armor: 1,
        isAlive: true,
        faction: Faction.ENEMY,
        position: { cellNumber: 4, direction: Direction.UP },
        combatType: CombatType.MELEE,
        jobType: JobType.WARRIOR,
        traits: [],
        statusEffects: []
      }

      const result = handleAttack(attacker, target)
      expect(result.damage).toBe(2) // 两次攻击，每次1点实际伤害
      expect(result.target.hp).toBe(8)
      expect(result.target.armor).toBe(0)
    })
  })

  describe('selectTarget', () => {
    it('近战单位应该选择相邻的敌人', () => {
      const attacker: Unit = {
        id: '1',
        name: '战士',
        hp: 10,
        maxHp: 10,
        atk: 3,
        armor: 0,
        isAlive: true,
        faction: Faction.PLAYER,
        position: { cellNumber: 5, direction: Direction.DOWN }, // 中心位置
        combatType: CombatType.MELEE,
        jobType: JobType.WARRIOR,
        traits: [],
        statusEffects: []
      }

      const potentialTargets: Unit[] = [
        {
          id: '2',
          name: '远程敌人',
          hp: 8,
          maxHp: 8,
          atk: 2,
          armor: 0,
          isAlive: true,
          faction: Faction.ENEMY,
          position: { cellNumber: 2, direction: Direction.DOWN }, // 相邻位置
          combatType: CombatType.RANGED,
          jobType: JobType.MAGE,
          traits: [],
          statusEffects: []
        },
        {
          id: '3',
          name: '远程敌人2',
          hp: 8,
          maxHp: 8,
          atk: 2,
          armor: 0,
          isAlive: true,
          faction: Faction.ENEMY,
          position: { cellNumber: 9, direction: Direction.UP }, // 非相邻位置
          combatType: CombatType.RANGED,
          jobType: JobType.MAGE,
          traits: [],
          statusEffects: []
        }
      ]

      const target = selectTarget(attacker, potentialTargets, potentialTargets)
      expect(target?.id).toBe('2') // 应该选择相邻的敌人
    })

    it('远程单位应该优先选择面向方向的敌人', () => {
      const attacker: Unit = {
        id: '1',
        name: '法师',
        hp: 8,
        maxHp: 8,
        atk: 3,
        armor: 0,
        isAlive: true,
        faction: Faction.PLAYER,
        position: { cellNumber: 5, direction: Direction.DOWN },
        combatType: CombatType.RANGED,
        jobType: JobType.MAGE,
        traits: [],
        statusEffects: []
      }

      const potentialTargets: Unit[] = [
        {
          id: '2',
          name: '敌人1',
          hp: 10,
          maxHp: 10,
          atk: 2,
          armor: 0,
          isAlive: true,
          faction: Faction.ENEMY,
          position: { cellNumber: 8, direction: Direction.UP }, // 面向方向
          combatType: CombatType.MELEE,
          jobType: JobType.WARRIOR,
          traits: [],
          statusEffects: []
        },
        {
          id: '3',
          name: '敌人2',
          hp: 10,
          maxHp: 10,
          atk: 2,
          armor: 0,
          isAlive: true,
          faction: Faction.ENEMY,
          position: { cellNumber: 2, direction: Direction.DOWN }, // 非面向方向
          combatType: CombatType.MELEE,
          jobType: JobType.WARRIOR,
          traits: [],
          statusEffects: []
        }
      ]

      const target = selectTarget(attacker, potentialTargets, potentialTargets)
      expect(target?.id).toBe('2') // 应该选择面向方向的敌人
    })
  })

  describe('getDirectionBetweenCells', () => {
    it('应该正确计算相邻格子之间的方向', () => {
      // 水平方向
      expect(getDirectionBetweenCells(1, 2)).toBe(Direction.RIGHT)
      expect(getDirectionBetweenCells(2, 1)).toBe(Direction.LEFT)

      // 垂直方向
      expect(getDirectionBetweenCells(1, 4)).toBe(Direction.DOWN)
      expect(getDirectionBetweenCells(4, 1)).toBe(Direction.UP)
    })

    it('对于非相邻格子应该返回null', () => {
      expect(getDirectionBetweenCells(1, 3)).toBe(null) // 隔了一格
      expect(getDirectionBetweenCells(1, 5)).toBe(null) // 对角线
      expect(getDirectionBetweenCells(1, 9)).toBe(null) // 远距离
    })
  })
}) 