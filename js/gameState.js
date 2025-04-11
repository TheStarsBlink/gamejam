/**
 * 游戏状态管理
 */
class GameState {
    constructor() {
        this.reset();
    }

    /**
     * 重置游戏状态
     */
    reset() {
        // 基础资源
        this.money = 100;
        this.happiness = 0;
        this.round = 1;
        
        // 卡牌系统
        this.deck = shuffleDeck(createDeck());
        this.handCards = [];
        this.discardPile = [];
        
        // 特殊效果
        this.activeEffect = {
            type: null, // 'effect1'(翻倍) 或 'effect2'(资金消耗无效) 或 'effect3'(幸福减少无效)
            remaining: 0 // 剩余生效次数
        };
        
        // 事件状态
        this.eventStatus = {
            isCrisis: false, // 是否处于金融危机
            isConsumerDepression: false, // 是否处于消费低迷
            remaining: 0,    // 剩余回合
            eventType: null  // 当前事件类型
        };
        
        // 贷款状态
        this.loanStatus = {
            hasLoan: false,   // 是否有贷款
            amount: 0,        // 贷款金额
            interestRate: 0.2, // 利率
            remainingRounds: 0 // 剩余还款回合
        };
        
        // 换牌功能状态
        this.canSwapCard = true;
        
        // 已使用牌数量计数（每回合要使用3张牌）
        this.usedCardsInCurrentRound = 0;
        
        // 补满手牌到5张
        this.drawCards(5);
    }

    /**
     * 从牌堆抽取指定数量的卡牌
     * @param {number} count - 抽取数量
     * @returns {Array} 抽取的卡牌数组
     */
    drawCards(count) {
        const drawnCards = [];
        
        for (let i = 0; i < count && this.deck.length > 0; i++) {
            const card = this.deck.pop();
            this.handCards.push(card);
            drawnCards.push(card);
        }
        
        // 检查牌堆是否为空，如果为空，可以选择重组弃牌堆
        if (this.deck.length === 0 && this.discardPile.length > 0) {
            this.reshuffleDeck();
        }
        
        return drawnCards;
    }
    
    /**
     * 从牌堆抽取符合特定条件的卡牌
     * @param {number} count - 抽取数量
     * @param {Function} filterFn - 过滤函数
     * @returns {Array} 抽取的卡牌数组
     */
    drawSpecificCards(count, filterFn) {
        const drawnCards = [];
        const tempDeck = [...this.deck];
        
        // 找到符合条件的卡牌
        const matchingCards = tempDeck.filter(filterFn);
        
        // 从符合条件的卡牌中随机抽取
        for (let i = 0; i < count && matchingCards.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * matchingCards.length);
            const card = matchingCards.splice(randomIndex, 1)[0];
            
            // 从原牌堆中移除这张卡
            const deckIndex = this.deck.findIndex(c => c.id === card.id);
            if (deckIndex !== -1) {
                this.deck.splice(deckIndex, 1);
                this.handCards.push(card);
                drawnCards.push(card);
            }
        }
        
        // 如果没有足够的符合条件的卡，就随机抽取
        const remainingCount = count - drawnCards.length;
        if (remainingCount > 0) {
            const randomCards = this.drawCards(remainingCount);
            drawnCards.push(...randomCards);
        }
        
        return drawnCards;
    }

    /**
     * 重组牌堆（将弃牌堆洗牌后放入牌堆）
     */
    reshuffleDeck() {
        this.deck = shuffleDeck([...this.discardPile]);
        this.discardPile = [];
        this.addLog('牌堆已用尽，重组弃牌堆');
    }

    /**
     * 使用手牌
     * @param {number} cardIndex - 手牌索引
     * @returns {Object|null} 使用结果，如果使用失败返回null
     */
    useHandCard(cardIndex) {
        if (cardIndex < 0 || cardIndex >= this.handCards.length) {
            return null;
        }
        
        const card = this.handCards[cardIndex];
        
        // 计算卡牌效果
        const effects = card.calculateEffects(this);
        
        // 检查资金是否足够
        if (this.money + effects.moneyChange < 0) {
            return {
                success: false,
                message: '资金不足！'
            };
        }
        
        // 应用效果
        this.money += effects.moneyChange;
        this.happiness += effects.happinessChange;
        
        // 确保幸福指数不超过100
        this.happiness = Math.min(this.happiness, 100);
        
        // 应用特殊效果
        card.applySpecialEffect(this);
        
        // 从手牌移除并加入弃牌堆
        this.handCards.splice(cardIndex, 1);
        this.discardPile.push(card);
        
        // 更新已使用牌数量
        this.usedCardsInCurrentRound++;
        
        // 记录日志
        this.addLog(`使用了${card.type}(${card.value})：资金${effects.moneyChange >= 0 ? '+' : ''}${effects.moneyChange}，幸福${effects.happinessChange >= 0 ? '+' : ''}${effects.happinessChange}`);
        
        if (card.isSpecial) {
            this.addLog(`触发特殊效果：${card.specialEffectDesc}`);
        }
        
        return {
            success: true,
            card: card,
            effects: effects
        };
    }

    /**
     * 替换一张手牌
     * @param {number} cardIndex - 要替换的手牌索引
     * @returns {Object|null} 替换结果，如果替换失败返回null
     */
    swapCard(cardIndex) {
        if (!this.canSwapCard || cardIndex < 0 || cardIndex >= this.handCards.length || this.deck.length === 0) {
            return null;
        }
        
        const oldCard = this.handCards[cardIndex];
        const newCard = this.deck.pop();
        
        // 从手牌移除旧卡并加入弃牌堆
        this.handCards.splice(cardIndex, 1, newCard);
        this.discardPile.push(oldCard);
        
        // 使用换牌功能后，本回合不能再换牌
        this.canSwapCard = false;
        
        // 记录日志
        this.addLog(`替换了一张${oldCard.type}(${oldCard.value})，获得了${newCard.type}(${newCard.value})`);
        
        return {
            success: true,
            oldCard: oldCard,
            newCard: newCard
        };
    }
    
    /**
     * 贷款功能
     * @param {number} amount - 贷款金额
     * @returns {Object} 贷款结果
     */
    takeLoan(amount) {
        // 检查是否已有贷款
        if (this.loanStatus.hasLoan) {
            return {
                success: false,
                message: '您已经有一笔未偿还的贷款'
            };
        }
        
        // 设置贷款状态
        this.loanStatus.hasLoan = true;
        this.loanStatus.amount = amount;
        this.loanStatus.remainingRounds = 3; // 3回合后需要还款
        
        // 增加资金
        this.money += amount;
        
        // 记录日志
        this.addLog(`获得了${amount}资金的贷款，${this.loanStatus.remainingRounds}回合后需偿还${Math.ceil(amount * (1 + this.loanStatus.interestRate))}`);
        
        return {
            success: true,
            message: `成功获得${amount}资金的贷款`
        };
    }
    
    /**
     * 处理贷款状态更新
     */
    updateLoanStatus() {
        if (!this.loanStatus.hasLoan) return;
        
        this.loanStatus.remainingRounds--;
        
        // 检查是否到还款期
        if (this.loanStatus.remainingRounds <= 0) {
            const repayAmount = Math.ceil(this.loanStatus.amount * (1 + this.loanStatus.interestRate));
            
            // 检查资金是否足够还款
            if (this.money >= repayAmount) {
                this.money -= repayAmount;
                this.loanStatus.hasLoan = false;
                this.loanStatus.amount = 0;
                this.addLog(`已偿还贷款${repayAmount}资金`);
            } else {
                // 资金不足，利息翻倍，延期还款
                this.loanStatus.interestRate *= 2;
                this.loanStatus.remainingRounds = 2;
                this.addLog(`资金不足，无法偿还贷款！利息翻倍，延期2回合偿还`);
            }
        } else {
            this.addLog(`贷款还有${this.loanStatus.remainingRounds}回合到期`);
        }
    }

    /**
     * 结束当前回合
     * @returns {Object} 结束回合的结果信息
     */
    endTurn() {
        // 检查是否使用了恰好3张牌
        if (this.usedCardsInCurrentRound !== 3) {
            return {
                success: false,
                message: '每回合必须使用恰好3张牌'
            };
        }
        
        // 回合数增加
        this.round++;
        
        // 重置换牌功能和已使用牌数量
        this.canSwapCard = true;
        this.usedCardsInCurrentRound = 0;
        
        // 更新事件状态
        this.updateEventStatus();
        
        // 更新贷款状态
        this.updateLoanStatus();
        
        // 计算需要抽取的卡牌数量，补充到5张
        const needToDraw = 5 - this.handCards.length;
        
        // 抽新卡补满手牌
        const drawnCards = this.drawCards(needToDraw);
        
        // 记录日志
        this.addLog(`回合${this.round}开始，抽取了${drawnCards.length}张新卡`);
        
        return {
            success: true,
            round: this.round,
            drawnCards: drawnCards
        };
    }

    /**
     * 更新事件状态
     */
    updateEventStatus() {
        // 如果已经处于事件状态，减少剩余回合
        if (this.eventStatus.eventType) {
            this.eventStatus.remaining--;
            
            if (this.eventStatus.remaining <= 0) {
                // 事件结束
                if (this.eventStatus.eventType === 'crisis') {
                    this.eventStatus.isCrisis = false;
                    this.addLog('金融危机结束');
                } else if (this.eventStatus.eventType === 'depression') {
                    this.eventStatus.isConsumerDepression = false;
                    this.addLog('消费低迷结束');
                }
                
                this.eventStatus.eventType = null;
            }
        } 
        // 每3回合触发一次随机事件
        else if (this.round % 3 === 0) {
            // 随机选择事件类型
            const eventType = Math.random() < 0.5 ? 'crisis' : 'depression';
            
            if (eventType === 'crisis') {
                // 金融危机
                this.eventStatus.isCrisis = true;
                this.eventStatus.eventType = 'crisis';
                this.eventStatus.remaining = 2; // 持续2回合
                this.addLog('金融危机爆发！黑桃卡收益减半');
            } else {
                // 消费低迷
                this.eventStatus.isConsumerDepression = true;
                this.eventStatus.eventType = 'depression';
                this.eventStatus.remaining = 2; // 持续2回合
                this.addLog('消费低迷！幸福指数增加减半');
            }
        }
    }

    /**
     * 检查游戏是否结束
     * @returns {Object|null} 游戏结束状态，游戏未结束返回null
     */
    checkGameEnd() {
        // 胜利条件：幸福指数 >= 100
        if (this.happiness >= 100) {
            // 判断结局类型
            let ending = '';
            
            if (this.happiness === 100 && this.money >= 200) {
                ending = 'perfect';
                return {
                    isOver: true,
                    isWin: true,
                    ending: ending,
                    message: `完美结局！你成功达到了${this.happiness}点幸福指数，并且积累了${this.money}资金，成为了既有钱又快乐的人！`
                };
            } else {
                ending = 'charity';
                return {
                    isOver: true,
                    isWin: true,
                    ending: ending,
                    message: `慈善结局！你成功达到了${this.happiness}点幸福指数，成为了一个注重生活品质的人！`
                };
            }
        }
        
        // 失败条件：资金 <= 0 且无手牌可用
        if (this.money <= 0 && this.handCards.every(card => card.moneyEffect < 0)) {
            return {
                isOver: true,
                isWin: false,
                ending: 'bankrupt',
                message: '破产结局！你的资金耗尽，无法继续投资幸福。'
            };
        }
        
        // 资本家结局：资金 >= 300 但幸福指数较低
        if (this.money >= 300 && this.happiness < 50) {
            return {
                isOver: true,
                isWin: true,
                ending: 'capitalist',
                message: `资本家结局！你积累了惊人的${this.money}资金，但幸福指数只有${this.happiness}。钱不能买到快乐，但能买到奢侈品！`
            };
        }
        
        return null;
    }

    /**
     * 添加日志
     * @param {string} message - 日志内容
     */
    addLog(message) {
        const logContainer = document.getElementById('log-container');
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = `[回合${this.round}] ${message}`;
        logContainer.prepend(logEntry);
    }
}

// 创建全局游戏状态实例
const gameState = new GameState(); 