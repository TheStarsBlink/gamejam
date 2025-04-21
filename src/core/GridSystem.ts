/**
 * GridSystem 类 - 网格系统
 * 
 * 负责管理游戏棋盘的网格和单元格，处理网格相关的逻辑，
 * 如单位位置、格子状态、网格效果等
 */

// 格子接口，表示棋盘上的一个单元格
export interface GridCell {
  id: number;           // 格子编号(1-9)
  x: number;            // 格子在棋盘上的x坐标
  y: number;            // 格子在棋盘上的y坐标
  number: number;       // 格子上的数字（用于区域战斗）
  occupied: boolean;    // 格子是否被占用
  occupiedById: string | null; // 占用格子的单位ID，如果没有则为null
}

export class GridSystem {
  private _grid: GridCell[] = [];  // 棋盘格子列表
  private _size: number = 3;       // 棋盘大小（3x3格子）
  
  constructor() {
    // 初始化创建一个空的网格
    this.reset(1);
  }
  
  /**
   * 重置网格系统，生成新的棋盘
   * @param level 当前关卡，可能会影响棋盘生成
   */
  public reset(level: number): void {
    // 清空当前网格
    this._grid = [];
    
    // 生成3x3的网格
    for (let y = 0; y < this._size; y++) {
      for (let x = 0; x < this._size; x++) {
        const id = y * this._size + x + 1; // 格子编号从1开始
        
        // 根据关卡生成不同的数字
        // 这里简单示例，实际游戏中可能有更复杂的数字生成逻辑
        let number;
        if (level === 1) {
          // 第一关使用1-9的数字
          number = id;
        } else if (level === 2) {
          // 第二关使用随机1-4的数字
          number = Math.floor(Math.random() * 4) + 1;
        } else {
          // 第三关使用随机1-9的数字
          number = Math.floor(Math.random() * 9) + 1;
        }
        
        // 创建格子
        this._grid.push({
          id,
          x,
          y,
          number,
          occupied: false,
          occupiedById: null
        });
      }
    }
  }
  
  /**
   * 获取指定ID的格子
   * @param id 格子ID
   * @returns 找到的格子，如果不存在则返回undefined
   */
  public getCell(id: number): GridCell | undefined {
    return this._grid.find(cell => cell.id === id);
  }
  
  /**
   * 占用指定格子
   * @param cellId 要占用的格子ID
   * @param unitId 占用格子的单位ID
   * @returns 是否成功占用
   */
  public occupyCell(cellId: number, unitId: string): boolean {
    const cell = this.getCell(cellId);
    
    // 如果格子不存在或已被占用，则无法占用
    if (!cell || cell.occupied) {
      return false;
    }
    
    // 占用格子
    cell.occupied = true;
    cell.occupiedById = unitId;
    
    return true;
  }
  
  /**
   * 释放指定格子
   * @param cellId 要释放的格子ID
   * @returns 是否成功释放
   */
  public releaseCell(cellId: number): boolean {
    const cell = this.getCell(cellId);
    
    // 如果格子不存在，则无法释放
    if (!cell) {
      return false;
    }
    
    // 释放格子
    cell.occupied = false;
    cell.occupiedById = null;
    
    return true;
  }
  
  /**
   * 检查指定格子是否可用（存在且未被占用）
   * @param cellId 要检查的格子ID
   * @returns 格子是否可用
   */
  public isCellAvailable(cellId: number): boolean {
    const cell = this.getCell(cellId);
    return cell !== undefined && !cell.occupied;
  }
  
  /**
   * 获取所有格子
   */
  get grid(): GridCell[] {
    return this._grid;
  }
  
  /**
   * 获取网格大小
   */
  get size(): number {
    return this._size;
  }
} 