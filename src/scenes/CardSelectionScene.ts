import Phaser from 'phaser';
import { gameState } from '../index';
import { Card } from '../types/Card';
import { minionCards } from '../cards/MinionCards';
import { spellCards } from '../cards/SpellCards';
import { buffCards } from '../cards/BuffCards';

export class CardSelectionScene extends Phaser.Scene {
    private availableCards: Card[] = [];
    private cardSprites: Phaser.GameObjects.Sprite[] = [];
    private selectedCardIndex: number = -1;
    
    constructor() {
        super('CardSelectionScene');
    }
    
    create(): void {
        // 创建背景
        this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'menu_bg')
            .setDisplaySize(this.cameras.main.width, this.cameras.main.height);
        
        // 创建标题
        this.add.text(
            this.cameras.main.width / 2,
            50,
            '选择一张卡牌添加到你的牌库',
            {
                fontFamily: 'Arial',
                fontSize: '32px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 5
            }
        ).setOrigin(0.5);
        
        // 随机生成三张卡选择
        this.generateCardChoices();
        
        // 创建卡牌精灵
        this.createCardSprites();
        
        // 创建确认按钮
        const confirmButton = this.add.image(
            this.cameras.main.width / 2,
            this.cameras.main.height - 100,
            'button'
        );
        
        const confirmText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height - 100,
            '确认',
            {
                fontFamily: 'Arial',
                fontSize: '28px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);
        
        // 使按钮可交互
        confirmButton.setInteractive();
        
        // 鼠标悬停效果
        confirmButton.on('pointerover', () => {
            confirmButton.setTint(0xdddddd);
        });
        
        confirmButton.on('pointerout', () => {
            confirmButton.clearTint();
        });
        
        // 点击确认
        confirmButton.on('pointerdown', () => {
            if (this.selectedCardIndex >= 0) {
                this.confirmSelection();
            }
        });
        
        // 初始时禁用确认按钮
        confirmButton.setAlpha(0.5);
        confirmText.setAlpha(0.5);
        confirmButton.disableInteractive();
        
        // 保存引用以便后续启用
        (this as any).confirmButton = confirmButton;
        (this as any).confirmText = confirmText;
    }
    
    // 生成卡牌选择
    private generateCardChoices(): void {
        // 清空现有卡牌
        this.availableCards = [];
        
        // 确保至少有一张随从卡
        const randomMinionIndex = Math.floor(Math.random() * minionCards.length);
        this.availableCards.push(minionCards[randomMinionIndex]);
        
        // 随机选择其他两张卡（可以是任何类型）
        const allCards = [...minionCards, ...spellCards, ...buffCards];
        
        while (this.availableCards.length < 3) {
            const randomIndex = Math.floor(Math.random() * allCards.length);
            const card = allCards[randomIndex];
            
            // 检查是否已经选择了这张卡
            if (!this.availableCards.includes(card)) {
                this.availableCards.push(card);
            }
        }
    }
    
    // 创建卡牌精灵
    private createCardSprites(): void {
        // 清除旧的卡牌精灵
        this.cardSprites.forEach(sprite => sprite.destroy());
        this.cardSprites = [];
        
        // 计算卡牌位置
        const cardWidth = 200;
        const cardHeight = 300;
        const cardGap = 50;
        const startX = (this.cameras.main.width - (this.availableCards.length * (cardWidth + cardGap) - cardGap)) / 2;
        const y = this.cameras.main.height / 2;
        
        // 创建新的卡牌精灵
        this.availableCards.forEach((card, index) => {
            const x = startX + index * (cardWidth + cardGap);
            
            // 卡牌背景
            const cardSprite = this.add.sprite(x, y, 'card_back');
            cardSprite.setDisplaySize(cardWidth, cardHeight);
            
            // 卡牌名称
            const nameText = this.add.text(x, y - cardHeight / 3, card.name, {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#ffffff',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5);
            
            // 卡牌类型
            const typeText = this.add.text(x, y - cardHeight / 5, card.type, {
                fontFamily: 'Arial',
                fontSize: '18px',
                color: '#ffff00',
                align: 'center'
            }).setOrigin(0.5);
            
            // 卡牌描述
            const descText = this.add.text(x, y + 20, card.description, {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: '#ffffff',
                align: 'center',
                wordWrap: { width: cardWidth - 20 }
            }).setOrigin(0.5, 0);
            
            // 使卡牌可交互
            cardSprite.setInteractive();
            cardSprite.on('pointerdown', () => this.onCardClick(index));
            
            // 记录卡牌精灵
            this.cardSprites.push(cardSprite);
            this.cardSprites.push(nameText as any);
            this.cardSprites.push(typeText as any);
            this.cardSprites.push(descText as any);
        });
    }
    
    // 点击卡牌
    private onCardClick(cardIndex: number): void {
        // 取消之前的选择
        if (this.selectedCardIndex >= 0 && this.selectedCardIndex < this.cardSprites.length) {
            this.cardSprites[this.selectedCardIndex * 4].clearTint();
        }
        
        // 设置新的选择
        this.selectedCardIndex = cardIndex;
        this.cardSprites[cardIndex * 4].setTint(0x00ff00);
        
        // 启用确认按钮
        (this as any).confirmButton.setAlpha(1);
        (this as any).confirmText.setAlpha(1);
        (this as any).confirmButton.setInteractive();
    }
    
    // 确认选择
    private confirmSelection(): void {
        // 添加选择的卡牌到玩家牌库
        const selectedCard = this.availableCards[this.selectedCardIndex];
        gameState.deck.push(selectedCard);
        
        // 显示确认消息
        const confirmMessage = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            `已将 ${selectedCard.name} 添加到你的牌库！`,
            {
                fontFamily: 'Arial',
                fontSize: '32px',
                color: '#00ff00',
                stroke: '#000000',
                strokeThickness: 5
            }
        ).setOrigin(0.5);
        
        // 添加动画效果
        this.tweens.add({
            targets: confirmMessage,
            alpha: { from: 1, to: 0 },
            duration: 2000,
            onComplete: () => {
                // 进入下一场战斗
                this.scene.start('BattleScene');
            }
        });
    }
} 