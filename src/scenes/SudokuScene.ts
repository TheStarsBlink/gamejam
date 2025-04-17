import Phaser from 'phaser';
import { SudokuGenerator } from '../utils/SudokuGenerator';

export class SudokuScene extends Phaser.Scene {
  private cells: Phaser.GameObjects.Rectangle[][] = [];
  private numbers: Phaser.GameObjects.Text[][] = [];
  private puzzle: number[][] = [];
  private solution: number[][] = [];
  private selectedCell: { row: number, col: number } | null = null;
  private numberButtons: Phaser.GameObjects.Text[] = [];
  private difficulty: number = 0.5;
  private cellSize: number = 0;
  private gridSize: number = 0;
  private margin: number = 0;

  constructor() {
    super('SudokuScene');
  }

  create(): void {
    // 设置背景
    this.cameras.main.setBackgroundColor('#f0f0f0');
    
    // 计算网格大小和单元格大小
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    
    this.gridSize = Math.min(screenWidth, screenHeight) * 0.8;
    this.cellSize = this.gridSize / 9;
    this.margin = (Math.min(screenWidth, screenHeight) - this.gridSize) / 2;
    
    // 生成数独谜题
    this.generateNewPuzzle();
    
    // 创建数独网格
    this.createGrid();
    
    // 创建数字按钮
    this.createNumberButtons();
    
    // 添加控制按钮
    this.createControlButtons();
    
    // 添加返回主菜单按钮
    this.addBackButton();
  }

  /**
   * 生成新的数独谜题
   */
  private generateNewPuzzle(): void {
    const generator = new SudokuGenerator();
    const result = generator.generate(this.difficulty);
    this.puzzle = result.puzzle;
    this.solution = result.solution;
  }

  /**
   * 创建数独网格
   */
  private createGrid(): void {
    const startX = (this.cameras.main.width - this.gridSize) / 2;
    const startY = (this.cameras.main.height - this.gridSize) / 2;
    
    // 创建背景
    const gridBg = this.add.rectangle(
      startX + this.gridSize / 2,
      startY + this.gridSize / 2,
      this.gridSize + 4,
      this.gridSize + 4,
      0x333333
    );
    
    // 创建单元格
    for (let row = 0; row < 9; row++) {
      this.cells[row] = [];
      this.numbers[row] = [];
      
      for (let col = 0; col < 9; col++) {
        // 创建单元格背景
        const cellX = startX + col * this.cellSize + this.cellSize / 2;
        const cellY = startY + row * this.cellSize + this.cellSize / 2;
        
        // 添加单元格背景
        const cell = this.add.rectangle(
          cellX,
          cellY,
          this.cellSize - 2,
          this.cellSize - 2,
          0xffffff
        );
        cell.setInteractive();
        cell.on('pointerdown', () => this.selectCell(row, col));
        this.cells[row][col] = cell;
        
        // 添加数字
        const textStyle = {
          font: `${this.cellSize * 0.6}px Arial`,
          color: this.puzzle[row][col] !== 0 ? '#000000' : '#0066cc'
        };
        
        const number = this.add.text(
          cellX,
          cellY,
          this.puzzle[row][col] !== 0 ? this.puzzle[row][col].toString() : '',
          textStyle
        );
        number.setOrigin(0.5, 0.5);
        this.numbers[row][col] = number;
      }
    }
    
    // 添加粗线分隔3x3区域
    const lineWidth = 3;
    for (let i = 1; i < 3; i++) {
      // 横线
      this.add.rectangle(
        startX + this.gridSize / 2,
        startY + i * 3 * this.cellSize,
        this.gridSize,
        lineWidth,
        0x000000
      );
      
      // 竖线
      this.add.rectangle(
        startX + i * 3 * this.cellSize,
        startY + this.gridSize / 2,
        lineWidth,
        this.gridSize,
        0x000000
      );
    }
  }

  /**
   * 创建数字按钮
   */
  private createNumberButtons(): void {
    const startX = (this.cameras.main.width - this.gridSize) / 2;
    const startY = (this.cameras.main.height + this.gridSize) / 2 + 20;
    const buttonSize = this.cellSize * 0.8;
    
    for (let i = 1; i <= 9; i++) {
      const buttonX = startX + (i - 1) * (buttonSize + 10) + buttonSize / 2;
      const buttonY = startY + buttonSize / 2;
      
      // 按钮背景
      const buttonBg = this.add.rectangle(
        buttonX,
        buttonY,
        buttonSize,
        buttonSize,
        0xdddddd
      );
      buttonBg.setInteractive();
      buttonBg.on('pointerdown', () => this.insertNumber(i));
      
      // 按钮文字
      const buttonText = this.add.text(
        buttonX,
        buttonY,
        i.toString(),
        { font: `${buttonSize * 0.6}px Arial`, color: '#000000' }
      );
      buttonText.setOrigin(0.5, 0.5);
      
      this.numberButtons[i] = buttonText;
    }
    
    // 添加清除按钮
    const clearButtonX = startX + 9 * (buttonSize + 10) + buttonSize / 2;
    const clearButtonY = startY + buttonSize / 2;
    
    const clearButtonBg = this.add.rectangle(
      clearButtonX,
      clearButtonY,
      buttonSize * 1.5,
      buttonSize,
      0xff6666
    );
    clearButtonBg.setInteractive();
    clearButtonBg.on('pointerdown', () => this.clearSelectedCell());
    
    const clearButtonText = this.add.text(
      clearButtonX,
      clearButtonY,
      '清除',
      { font: `${buttonSize * 0.4}px Arial`, color: '#ffffff' }
    );
    clearButtonText.setOrigin(0.5, 0.5);
  }

  /**
   * 创建控制按钮
   */
  private createControlButtons(): void {
    const startX = (this.cameras.main.width - this.gridSize) / 2;
    const startY = (this.cameras.main.height - this.gridSize) / 2 - 60;
    const buttonWidth = 120;
    const buttonHeight = 40;
    
    // 新游戏按钮
    const newGameButton = this.add.rectangle(
      startX + 80,
      startY,
      buttonWidth,
      buttonHeight,
      0x4CAF50
    );
    newGameButton.setInteractive();
    newGameButton.on('pointerdown', () => this.startNewGame());
    
    const newGameText = this.add.text(
      startX + 80,
      startY,
      '新游戏',
      { font: '20px Arial', color: '#ffffff' }
    );
    newGameText.setOrigin(0.5, 0.5);
    
    // 验证按钮
    const validateButton = this.add.rectangle(
      startX + this.gridSize - 80,
      startY,
      buttonWidth,
      buttonHeight,
      0x2196F3
    );
    validateButton.setInteractive();
    validateButton.on('pointerdown', () => this.validateSolution());
    
    const validateText = this.add.text(
      startX + this.gridSize - 80,
      startY,
      '检查',
      { font: '20px Arial', color: '#ffffff' }
    );
    validateText.setOrigin(0.5, 0.5);
    
    // 困难度选择
    const easyButton = this.add.rectangle(
      startX + this.gridSize / 2 - 100,
      startY,
      buttonWidth - 40,
      buttonHeight,
      0x9e9e9e
    );
    easyButton.setInteractive();
    easyButton.on('pointerdown', () => this.setDifficulty(0.3));
    
    const easyText = this.add.text(
      startX + this.gridSize / 2 - 100,
      startY,
      '简单',
      { font: '20px Arial', color: '#ffffff' }
    );
    easyText.setOrigin(0.5, 0.5);
    
    const mediumButton = this.add.rectangle(
      startX + this.gridSize / 2,
      startY,
      buttonWidth - 40,
      buttonHeight,
      0xffc107
    );
    mediumButton.setInteractive();
    mediumButton.on('pointerdown', () => this.setDifficulty(0.5));
    
    const mediumText = this.add.text(
      startX + this.gridSize / 2,
      startY,
      '中等',
      { font: '20px Arial', color: '#ffffff' }
    );
    mediumText.setOrigin(0.5, 0.5);
    
    const hardButton = this.add.rectangle(
      startX + this.gridSize / 2 + 100,
      startY,
      buttonWidth - 40,
      buttonHeight,
      0xf44336
    );
    hardButton.setInteractive();
    hardButton.on('pointerdown', () => this.setDifficulty(0.7));
    
    const hardText = this.add.text(
      startX + this.gridSize / 2 + 100,
      startY,
      '困难',
      { font: '20px Arial', color: '#ffffff' }
    );
    hardText.setOrigin(0.5, 0.5);
  }

  /**
   * 添加返回主菜单按钮
   */
  private addBackButton(): void {
    const backButton = this.add.rectangle(
      60,
      40,
      100,
      40,
      0x333333
    );
    backButton.setInteractive();
    backButton.on('pointerdown', () => {
      this.scene.start('MainMenuScene');
    });
    
    const backText = this.add.text(
      60,
      40,
      '返回',
      { font: '18px Arial', color: '#ffffff' }
    );
    backText.setOrigin(0.5, 0.5);
  }

  /**
   * 选择单元格
   */
  private selectCell(row: number, col: number): void {
    // 检查是否为预设值（不可修改）
    if (this.puzzle[row][col] !== 0) {
      return;
    }
    
    // 重置先前选中的单元格
    if (this.selectedCell) {
      const { row: prevRow, col: prevCol } = this.selectedCell;
      this.cells[prevRow][prevCol].setFillStyle(0xffffff);
    }
    
    // 设置新选中的单元格
    this.selectedCell = { row, col };
    this.cells[row][col].setFillStyle(0xaaddff);
  }

  /**
   * 在选中的单元格中插入数字
   */
  private insertNumber(num: number): void {
    if (!this.selectedCell) return;
    
    const { row, col } = this.selectedCell;
    
    // 检查是否为预设值（不可修改）
    if (this.puzzle[row][col] !== 0) {
      return;
    }
    
    // 更新显示和内部数据
    this.numbers[row][col].setText(num.toString());
    this.puzzle[row][col] = num;
  }

  /**
   * 清除选中的单元格
   */
  private clearSelectedCell(): void {
    if (!this.selectedCell) return;
    
    const { row, col } = this.selectedCell;
    
    // 检查是否为预设值（不可修改）
    if (this.puzzle[row][col] === 0) {
      this.numbers[row][col].setText('');
      this.puzzle[row][col] = 0;
    }
  }

  /**
   * 设置难度
   */
  private setDifficulty(level: number): void {
    this.difficulty = level;
  }

  /**
   * 开始新游戏
   */
  private startNewGame(): void {
    // 生成新的数独谜题
    this.generateNewPuzzle();
    
    // 更新显示
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        // 更新数字
        if (this.puzzle[row][col] !== 0) {
          this.numbers[row][col].setText(this.puzzle[row][col].toString());
          this.numbers[row][col].setColor('#000000');
        } else {
          this.numbers[row][col].setText('');
        }
        
        // 重置单元格背景
        this.cells[row][col].setFillStyle(0xffffff);
      }
    }
    
    // 重置选择的单元格
    this.selectedCell = null;
  }

  /**
   * 验证当前解答
   */
  private validateSolution(): void {
    // 检查是否有空白单元格
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (this.puzzle[row][col] === 0) {
          this.showMessage('请完成所有空白格子！', 0xff6666);
          return;
        }
      }
    }
    
    // 验证解答
    if (SudokuGenerator.validateSudoku(this.puzzle)) {
      // 检查是否与正确解答匹配
      let correct = true;
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (this.puzzle[row][col] !== this.solution[row][col]) {
            correct = false;
            break;
          }
        }
        if (!correct) break;
      }
      
      if (correct) {
        this.showMessage('恭喜！解答正确！', 0x4CAF50);
      } else {
        this.showMessage('解答合法，但不是最优解！', 0xffc107);
      }
    } else {
      this.showMessage('解答错误，请检查！', 0xff6666);
    }
  }

  /**
   * 显示消息
   */
  private showMessage(text: string, color: number): void {
    const messageBg = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      400,
      100,
      color
    );
    
    const message = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      text,
      { font: '24px Arial', color: '#ffffff' }
    );
    message.setOrigin(0.5, 0.5);
    
    // 2秒后自动消失
    this.time.delayedCall(2000, () => {
      messageBg.destroy();
      message.destroy();
    });
  }
} 