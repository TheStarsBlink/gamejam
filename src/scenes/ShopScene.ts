import Phaser from 'phaser';
import { gameState } from '../index';
import { Card } from '../types/Card';
import { minionCards } from '../cards/MinionCards';
import { spellCards } from '../cards/SpellCards';
import { buffCards } from '../cards/BuffCards';

export class ShopScene extends Phaser.Scene {
    private availableCards: Card[] = [];
    private cardSprites: Phaser.GameObjects.Sprite[] = [];
    private cardCosts: number[] = [];
    private goldText!: Phaser.GameObjects.Text;
    
    constructor() {
        super('ShopScene');
    }
    
    create(): void {
        // 创建背景
        this.add.image(this.cameras.main.width / 2, this.cameras.main.height / 2, 'menu_bg')
            .setDisplaySize(this.cameras.main.width, this.cameras.main.height);
        
        // 创建标题
        this.add.text(
            this.cameras.main.width / 2,
            50,
            '商店',
            {
                fontFamily: 'Arial',
                fontSize: '48px',
                color: '#ffffff',
                stroke: '#000000',
                strokeThickness: 6
            }
        ).setOrigin(0.5);
        
        // 显示金币
        this.goldText = this.add.text(
            this.cameras.main.width - 150,
            50,
            `金币: ${gameState.player.gold}`,
            {
                fontFamily: 'Arial',
                fontSize: '32px',
                color: '#ffff00',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        
        // 生成商店卡牌
        this.generateShopCards();
        
        // 创建卡牌精灵
        this.createCardSprites();
        
        // 创建继续按钮
        const continueButton = this.add.image(
            this.cameras.main.width / 2,
            this.cameras.main.height - 100,
            'button'
        );
        
        const continueText = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height - 100,
            '继续',
            {
                fontFamily: 'Arial',
                fontSize: '28px',
                color: '#ffffff'
            }
        ).setOrigin(0.5);
        
        // 使按钮可交互
        continueButton.setInteractive();
        
        // 鼠标悬停效果
        continueButton.on('pointerover', () => {
            continueButton.setTint(0xdddddd);
        });
        
        continueButton.on('pointerout', () => {
            continueButton.clearTint();
        });
        
        // 点击继续
        continueButton.on('pointerdown', () => {
            this.onContinue();
        });
    }
    
    // 生成商店卡牌
    private generateShopCards(): void {
        // 清空现有卡牌
        this.availableCards = [];
        this.cardCosts = [];
        
        // 生成随从包
        this.generateCardPack(minionCards, 0);
        
        // 生成法术包
        this.generateCardPack(spellCards, 1);
        
        // 生成强化包
        this.generateCardPack(buffCards, 2);
    }
    
    // 生成卡牌包
    private generateCardPack(cardPool: Card[], packIndex: number): void {
        // 随机选择3张卡牌
        const selectedCards: Card[] = [];
        
        // 获取不同稀有度的卡牌
        const commonCards = cardPool.filter(card => card.rarity === '普通');
        const rareCards = cardPool.filter(card => card.rarity === '稀有');
        const epicCards = cardPool.filter(card => card.rarity === '史诗');
        
        // 确保有不同稀有度的卡牌可选
        if (commonCards.length > 0) {
            selectedCards.push(commonCards[Math.floor(Math.random() * commonCards.length)]);
        }
        
        if (rareCards.length > 0) {
            selectedCards.push(rareCards[Math.floor(Math.random() * rareCards.length)]);
        }
        
        if (epicCards.length > 0) {
            selectedCards.push(epicCards[Math.floor(Math.random() * epicCards.length)]);
        }
        
        // 如果没有选够3张，随机补充
        while (selectedCards.length < 3) {
            const randomCard = cardPool[Math.floor(Math.random() * cardPool.length)];
            if (!selectedCards.includes(randomCard)) {
                selectedCards.push(randomCard);
            }
        }
        
        // 添加卡牌到商店
        selectedCards.forEach((card, index) => {
            this.availableCards.push(card);
            
            // 设置价格（根据稀有度）
            let cost = 10; // 基础价格
            
            if (card.rarity === '稀有') {
                cost = 20;
            } else if (card.rarity === '史诗') {
                cost = 30;
            } else if (card.rarity === '传说') {
                cost = 50;
            }
            
            this.cardCosts.push(cost);
        });
    }
    
    // 创建卡牌精灵
    private createCardSprites(): void {
        // 清除旧的卡牌精灵
        this.cardSprites.forEach(sprite => sprite.destroy());
        this.cardSprites = [];
        
        // 计算卡牌位置
        const cardWidth = 180;
        const cardHeight = 270;
        const cardGap = 30;
        const packGap = 100;
        const cardsPerPack = 3;
        
        // 创建新的卡牌精灵
        for (let packIndex = 0; packIndex < 3; packIndex++) {
            const packTitle = this.add.text(
                this.cameras.main.width / 2,
                150 + packIndex * (cardHeight + packGap),
                packIndex === 0 ? '随从卡' : (packIndex === 1 ? '法术卡' : '强化卡'),
                {
                    fontFamily: 'Arial',
                    fontSize: '24px',
                    color: '#ffffff',
                    stroke: '#000000',
                    strokeThickness: 3
                }
            ).setOrigin(0.5);
            
            const startX = (this.cameras.main.width - (cardsPerPack * (cardWidth + cardGap) - cardGap)) / 2;
            const y = 250 + packIndex * (cardHeight + packGap);
            
            for (let cardIndex = 0; cardIndex < cardsPerPack; cardIndex++) {
                const globalIndex = packIndex * cardsPerPack + cardIndex;
                
                if (globalIndex >= this.availableCards.length) continue;
                
                const card = this.availableCards[globalIndex];
                const cost = this.cardCosts[globalIndex];
                const x = startX + cardIndex * (cardWidth + cardGap);
                
                // 卡牌背景
                const cardSprite = this.add.sprite(x, y, 'card_back');
                cardSprite.setDisplaySize(cardWidth, cardHeight);
                
                // 卡牌名称
                const nameText = this.add.text(x, y - cardHeight / 3, card.name, {
                    fontFamily: 'Arial',
                    fontSize: '18px',
                    color: '#ffffff',
                    align: 'center',
                    stroke: '#000000',
                    strokeThickness: 2
                }).setOrigin(0.5);
                
                // 卡牌稀有度和类型
                const typeText = this.add.text(x, y - cardHeight / 5, `${card.rarity} ${card.type}`, {
                    fontFamily: 'Arial',
                    fontSize: '14px',
                    color: '#ffff00',
                    align: 'center'
                }).setOrigin(0.5);
                
                // 卡牌描述
                const descText = this.add.text(x, y + 10, card.description, {
                    fontFamily: 'Arial',
                    fontSize: '12px',
                    color: '#ffffff',
                    align: 'center',
                    wordWrap: { width: cardWidth - 20 }
                }).setOrigin(0.5, 0);
                
                // 价格标签
                const costText = this.add.text(x, y + cardHeight / 2 - 15, `价格: ${cost} 金币`, {
                    fontFamily: 'Arial',
                    fontSize: '16px',
                    color: '#ffff00',
                    stroke: '#000000',
                    strokeThickness: 2
                }).setOrigin(0.5);
                
                // 添加购买按钮
                const buyButton = this.add.image(x, y + cardHeight / 2 + 20, 'button').setScale(0.5);
                const buyText = this.add.text(x, y + cardHeight / 2 + 20, '购买', {
                    fontFamily: 'Arial',
                    fontSize: '14px',
                    color: '#ffffff'
                }).setOrigin(0.5);
                
                // 使按钮可交互
                buyButton.setInteractive();
                
                // 如果金币不足，禁用按钮
                if (gameState.player.gold < cost) {
                    buyButton.setTint(0x666666);
                    buyButton.disableInteractive();
                }
                
                // 鼠标悬停效果
                buyButton.on('pointerover', () => {
                    buyButton.setTint(0xdddddd);
                });
                
                buyButton.on('pointerout', () => {
                    buyButton.clearTint();
                });
                
                // 点击购买
                buyButton.on('pointerdown', () => {
                    this.buyCard(globalIndex);
                });
                
                // 记录卡牌精灵
                this.cardSprites.push(cardSprite);
                this.cardSprites.push(nameText as any);
                this.cardSprites.push(typeText as any);
                this.cardSprites.push(descText as any);
                this.cardSprites.push(costText as any);
                this.cardSprites.push(buyButton as any);
                this.cardSprites.push(buyText as any);
            }
        }
    }
    
    // 购买卡牌
    private buyCard(cardIndex: number): void {
        const card = this.availableCards[cardIndex];
        const cost = this.cardCosts[cardIndex];
        
        // 检查金币是否足够
        if (gameState.player.gold < cost) return;
        
        // 扣除金币
        gameState.player.gold -= cost;
        
        // 添加卡牌到牌库
        gameState.deck.push(card);
        
        // 更新金币显示
        this.goldText.setText(`金币: ${gameState.player.gold}`);
        
        // 显示购买成功消息
        const successMessage = this.add.text(
            this.cameras.main.width / 2,
            this.cameras.main.height / 2,
            `购买成功！已将 ${card.name} 添加到你的牌库！`,
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
            targets: successMessage,
            alpha: { from: 1, to: 0 },
            duration: 2000,
            onComplete: () => {
                successMessage.destroy();
            }
        });
        
        // 禁用已购买的卡牌
        const spriteIndex = cardIndex * 7;
        for (let i = 0; i < 7; i++) {
            if (i === 5) { // 购买按钮
                this.cardSprites[spriteIndex + i].setTint(0x666666);
                (this.cardSprites[spriteIndex + i] as Phaser.GameObjects.Image).disableInteractive();
            } else {
                this.cardSprites[spriteIndex + i].setAlpha(0.5);
            }
        }
        
        // 禁用其他卡牌的购买按钮（如果金币不足）
        for (let i = 0; i < this.availableCards.length; i++) {
            if (i !== cardIndex && gameState.player.gold < this.cardCosts[i]) {
                const otherSpriteIndex = i * 7 + 5; // 其他卡牌的购买按钮
                this.cardSprites[otherSpriteIndex].setTint(0x666666);
                (this.cardSprites[otherSpriteIndex] as Phaser.GameObjects.Image).disableInteractive();
            }
        }
    }
    
    // 继续游戏
    private onContinue(): void {
        // 如果通关所有关卡，返回主菜单
        if (gameState.completedBattles >= 4) {
            // 显示游戏通关消息
            const victoryMessage = this.add.text(
                this.cameras.main.width / 2,
                this.cameras.main.height / 2,
                '恭喜！你已经成功击退了入侵的天使联军！',
                {
                    fontFamily: 'Arial',
                    fontSize: '32px',
                    color: '#ffff00',
                    stroke: '#000000',
                    strokeThickness: 5
                }
            ).setOrigin(0.5);
            
            // 添加动画效果
            this.tweens.add({
                targets: victoryMessage,
                scale: 1.2,
                duration: 1000,
                yoyo: true,
                repeat: 2,
                onComplete: () => {
                    // 返回主菜单
                    this.scene.start('MainMenuScene');
                }
            });
        } else {
            // 进入下一场战斗
            gameState.currentBattle = 1; // 重置战斗计数
            gameState.currentLevel++; // 提升关卡
            this.scene.start('BattleScene');
        }
    }
}