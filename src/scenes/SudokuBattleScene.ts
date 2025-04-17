import Phaser from 'phaser';
import { SudokuGenerator } from '../utils/SudokuGenerator';
import { GameRules } from '../utils/GameRules';
import { SudokuUnit, UnitType, Card, CardType, CardRarity, SpellEffectType } from '../types/GameTypes';

export class SudokuBattleScene extends Phaser.Scene {
  // 数独相关
  private puzzle: number[][] = [];
  private solution: number[][] = [];
  private cellSize: number = 0;
  private gridSize: number = 0;
  private cells: Phaser.GameObjects.Rectangle[][] = [];
  private numbers: Phaser.GameObjects.Text[][] = [];
  
  // 单位相关
  private board: (SudokuUnit | null)[][] = [];
  private selectedCell: { row: number, col: number } | null = null;
  private activeUnit: SudokuUnit | null = null;
  
  // 卡牌相关
  private deck: Card[] = [];
  private hand: Card[] = [];
  private discard: Card[] = [];
  private cardDisplays: Phaser.GameObjects.Container[] = [];
  
  // UI相关
  private messageText: Phaser.GameObjects.Text | null = null;
  private turnText: Phaser.GameObjects.Text | null = null;
  private deckCountText: Phaser.GameObjects.Text | null = null;
  private discardCountText: Phaser.GameObjects.Text | null = null;

  constructor() {
    super('SudokuBattleScene');
  }

  init(): void {
    // 初始化数独谜题
    const generator = new SudokuGenerator();
    const result = generator.generate(0.7); // 使用较难的难度
    this.puzzle = result.puzzle;
    this.solution = result.solution;
    
    // 初始化棋盘
    this.board = Array(9).fill(null).map(() => Array(9).fill(null));
    
    // 初始化牌库、手牌和弃牌堆
    this.initializeDeck();
    this.hand = [];
    this.discard = [];
    
    // 设置为全屏
    this.scale.startFullscreen();
  }

  create(): void {
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    
    // 设置背景色
    this.cameras.main.setBackgroundColor('#1a1a2e');
    
    // 强制全屏
    if (!this.scale.isFullscreen) {
      this.scale.startFullscreen();
    }
    
    // 确保摄像头填满整个屏幕
    this.cameras.main.setPosition(0, 0);
    this.cameras.main.setSize(screenWidth, screenHeight);
    
    // 计算网格大小和单元格大小（根据屏幕高度的80%调整）
    this.gridSize = Math.min(screenWidth * 0.6, screenHeight * 0.8);
    this.cellSize = this.gridSize / 9;
    
    // 创建数独棋盘
    this.createSudokuBoard();
    
    // 创建UI元素
    this.createUI(screenWidth, screenHeight);
    
    // 抽取初始手牌
    this.drawInitialHand();
    
    // 创建单位（敌人和中立单位）
    this.createInitialUnits();
    
    // 显示回合信息
    this.updateTurnText("请选择一张卡牌进行部署");
    
    // 添加全屏切换按钮
    this.createFullscreenButton(screenWidth, screenHeight);
  }

  /**
   * 创建全屏切换按钮
   */
  private createFullscreenButton(screenWidth: number, screenHeight: number): void {
    const fullscreenButton = this.add.rectangle(
      screenWidth - 50,
      50,
      40,
      40,
      0x333333
    );
    fullscreenButton.setStrokeStyle(2, 0xffffff);
    fullscreenButton.setInteractive();
    fullscreenButton.on('pointerdown', () => {
      if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
      } else {
        this.scale.startFullscreen();
      }
    });
    
    // 添加图标
    const fullscreenIcon = this.add.text(
      screenWidth - 50,
      50,
      "⛶",
      { font: '24px Arial', color: '#ffffff' }
    );
    fullscreenIcon.setOrigin(0.5, 0.5);
  }

  /**
   * 创建数独棋盘
   */
  private createSudokuBoard(): void {
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    const startX = (screenWidth - this.gridSize) / 2;
    const startY = (screenHeight - this.gridSize) / 2;
    
    // 创建棋盘背景
    this.add.rectangle(
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
        cell.setStrokeStyle(1, 0x999999);
        cell.setInteractive();
        cell.on('pointerdown', () => this.onCellClick(row, col));
        this.cells[row][col] = cell;
        
        // 添加数字
        const number = this.add.text(
          cellX,
          cellY - this.cellSize * 0.25,
          this.puzzle[row][col] !== 0 ? this.puzzle[row][col].toString() : '',
          { font: `${this.cellSize * 0.4}px Arial`, color: '#000000' }
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
   * 创建UI元素
   */
  private createUI(screenWidth: number, screenHeight: number): void {
    // 创建回合信息文本
    this.turnText = this.add.text(
      screenWidth / 2,
      50,
      "回合准备中...",
      { font: '28px Arial', color: '#ffffff' }
    );
    this.turnText.setOrigin(0.5, 0.5);
    
    // 创建牌库和弃牌堆计数器
    this.deckCountText = this.add.text(
      120,
      screenHeight - 50,
      `牌库: ${this.deck.length}`,
      { font: '22px Arial', color: '#ffffff' }
    );
    
    this.discardCountText = this.add.text(
      screenWidth - 120,
      screenHeight - 50,
      `弃牌堆: ${this.discard.length}`,
      { font: '22px Arial', color: '#ffffff' }
    );
    this.discardCountText.setOrigin(1, 0);
    
    // 创建返回按钮
    const backButton = this.add.rectangle(
      100,
      50,
      140,
      50,
      0x666666
    );
    backButton.setInteractive();
    backButton.on('pointerdown', () => {
      this.scale.stopFullscreen();
      this.scene.start('MainMenuScene');
    });
    
    const backText = this.add.text(
      100,
      50,
      "返回菜单",
      { font: '20px Arial', color: '#ffffff' }
    );
    backText.setOrigin(0.5, 0.5);
  }

  /**
   * 初始化牌库
   */
  private initializeDeck(): void {
    // 这里只是创建一些示例卡牌
    // 在实际游戏中，应该有一个更复杂的卡牌管理系统
    
    // 创建一些单位卡
    for (let i = 1; i <= 5; i++) {
      this.deck.push({
        id: `unit_${i}`,
        name: `恶魔战士 ${i}`,
        type: 'unit',
        cost: i,
        image: 'demon',
        description: `恶魔战士，攻击力 ${i + 2}，生命值 ${i * 2}`,
        rarity: i <= 3 ? 'common' : 'uncommon',
        unitData: {
          numbers: [i],
          hp: i * 2,
          attack: i + 2,
          defense: i,
          abilities: []
        }
      });
    }
    
    // 创建一些法术卡
    const spellTypes = [
      { name: "火球术", effect: 'damage' as SpellEffectType, value: 3 },
      { name: "治疗术", effect: 'heal' as SpellEffectType, value: 3 },
      { name: "力量增强", effect: 'buff' as SpellEffectType, value: 2 }
    ];
    
    for (let i = 0; i < spellTypes.length; i++) {
      const spell = spellTypes[i];
      this.deck.push({
        id: `spell_${i}`,
        name: spell.name,
        type: 'spell',
        cost: 2,
        image: spell.effect === 'damage' ? 'fireball' : 'shield',
        description: `${spell.name}: ${this.getSpellDescription(spell.effect, spell.value)}`,
        rarity: 'common',
        spellData: {
          effectType: spell.effect,
          value: spell.value,
          range: 1,
          duration: spell.effect === 'buff' ? 2 : undefined
        }
      });
    }
    
    // 洗牌
    this.deck = GameRules.shuffleArray(this.deck);
  }

  /**
   * 创建初始单位（敌人和中立单位）
   */
  private createInitialUnits(): void {
    // 创建一些敌方单位
    const enemyPositions = [
      { row: 0, col: 0 }, { row: 0, col: 8 },
      { row: 8, col: 0 }, { row: 8, col: 8 }
    ];
    
    for (let i = 0; i < enemyPositions.length; i++) {
      const pos = enemyPositions[i];
      const enemyNumber = i + 1;
      
      const enemy: SudokuUnit = {
        id: `enemy_${i}`,
        name: `敌方单位 ${i + 1}`,
        type: 'enemy',
        numbers: [enemyNumber],
        hp: 10,
        maxHp: 10,
        attack: 3,
        defense: 1,
        image: 'demon',
        description: "敌方单位"
      };
      
      this.placeUnit(enemy, pos.row, pos.col);
    }
    
    // 创建一些中立单位
    const neutralPositions = [
      { row: 2, col: 2 }, { row: 2, col: 6 },
      { row: 6, col: 2 }, { row: 6, col: 6 }
    ];
    
    for (let i = 0; i < neutralPositions.length; i++) {
      const pos = neutralPositions[i];
      const neutralNumber = i + 5; // 中立单位编号从5开始
      
      const neutral: SudokuUnit = {
        id: `neutral_${i}`,
        name: `中立单位 ${i + 1}`,
        type: 'neutral',
        numbers: [neutralNumber],
        hp: 8,
        maxHp: 8,
        attack: 2,
        defense: 1,
        image: 'fortress',
        description: "中立单位"
      };
      
      this.placeUnit(neutral, pos.row, pos.col);
    }
  }

  /**
   * 抽取初始手牌
   */
  private drawInitialHand(): void {
    this.hand = GameRules.drawCards(this.deck);
    this.displayHand();
  }

  /**
   * 显示手牌
   */
  private displayHand(): void {
    // 清除现有的卡牌显示
    this.cardDisplays.forEach(display => display.destroy());
    this.cardDisplays = [];
    
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    
    const cardWidth = 140;
    const cardHeight = 180;
    const cardSpacing = 30;
    const startX = (screenWidth - (this.hand.length * (cardWidth + cardSpacing) - cardSpacing)) / 2;
    const startY = screenHeight - cardHeight - 40;
    
    // 为每张手牌创建显示
    for (let i = 0; i < this.hand.length; i++) {
      const card = this.hand[i];
      const x = startX + i * (cardWidth + cardSpacing);
      
      // 创建卡牌容器
      const cardContainer = this.add.container(x, startY);
      
      // 卡牌背景
      const cardBg = this.add.rectangle(0, 0, cardWidth, cardHeight, 0xeeeeee);
      cardBg.setStrokeStyle(2, 0x000000);
      
      // 卡牌名称
      const nameText = this.add.text(0, -cardHeight / 2 + 18, card.name, {
        font: '18px Arial',
        color: '#000000'
      });
      nameText.setOrigin(0.5, 0);
      
      // 卡牌费用
      const costText = this.add.text(-cardWidth / 2 + 20, -cardHeight / 2 + 18, `${card.cost}`, {
        font: 'bold 22px Arial',
        color: '#0000ff'
      });
      costText.setOrigin(0.5);
      
      // 卡牌图像
      const cardImage = this.add.rectangle(0, -20, cardWidth - 20, 80, 0xaaaaaa);
      
      // 卡牌描述
      const descText = this.add.text(0, cardHeight / 2 - 45, card.description, {
        font: '14px Arial',
        color: '#000000',
        wordWrap: { width: cardWidth - 20 }
      });
      descText.setOrigin(0.5, 0.5);
      
      // 卡牌稀有度
      let rarityColor: number;
      switch (card.rarity) {
        case 'common':
          rarityColor = 0xffffff;
          break;
        case 'uncommon':
          rarityColor = 0x00ff00;
          break;
        case 'rare':
          rarityColor = 0x0000ff;
          break;
        case 'epic':
          rarityColor = 0xaa00ff;
          break;
        case 'legendary':
          rarityColor = 0xffaa00;
          break;
        default:
          rarityColor = 0xffffff;
      }
      
      const rarityIndicator = this.add.rectangle(
        cardWidth / 2 - 10,
        -cardHeight / 2 + 10,
        10,
        10,
        rarityColor
      );
      
      // 添加所有元素到卡牌容器
      cardContainer.add([cardBg, nameText, costText, cardImage, descText, rarityIndicator]);
      
      // 使卡牌可点击
      cardBg.setInteractive();
      cardBg.on('pointerdown', () => this.onCardClick(i));
      
      // 保存卡牌显示
      this.cardDisplays.push(cardContainer);
    }
    
    // 更新牌库和弃牌堆计数
    if (this.deckCountText) {
      this.deckCountText.setText(`牌库: ${this.deck.length}`);
    }
    
    if (this.discardCountText) {
      this.discardCountText.setText(`弃牌堆: ${this.discard.length}`);
    }
  }

  /**
   * 单元格点击处理
   */
  private onCellClick(row: number, col: number): void {
    if (!this.activeUnit) {
      this.showMessage("请先选择一张卡牌");
      return;
    }
    
    // 检查是否可以在该单元格放置单位
    if (!this.canPlaceUnit(row, col)) {
      this.showMessage("不能在此处放置单位");
      return;
    }
    
    // 放置单位
    this.placeUnit(this.activeUnit, row, col);
    
    // 重置选中状态
    this.activeUnit = null;
    
    // 清除手牌并抽新牌
    this.hand = [];
    this.displayHand();
    this.drawInitialHand();
    
    // 更新回合信息
    this.updateTurnText("单位已放置，请选择下一张卡牌");
  }

  /**
   * 检查是否可以在指定位置放置单位
   */
  private canPlaceUnit(row: number, col: number): boolean {
    // 检查是否超出边界
    if (row < 0 || row >= 9 || col < 0 || col >= 9) {
      return false;
    }
    
    // 检查是否已被敌方单位或中立单位占据
    const existingUnit = this.board[row][col];
    if (existingUnit && (existingUnit.type === 'enemy' || existingUnit.type === 'neutral')) {
      return false;
    }
    
    return true;
  }

  /**
   * 卡牌点击处理
   */
  private onCardClick(index: number): void {
    const selectedCard = this.hand[index];
    
    // 处理不同类型的卡牌
    if (selectedCard.type === 'unit' && selectedCard.unitData) {
      // 创建单位
      const unit: SudokuUnit = {
        id: `player_unit_${Date.now()}`,
        name: selectedCard.name,
        type: 'friendly',
        numbers: selectedCard.unitData.numbers,
        hp: selectedCard.unitData.hp,
        maxHp: selectedCard.unitData.hp,
        attack: selectedCard.unitData.attack,
        defense: selectedCard.unitData.defense,
        image: selectedCard.image,
        abilities: selectedCard.unitData.abilities,
        description: selectedCard.description
      };
      
      // 设置为活动单位，等待放置
      this.activeUnit = unit;
      this.updateTurnText("请选择一个格子放置单位");
      
      // 处理卡牌使用规则：使用一张，丢弃其他的
      const playedCard = GameRules.playCard(this.hand, index, this.discard);
      this.displayHand(); // 更新手牌显示
    } else if (selectedCard.type === 'spell') {
      // 处理法术卡的效果
      this.showMessage("法术卡效果尚未实现");
      
      // 处理卡牌使用规则
      const playedCard = GameRules.playCard(this.hand, index, this.discard);
      this.displayHand();
      this.drawInitialHand();
    }
  }

  /**
   * 放置单位到棋盘上
   */
  private placeUnit(unit: SudokuUnit, row: number, col: number): void {
    // 更新棋盘状态
    this.board[row][col] = unit;
    
    // 获取单元格位置
    const screenWidth = this.cameras.main.width;
    const screenHeight = this.cameras.main.height;
    const startX = (screenWidth - this.gridSize) / 2;
    const startY = (screenHeight - this.gridSize) / 2;
    const cellX = startX + col * this.cellSize + this.cellSize / 2;
    const cellY = startY + row * this.cellSize + this.cellSize / 2;
    
    // 创建单位表示
    const unitCircle = this.add.circle(
      cellX,
      cellY + this.cellSize * 0.15,
      this.cellSize * 0.3,
      unit.type === 'friendly' ? 0x00ff00 : 
      unit.type === 'enemy' ? 0xff0000 : 0xffff00
    );
    
    // 添加单位生命值显示
    const hpText = this.add.text(
      cellX,
      cellY + this.cellSize * 0.3,
      `${unit.hp}`,
      { font: `${this.cellSize * 0.3}px Arial`, color: '#ffffff' }
    );
    hpText.setOrigin(0.5, 0.5);
    
    // 为每个数字编号设置不同颜色
    const numberColor = unit.type === 'friendly' ? '#00ff00' : 
                        unit.type === 'enemy' ? '#ff0000' : '#ffff00';
    
    // 如果单元格中有数独数字，确保它仍然可见
    if (this.numbers[row][col]) {
      this.numbers[row][col].setColor(numberColor);
    }
    
    // 在单位下方显示其最小编号
    const minNumber = Math.min(...unit.numbers);
    const numberText = this.add.text(
      cellX,
      cellY - this.cellSize * 0.25,
      `${minNumber}`,
      { font: `${this.cellSize * 0.4}px Arial`, color: numberColor }
    );
    numberText.setOrigin(0.5, 0.5);
    
    // 替换原有的数字显示
    if (this.numbers[row][col]) {
      this.numbers[row][col].destroy();
    }
    this.numbers[row][col] = numberText;
  }

  /**
   * 显示消息
   */
  private showMessage(text: string): void {
    if (this.messageText) {
      this.messageText.destroy();
    }
    
    this.messageText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      text,
      { font: '28px Arial', color: '#ffffff', backgroundColor: '#000000' }
    );
    this.messageText.setOrigin(0.5, 0.5);
    this.messageText.setPadding(15, 15, 15, 15);
    this.messageText.setDepth(100); // 确保消息显示在最上层
    
    // 2秒后消失
    this.time.delayedCall(2000, () => {
      if (this.messageText) {
        this.messageText.destroy();
        this.messageText = null;
      }
    });
  }

  /**
   * 更新回合信息
   */
  private updateTurnText(message: string): void {
    if (this.turnText) {
      this.turnText.setText(message);
    }
  }

  /**
   * 获取法术描述
   */
  private getSpellDescription(effect: SpellEffectType, value: number): string {
    switch (effect) {
      case 'damage':
        return `对敌人造成 ${value} 点伤害`;
      case 'heal':
        return `恢复友方单位 ${value} 点生命值`;
      case 'buff':
        return `增加友方单位 ${value} 点攻击力，持续2回合`;
      case 'debuff':
        return `降低敌方单位 ${value} 点防御力，持续2回合`;
      default:
        return `产生 ${value} 点效果`;
    }
  }
} 