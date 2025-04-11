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
        this.loanBtn = document.getElementById('loan-btn');
        this.eventNotification = document.getElementById('event-notification');
        this.eventRemaining = document.getElementById('event-remaining');
        this.eventDescription = document.getElementById('event-description');
        this.gameOverElement = document.getElementById('game-over');
        this.gameOverTitle = document.getElementById('game-over-title');
        this.gameOverMessage = document.getElementById('game-over-message');
        this.restartBtn = document.getElementById('restart-btn');
        this.closeGameOverBtn = document.getElementById('close-game-over-btn');
        
        // 设置拖放区域
        this.dropZone = document.getElementById('drop-zone');
        
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
                '- 可以通过点击或拖拽方式使用卡牌',
                '- 使用第3张牌后会自动结束回合',
                '- 剩余2张牌会保留到下一回合',
                '- 结束回合后，会补充手牌到5张',
                '- 红桃(粉色)：慈善卡，略微减少资金，增加幸福',
                '- 方片(黄色)：建设卡，减少资金，增加幸福',
                '- 梅花(绿色)：收集卡，略微增加资金，减少幸福',
                '- 黑桃(灰色)：投资卡，增加资金，减少幸福',
                '特殊卡牌(带"特"标记)：',
                '- 特1：下一张卡效果翻倍',
                '- 特2：下两张卡资金消耗无效',
                '- 特3：下两张卡幸福减少无效',
                '- 特4：额外抽2张增加资金的卡',
                '游戏事件：',
                '- 每3回合会触发随机事件',
                '- 金融危机：持续2回合，黑桃卡收益减半',
                '- 消费低迷：持续2回合，幸福指数增加减半',
                '玩家技能：',
                '- 换牌：每回合可使用一次，替换一张手牌',
                '- 贷款：获得50资金，3回合后需还款并支付利息',
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
        
        // 贷款按钮
        if (this.loanBtn) {
            this.loanBtn.addEventListener('click', () => {
                if (this.gameState.loanStatus.hasLoan) {
                    this.showMessage('您已有一笔未偿还的贷款');
                    return;
                }
                
                const loanAmount = 50; // 固定贷款额度
                const result = this.gameState.takeLoan(loanAmount);
                
                if (result.success) {
                    this.updateUI();
                    this.showMessage(result.message);
                } else {
                    this.showMessage(result.message);
                }
            });
        }
        
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
        
        // 设置拖放区域事件监听
        this.setupDragAndDrop();
    }
    
    /**
     * 设置拖拽功能
     */
    setupDragAndDrop() {
        // 如果存在拖放区域
        if (this.dropZone) {
            // 阻止默认拖放行为
            this.dropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
            });
            
            // 拖拽经过时高亮显示
            this.dropZone.addEventListener('dragenter', (e) => {
                e.preventDefault();
                this.dropZone.classList.add('drag-active');
            });
            
            // 拖拽离开时取消高亮
            this.dropZone.addEventListener('dragleave', () => {
                this.dropZone.classList.remove('drag-active');
            });
            
            // 处理卡牌放置
            this.dropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                this.dropZone.classList.remove('drag-active');
                
                const cardId = e.dataTransfer.getData('text/plain');
                const cardIndex = this.gameState.handCards.findIndex(card => card.id.toString() === cardId);
                
                if (cardIndex >= 0) {
                    const result = this.gameState.useHandCard(cardIndex);
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
                }
            });
        }
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
        if (this.loanBtn) this.loanBtn.disabled = true;
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
        if (this.loanBtn) this.loanBtn.disabled = false;
        
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
        this.updateLoanButtonStatus();
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
            
            // 添加拖拽事件
            cardNode.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', card.id);
                e.dataTransfer.effectAllowed = 'move';
                cardNode.classList.add('dragging');
            });
            
            cardNode.addEventListener('dragend', () => {
                cardNode.classList.remove('dragging');
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
        
        // 如果有贷款，显示贷款信息
        const loanInfoElement = document.getElementById('loan-info');
        if (loanInfoElement) {
            if (this.gameState.loanStatus.hasLoan) {
                const repayAmount = Math.ceil(this.gameState.loanStatus.amount * (1 + this.gameState.loanStatus.interestRate));
                loanInfoElement.textContent = `贷款: ${this.gameState.loanStatus.amount} (到期需还: ${repayAmount})`;
                loanInfoElement.classList.remove('hidden');
            } else {
                loanInfoElement.classList.add('hidden');
            }
        }
    }
    
    /**
     * 更新事件显示
     */
    updateEventDisplay() {
        if (this.gameState.eventStatus.eventType) {
            this.eventNotification.classList.remove('hidden');
            this.eventRemaining.textContent = this.gameState.eventStatus.remaining;
            
            // 根据事件类型显示不同的描述
            if (this.gameState.eventStatus.eventType === 'crisis') {
                this.eventDescription.textContent = '金融危机！黑桃卡收益减半';
            } else if (this.gameState.eventStatus.eventType === 'depression') {
                this.eventDescription.textContent = '消费低迷！幸福指数增加减半';
            }
        } else {
            this.eventNotification.classList.add('hidden');
        }
    }
    
    /**
     * 更新贷款按钮状态
     */
    updateLoanButtonStatus() {
        if (this.loanBtn) {
            this.loanBtn.disabled = this.gameState.loanStatus.hasLoan;
            
            if (this.gameState.loanStatus.hasLoan) {
                this.loanBtn.title = '您已有未偿还的贷款';
            } else {
                this.loanBtn.title = '获得50资金的贷款，3回合后需偿还';
            }
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
        this.gameOverTitle.textContent = gameEndStatus.isWin ? '游戏胜利！' : '游戏失败！';
        this.gameOverMessage.textContent = gameEndStatus.message;
        
        // 根据结局类型添加不同的CSS类
        this.gameOverElement.className = 'game-over-overlay'; // 重置类
        if (gameEndStatus.ending) {
            this.gameOverElement.classList.add(`ending-${gameEndStatus.ending}`);
        }
        
        this.gameOverElement.classList.remove('hidden');
    }
}

// 游戏启动时初始化UI
document.addEventListener('DOMContentLoaded', () => {
    const ui = new UI(gameState);
    ui.updateUI();
}); 