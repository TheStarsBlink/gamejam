/**
 * 数独生成器
 * 用于生成有效的9x9数独谜题及其解答
 */
export class SudokuGenerator {
  private grid: number[][];
  private solution: number[][];

  constructor() {
    this.grid = Array(9).fill(null).map(() => Array(9).fill(0));
    this.solution = Array(9).fill(null).map(() => Array(9).fill(0));
  }

  /**
   * 生成一个有效的数独谜题
   * @param difficulty 难度系数(0-1)，值越大，空格越多
   * @returns 生成的数独谜题
   */
  generate(difficulty: number = 0.5): { puzzle: number[][], solution: number[][] } {
    // 清空网格
    this.grid = Array(9).fill(null).map(() => Array(9).fill(0));
    
    // 生成完整解决方案
    this.fillGrid();
    
    // 保存解决方案的副本
    this.solution = this.grid.map(row => [...row]);
    
    // 根据难度移除一些数字来创建谜题
    this.removeNumbers(difficulty);
    
    return {
      puzzle: this.grid.map(row => [...row]),
      solution: this.solution
    };
  }

  /**
   * 检查在特定位置放置某个数字是否有效
   */
  private isValid(row: number, col: number, num: number): boolean {
    // 检查行
    for (let x = 0; x < 9; x++) {
      if (this.grid[row][x] === num) {
        return false;
      }
    }
    
    // 检查列
    for (let x = 0; x < 9; x++) {
      if (this.grid[x][col] === num) {
        return false;
      }
    }
    
    // 检查3x3方格
    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (this.grid[boxRow + r][boxCol + c] === num) {
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * 填充整个数独网格
   */
  private fillGrid(): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (this.grid[row][col] === 0) {
          // 随机排列1-9
          const nums = this.shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);
          
          for (const num of nums) {
            if (this.isValid(row, col, num)) {
              this.grid[row][col] = num;
              
              if (this.fillGrid()) {
                return true;
              }
              
              this.grid[row][col] = 0;
            }
          }
          
          return false;
        }
      }
    }
    
    return true;
  }

  /**
   * 从谜题中移除数字以创建谜题
   */
  private removeNumbers(difficulty: number): void {
    // 计算要移除的数量 (最多移除约81*0.8个数字)
    const cellsToRemove = Math.floor(81 * Math.min(0.8, difficulty));
    
    console.log(`将从数独中移除 ${cellsToRemove} 个数字，创建空地`);
    
    let removed = 0;
    while (removed < cellsToRemove) {
      const row = Math.floor(Math.random() * 9);
      const col = Math.floor(Math.random() * 9);
      
      if (this.grid[row][col] !== 0) {
        const originalValue = this.grid[row][col];
        this.grid[row][col] = 0;
        removed++;
        
        if (removed % 10 === 0) {
          console.log(`已移除 ${removed} 个数字，创建空地`);
        }
      }
    }
    
    // 检查空地数量是否正确
    let emptyCount = 0;
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (this.grid[row][col] === 0) {
          emptyCount++;
        }
      }
    }
    
    console.log(`验证结果: 创建的空地数量为 ${emptyCount}`);
  }

  /**
   * 将数组随机打乱顺序
   */
  private shuffleArray(array: number[]): number[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * 验证数独是否有效
   */
  static validateSudoku(grid: number[][]): boolean {
    // 检查行
    for (let row = 0; row < 9; row++) {
      const rowSet = new Set<number>();
      for (let col = 0; col < 9; col++) {
        const cell = grid[row][col];
        if (cell !== 0) {
          if (rowSet.has(cell)) return false;
          rowSet.add(cell);
        }
      }
    }
    
    // 检查列
    for (let col = 0; col < 9; col++) {
      const colSet = new Set<number>();
      for (let row = 0; row < 9; row++) {
        const cell = grid[row][col];
        if (cell !== 0) {
          if (colSet.has(cell)) return false;
          colSet.add(cell);
        }
      }
    }
    
    // 检查9个3x3方格
    for (let boxRow = 0; boxRow < 3; boxRow++) {
      for (let boxCol = 0; boxCol < 3; boxCol++) {
        const boxSet = new Set<number>();
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            const cell = grid[boxRow * 3 + r][boxCol * 3 + c];
            if (cell !== 0) {
              if (boxSet.has(cell)) return false;
              boxSet.add(cell);
            }
          }
        }
      }
    }
    
    return true;
  }
} 