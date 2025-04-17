import Phaser from 'phaser';
import { gameState } from '../index';
import { Cell, GridLayout } from '../types/Config';
import { Card, MinionCard } from '../types/Card';
import { CombatType, Direction, EventType, Faction, GameState, Trait } from '../types/Enums';
import { UnitType } from '../utils/GameRules';
import { Unit } from '../types/Unit';
import { createInitialGrid, updateGridBonuses } from '../utils/GridUtils';
import { createEnemy, normalBattleWaves, bossBattleWaves } from '../objects/Enemies';
import { createUnitFromCard, drawCards, getMinionCards, shuffleDeck } from '../utils/CardUtils';
import { handleAttack, processStatusEffects, selectTarget } from '../utils/CombatUtils';

export class BattleScene extends Phaser.Scene {
    // 游戏状态
    private gameState: GameState = GameState.DEPLOYMENT;
    
    // 格子布局
    private grid!: GridLayout;
    
    // 单位数组
    private playerUnits: Unit[] = [];
    private enemyUnits: Unit[] = [];
    private villagerUnits: Unit[] = []; // 用于救援事件
    
    // 卡牌管理
    private deck: Card[] = [];
    private hand: Card[] = [];
    private discardPile: Card[] = [];
    
    // 回合管理
    private currentTurn: number = 1;
    private actionOrder: Unit[] = [];
    private currentActionIndex: number = 0;
    
    // UI元素
    private cells: Phaser.GameObjects.Image[] = [];
    private unitSprites: Map<string, Phaser.GameObjects.Sprite> = new Map();
    private cardSprites: Phaser.GameObjects.Sprite[] = [];
    private healthBars: Map<string, Phaser.GameObjects.Graphics> = new Map();
    private statusTexts: Map<string, Phaser.GameObjects.Text> = new Map();
    
    // 事件系统
    private currentEvent: EventType = EventType.NONE;
    private eventTargetCell: number | null = null;
    
    // UI文本
    private turnText!: Phaser.GameObjects.Text;
    private stateText!: Phaser.GameObjects.Text;
    private playerStatsText!: Phaser.GameObjects.Text;
    private deckCountText!: Phaser.GameObjects.Text;
    private discardCountText!: Phaser.GameObjects.Text;
    
    // 按钮
    private endTurnButton!: Phaser.GameObjects.Image;
    private endTurnText!: Phaser.GameObjects.Text;
    
    // 底部单位信息卡片
    private bottomCardElements: Map<string, [Phaser.GameObjects.Rectangle, Phaser.GameObjects.Text, Phaser.GameObjects.Text]> | null = null;
    
    constructor() {
        super('BattleScene');
    }

    create(): void {
        // 创建战斗背景
        this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'battle_bg')
            .setDisplaySize(this.cameras.main.width, this.cameras.main.height);
        
        // 初始化格子布局
        this.grid = createInitialGrid();
        
        // 初始化卡牌
        this.deck = [...gameState.deck];
        this.deck = shuffleDeck(this.deck);
        
        // 设置战斗数据
        this.setupBattle();
        
        // 创建UI
        this.createUI();
        
        // 创建格子
        this.createGrid();
        
        // 创建初始敌人
        this.spawnEnemies();
        
        // 创建初始事件（如果是普通战斗）
        if (gameState.currentBattle <= 3) {
            this.createRandomEvent();
        }
        
        // 开始部署阶段
        this.startDeploymentPhase();
        
        // 初始化DOM UI状态
        this.updateDOMUI();
    }
    
    update(): void {
        // 根据游戏状态更新逻辑
        switch (this.gameState) {
            case GameState.DEPLOYMENT:
                // 部署阶段逻辑
                break;
                
            case GameState.BATTLE:
                // 战斗阶段逻辑
                break;
                
            case GameState.VICTORY:
            case GameState.DEFEAT:
                // 胜利或失败逻辑
                break;
        }
    }
    
    // 设置战斗数据
    private setupBattle(): void {
        // 清空单位数组
        this.playerUnits = [];
        this.enemyUnits = [];
        this.villagerUnits = [];
        
        // 清空手牌和弃牌堆
        this.hand = [];
        this.discardPile = [];
        
        // 重置回合和战斗状态
        this.currentTurn = 1;
        this.actionOrder = [];
        this.currentActionIndex = 0;
        this.gameState = GameState.DEPLOYMENT;
    }
    
    // 创建UI元素
    private createUI(): void {
        // 回合显示
        this.turnText = this.add.text(50, 30, `回合: ${this.currentTurn}`, {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        
        // 状态显示
        this.stateText = this.add.text(50, 70, '阶段: 部署', {
            fontFamily: 'Arial',
            fontSize: '24px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        });
        
        // 玩家状态
        this.playerStatsText = this.add.text(
            this.cameras.main.width - 250, 
            30, 
            `HP: ${gameState.player.hp}/${gameState.player.maxHp} | ATK: ${gameState.player.atk}`, 
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        
        // 牌库和弃牌堆计数
        this.deckCountText = this.add.text(
            this.cameras.main.width - 150, 
            80, 
            `牌库: ${this.deck.length}`, 
            {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }
        );
        
        this.discardCountText = this.add.text(
            this.cameras.main.width - 150, 
            110, 
            `弃牌堆: ${this.discardPile.length}`, 
            {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 3
            }
        );
        
        // 结束回合按钮
        this.endTurnButton = this.add.image(
            this.cameras.main.width - 100,
            this.cameras.main.height - 60,
            'button'
        ).setScale(0.8);
        
        this.endTurnText = this.add.text(
            this.cameras.main.width - 100,
            this.cameras.main.height - 60,
            '结束回合',
            {
                fontFamily: 'Arial',
                fontSize: '20px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);
        
        // 使按钮可交互
        this.endTurnButton.setInteractive();
        
        // 鼠标悬停效果
        this.endTurnButton.on('pointerover', () => {
            this.endTurnButton.setTint(0xdddddd);
        });
        
        this.endTurnButton.on('pointerout', () => {
            this.endTurnButton.clearTint();
        });
        
        // 点击结束回合
        this.endTurnButton.on('pointerdown', () => {
            if (this.gameState === GameState.DEPLOYMENT) {
                this.startBattlePhase();
            }
        });
        
        // 初始时隐藏结束回合按钮
        this.endTurnButton.setVisible(false);
        this.endTurnText.setVisible(false);
    }
    
    // 创建九宫格
    private createGrid(): void {
        const cellSize = 120;
        const startX = (this.cameras.main.width - cellSize * 3) / 2;
        const startY = (this.cameras.main.height - cellSize * 3) / 2;
        
        for (let i = 0; i < 9; i++) {
            const x = startX + (i % 3) * cellSize + cellSize / 2;
            const y = startY + Math.floor(i / 3) * cellSize + cellSize / 2;
            
            // 创建格子背景
            const cell = this.add.image(x, y, 'cell');
            cell.setDisplaySize(cellSize - 10, cellSize - 10);
            
            // 添加格子编号
            this.add.text(x, y - cellSize / 3, `${i + 1}`, {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff'
            }).setOrigin(0.5);
            
            // 使格子可交互
            cell.setInteractive();
            cell.on('pointerdown', () => this.onCellClick(i + 1));
            
            this.cells.push(cell);
        }
    }
    
    // 生成敌人
    private spawnEnemies(): void {
        // 根据当前战斗选择波次
        const isBossBattle = gameState.currentBattle === 4;
        const waveIndex = isBossBattle ? 0 : gameState.currentBattle - 1;
        
        const waveData = isBossBattle 
            ? bossBattleWaves[waveIndex] 
            : normalBattleWaves[waveIndex];
        
        // 生成敌人单位
        waveData.enemies.forEach(enemyData => {
            const enemy = createEnemy(
                enemyData.type,
                enemyData.position,
                enemyData.direction
            );
            
            this.enemyUnits.push(enemy);
            
            // 标记格子为已占用
            const cell = this.grid.cells.find(c => c.id === enemy.position.cellNumber);
            if (cell) {
                cell.occupied = true;
                cell.occupiedBy = enemy.id;
            }
            
            // 创建敌人精灵
            this.createUnitSprite(enemy);
        });
        
        // 更新格子加成效果
        this.grid = updateGridBonuses(this.grid, [...this.playerUnits, ...this.enemyUnits]);
    }
    
    // 创建随机事件
    private createRandomEvent(): void {
        const eventTypes = [EventType.RESCUE, EventType.BUILD, EventType.TRAIN];
        const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        
        // 随机选择一个空闲格子
        const emptyCells = this.grid.cells.filter(cell => !cell.occupied);
        if (emptyCells.length === 0) return;
        
        const targetCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        
        this.currentEvent = randomEvent;
        this.eventTargetCell = targetCell.id;
        
        // 如果是救援事件，创建村民单位
        if (randomEvent === EventType.RESCUE) {
            // 创建恶魔村民
            const villager: Unit = {
                id: `villager_${Math.random().toString(36).substr(2, 9)}`,
                name: '恶魔村民',
                faction: Faction.NEUTRAL,
                unitType: UnitType.NEUTRAL,
                combatType: CombatType.MELEE,
                jobType: JobType.DEMON,
                hp: 2,
                maxHp: 2,
                atk: 1,
                baseAtk: 1,
                armor: 0,
                baseArmor: 0,
                position: {
                    gridX: targetCell.gridX,
                    gridY: targetCell.gridY,
                    cellNumber: targetCell.id,
                    direction: Direction.DOWN
                },
                traits: [],
                traitValues: {},
                statusEffects: [],
                hasAttacked: false,
                isAlive: true,
                imagePath: 'assets/images/villager.png'
            };
            
            this.villagerUnits.push(villager);
            
            // 标记格子为已占用
            targetCell.occupied = true;
            targetCell.occupiedBy = villager.id;
            
            // 创建村民精灵
            this.createUnitSprite(villager);
        }
        
        // 显示事件提示
        let eventText = '';
        switch (randomEvent) {
            case EventType.RESCUE:
                eventText = `救援事件: 在格子${targetCell.id}上有村民需要救援！`;
                break;
            case EventType.BUILD:
                eventText = `建设事件: 在格子${targetCell.id}上部署单位完成建设，获得护甲+2！`;
                break;
            case EventType.TRAIN:
                eventText = `训练事件: 在格子${targetCell.id}上部署单位完成训练，获得攻击+2！`;
                break;
        }
        
        const eventNotification = this.add.text(
            this.cameras.main.width / 2,
            100,
            eventText,
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffff00',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);
        
        // 高亮目标格子
        const cellIndex = targetCell.id - 1;
        if (this.cells[cellIndex]) {
            this.cells[cellIndex].setTint(0xffff00);
        }
        
        // 3秒后移除提示
        this.time.delayedCall(3000, () => {
            eventNotification.destroy();
        });
    }
    
    // 开始部署阶段
    private startDeploymentPhase(): void {
        this.gameState = GameState.DEPLOYMENT;
        this.stateText.setText('阶段: 部署');
        
        // 抽牌
        this.drawCardsFromDeck(3);
        
        // 显示结束回合按钮
        this.endTurnButton.setVisible(true);
        this.endTurnText.setVisible(true);
    }
    
    // 从牌库抽牌
    private drawCardsFromDeck(count: number): void {
        // 检查牌库是否为空，如果为空则将弃牌堆洗牌后加入牌库
        if (this.deck.length === 0 && this.discardPile.length > 0) {
            this.deck = shuffleDeck([...this.discardPile]);
            this.discardPile = [];
            this.updateCardCountTexts();
        }
        
        const { drawnCards, remainingDeck } = drawCards(this.deck, count);
        this.hand.push(...drawnCards);
        this.deck = remainingDeck;
        
        // 更新UI
        this.createCardSprites();
        this.updateCardCountTexts();
        
        // 更新DOM UI
        this.updateDOMUI();
    }
    
    // 创建卡牌精灵
    private createCardSprites(): void {
        // 清除旧的卡牌精灵
        this.cardSprites.forEach(sprite => sprite.destroy());
        this.cardSprites = [];
        
        // 计算卡牌位置
        const cardWidth = 80;
        const cardHeight = 120;
        const cardGap = 20;
        // 修改卡牌位置到右侧
        const startX = this.cameras.main.width - cardWidth / 2 - 20;
        const startY = 150;
        
        // 创建新的卡牌精灵
        this.hand.forEach((card, index) => {
            // 垂直排列卡牌
            const x = startX;
            const y = startY + index * (cardHeight + cardGap);
            
            // 卡牌背景
            const cardSprite = this.add.sprite(x, y, 'card_back');
            cardSprite.setDisplaySize(cardWidth, cardHeight);
            
            // 卡牌名称
            const nameText = this.add.text(x, y - cardHeight / 4, card.name, {
                fontFamily: 'Arial',
                fontSize: '12px',
                color: '#ffffff',
                align: 'center'
            }).setOrigin(0.5);
            
            // 卡牌描述（仅显示一部分）
            const description = card.description.length > 20 
                ? card.description.substring(0, 20) + '...' 
                : card.description;
                
            const descText = this.add.text(x, y + cardHeight / 4, description, {
                fontFamily: 'Arial',
                fontSize: '10px',
                color: '#ffffff',
                align: 'center',
                wordWrap: { width: cardWidth - 10 }
            }).setOrigin(0.5);
            
            // 使卡牌可交互
            cardSprite.setInteractive();
            cardSprite.on('pointerdown', () => this.onCardClick(index));
            
            // 记录卡牌精灵
            this.cardSprites.push(cardSprite);
            this.cardSprites.push(nameText as any);
            this.cardSprites.push(descText as any);
        });
    }
    
    // 更新卡牌计数文本
    private updateCardCountTexts(): void {
        this.deckCountText.setText(`牌库: ${this.deck.length}`);
        this.discardCountText.setText(`弃牌堆: ${this.discardPile.length}`);
    }
    
    // 创建单位精灵
    private createUnitSprite(unit: Unit): void {
        const cellSize = 120;
        const startX = (this.cameras.main.width - cellSize * 3) / 2;
        const startY = (this.cameras.main.height - cellSize * 3) / 2;
        
        const x = startX + unit.position.gridX * cellSize + cellSize / 2;
        const y = startY + unit.position.gridY * cellSize + cellSize / 2;
        
        // 创建单位精灵
        const sprite = this.add.sprite(x, y, 'card_back'); // 临时使用卡牌背面作为单位图像
        sprite.setDisplaySize(cellSize / 2, cellSize / 2);
        
        // 设置单位名称 - 只在棋盘上显示简单名称
        const nameText = this.add.text(x, y - 30, unit.name, {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: unit.faction === Faction.PLAYER ? '#00ff00' : (unit.faction === Faction.ENEMY ? '#ff0000' : '#ffff00'),
            stroke: '#000000',
            strokeThickness: 3
        }).setOrigin(0.5);
        
        // 创建血条
        const healthBar = this.add.graphics();
        this.updateHealthBar(unit, healthBar);
        
        // 创建方向指示器
        const directionArrow = this.add.image(x, y, 'direction_arrow');
        directionArrow.setDisplaySize(20, 20);
        directionArrow.setOrigin(0.5);
        
        // 根据朝向设置箭头角度
        switch (unit.position.direction) {
            case Direction.UP:
                directionArrow.setAngle(0);
                break;
            case Direction.RIGHT:
                directionArrow.setAngle(90);
                break;
            case Direction.DOWN:
                directionArrow.setAngle(180);
                break;
            case Direction.LEFT:
                directionArrow.setAngle(270);
                break;
        }
        
        // 保存精灵引用
        this.unitSprites.set(unit.id, sprite);
        this.healthBars.set(unit.id, healthBar);
        this.statusTexts.set(unit.id, nameText);
        
        // 将所有单位信息(包括敌人)都显示在右侧，而不是底部
        if (unit.faction === Faction.PLAYER || unit.faction === Faction.ENEMY) {
            const cardWidth = 180;
            const cardHeight = 120;
            const rightSide = this.cameras.main.width - cardWidth / 2 - 20;
            
            // 基于单位类型计算位置
            let baseY = unit.faction === Faction.PLAYER ? 300 : 600;
            const unitArray = unit.faction === Faction.PLAYER ? this.playerUnits : this.enemyUnits;
            const unitIndex = unitArray.findIndex(u => u.id === unit.id);
            const yPosition = baseY + unitIndex * (cardHeight + 10);
            
            // 使用对应阵营的颜色
            const bgColor = unit.faction === Faction.PLAYER ? 0x333399 : 0x993333;
            
            // 创建卡片背景
            const cardBg = this.add.rectangle(rightSide, yPosition, cardWidth, cardHeight, bgColor, 0.9)
                .setOrigin(0.5)
                .setStrokeStyle(2, 0xffffff);
                
            // 创建单位编号和名称
            const cardNameText = this.add.text(rightSide - cardWidth/2 + 20, yPosition - cardHeight/2 + 20, 
                `${unitIndex + 1} ${unit.name}`, {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#ffffff',
                align: 'left'
            }).setOrigin(0, 0.5);
            
            // 创建单位属性信息
            const statsText = this.add.text(rightSide, yPosition + 20, 
                `攻击力: ${unit.atk}\n生命值: ${unit.hp}/${unit.maxHp}`, {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: '#ffffff',
                align: 'center'
            }).setOrigin(0.5);
            
            // 如果有特性，显示特性
            if (unit.traits.length > 0) {
                const traitsText = this.add.text(rightSide, yPosition + 60, 
                    `特性: ${unit.traits.join(', ')}`, {
                    fontFamily: 'Arial',
                    fontSize: '14px',
                    color: '#ffff00',
                    align: 'center'
                }).setOrigin(0.5);
            }
        }
    }
    
    // 更新血条
    private updateHealthBar(unit: Unit, healthBar: Phaser.GameObjects.Graphics): void {
        const cellSize = 120;
        const startX = (this.cameras.main.width - cellSize * 3) / 2;
        const startY = (this.cameras.main.height - cellSize * 3) / 2;
        
        const x = startX + unit.position.gridX * cellSize + cellSize / 2 - 25;
        const y = startY + unit.position.gridY * cellSize + cellSize / 2 + 20;
        
        healthBar.clear();
        
        // 背景
        healthBar.fillStyle(0x000000, 0.8);
        healthBar.fillRect(x, y, 50, 6);
        
        // 血量颜色
        const healthPercentage = unit.hp / unit.maxHp;
        let color = 0x00ff00; // 绿色
        
        if (healthPercentage < 0.3) {
            color = 0xff0000; // 红色
        } else if (healthPercentage < 0.6) {
            color = 0xffff00; // 黄色
        }
        
        // 血量条
        healthBar.fillStyle(color, 1);
        healthBar.fillRect(x, y, 50 * healthPercentage, 6);
        
        // 血量文本
        if (this.statusTexts.has(unit.id)) {
            const nameText = this.statusTexts.get(unit.id)!;
            nameText.setText(`${unit.name} (${unit.hp}/${unit.maxHp})`);
        }
    }
    
    // 点击卡牌事件处理
    private onCardClick(cardIndex: number): void {
        if (this.gameState !== GameState.DEPLOYMENT) return;
        
        const selectedCard = this.hand[cardIndex];
        
        if (selectedCard.type === '随从卡') {
            // 高亮可放置的格子
            this.highlightEmptyCells();
            
            // 保存选中的卡牌索引，用于后续的格子点击处理
            (this as any).selectedCardIndex = cardIndex;
        } else if (selectedCard.type === '法术卡' || selectedCard.type === '强化卡') {
            // 根据卡牌类型高亮不同的格子
            if (selectedCard.type === '法术卡') {
                // 法术卡通常对敌方单位使用
                this.highlightEnemyCells();
            } else {
                // 强化卡通常对友方单位使用
                this.highlightFriendlyCells();
            }
            
            // 保存选中的卡牌索引
            (this as any).selectedCardIndex = cardIndex;
        }
        
        // 更新DOM UI
        this.updateDOMUI();
    }
    
    // 点击格子事件处理
    private onCellClick(cellNumber: number): void {
        // 如果是部署阶段且有选中的卡牌
        if (this.gameState === GameState.DEPLOYMENT && (this as any).selectedCardIndex !== undefined) {
            const selectedCard = this.hand[(this as any).selectedCardIndex];
            const cell = this.grid.cells.find(c => c.id === cellNumber);
            
            if (!cell) return;
            
            if (selectedCard.type === 'RandomFrom卡' && !cell.occupied) {
                // 部署随从
                this.deployMinion(selectedCard as MinionCard, cellNumber);
                
                // 移除选中的卡牌
                this.hand.splice((this as any).selectedCardIndex, 1);
                this.discardPile.push(selectedCard);
                
                // 更新UI
                this.createCardSprites();
                this.updateCardCountTexts();
                
                // 清除高亮
                this.clearCellHighlights();
                
                // 清除选中状态
                delete (this as any).selectedCardIndex;
                
                // 检查是否还有可用卡牌，如果没有则自动结束回合
                if (this.hand.length === 0) {
                    this.startBattlePhase();
                }
            } else if ((selectedCard.type === '法术卡' || selectedCard.type === '强化卡') && cell.occupied) {
                // 使用法术或强化卡
                this.useSpellOrBuff(selectedCard, cellNumber);
                
                // 移除选中的卡牌
                this.hand.splice((this as any).selectedCardIndex, 1);
                this.discardPile.push(selectedCard);
                
                // 更新UI
                this.createCardSprites();
                this.updateCardCountTexts();
                
                // 清除高亮
                this.clearCellHighlights();
                
                // 清除选中状态
                delete (this as any).selectedCardIndex;
                
                // 检查是否还有可用卡牌，如果没有则自动结束回合
                if (this.hand.length === 0) {
                    this.startBattlePhase();
                }
            }
        }
        
        // 更新DOM UI
        this.updateDOMUI();
    }
    
    // 部署随从
    private deployMinion(card: MinionCard, cellNumber: number): void {
        const cell = this.grid.cells.find(c => c.id === cellNumber)!;
        
        // 创建随从单位
        const unit = createUnitFromCard(card, cellNumber, Direction.DOWN);
        this.playerUnits.push(unit);
        
        // 标记格子为已占用
        cell.occupied = true;
        cell.occupiedBy = unit.id;
        
        // 创建单位精灵
        this.createUnitSprite(unit);
        
        // 检查是否满足事件条件
        this.checkEventCompletion(cellNumber);
        
        // 更新格子加成效果
        this.grid = updateGridBonuses(this.grid, [...this.playerUnits, ...this.enemyUnits]);
        
        // 显示消息
        this.showMessage(`部署了 ${card.name} 到格子 ${cellNumber + 1}`);
        
        // 更新DOM UI
        this.updateDOMUI();
    }
    
    // 使用法术或强化卡
    private useSpellOrBuff(card: Card, cellNumber: number): void {
        // 在实际实现中，这里应该根据卡牌的具体效果执行相应的逻辑
        // 由于演示需要，这里只添加一个简单的提示
        const notification = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            `使用了 ${card.name} 在格子 ${cellNumber} 上`,
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);
        
        // 2秒后移除提示
        this.time.delayedCall(2000, () => {
            notification.destroy();
        });
        
        // 更新DOM UI
        this.updateDOMUI();
    }
    
    // 高亮空格子
    private highlightEmptyCells(): void {
        this.clearCellHighlights();
        
        this.grid.cells.forEach((cell, index) => {
            if (!cell.occupied) {
                this.cells[index].setTint(0x00ff00); // 绿色高亮
            }
        });
    }
    
    // 高亮敌方单位格子
    private highlightEnemyCells(): void {
        this.clearCellHighlights();
        
        this.enemyUnits.forEach(enemy => {
            if (enemy.isAlive) {
                const cellIndex = enemy.position.cellNumber - 1;
                this.cells[cellIndex].setTint(0xff0000); // 红色高亮
            }
        });
    }
    
    // 高亮友方单位格子
    private highlightFriendlyCells(): void {
        this.clearCellHighlights();
        
        this.playerUnits.forEach(unit => {
            if (unit.isAlive) {
                const cellIndex = unit.position.cellNumber - 1;
                this.cells[cellIndex].setTint(0x00ff00); // 绿色高亮
            }
        });
    }
    
    // 清除格子高亮
    private clearCellHighlights(): void {
        this.cells.forEach(cell => {
            cell.clearTint();
        });
    }
    
    // 检查事件完成
    private checkEventCompletion(cellNumber: number): void {
        if (this.currentEvent === EventType.NONE || this.eventTargetCell !== cellNumber) return;
        
        // 根据事件类型执行不同的效果
        switch (this.currentEvent) {
            case EventType.RESCUE:
                // 救援事件：移除村民，获得奖励
                this.completeRescueEvent();
                break;
                
            case EventType.BUILD:
                // 建设事件：格子获得护甲+2的加成
                this.completeBuildEvent();
                break;
                
            case EventType.TRAIN:
                // 训练事件：格子获得攻击+2的加成
                this.completeTrainEvent();
                break;
        }
        
        // 清除事件
        this.currentEvent = EventType.NONE;
        this.eventTargetCell = null;
        
        // 更新DOM UI
        this.updateDOMUI();
    }
    
    // 完成救援事件
    private completeRescueEvent(): void {
        // 移除村民
        const villager = this.villagerUnits.find(v => v.position.cellNumber === this.eventTargetCell);
        if (!villager) return;
        
        // 从地图中移除村民精灵
        if (this.unitSprites.has(villager.id)) {
            this.unitSprites.get(villager.id)!.destroy();
            this.unitSprites.delete(villager.id);
        }
        
        if (this.healthBars.has(villager.id)) {
            this.healthBars.get(villager.id)!.destroy();
            this.healthBars.delete(villager.id);
        }
        
        if (this.statusTexts.has(villager.id)) {
            this.statusTexts.get(villager.id)!.destroy();
            this.statusTexts.delete(villager.id);
        }
        
        // 从数组中移除村民
        this.villagerUnits = this.villagerUnits.filter(v => v.id !== villager.id);
        
        // 获得奖励：增加10金币
        gameState.player.gold += 10;
        
        // 显示奖励提示
        const notification = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            '救援成功！获得10金币奖励',
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffff00',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);
        
        // 2秒后移除提示
        this.time.delayedCall(2000, () => {
            notification.destroy();
        });
        
        // 更新DOM UI
        this.updateDOMUI();
    }
    
    // 完成建设事件
    private completeBuildEvent(): void {
        // 获取目标格子
        const cell = this.grid.cells.find(c => c.id === this.eventTargetCell);
        if (!cell) return;
        
        // 增加格子护甲加成
        cell.bonusArmor += 2;
        
        // 显示奖励提示
        const notification = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            `建设完成！格子${cell.id}获得护甲+2加成`,
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffff00',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);
        
        // 2秒后移除提示
        this.time.delayedCall(2000, () => {
            notification.destroy();
        });
        
        // 更新DOM UI
        this.updateDOMUI();
    }
    
    // 完成训练事件
    private completeTrainEvent(): void {
        // 获取目标格子
        const cell = this.grid.cells.find(c => c.id === this.eventTargetCell);
        if (!cell) return;
        
        // 增加格子攻击加成
        cell.bonusAtk += 2;
        
        // 显示奖励提示
        const notification = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            `训练完成！格子${cell.id}获得攻击+2加成`,
            {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffff00',
                stroke: '#000000',
                strokeThickness: 4
            }
        ).setOrigin(0.5);
        
        // 2秒后移除提示
        this.time.delayedCall(2000, () => {
            notification.destroy();
        });
        
        // 更新DOM UI
        this.updateDOMUI();
    }
    
    // 战斗阶段开始
    private startBattlePhase(): void {
        this.gameState = GameState.BATTLE;
        this.stateText.setText('阶段: 战斗');
        
        // 隐藏结束回合按钮
        this.endTurnButton.setVisible(false);
        this.endTurnText.setVisible(false);
        
        // 将剩余的手牌放入弃牌堆
        this.discardPile.push(...this.hand);
        this.hand = [];
        this.createCardSprites();
        this.updateCardCountTexts();
        
        // 创建行动顺序
        this.createActionOrder();
        
        // 开始执行行动
        this.executeNextAction();
        
        // 更新DOM UI
        this.updateDOMUI();
        this.showMessage("战斗开始！");
    }
    
    // 创建行动顺序
    private createActionOrder(): void {
        this.actionOrder = [];
        this.currentActionIndex = 0;
        
        // 按照格子编号排序单位
        for (let cellNumber = 1; cellNumber <= 9; cellNumber++) {
            // 玩家单位优先
            const playerUnit = this.playerUnits.find(unit => 
                unit.isAlive && unit.position.cellNumber === cellNumber
            );
            
            if (playerUnit) {
                this.actionOrder.push(playerUnit);
            }
            
            // 中立单位其次
            const villagerUnit = this.villagerUnits.find(unit => 
                unit.isAlive && unit.position.cellNumber === cellNumber
            );
            
            if (villagerUnit) {
                this.actionOrder.push(villagerUnit);
            }
            
            // 敌方单位最后
            const enemyUnit = this.enemyUnits.find(unit => 
                unit.isAlive && unit.position.cellNumber === cellNumber
            );
            
            if (enemyUnit) {
                this.actionOrder.push(enemyUnit);
            }
        }
    }
    
    // 执行下一个行动
    private executeNextAction(): void {
        // 检查是否所有行动都已执行完毕
        if (this.currentActionIndex >= this.actionOrder.length) {
            // 检查战斗结果
            this.checkBattleResult();
            return;
        }
        
        const unit = this.actionOrder[this.currentActionIndex];
        
        // 如果单位已经死亡，跳过该单位
        if (!unit.isAlive) {
            this.currentActionIndex++;
            this.executeNextAction();
            return;
        }
        
        // 高亮当前行动的单位
        const sprite = this.unitSprites.get(unit.id);
        if (sprite) {
            sprite.setTint(0xffff00);
        }
        
        // 根据单位类型执行不同的行动
        if (unit.faction === Faction.PLAYER) {
            // 玩家单位行动
            this.executePlayerUnitAction(unit);
        } else if (unit.faction === Faction.ENEMY) {
            // 敌方单位行动
            this.executeEnemyUnitAction(unit);
        } else {
            // 中立单位行动（如村民）
            this.executeNeutralUnitAction(unit);
        }
        
        // 延迟一段时间后进行下一个行动
        this.time.delayedCall(800, () => {
            // 取消高亮
            if (sprite) {
                sprite.clearTint();
            }
            
            // 移动到下一个单位
            this.currentActionIndex++;
            this.executeNextAction();
        });
        
        // 更新DOM UI
        this.updateDOMUI();
    }
    
    // 执行玩家单位行动
    private executePlayerUnitAction(unit: Unit): void {
        // 查找目标
        const target = selectTarget(unit, this.enemyUnits, [...this.playerUnits, ...this.enemyUnits]);
        
        if (target) {
            // 执行攻击
            const result = handleAttack(unit, target);
            
            // 更新目标单位的血条
            if (this.healthBars.has(target.id)) {
                this.updateHealthBar(target, this.healthBars.get(target.id)!);
            }
            
            // 如果目标死亡，移除其精灵
            if (!target.isAlive) {
                this.handleUnitDeath(target);
            }
            
            // 显示伤害文本
            this.showDamageText(target.position.cellNumber, result.damage);
        }
    }
    
    // 执行敌方单位行动
    private executeEnemyUnitAction(unit: Unit): void {
        // 查找目标
        const target = selectTarget(unit, [...this.playerUnits, ...this.villagerUnits], [...this.playerUnits, ...this.enemyUnits, ...this.villagerUnits]);
        
        if (target) {
            // 执行攻击
            const result = handleAttack(unit, target);
            
            // 更新目标单位的血条
            if (this.healthBars.has(target.id)) {
                this.updateHealthBar(target, this.healthBars.get(target.id)!);
            }
            
            // 如果目标死亡，移除其精灵
            if (!target.isAlive) {
                this.handleUnitDeath(target);
            }
            
            // 显示伤害文本
            this.showDamageText(target.position.cellNumber, result.damage);
        } else if (this.playerUnits.length === 0) {
            // 如果没有玩家单位，直接攻击玩家
            gameState.player.hp -= unit.atk;
            
            // 更新玩家状态文本
            this.playerStatsText.setText(`HP: ${gameState.player.hp}/${gameState.player.maxHp} | ATK: ${gameState.player.atk}`);
            
            // 显示伤害文本
            this.showDamageText(5, unit.atk); // 假设玩家在中心位置
            
            // 检查玩家是否死亡
            if (gameState.player.hp <= 0) {
                this.handlePlayerDefeat();
            }
        }
    }
    
    // 执行中立单位行动
    private executeNeutralUnitAction(unit: Unit): void {
        // 中立单位通常不执行任何行动
    }
    
    // 显示伤害文本
    private showDamageText(cellNumber: number, damage: number): void {
        const cellSize = 120;
        const startX = (this.cameras.main.width - cellSize * 3) / 2;
        const startY = (this.cameras.main.height - cellSize * 3) / 2;
        
        const x = startX + ((cellNumber - 1) % 3) * cellSize + cellSize / 2;
        const y = startY + Math.floor((cellNumber - 1) / 3) * cellSize + cellSize / 2;
        
        const damageText = this.add.text(x, y, `-${damage}`, {
            fontFamily: 'Arial',
            fontSize: '28px',
            color: '#ff0000',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        // 添加动画效果
        this.tweens.add({
            targets: damageText,
            y: y - 50,
            alpha: 0,
            duration: 800,
            onComplete: () => {
                damageText.destroy();
            }
        });
    }
    
    // 处理单位死亡
    private handleUnitDeath(unit: Unit): void {
        // 从精灵列表中移除
        if (this.unitSprites.has(unit.id)) {
            this.unitSprites.get(unit.id)!.destroy();
            this.unitSprites.delete(unit.id);
        }
        
        if (this.healthBars.has(unit.id)) {
            this.healthBars.get(unit.id)!.destroy();
            this.healthBars.delete(unit.id);
        }
        
        if (this.statusTexts.has(unit.id)) {
            this.statusTexts.get(unit.id)!.destroy();
            this.statusTexts.delete(unit.id);
        }
        
        // 释放格子
        const cell = this.grid.cells.find(c => c.id === unit.position.cellNumber);
        if (cell) {
            cell.occupied = false;
            cell.occupiedBy = undefined;
        }
        
        // 显示消息
        this.showMessage(`${unit.name} 被消灭了！`);
        
        // 更新DOM UI
        this.updateDOMUI();
    }
    
    // 检查战斗结果
    private checkBattleResult(): void {
        // 检查敌方单位是否全部死亡
        const allEnemiesDead = this.enemyUnits.every(unit => !unit.isAlive);
        
        if (allEnemiesDead) {
            this.handleVictory();
        } else {
            // 开始下一回合
            this.currentTurn++;
            this.turnText.setText(`回合: ${this.currentTurn}`);
            this.startDeploymentPhase();
        }
    }
    
    // 处理胜利
    private handleVictory(): void {
        this.gameState = GameState.VICTORY;
        this.stateText.setText('阶段: 胜利');
        
        // 显示胜利文本
        const victoryText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            '胜利！',
            {
                fontFamily: 'Arial',
                fontSize: '64px',
                color: '#ffff00',
                stroke: '#000000',
                strokeThickness: 6
            }
        ).setOrigin(0.5);
        
        // 添加动画效果
        this.tweens.add({
            targets: victoryText,
            scale: 1.2,
            duration: 1000,
            yoyo: true,
            repeat: 2
        });
        
        // 增加完成的战斗数
        gameState.completedBattles++;
        
        // 如果当前战斗不是BOSS战，继续下一场战斗
        if (gameState.currentBattle < 4) {
            gameState.currentBattle++;
            
            // 3秒后进入卡牌选择场景
            this.time.delayedCall(3000, () => {
                this.scene.start('CardSelectionScene');
            });
        } else {
            // 如果是BOSS战胜利，进入商店场景
            this.time.delayedCall(3000, () => {
                this.scene.start('ShopScene');
            });
        }
        
        // 显示消息
        this.showMessage("战斗胜利！");
        
        // 更新DOM UI
        this.updateDOMUI();
    }
    
    // 处理失败
    private handlePlayerDefeat(): void {
        this.gameState = GameState.DEFEAT;
        this.stateText.setText('阶段: 失败');
        
        // 显示失败文本
        const defeatText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            '失败！',
            {
                fontFamily: 'Arial',
                fontSize: '64px',
                color: '#ff0000',
                stroke: '#000000',
                strokeThickness: 6
            }
        ).setOrigin(0.5);
        
        // 添加动画效果
        this.tweens.add({
            targets: defeatText,
            scale: 1.2,
            duration: 1000,
            yoyo: true,
            repeat: 2
        });
        
        // 3秒后返回主菜单
        this.time.delayedCall(3000, () => {
            this.scene.start('MainMenuScene');
        });
        
        // 显示消息
        this.showMessage("你被击败了...");
        
        // 更新DOM UI
        this.updateDOMUI();
    }
    
    // 更新DOM UI状态
    private updateDOMUI(): void {
        // 将当前场景数据同步到全局游戏状态
        gameState.player.hp = gameState.player.hp;
        gameState.player.energy = 1; // 每回合1点能量
        gameState.hand = this.hand;
        gameState.enemyUnits = this.enemyUnits;
        gameState.playerUnits = this.playerUnits;
        
        // 通知游戏引擎更新UI
        if (window && (window as any).gameEngine) {
            (window as any).gameEngine.updateUI();
        }
    }
    
    // 显示消息到DOM UI
    private showMessage(message: string): void {
        if (window && (window as any).gameEngine) {
            (window as any).gameEngine.showMessage(message);
        }
    }
    
    // 处理卡牌点击（从DOM UI调用）
    public handleCardClick(cardId: string): void {
        // 找到对应的卡牌索引
        const cardIndex = this.hand.findIndex(card => card.id === cardId);
        if (cardIndex !== -1) {
            this.onCardClick(cardIndex);
        }
    }
    
    // 结束回合（从DOM UI调用）
    public endTurn(): void {
        if (this.gameState === GameState.DEPLOYMENT) {
            this.startBattlePhase();
        }
    }
} 