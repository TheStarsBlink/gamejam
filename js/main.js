/**
 * 主程序，游戏入口
 */

// 游戏启动初始化
document.addEventListener('DOMContentLoaded', () => {
    // 确保游戏开始时弹窗完全隐藏
    const gameOverElement = document.getElementById('game-over');
    if (gameOverElement) {
        gameOverElement.classList.add('hidden');
        
        // 确保关闭按钮正常工作
        const closeBtn = document.getElementById('close-game-over-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                gameOverElement.classList.add('hidden');
                console.log('关闭按钮被点击');
            });
        }
    }
    
    // 所有初始化工作已在UI类和GameState类中处理
    // UI类会自动渲染界面，GameState类会自动初始化游戏状态
    // 欢迎提示已移至UI类的构造函数中
}); 