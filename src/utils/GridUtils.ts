import { Cell, GridLayout } from '../types/Config';
import { Direction, JobType } from '../types/Enums';
import { Unit } from '../types/Unit';

// 创建初始的九宫格布局
export const createInitialGrid = (): GridLayout => {
    const cells: Cell[] = [];
    
    // 创建9个格子，编号1-9
    for (let i = 0; i < 9; i++) {
        const cellNumber = i + 1;
        const gridX = i % 3; // 0, 1, 2
        const gridY = Math.floor(i / 3); // 0, 1, 2
        
        cells.push({
            id: cellNumber,
            gridX,
            gridY,
            bonusAtk: 0,
            bonusArmor: 0,
            occupied: false
        });
    }
    
    return { cells };
};

// 将单元格编号转换为坐标
export const cellNumberToCoordinates = (cellNumber: number): { x: number, y: number } => {
    const x = (cellNumber - 1) % 3;
    const y = Math.floor((cellNumber - 1) / 3);
    return { x, y };
};

// 将坐标转换为单元格编号
export const coordinatesToCellNumber = (x: number, y: number): number => {
    return y * 3 + x + 1;
};

// 获取相邻的单元格编号
export const getAdjacentCells = (cellNumber: number): number[] => {
    const { x, y } = cellNumberToCoordinates(cellNumber);
    const adjacentCells: number[] = [];
    
    // 上
    if (y > 0) {
        adjacentCells.push(coordinatesToCellNumber(x, y - 1));
    }
    
    // 右
    if (x < 2) {
        adjacentCells.push(coordinatesToCellNumber(x + 1, y));
    }
    
    // 下
    if (y < 2) {
        adjacentCells.push(coordinatesToCellNumber(x, y + 1));
    }
    
    // 左
    if (x > 0) {
        adjacentCells.push(coordinatesToCellNumber(x - 1, y));
    }
    
    return adjacentCells;
};

// 根据方向获取目标单元格
export const getCellInDirection = (cellNumber: number, direction: Direction): number | null => {
    const { x, y } = cellNumberToCoordinates(cellNumber);
    
    switch (direction) {
        case Direction.UP:
            return y > 0 ? coordinatesToCellNumber(x, y - 1) : null;
        case Direction.RIGHT:
            return x < 2 ? coordinatesToCellNumber(x + 1, y) : null;
        case Direction.DOWN:
            return y < 2 ? coordinatesToCellNumber(x, y + 1) : null;
        case Direction.LEFT:
            return x > 0 ? coordinatesToCellNumber(x - 1, y) : null;
        default:
            return null;
    }
};

// 计算两个单元格之间的曼哈顿距离
export const getManhattanDistance = (cell1: number, cell2: number): number => {
    const { x: x1, y: y1 } = cellNumberToCoordinates(cell1);
    const { x: x2, y: y2 } = cellNumberToCoordinates(cell2);
    
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
};

// 获取同一行的单元格
export const getCellsInSameRow = (cellNumber: number): number[] => {
    const { y } = cellNumberToCoordinates(cellNumber);
    return [1, 2, 3].map(col => coordinatesToCellNumber(col - 1, y));
};

// 获取同一列的单元格
export const getCellsInSameColumn = (cellNumber: number): number[] => {
    const { x } = cellNumberToCoordinates(cellNumber);
    return [1, 2, 3].map(row => coordinatesToCellNumber(x, row - 1));
};

// 检查行或列中的单位职业是否相同
export const checkJobsInLine = (units: Unit[], cellNumbers: number[]): boolean => {
    const unitsInLine = units.filter(unit => 
        cellNumbers.includes(unit.position.cellNumber)
    );
    
    if (unitsInLine.length < 2) return false;
    
    const firstJobType = unitsInLine[0].jobType;
    return unitsInLine.every(unit => unit.jobType === firstJobType);
};

// 更新九宫格加成效果
export const updateGridBonuses = (grid: GridLayout, units: Unit[]): GridLayout => {
    const newGrid = { ...grid, cells: [...grid.cells] };
    
    // 重置所有格子的加成
    newGrid.cells.forEach(cell => {
        cell.bonusAtk = 0;
        cell.bonusArmor = 0;
    });
    
    // 检查每个单元格的行列加成
    newGrid.cells.forEach(cell => {
        const rowCells = getCellsInSameRow(cell.id);
        const colCells = getCellsInSameColumn(cell.id);
        
        // 检查行中的职业加成
        if (checkJobsInLine(units, rowCells)) {
            cell.bonusAtk += 2; // 同职业行: 攻击+2
        } else {
            cell.bonusArmor += 2; // 不同职业行: 护甲+2
        }
        
        // 检查列中的职业加成
        if (checkJobsInLine(units, colCells)) {
            cell.bonusAtk += 2; // 同职业列: 攻击+2
        } else {
            cell.bonusArmor += 2; // 不同职业列: 护甲+2
        }
    });
    
    return newGrid;
};