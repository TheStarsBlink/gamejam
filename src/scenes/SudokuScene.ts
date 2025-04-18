import Phaser from 'phaser';
import { SudokuGenerator } from '../utils/SudokuGenerator';
import { Enemy, createEnemy } from '../types/Enemy';

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
  
  // 敌方角色相关
  private enemies: Enemy[] = [];
  private enemySprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
  private enemyHealthBars: Map<string, Phaser.GameObjects.Graphics> = new Map();
  private enemyTexts: Map<string, Phaser.GameObjects.Text> = new Map();
  private currentLevel: number = 1;
  private totalLevels: number = 10; // 总关卡数
  private currentTurn: number = 1;  // 当前回合数
  
  // 敌方角色类型，可以根据关卡难度调整
  private enemyTypes: string[] = ['DEMON', 'SKELETON', 'GHOST', 'ORC', 'DRAGON'];

  constructor() {
    super('SudokuScene');
  }

  /**
   * 预加载资源
   */
  preload(): void {
    // 加载敌方角色图片
    this.load.image('demon', 'assets/images/enemies/demon.png');
    this.load.image('skeleton', 'assets/images/enemies/skeleton.png');
    this.load.image('ghost', 'assets/images/enemies/ghost.png');
    this.load.image('dragon', 'assets/images/enemies/dragon.png');
    this.load.image('orc', 'assets/images/enemies/orc.png');
    
    // 添加默认图片，防止资源加载失败时使用
    this.load.image('enemy_default', 'assets/images/enemies/default.png');
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
    
    // 生成敌方角色
    this.generateEnemies();
    
    // 添加关卡信息
    this.addLevelText();
  }

  /**
   * 添加关卡信息文本
   */
  private addLevelText(): void {
    // 创建顶部状态栏背景
    const statusBarHeight = 70;
    const statusBarY = statusBarHeight / 2;
    
    // 顶部深色背景
    const topBar = this.add.rectangle(
      this.cameras.main.width / 2,
      statusBarY,
      this.cameras.main.width,
      statusBarHeight,
      0x000030
    );
    
    // 底部深色状态栏
    const bottomBar = this.add.rectangle(
      this.cameras.main.width / 2,
      this.cameras.main.height - statusBarHeight / 2,
      this.cameras.main.width,
      statusBarHeight,
      0x000030
    );
    
    // 添加HP条背景
    const hpBarWidth = this.cameras.main.width - 200;
    const hpBarBg = this.add.rectangle(
      this.cameras.main.width / 2,
      statusBarY + 15,
      hpBarWidth,
      20,
      0x333333
    );
    
    // 添加HP条
    const hpBar = this.add.rectangle(
      (this.cameras.main.width - hpBarWidth) / 2 + (hpBarWidth * 1.0),
      statusBarY + 15,
      hpBarWidth,
      20,
      0xff3333
    );
    hpBar.setOrigin(1, 0.5);
    
    // 在HP条上添加数值文本
    const statsText = this.add.text(
      this.cameras.main.width / 2,
      statusBarY + 15,
      'HP: 30/30 | ATK: 2 | MP: 0',
      { font: '16px Arial Bold', color: '#ffffff' }
    );
    statsText.setOrigin(0.5, 0.5);
    
    // 左上角添加关卡信息
    const levelInfo = this.add.text(
      this.cameras.main.width / 2,
      20,
      `关卡 ${this.currentLevel}`,
      { font: '24px Arial Bold', color: '#ffffff', stroke: '#000000', strokeThickness: 4 }
    );
    levelInfo.setOrigin(0.5, 0.5);
    
    // 左上角添加阶段信息
    const stageInfo = this.add.text(
      20,
      45,
      `阶段: 探索`,
      { font: '18px Arial Bold', color: '#ffffff', stroke: '#000000', strokeThickness: 4 }
    );
    stageInfo.setOrigin(0, 0.5);
    
    // 左上角添加战斗回合信息
    const turnInfo = this.add.text(
      20,
      70,
      `战斗: ${this.currentTurn}`,
      { font: '18px Arial Bold', color: '#ffffff', stroke: '#000000', strokeThickness: 4 }
    );
    turnInfo.setOrigin(0, 0.5);
    
    // 右上角添加能量信息
    const energyInfo = this.add.text(
      this.cameras.main.width - 20,
      20,
      `能量: 1/1`,
      { font: '18px Arial Bold', color: '#ffffff', stroke: '#000000', strokeThickness: 4 }
    );
    energyInfo.setOrigin(1, 0.5);
    
    // 右上角添加回合信息
    const roundInfo = this.add.text(
      this.cameras.main.width - 20,
      45,
      `回合: ${this.currentTurn}`,
      { font: '18px Arial Bold', color: '#ffffff', stroke: '#000000', strokeThickness: 4 }
    );
    roundInfo.setOrigin(1, 0.5);
    
    // 右下角添加金币信息
    const coinInfo = this.add.text(
      this.cameras.main.width - 20,
      this.cameras.main.height - 20,
      `金币: 0`,
      { font: '18px Arial Bold', color: '#ffffff', stroke: '#000000', strokeThickness: 4 }
    );
    coinInfo.setOrigin(1, 0.5);
  }
  
  /**
   * 更新状态栏信息
   */
  private updateStatusBar(): void {
    // 移除现有状态栏元素
    this.children.list.forEach(child => {
      if (child instanceof Phaser.GameObjects.Text && 
          (child.text.includes('关卡') || child.text.includes('阶段:') || 
           child.text.includes('战斗:') || child.text.includes('能量:') || 
           child.text.includes('回合:') || child.text.includes('金币:') ||
           child.text.includes('HP:'))) {
        child.destroy();
      }
    });
    
    // 重新添加状态栏
    this.addLevelText();
  }
  
  /**
   * 计算当前关卡的敌人数量
   */
  private calculateEnemyCount(): number {
    if (this.currentLevel >= 1 && this.currentLevel <= 3) {
      return 2;
    } else if (this.currentLevel >= 4 && this.currentLevel <= 6) {
      return 3;
    } else if (this.currentLevel >= 7 && this.currentLevel <= 9) {
      return 4;
    } else {
      return 5;
    }
  }

  /**
   * 生成敌方角色
   */
  private generateEnemies(): void {
    // 首先清除旧的敌方角色
    this.clearEnemies();
    
    // 根据关卡数确定敌人数量
    // 1-3关：2个敌人，4-6关：3个敌人，7-9关：4个敌人，10关以上：5个敌人
    let enemyCount = 2;
    if (this.currentLevel >= 4 && this.currentLevel <= 6) {
      enemyCount = 3;
    } else if (this.currentLevel >= 7 && this.currentLevel <= 9) {
      enemyCount = 4;
    } else if (this.currentLevel >= 10) {
      enemyCount = 5;
    }
    
    // 可用的单元格坐标
    const availableCells: {row: number, col: number}[] = [];
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        availableCells.push({row, col});
      }
    }
    
    // 随机打乱可用格子
    this.shuffleArray(availableCells);
    
    // 根据关卡难度选择敌人类型
    const availableEnemyTypes = this.getEnemyTypesForLevel();
    
    // 生成敌人
    for (let i = 0; i < enemyCount && i < availableCells.length; i++) {
      const cell = availableCells[i];
      const enemyTypeIndex = Math.floor(Math.random() * availableEnemyTypes.length);
      const enemyType = availableEnemyTypes[enemyTypeIndex];
      
      // 获取该格子的数独数字
      const cellNumber = this.puzzle[cell.row][cell.col];
      
      // 创建敌人
      const enemy = createEnemy(enemyType, cell.row, cell.col, cellNumber);
      this.enemies.push(enemy);
      
      // 创建敌人精灵
      this.createEnemySprite(enemy);
    }
  }
  
  /**
   * 根据关卡难度获取可用的敌人类型
   */
  private getEnemyTypesForLevel(): string[] {
    if (this.currentLevel <= 3) {
      return ['DEMON', 'SKELETON'];
    } else if (this.currentLevel <= 6) {
      return ['DEMON', 'SKELETON', 'GHOST'];
    } else if (this.currentLevel <= 9) {
      return ['DEMON', 'SKELETON', 'GHOST', 'ORC'];
    } else {
      return this.enemyTypes;
    }
  }
  
  /**
   * 创建敌人精灵
   */
  private createEnemySprite(enemy: Enemy): void {
    const startX = (this.cameras.main.width - this.gridSize) / 2;
    const startY = (this.cameras.main.height - this.gridSize) / 2;
    
    // 计算敌人在屏幕上的位置
    const x = startX + enemy.col * this.cellSize + this.cellSize / 2;
    const y = startY + enemy.row * this.cellSize + this.cellSize / 2;
    
    // 根据敌人类型获取图片键名
    const imageKey = enemy.image.split('/').pop()?.replace('.png', '') || 'enemy_default';
    
    // 创建敌人精灵
    let sprite: Phaser.GameObjects.Sprite;
    
    try {
      // 尝试使用加载的图片资源
      sprite = this.add.sprite(x, y, imageKey);
      sprite.setDisplaySize(this.cellSize * 0.7, this.cellSize * 0.7);
    } catch (e) {
      // 如果失败，使用矩形代替
      console.warn(`Failed to create sprite with key ${imageKey}, using fallback rectangle`);
      const rect = this.add.rectangle(x, y, this.cellSize * 0.7, this.cellSize * 0.7, 0xff0000);
      sprite = rect as any;
    }
    
    this.enemySprites.set(enemy.id, sprite);
    
    // 添加敌人数字文本
    const text = this.add.text(
      x,
      y,
      enemy.number.toString(),
      { font: `${this.cellSize * 0.4}px Arial`, color: '#ffffff' }
    );
    text.setOrigin(0.5, 0.5);
    this.enemyTexts.set(enemy.id, text);
    
    // 添加敌人血条
    this.createHealthBar(enemy, x, y - this.cellSize * 0.4);
    
    // 添加敌人名称和属性信息提示
    this.addEnemyTooltip(enemy, sprite);
  }
  
  /**
   * 为敌人添加信息提示
   */
  private addEnemyTooltip(enemy: Enemy, sprite: Phaser.GameObjects.Sprite): void {
    sprite.setInteractive();
    
    // 鼠标悬停显示敌人信息
    sprite.on('pointerover', () => {
      const tooltipBg = this.add.rectangle(
        this.input.x + 10,
        this.input.y - 50,
        200,
        80,
        0x333333,
        0.8
      );
      
      const tooltip = this.add.text(
        this.input.x + 10,
        this.input.y - 50,
        `${enemy.name}\nHP: ${enemy.hp}/${enemy.maxHp}\n攻击: ${enemy.attack} 防御: ${enemy.defense}\n数字: ${enemy.number}`,
        { font: '14px Arial', color: '#ffffff' }
      );
      tooltip.setOrigin(0.5, 0.5);
      
      // 鼠标移出时移除提示
      const removeTooltip = () => {
        tooltipBg.destroy();
        tooltip.destroy();
        sprite.off('pointerout', removeTooltip);
      };
      
      sprite.on('pointerout', removeTooltip);
    });
  }
  
  /**
   * 创建敌人血条
   */
  private createHealthBar(enemy: Enemy, x: number, y: number): void {
    const width = this.cellSize * 0.7;
    const height = 5;
    
    const healthBar = this.add.graphics();
    
    // 背景
    healthBar.fillStyle(0x808080, 1);
    healthBar.fillRect(x - width / 2, y, width, height);
    
    // 血条
    const healthPct = enemy.hp / enemy.maxHp;
    healthBar.fillStyle(0x00ff00, 1);
    healthBar.fillRect(x - width / 2, y, width * healthPct, height);
    
    this.enemyHealthBars.set(enemy.id, healthBar);
  }
  
  /**
   * 清除所有敌方角色
   */
  private clearEnemies(): void {
    // 销毁所有敌人精灵
    this.enemySprites.forEach(sprite => sprite.destroy());
    this.enemySprites.clear();
    
    // 销毁所有敌人文本
    this.enemyTexts.forEach(text => text.destroy());
    this.enemyTexts.clear();
    
    // 销毁所有敌人血条
    this.enemyHealthBars.forEach(bar => bar.destroy());
    this.enemyHealthBars.clear();
    
    // 清空敌人数组
    this.enemies = [];
  }
  
  /**
   * 打乱数组顺序（Fisher-Yates洗牌算法）
   */
  private shuffleArray(array: any[]): void {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
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
    // 考虑顶部和底部状态栏的高度(各70px)
    const statusBarHeight = 70;
    const availableHeight = this.cameras.main.height - (statusBarHeight * 2);
    
    // 重新计算网格尺寸，保持正方形且适应可用空间
    this.gridSize = Math.min(this.cameras.main.width * 0.9, availableHeight * 0.9);
    this.cellSize = this.gridSize / 9;
    
    // 计算网格起始位置，使其居中
    const startX = (this.cameras.main.width - this.gridSize) / 2;
    const startY = statusBarHeight + (availableHeight - this.gridSize) / 2;
    
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
        
        // 添加数字 - 所有数字都使用相同的黑色
        const textStyle = {
          font: `${this.cellSize * 0.6}px Arial`,
          color: '#000000'
        };
        
        const number = this.add.text(
          cellX,
          cellY,
          this.puzzle[row][col].toString(),
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
    // 考虑底部状态栏高度
    const statusBarHeight = 70;
    const availableHeight = this.cameras.main.height - (statusBarHeight * 2);
    
    // 计算网格起始位置和结束位置
    const startX = (this.cameras.main.width - this.gridSize) / 2;
    const startY = statusBarHeight + (availableHeight - this.gridSize) / 2;
    const gridBottom = startY + this.gridSize;
    
    const buttonSize = this.cellSize * 0.8;
    
    // 添加提示文本
    const hintText = this.add.text(
      this.cameras.main.width / 2,
      gridBottom + buttonSize / 2,
      '此数独为完整解，点击敌人单位进行战斗',
      { font: '18px Arial', color: '#ffffff' }
    );
    hintText.setOrigin(0.5, 0.5);
  }

  /**
   * 创建控制按钮
   */
  private createControlButtons(): void {
    // 考虑顶部状态栏高度
    const statusBarHeight = 70;
    const availableHeight = this.cameras.main.height - (statusBarHeight * 2);
    
    // 计算网格起始位置
    const startX = (this.cameras.main.width - this.gridSize) / 2;
    const startY = statusBarHeight + (availableHeight - this.gridSize) / 2;
    
    const buttonWidth = 120;
    const buttonHeight = 40;
    const buttonY = startY - buttonHeight - 10; // 在网格上方留出空间
    
    // 新游戏按钮
    const newGameButton = this.add.rectangle(
      startX + this.gridSize / 2 - 80,
      buttonY,
      buttonWidth,
      buttonHeight,
      0x4CAF50
    );
    newGameButton.setInteractive();
    newGameButton.on('pointerdown', () => this.startNewGame());
    
    const newGameText = this.add.text(
      startX + this.gridSize / 2 - 80,
      buttonY,
      '新数独',
      { font: '20px Arial', color: '#ffffff' }
    );
    newGameText.setOrigin(0.5, 0.5);
    
    // 下一关按钮
    const nextLevelButton = this.add.rectangle(
      startX + this.gridSize / 2 + 80,
      buttonY,
      buttonWidth,
      buttonHeight,
      0x2196F3
    );
    nextLevelButton.setInteractive();
    nextLevelButton.on('pointerdown', () => this.nextLevel());
    
    const nextLevelText = this.add.text(
      startX + this.gridSize / 2 + 80,
      buttonY,
      '下一关',
      { font: '20px Arial', color: '#ffffff' }
    );
    nextLevelText.setOrigin(0.5, 0.5);
  }

  /**
   * 添加返回主菜单按钮
   */
  private addBackButton(): void {
    // 按钮放在顶部状态栏内
    const backButton = this.add.rectangle(
      60,
      35,
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
      35,
      '返回',
      { font: '18px Arial', color: '#ffffff' }
    );
    backText.setOrigin(0.5, 0.5);
  }

  /**
   * 选择单元格
   */
  private selectCell(row: number, col: number): void {
    // 检查是否有敌人在此单元格
    const enemyAtCell = this.getEnemyAtCell(row, col);
    
    if (enemyAtCell) {
      // 如果有敌人，触发战斗
      this.battleWithEnemy(enemyAtCell);
      return;
    }
    
    // 取消选中之前的单元格
    if (this.selectedCell) {
      const { row: prevRow, col: prevCol } = this.selectedCell;
      this.cells[prevRow][prevCol].setFillStyle(0xffffff);
    }
    
    // 选中新单元格 - 由于所有格子都已填充数字，只需高亮显示选中的单元格
    this.selectedCell = { row, col };
    this.cells[row][col].setFillStyle(0xe6f7ff);
  }
  
  /**
   * 获取指定单元格上的敌人
   */
  private getEnemyAtCell(row: number, col: number): Enemy | null {
    return this.enemies.find(enemy => enemy.row === row && enemy.col === col && enemy.isAlive) || null;
  }
  
  /**
   * 与敌人战斗
   */
  private battleWithEnemy(enemy: Enemy): void {
    // 在这里实现战斗逻辑
    // 由于没有完整的战斗系统实现，这里只是简单地减少敌人的血量
    // 实际游戏中可能会弹出战斗界面或执行更复杂的战斗逻辑
    
    // 造成1-3点随机伤害
    const damage = Math.floor(Math.random() * 3) + 1;
    enemy.hp = Math.max(0, enemy.hp - damage);
    
    // 更新敌人血条
    this.updateEnemyHealthBar(enemy);
    
    // 显示伤害文本
    this.showDamageText(enemy, damage);
    
    // 检查敌人是否被击败
    if (enemy.hp <= 0) {
      this.defeatedEnemy(enemy);
    }
    
    // 增加回合数
    this.incrementTurn();
  }
  
  /**
   * 更新敌人血条
   */
  private updateEnemyHealthBar(enemy: Enemy): void {
    const healthBar = this.enemyHealthBars.get(enemy.id);
    if (!healthBar) return;
    
    // 获取敌人位置
    const sprite = this.enemySprites.get(enemy.id);
    if (!sprite) return;
    
    const x = sprite.x;
    const y = sprite.y - this.cellSize * 0.4;
    const width = this.cellSize * 0.7;
    const height = 5;
    
    // 清除旧血条
    healthBar.clear();
    
    // 绘制背景
    healthBar.fillStyle(0x808080, 1);
    healthBar.fillRect(x - width / 2, y, width, height);
    
    // 绘制新血条
    const healthPct = Math.max(0, enemy.hp) / enemy.maxHp;
    healthBar.fillStyle(0x00ff00, 1);
    healthBar.fillRect(x - width / 2, y, width * healthPct, height);
  }
  
  /**
   * 显示伤害文本
   */
  private showDamageText(enemy: Enemy, damage: number): void {
    const sprite = this.enemySprites.get(enemy.id);
    if (!sprite) return;
    
    const x = sprite.x;
    const y = sprite.y;
    
    // 创建伤害文本
    const damageText = this.add.text(
      x,
      y - 20,
      `-${damage}`,
      { font: '20px Arial', color: '#ff0000' }
    );
    damageText.setOrigin(0.5, 0.5);
    
    // 添加上浮动画
    this.tweens.add({
      targets: damageText,
      y: y - 50,
      alpha: 0,
      duration: 1000,
      onComplete: () => {
        damageText.destroy();
      }
    });
  }
  
  /**
   * 处理击败敌人
   */
  private defeatedEnemy(enemy: Enemy): void {
    enemy.isAlive = false;
    
    // 获取敌人精灵
    const sprite = this.enemySprites.get(enemy.id);
    if (!sprite) return;
    
    // 添加淡出动画
    this.tweens.add({
      targets: sprite,
      alpha: 0,
      duration: 500,
      onComplete: () => {
        // 清理敌人相关对象
        sprite.destroy();
        this.enemySprites.delete(enemy.id);
        
        // 移除数字文本
        const text = this.enemyTexts.get(enemy.id);
        if (text) {
          text.destroy();
          this.enemyTexts.delete(enemy.id);
        }
        
        // 移除血条
        const healthBar = this.enemyHealthBars.get(enemy.id);
        if (healthBar) {
          healthBar.destroy();
          this.enemyHealthBars.delete(enemy.id);
        }
        
        // 显示击败消息
        this.showMessage(`击败了敌人 ${enemy.name}！`, 0x4CAF50);
        
        // 检查是否所有敌人都被击败
        if (this.enemies.every(e => !e.isAlive)) {
          this.showMessage('恭喜！击败了所有敌人！', 0x4CAF50);
        }
      }
    });
  }

  /**
   * 插入数字
   */
  private insertNumber(num: number): void {
    // 由于所有格子都已填充数字，此方法不再更改单元格内容
    // 但保留此方法以便将来可能的功能修改
    if (this.selectedCell) {
      this.showMessage('所有格子已填满数字，无法修改', 0xffc107);
    }
  }

  /**
   * 清除选中的单元格
   */
  private clearSelectedCell(): void {
    // 由于所有格子都已填充数字，此方法不再清除单元格内容
    // 但保留此方法以便将来可能的功能修改
    if (this.selectedCell) {
      this.showMessage('所有格子已填满数字，无法清除', 0xffc107);
    }
  }

  /**
   * 设置难度
   */
  private setDifficulty(level: number): void {
    // 由于现在不再使用难度来移除数字，这个方法仅作占位保留
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
        // 更新数字 - 由于现在没有空白格，所有格子都有数字
        this.numbers[row][col].setText(this.puzzle[row][col].toString());
        this.numbers[row][col].setColor('#000000');
        
        // 重置单元格背景
        this.cells[row][col].setFillStyle(0xffffff);
      }
    }
    
    // 重置选择的单元格
    this.selectedCell = null;
    
    // 移除现有状态栏
    this.children.list.forEach(child => {
      if ((child instanceof Phaser.GameObjects.Text && 
          (child.text.includes('关卡:') || child.text.includes('阶段:') || 
           child.text.includes('战斗:') || child.text.includes('能量:') || 
           child.text.includes('回合:') || child.text.includes('金币:') ||
           child.text.includes('HP:'))) ||
          (child instanceof Phaser.GameObjects.Rectangle && 
           (child.y === 35 || child.y === this.cameras.main.height - 35))) {
        child.destroy();
      }
    });
    
    // 重新添加状态栏
    this.addLevelText();
    
    // 生成新的敌方角色
    this.generateEnemies();
  }

  /**
   * 验证当前解答
   */
  private validateSolution(): void {
    // 由于数独已经是完整解答，直接显示恭喜信息
    this.showMessage('恭喜！您已经完成了数独！', 0x4CAF50);
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

  /**
   * 进入下一关
   */
  private nextLevel(): void {
    // 关卡数增加，但不超过总关卡数
    this.currentLevel = Math.min(this.currentLevel + 1, this.totalLevels);
    
    // 重置回合数
    this.currentTurn = 1;
    
    this.startNewGame();
    
    // 显示关卡切换消息
    this.showMessage(`进入第 ${this.currentLevel} 关！`, 0x2196F3);
  }
  
  /**
   * 增加回合数
   */
  private incrementTurn(): void {
    this.currentTurn++;
    this.updateStatusBar();
  }
} 