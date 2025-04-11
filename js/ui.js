/**
 * UI交互模块，处理游戏界面的更新和交互
 */
class UI {
    constructor(gameState) {
        this.gameState = gameState;
        this.handCardsElement = document.getElementById('hand-cards');
        this.moneyElement = document.getElementById('money');
        this.happinessElement = document.getElementById('happiness');
        this.roundElement = document.getElementById('round');
        this.endTurnBtn = document.getElementById('end-turn-btn');
        this.swapCardBtn = document.getElementById('swap-card-btn');
        this.eventNotification = document.getElementById('event-notification');
        this.eventRemaining = document.getElementById('event-remaining');
        this.gameOverElement = document.getElementById('game-over');
        this.gameOverTitle = document.getElementById('game-over-title');
        this.gameOverMessage = document.getElementById('game-over-message');
        this.restartBtn = document.getElementById('restart-btn');
        this.closeGameOverBtn = document.getElementById('close-game-over-btn');
        
        // 确保游戏开始时，游戏结束弹窗是隐藏的
        this.gameOverElement.classList.add('hidden');
        
        this.setupEventListeners();
        
        // 初始化时添加欢迎提示
        this.showWelcomeMessage();
    }
    
    /**
     * 显示欢迎信息和游戏规则
     */
    showWelcomeMessage() {
        setTimeout(() => {
            // 添加游戏说明日志
            const logContainer = document.getElementById('log-container');
            
            const introLogs = [
                '欢迎来到卡牌资源管理游戏！',
                '游戏目标：通过使用不同花色卡牌，在资金与幸福指数间平衡，达成幸福指数100点胜利。',
                '游戏规则：',
                '- 每回合持有5张牌，必须使用恰好3张牌',
                '- 使用第3张牌后会自动结束回合',
                '- 剩余2张牌会保留到下一回合',
                '- 结束回合后，会补充手牌到5张',
                '- 红桃(粉色)：慈善卡，消耗资金，增加幸福',
                '- 方片(黄色)：建设卡，消耗资金，增加幸福',
                '- 梅花(绿色)：收集卡，增加资金，减少幸福',
                '- 黑桃(灰色)：投资卡，增加资金，减少幸福',
                '特殊卡牌(带"特"标记)：',
                '- 红桃特殊卡：下一张卡效果翻倍',
                '- 方片特殊卡：接下来两张卡的资金消耗无效',
                '每3回合会触发金融危机，持续2回合，黑桃卡收益减半',
                '祝您游戏愉快！'
            ];
            
            // 反向添加，使最后一条显示在最上方
            for (let i = introLogs.length - 1; i >= 0; i--) {
                const logEntry = document.createElement('div');
                logEntry.className = 'log-entry';
                logEntry.textContent = introLogs[i];
                logContainer.prepend(logEntry);
            }
        }, 100);
    }
    
    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 结束回合按钮
        this.endTurnBtn.addEventListener('click', () => {
            // 只有在已使用3张牌的情况下才能结束回合
            if (this.gameState.usedCardsInCurrentRound === 3) {
                const result = this.gameState.endTurn();
                if (!result.success) {
                    this.showMessage(result.message);
                    return;
                }
                
                this.updateUI();
                this.checkGameEnd();
            } else {
                this.showMessage('必须使用恰好3张牌才能结束回合');
            }
        });
        
        // 换牌按钮
        this.swapCardBtn.addEventListener('click', () => {
            if (!this.gameState.canSwapCard) {
                this.showMessage('本回合已经使用过换牌功能');
                return;
            }
            
            if (this.gameState.deck.length === 0) {
                this.showMessage('牌堆已空，无法换牌');
                return;
            }
            
            // 激活卡牌选择模式
            this.activateSwapMode();
        });
        
        // 重新开始按钮
        this.restartBtn.addEventListener('click', () => {
            // 先隐藏游戏结束界面
            this.gameOverElement.classList.add('hidden');
            // 然后重置游戏状态
            this.gameState.reset();
            this.updateUI();
            
            // 清除日志区域
            const logContainer = document.getElementById('log-container');
            logContainer.innerHTML = '';
            
            // 显示欢迎提示
            this.showWelcomeMessage();
        });
        
        // 关闭游戏结束弹窗按钮
        this.closeGameOverBtn.addEventListener('click', (e) => {
            // 阻止事件冒泡
            e.preventDefault();
            e.stopPropagation();
            
            // 确保弹窗隐藏
            this.gameOverElement.style.display = 'none';
            this.gameOverElement.classList.add('hidden');
            
            console.log('UI类中的关闭按钮被点击');
        });
    }
    
    /**
     * 激活换牌模式，让玩家选择要替换的卡牌
     */
    activateSwapMode() {
        // 给所有手牌添加特殊样式和临时点击事件
        const cards = this.handCardsElement.querySelectorAll('.card');
        cards.forEach((card, index) => {
            card.classList.add('swap-mode');
            
            // 移除旧有事件，避免重复绑定
            const newCard = card.cloneNode(true);
            card.parentNode.replaceChild(newCard, card);
            
            newCard.addEventListener('click', () => {
                // 替换卡牌
                const result = this.gameState.swapCard(index);
                if (result && result.success) {
                    this.updateUI();
                }
                
                // 退出换牌模式
                this.deactivateSwapMode();
            });
        });
        
        // 显示换牌提示
        this.showMessage('请选择要替换的卡牌');
        
        // 禁用按钮
        this.swapCardBtn.disabled = true;
        this.endTurnBtn.disabled = true;
    }
    
    /**
     * 退出换牌模式
     */
    deactivateSwapMode() {
        // 移除特殊样式和临时点击事件
        const cards = this.handCardsElement.querySelectorAll('.card');
        cards.forEach(card => {
            card.classList.remove('swap-mode');
        });
        
        // 启用按钮
        this.swapCardBtn.disabled = !this.gameState.canSwapCard;
        this.endTurnBtn.disabled = false;
        
        // 重新渲染手牌，恢复正常点击事件
        this.renderHandCards();
    }
    
    /**
     * 更新UI
     */
    updateUI() {
        this.renderHandCards();
        this.updateResourceDisplay();
        this.updateEventDisplay();
    }
    
    /**
     * 渲染手牌区域
     */
    renderHandCards() {
        // 清空手牌区域
        this.handCardsElement.innerHTML = '';
        
        // 渲染每张手牌
        this.gameState.handCards.forEach((card, index) => {
            const cardHTML = card.getHTML();
            const cardElement = document.createElement('div');
            cardElement.innerHTML = cardHTML;
            const cardNode = cardElement.firstElementChild;
            
            // 添加点击事件
            cardNode.addEventListener('click', () => {
                const result = this.gameState.useHandCard(index);
                if (!result) return;
                
                if (!result.success) {
                    this.showMessage(result.message);
                    return;
                }
                
                this.updateUI();
                
                // 检查是否已使用了3张牌，如果是则自动结束回合
                if (this.gameState.usedCardsInCurrentRound === 3) {
                    const endTurnResult = this.gameState.endTurn();
                    if (endTurnResult.success) {
                        this.updateUI();
                        this.checkGameEnd();
                    }
                } else {
                    this.checkGameEnd();
                }
            });
            
            this.handCardsElement.appendChild(cardNode);
        });
        
        // 更新按钮状态
        this.swapCardBtn.disabled = !this.gameState.canSwapCard || this.gameState.deck.length === 0;
        
        // 根据已使用的牌数量更新结束回合按钮状态
        this.endTurnBtn.disabled = this.gameState.usedCardsInCurrentRound !== 3;
    }
    
    /**
     * 更新资源显示
     */
    updateResourceDisplay() {
        this.moneyElement.textContent = this.gameState.money;
        this.happinessElement.textContent = this.gameState.happiness;
        this.roundElement.textContent = this.gameState.round;
        
        // 资金低于50时显示红色警告
        if (this.gameState.money < 50) {
            this.moneyElement.classList.add('money-low');
        } else {
            this.moneyElement.classList.remove('money-low');
        }
        
        // 幸福指数大于等于80时显示绿色高亮
        if (this.gameState.happiness >= 80) {
            this.happinessElement.classList.add('happiness-high');
        } else {
            this.happinessElement.classList.remove('happiness-high');
        }
    }
    
    /**
     * 更新事件显示
     */
    updateEventDisplay() {
        if (this.gameState.eventStatus.isCrisis) {
            this.eventNotification.classList.remove('hidden');
            this.eventRemaining.textContent = this.gameState.eventStatus.remaining;
        } else {
            this.eventNotification.classList.add('hidden');
        }
    }
    
    /**
     * 显示消息提示
     * @param {string} message - 消息内容
     */
    showMessage(message) {
        alert(message);
    }
    
    /**
     * 检查游戏是否结束
     */
    checkGameEnd() {
        const gameEndStatus = this.gameState.checkGameEnd();
        if (!gameEndStatus) return;
        
        // 显示游戏结束界面
        this.gameOverTitle.textContent = gameEndStatus.isWin ? '胜利！' : '失败！';
        this.gameOverMessage.textContent = gameEndStatus.message;
        this.gameOverElement.classList.remove('hidden');
    }
}

// 游戏启动时初始化UI
document.addEventListener('DOMContentLoaded', () => {
    const ui = new UI(gameState);
    ui.updateUI();
}); 