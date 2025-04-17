import Phaser from 'phaser';

export class LoadingScene extends Phaser.Scene {
    constructor() {
        super('LoadingScene');
    }

    preload(): void {
        // 创建加载进度条
        const progressBar = this.add.graphics();
        const progressBox = this.add.graphics();
        const width = this.cameras.main.width;
        const height = this.cameras.main.height;
        
        progressBox.fillStyle(0x222222, 0.8);
        progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50);
        
        // 加载文本
        const loadingText = this.make.text({
            x: width / 2,
            y: height / 2 - 50,
            text: '加载中...',
            style: {
                font: '20px monospace'
            }
        });
        loadingText.setOrigin(0.5, 0.5);
        
        // 百分比文本
        const percentText = this.make.text({
            x: width / 2,
            y: height / 2,
            text: '0%',
            style: {
                font: '18px monospace'
            }
        });
        percentText.setOrigin(0.5, 0.5);
        
        // 监听加载进度
        this.load.on('progress', (value: number) => {
            percentText.setText(parseInt((value * 100).toString()) + '%');
            progressBar.clear();
            progressBar.fillStyle(0xffffff, 1);
            progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30);
        });
        
        // 加载完成时清除监听器
        this.load.on('complete', () => {
            progressBar.destroy();
            progressBox.destroy();
            loadingText.destroy();
            percentText.destroy();
        });
        
        // 加载游戏资源
        this.loadGameAssets();
    }

    create(): void {
        this.scene.start('MainMenuScene');
    }

    private loadGameAssets(): void {
        // 由于缺少图像资源，先只加载已有的SVG资源
        // 注释掉还未创建的图像资源，避免加载错误
        
        /* 
        // 加载背景图
        this.load.image('background', 'assets/images/background.png');
        this.load.image('battle_bg', 'assets/images/battle_bg.png');
        this.load.image('menu_bg', 'assets/images/menu_bg.png');
        
        // 加载UI元素
        this.load.image('button', 'assets/images/button.png');
        this.load.image('card_back', 'assets/images/card_back.png');
        this.load.image('cell', 'assets/images/cell.png');
        this.load.image('cell_highlight', 'assets/images/cell_highlight.png');
        this.load.image('direction_arrow', 'assets/images/direction_arrow.png');
        
        // 加载精灵图
        this.load.spritesheet('health_bar', 'assets/images/health_bar.png', { frameWidth: 80, frameHeight: 12 });
        */
        
        // 加载SVG资源 - 正确路径格式
        this.load.image('demon', 'assets/demon.svg');
        this.load.image('fortress', 'assets/fortress.svg');
        this.load.image('card_template', 'assets/card.svg');
        this.load.image('fireball', 'assets/fireball.svg');
        this.load.image('shield', 'assets/shield.svg');
        
        // 为了演示，创建一个1秒的延迟
        this.time.delayedCall(1000, () => {
            // 延迟结束后，自动触发加载完成事件
        });
    }
}