import Phaser from 'phaser';
import { gameState } from '../index';
import { createInitialDeck } from '../utils/CardUtils';
import { shuffleDeck } from '../utils/CardUtils';

export class MainMenuScene extends Phaser.Scene {
    private startButton!: Phaser.GameObjects.Image;
    private titleText!: Phaser.GameObjects.Text;
    private subtitleText!: Phaser.GameObjects.Text;

    constructor() {
        super('MainMenuScene');
    }

    create(): void {
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;

        // 添加背景
        this.add.rectangle(0, 0, width, height, 0x000000).setOrigin(0, 0);

        // 添加标题
        const title = this.add.text(
            width / 2,
            height / 4,
            '恶魔要塞防御',
            { font: '64px Arial', color: '#ff0000' }
        );
        title.setOrigin(0.5, 0.5);

        // 添加副标题
        const subtitle = this.add.text(
            width / 2,
            height / 4 + 70,
            '地狱小头目的奋斗之路',
            { font: '32px Arial', color: '#ffffff' }
        );
        subtitle.setOrigin(0.5, 0.5);

        // 添加开始游戏按钮
        const startButton = this.add.rectangle(
            width / 2,
            height / 2,
            300,
            60,
            0x990000
        );
        startButton.setInteractive();
        startButton.on('pointerdown', () => {
            this.scene.start('BattleScene');
        });

        const startText = this.add.text(
            width / 2,
            height / 2,
            '开始游戏',
            { font: '32px Arial', color: '#ffffff' }
        );
        startText.setOrigin(0.5, 0.5);

        // 添加数独游戏按钮
        const sudokuButton = this.add.rectangle(
            width / 2,
            height / 2 + 80,
            300,
            60,
            0x009900
        );
        sudokuButton.setInteractive();
        sudokuButton.on('pointerdown', () => {
            this.scene.start('SudokuScene');
        });

        const sudokuText = this.add.text(
            width / 2,
            height / 2 + 80,
            '数独游戏',
            { font: '32px Arial', color: '#ffffff' }
        );
        sudokuText.setOrigin(0.5, 0.5);
        
        // 添加数独战斗按钮
        const sudokuBattleButton = this.add.rectangle(
            width / 2,
            height / 2 + 160,
            300,
            60,
            0x0066cc
        );
        sudokuBattleButton.setInteractive();
        sudokuBattleButton.on('pointerdown', () => {
            this.scene.start('SudokuBattleScene');
        });

        const sudokuBattleText = this.add.text(
            width / 2,
            height / 2 + 160,
            '数独战斗',
            { font: '32px Arial', color: '#ffffff' }
        );
        sudokuBattleText.setOrigin(0.5, 0.5);

        // 添加设置按钮
        const settingsButton = this.add.rectangle(
            width / 2,
            height / 2 + 240,
            300,
            60,
            0x666666
        );
        settingsButton.setInteractive();
        // 暂时不做任何事情

        const settingsText = this.add.text(
            width / 2,
            height / 2 + 240,
            '设置',
            { font: '32px Arial', color: '#ffffff' }
        );
        settingsText.setOrigin(0.5, 0.5);
    }
    
    private initializeGame(): void {
        // 初始化游戏状态
        gameState.player = {
            hp: 30,
            maxHp: 30,
            atk: 3,
            gold: 0
        };
        
        // 创建初始牌库并洗牌
        gameState.deck = shuffleDeck(createInitialDeck());
        
        // 重置关卡进度
        gameState.currentLevel = 1;
        gameState.currentBattle = 1;
        gameState.completedBattles = 0;
    }
}