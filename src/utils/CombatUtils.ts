import { CombatType, Direction, Faction, Trait } from '../types/Enums';
import { StatusEffect, Unit } from '../types/Unit';
import { getAdjacentCells, getCellInDirection } from './GridUtils';
import { UnitType } from '../utils/GameRules';

// 处理攻击
export const handleAttack = (attacker: Unit, target: Unit): { attacker: Unit, target: Unit, damage: number } => {
    let damage = attacker.atk;
    let actualDamage = 0;
    
    // 检查特殊特性
    const hasDoubleAttack = attacker.traits.includes(Trait.DOUBLE_ATTACK);
    const hasPierce = attacker.traits.includes(Trait.PIERCE);
    const hasBackstab = attacker.traits.includes(Trait.BACKSTAB);
    
    // 背刺检查
    if (hasBackstab) {
        // 获取目标的背后方向
        const backDirection = getOppositeDirection(target.position.direction);
        const attackerDirection = getDirectionBetweenCells(attacker.position.cellNumber, target.position.cellNumber);
        
        if (attackerDirection === backDirection) {
            damage += 1; // 背刺攻击+1
        }
    }
    
    // 处理连击
    const attackCount = hasDoubleAttack ? 2 : 1;
    
    for (let i = 0; i < attackCount; i++) {
        let currentDamage = damage;
        
        // 处理护甲
        if (!hasPierce && target.armor > 0) {
            const absorbedDamage = Math.min(target.armor, currentDamage);
            target.armor -= absorbedDamage;
            currentDamage -= absorbedDamage;
        }
        
        // 处理伤害
        if (currentDamage > 0) {
            target.hp -= currentDamage;
            actualDamage += currentDamage;
        }
    }
    
    // 检查目标是否死亡
    if (target.hp <= 0) {
        target.hp = 0;
        target.isAlive = false;
        
        // 处理亡语效果
        if (target.traits.includes(Trait.DEATHRATTLE)) {
            handleDeathrattle(target);
        }
    }
    
    // 处理攻击后的效果
    handlePostAttackEffects(attacker, target);
    
    return { attacker, target, damage: actualDamage };
};

// 处理攻击后的效果
const handlePostAttackEffects = (attacker: Unit, target: Unit): void => {
    // 处理治疗
    if (attacker.traits.includes(Trait.HEALING) && attacker.faction === Faction.PLAYER) {
        const healAmount = attacker.traitValues[Trait.HEALING] || attacker.atk;
        attacker.hp = Math.min(attacker.hp + healAmount, attacker.maxHp);
    }
    
    // 处理中毒
    if (attacker.traits.includes(Trait.POISON)) {
        const poisonValue = attacker.traitValues[Trait.POISON] || 1;
        const poisonDuration = 2; // 默认2回合
        
        // 添加中毒状态效果
        const poisonEffect: StatusEffect = {
            name: '中毒',
            duration: poisonDuration,
            value: poisonValue,
            description: `每回合受到${poisonValue}点伤害`,
            onApply: (unit: Unit) => {
                // 应用时无特殊效果
            },
            onRemove: (unit: Unit) => {
                // 移除时无特殊效果
            },
            onTurnEnd: (unit: Unit) => {
                unit.hp -= poisonValue;
                if (unit.hp <= 0) {
                    unit.hp = 0;
                    unit.isAlive = false;
                }
            }
        };
        
        // 检查是否已有中毒效果，有则刷新持续时间
        const existingPoisonIndex = target.statusEffects.findIndex(effect => effect.name === '中毒');
        if (existingPoisonIndex >= 0) {
            target.statusEffects[existingPoisonIndex].duration = poisonDuration;
        } else {
            target.statusEffects.push(poisonEffect);
            poisonEffect.onApply(target);
        }
    }
    
    // 处理反击
    if (target.isAlive && target.traits.includes(Trait.COUNTER)) {
        const counterValue = target.traitValues[Trait.COUNTER] || 1;
        attacker.hp -= counterValue;
        
        if (attacker.hp <= 0) {
            attacker.hp = 0;
            attacker.isAlive = false;
        }
    }
};

// 处理亡语效果
const handleDeathrattle = (unit: Unit): void => {
    // 获取相邻格子
    const adjacentCells = getAdjacentCells(unit.position.cellNumber);
    
    // 这里可以实现各种亡语效果，如对相邻敌人造成伤害等
    // 具体实现将在BattleScene中处理
};

// 根据攻击逻辑选择目标
export const selectTarget = (
    attacker: Unit, 
    potentialTargets: Unit[], 
    allUnits: Unit[]
): Unit | null => {
    if (potentialTargets.length === 0) return null;
    
    // 筛选存活的敌方单位
    const aliveEnemies = potentialTargets.filter(
        unit => unit.isAlive && unit.faction !== attacker.faction
    );
    
    if (aliveEnemies.length === 0) return null;
    
    // 近战单位的目标选择逻辑
    if (attacker.combatType === CombatType.MELEE) {
        // 获取相邻格子
        const adjacentCells = getAdjacentCells(attacker.position.cellNumber);
        
        // 找出相邻的敌人
        const adjacentEnemies = aliveEnemies.filter(
            enemy => adjacentCells.includes(enemy.position.cellNumber)
        );
        
        if (adjacentEnemies.length === 0) return null;
        
        // 优先攻击远程单位
        const rangedEnemies = adjacentEnemies.filter(
            enemy => enemy.combatType === CombatType.RANGED
        );
        
        if (rangedEnemies.length > 0) {
            // 如果有多个远程单位，随机选择一个
            return rangedEnemies[Math.floor(Math.random() * rangedEnemies.length)];
        }
        
        // 否则随机选择一个相邻敌人
        return adjacentEnemies[Math.floor(Math.random() * adjacentEnemies.length)];
    }
    
    // 远程单位的目标选择逻辑
    if (attacker.combatType === CombatType.RANGED) {
        // 按照面朝方向及顺时针顺序选择目标
        const direction = attacker.position.direction;
        let currentDirection = direction;
        
        // 尝试4个方向
        for (let i = 0; i < 4; i++) {
            // 获取当前方向上的目标格子
            const targetCellNumber = getCellInDirection(attacker.position.cellNumber, currentDirection);
            
            if (targetCellNumber) {
                // 检查该格子上是否有敌人
                const enemiesInCell = aliveEnemies.filter(
                    enemy => enemy.position.cellNumber === targetCellNumber
                );
                
                if (enemiesInCell.length > 0) {
                    return enemiesInCell[0];
                }
            }
            
            // 顺时针旋转方向
            currentDirection = (currentDirection + 1) % 4;
        }
        
        // 如果按方向找不到目标，随机选择一个敌人
        return aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
    }
    
    return null;
};

// 获取相反的方向
export const getOppositeDirection = (direction: Direction): Direction => {
    switch (direction) {
        case Direction.UP: return Direction.DOWN;
        case Direction.RIGHT: return Direction.LEFT;
        case Direction.DOWN: return Direction.UP;
        case Direction.LEFT: return Direction.RIGHT;
        default: return direction;
    }
};

// 获取两个格子之间的方向
export const getDirectionBetweenCells = (fromCell: number, toCell: number): Direction | null => {
    const fromCoords = { 
        x: (fromCell - 1) % 3, 
        y: Math.floor((fromCell - 1) / 3) 
    };
    
    const toCoords = { 
        x: (toCell - 1) % 3, 
        y: Math.floor((toCell - 1) / 3) 
    };
    
    // 只处理相邻格子
    const dx = toCoords.x - fromCoords.x;
    const dy = toCoords.y - fromCoords.y;
    
    if (dx === 0 && dy === -1) return Direction.UP;
    if (dx === 1 && dy === 0) return Direction.RIGHT;
    if (dx === 0 && dy === 1) return Direction.DOWN;
    if (dx === -1 && dy === 0) return Direction.LEFT;
    
    return null;
};

// 处理状态效果
export const processStatusEffects = (unit: Unit, phase: 'turnStart' | 'turnEnd'): Unit => {
    const updatedUnit = { ...unit };
    const expiredEffects: number[] = [];
    
    updatedUnit.statusEffects.forEach((effect, index) => {
        // 根据阶段调用对应的回调
        if (phase === 'turnStart' && effect.onTurnStart) {
            effect.onTurnStart(updatedUnit);
        } else if (phase === 'turnEnd' && effect.onTurnEnd) {
            effect.onTurnEnd(updatedUnit);
        }
        
        // 减少持续时间
        effect.duration--;
        
        // 标记已过期的效果
        if (effect.duration <= 0) {
            expiredEffects.push(index);
            effect.onRemove(updatedUnit);
        }
    });
    
    // 移除已过期的效果（从后往前移除，避免索引问题）
    for (let i = expiredEffects.length - 1; i >= 0; i--) {
        updatedUnit.statusEffects.splice(expiredEffects[i], 1);
    }
    
    // 检查单位是否死亡
    if (updatedUnit.hp <= 0) {
        updatedUnit.hp = 0;
        updatedUnit.isAlive = false;
    }
    
    return updatedUnit;
}; 