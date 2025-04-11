// 卡牌资源管理游戏 - 核心游戏逻辑

// 游戏基本参数
const gameConfig = {
    startingMoney: 1000,        // 初始金钱
    startingHappiness: 50,      // 初始幸福值
    maxRounds: 20,              // 游戏总回合数
    cardsPerHand: 5,            // 手牌数量
    loanAmount: 500,            // 贷款金额
    loanInterest: 0.2,          // 贷款利息
    cardSwapCost: 50            // 换牌费用
};

// 游戏状态
let gameState = {
    money: gameConfig.startingMoney,
    happiness: gameConfig.startingHappiness,
    currentRound: 1,
    loanAmount: 0,
    handCards: [],
    activeCard: null,
    gameOver: false,
    log: []
};

// 卡牌数据 - 包含不同类型的卡牌及其效果
const cardData = [
    // 投资类卡牌
    {
        id: 1,
        title: "股票投资",
        type: "investment",
        cost: 200,
        description: "投资股票市场，有机会获得回报。",
        effects: {
            money: { min: -50, max: 400 },
            happiness: { min: -10, max: 20 }
        },
        probability: 0.7 // 成功概率
    },
    {
        id: 2,
        title: "创业公司",
        type: "investment",
        cost: 500,
        description: "投资一家有潜力的创业公司。风险高，回报也高。",
        effects: {
            money: { min: -300, max: 1000 },
            happiness: { min: -20, max: 30 }
        },
        probability: 0.4
    },
    {
        id: 3,
        title: "稳健理财",
        type: "investment",
        cost: 100,
        description: "低风险的稳健型理财产品。",
        effects: {
            money: { min: 50, max: 150 },
            happiness: { min: 0, max: 5 }
        },
        probability: 0.9
    },
    
    // 事件类卡牌
    {
        id: 4,
        title: "休闲旅行",
        type: "event",
        cost: 150,
        description: "出门旅行放松心情，增加幸福感。",
        effects: {
            money: { min: -200, max: -100 },
            happiness: { min: 10, max: 30 }
        }
    },
    {
        id: 5,
        title: "职业培训",
        type: "event",
        cost: 200,
        description: "参加职业培训，提升技能和就业能力。",
        effects: {
            money: { min: -250, max: -150 },
            happiness: { min: -5, max: 15 }
        }
    },
    {
        id: 6,
        title: "意外医疗",
        type: "event",
        cost: 300,
        description: "突发健康问题，需要医疗费用。",
        effects: {
            money: { min: -500, max: -200 },
            happiness: { min: -30, max: -10 }
        }
    },
    
    // 特殊卡牌
    {
        id: 7,
        title: "慈善捐款",
        type: "special",
        cost: 100,
        description: "向慈善机构捐款，提升幸福感。",
        effects: {
            money: { fixed: -100 },
            happiness: { fixed: 20 }
        }
    },
    {
        id: 8,
        title: "彩票尝试",
        type: "special",
        cost: 50,
        description: "购买彩票，碰碰运气。",
        effects: {
            money: { min: -50, max: 1000 },
            happiness: { min: -5, max: 50 }
        },
        probability: 0.1
    },
    {
        id: 9,
        title: "社交活动",
        type: "special",
        cost: 80,
        description: "参加社交活动，认识新朋友。",
        effects: {
            money: { fixed: -80 },
            happiness: { min: 5, max: 25 }
        }
    }
];

// DOM 元素引用
const elements = {
    moneyValue: document.getElementById('money-value'),
    happinessValue: document.getElementById('happiness-value'),
    roundValue: document.getElementById('round-value'),
    loanValue: document.getElementById('loan-value'),
    handCardsContainer: document.getElementById('hand-cards'),
    dropZone: document.getElementById('drop-zone'),
    endTurnBtn: document.getElementById('end-turn-btn'),
    swapCardsBtn: document.getElementById('swap-cards-btn'),
    loanBtn: document.getElementById('loan-btn'),
    logContent: document.getElementById('log-content'),
    gameOverOverlay: document.getElementById('game-over-overlay'),
    gameOverTitle: document.getElementById('game-over-title'),
    gameOverMessage: document.getElementById('game-over-message'),
    restartBtn: document.getElementById('restart-btn'),
    closeBtn: document.getElementById('close-btn')
};

// 初始化游戏
function initGame() {
    // 重置游戏状态
    gameState = {
        money: gameConfig.startingMoney,
        happiness: gameConfig.startingHappiness,
        currentRound: 1,
        loanAmount: 0,
        handCards: [],
        activeCard: null,
        gameOver: false,
        log: []
    };
    
    // 更新UI显示
    updateResourceDisplay();
    
    // 清空手牌区域
    elements.handCardsContainer.innerHTML = '';
    
    // 清空日志
    elements.logContent.innerHTML = '';
    
    // 隐藏游戏结束遮罩
    elements.gameOverOverlay.classList.add('hidden');
    
    // 抽取初始手牌
    drawCards(gameConfig.cardsPerHand);
    
    // 添加游戏开始日志
    addLog("游戏开始！祝你好运！", "info");
}

// 更新资源显示
function updateResourceDisplay() {
    elements.moneyValue.textContent = gameState.money;
    elements.happinessValue.textContent = gameState.happiness;
    elements.roundValue.textContent = `${gameState.currentRound}/${gameConfig.maxRounds}`;
    elements.loanValue.textContent = gameState.loanAmount;
}

// 添加日志条目
function addLog(message, type = "info") {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    logEntry.textContent = message;
    
    // 添加到日志区域
    elements.logContent.appendChild(logEntry);
    
    // 滚动到最新日志
    elements.logContent.scrollTop = elements.logContent.scrollHeight;
    
    // 保存到游戏状态
    gameState.log.push({ message, type });
}

// 抽取卡牌
function drawCards(count) {
    for (let i = 0; i < count; i++) {
        // 随机选择一张卡牌
        const randomIndex = Math.floor(Math.random() * cardData.length);
        const card = { ...cardData[randomIndex] };
        
        // 深拷贝卡牌数据并添加唯一实例ID
        card.instanceId = Date.now() + Math.random().toString(16).slice(2);
        gameState.handCards.push(card);
        
        // 创建卡牌DOM
        createCardElement(card);
    }
}

// 创建卡牌DOM元素
function createCardElement(card) {
    const cardElement = document.createElement('div');
    cardElement.className = `card card-${card.type}`;
    cardElement.dataset.cardId = card.instanceId;
    
    // 卡牌内容
    cardElement.innerHTML = `
        <div class="card-title">${card.title}</div>
        <div class="card-type">${getCardTypeText(card.type)}</div>
        <div class="card-cost">${card.cost}</div>
        <div class="card-description">${card.description}</div>
        <div class="card-effect">
            ${getEffectHTML(card.effects)}
        </div>
    `;
    
    // 添加拖拽功能
    cardElement.setAttribute('draggable', 'true');
    cardElement.addEventListener('dragstart', handleDragStart);
    
    // 添加点击功能（移动设备）
    cardElement.addEventListener('click', () => handleCardClick(card));
    
    // 添加到手牌区域
    elements.handCardsContainer.appendChild(cardElement);
}

// 获取卡牌类型文本
function getCardTypeText(type) {
    const typeMap = {
        'investment': '投资',
        'event': '事件',
        'special': '特殊'
    };
    return typeMap[type] || type;
}

// 获取效果HTML
function getEffectHTML(effects) {
    let html = '';
    
    // 处理金钱效果
    if (effects.money) {
        if (effects.money.fixed !== undefined) {
            const value = effects.money.fixed;
            const cssClass = value >= 0 ? 'card-positive' : 'card-negative';
            const sign = value >= 0 ? '+' : '';
            html += `<span class="${cssClass}">金钱: ${sign}${value}</span>`;
        } else {
            const min = effects.money.min;
            const max = effects.money.max;
            const cssClass = max >= 0 ? 'card-positive' : 'card-negative';
            html += `<span class="${cssClass}">金钱: ${min} ~ ${max}</span>`;
        }
    }
    
    // 处理幸福值效果
    if (effects.happiness) {
        if (effects.happiness.fixed !== undefined) {
            const value = effects.happiness.fixed;
            const cssClass = value >= 0 ? 'card-positive' : 'card-negative';
            const sign = value >= 0 ? '+' : '';
            html += `<span class="${cssClass}">幸福: ${sign}${value}</span>`;
        } else {
            const min = effects.happiness.min;
            const max = effects.happiness.max;
            const cssClass = max >= 0 ? 'card-positive' : 'card-negative';
            html += `<span class="${cssClass}">幸福: ${min} ~ ${max}</span>`;
        }
    }
    
    return html;
}

// 拖拽开始处理
function handleDragStart(e) {
    const cardId = e.target.dataset.cardId;
    const card = gameState.handCards.find(c => c.instanceId === cardId);
    
    if (card) {
        e.dataTransfer.setData('text/plain', cardId);
        e.dataTransfer.effectAllowed = 'move';
        gameState.activeCard = card;
    }
}

// 卡牌点击处理（移动设备）
function handleCardClick(card) {
    // 设置当前激活的卡牌
    gameState.activeCard = card;
    
    // 高亮显示当前卡牌
    document.querySelectorAll('.card').forEach(cardEl => {
        cardEl.classList.remove('active');
    });
    
    document.querySelector(`[data-card-id="${card.instanceId}"]`).classList.add('active');
    
    // 提示用户拖放到放置区
    elements.dropZone.classList.add('active');
    elements.dropZone.querySelector('p').textContent = `点击这里使用 "${card.title}"`;
    
    // 添加点击事件到放置区
    elements.dropZone.onclick = () => {
        playCard(card);
    };
}

// 初始化拖放功能
function initDragAndDrop() {
    // 拖放区域事件
    elements.dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        elements.dropZone.classList.add('active');
    });
    
    elements.dropZone.addEventListener('dragleave', () => {
        elements.dropZone.classList.remove('active');
    });
    
    elements.dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        elements.dropZone.classList.remove('active');
        
        const cardId = e.dataTransfer.getData('text/plain');
        const card = gameState.handCards.find(c => c.instanceId === cardId);
        
        if (card) {
            playCard(card);
        }
    });
}

// 使用卡牌
function playCard(card) {
    // 检查是否有足够的金钱
    if (gameState.money < card.cost) {
        addLog(`金钱不足以使用 "${card.title}"`, "error");
        resetActiveCard();
        return;
    }
    
    // 支付卡牌费用
    gameState.money -= card.cost;
    addLog(`支付了 ${card.cost} 金钱使用 "${card.title}"`, "info");
    
    // 应用卡牌效果
    applyCardEffect(card);
    
    // 从手牌中移除卡牌
    const cardIndex = gameState.handCards.findIndex(c => c.instanceId === card.instanceId);
    if (cardIndex !== -1) {
        gameState.handCards.splice(cardIndex, 1);
    }
    
    // 从DOM中移除卡牌
    const cardElement = document.querySelector(`[data-card-id="${card.instanceId}"]`);
    if (cardElement) {
        cardElement.remove();
    }
    
    // 重置激活的卡牌
    resetActiveCard();
    
    // 更新资源显示
    updateResourceDisplay();
    
    // 检查游戏状态
    checkGameStatus();
}

// 重置激活的卡牌
function resetActiveCard() {
    gameState.activeCard = null;
    elements.dropZone.classList.remove('active');
    elements.dropZone.querySelector('p').textContent = '将卡牌拖放到这里使用';
    elements.dropZone.onclick = null;
    
    document.querySelectorAll('.card').forEach(cardEl => {
        cardEl.classList.remove('active');
    });
}

// 应用卡牌效果
function applyCardEffect(card) {
    let moneyEffect = 0;
    let happinessEffect = 0;
    
    // 处理金钱效果
    if (card.effects.money) {
        if (card.effects.money.fixed !== undefined) {
            moneyEffect = card.effects.money.fixed;
        } else {
            // 如果是有概率的卡牌（如投资）
            if (card.probability !== undefined) {
                const success = Math.random() < card.probability;
                if (success) {
                    moneyEffect = Math.floor(Math.random() * (card.effects.money.max - card.effects.money.min + 1)) + card.effects.money.min;
                    if (moneyEffect > 0) {
                        addLog(`${card.title}成功了！获得了 ${moneyEffect} 金钱`, "success");
                    } else {
                        addLog(`${card.title}勉强持平，获得了 ${moneyEffect} 金钱`, "info");
                    }
                } else {
                    moneyEffect = card.effects.money.min;
                    addLog(`${card.title}失败了。损失了 ${Math.abs(moneyEffect)} 金钱`, "error");
                }
            } else {
                // 随机效果
                moneyEffect = Math.floor(Math.random() * (card.effects.money.max - card.effects.money.min + 1)) + card.effects.money.min;
            }
        }
    }
    
    // 处理幸福值效果
    if (card.effects.happiness) {
        if (card.effects.happiness.fixed !== undefined) {
            happinessEffect = card.effects.happiness.fixed;
        } else {
            happinessEffect = Math.floor(Math.random() * (card.effects.happiness.max - card.effects.happiness.min + 1)) + card.effects.happiness.min;
        }
    }
    
    // 应用效果
    gameState.money += moneyEffect;
    gameState.happiness += happinessEffect;
    
    // 记录效果
    if (moneyEffect !== 0 && !card.probability) {
        const sign = moneyEffect > 0 ? '+' : '';
        addLog(`${card.title}：金钱变化 ${sign}${moneyEffect}`, moneyEffect > 0 ? "success" : "warning");
    }
    
    if (happinessEffect !== 0) {
        const sign = happinessEffect > 0 ? '+' : '';
        addLog(`${card.title}：幸福值变化 ${sign}${happinessEffect}`, happinessEffect > 0 ? "success" : "warning");
    }
}

// 结束回合
function endTurn() {
    // 结算贷款利息
    if (gameState.loanAmount > 0) {
        const interest = Math.floor(gameState.loanAmount * gameConfig.loanInterest);
        gameState.money -= interest;
        addLog(`支付贷款利息 ${interest} 金钱`, "warning");
    }
    
    // 增加回合数
    gameState.currentRound++;
    
    // 补充手牌
    const cardsToAdd = gameConfig.cardsPerHand - gameState.handCards.length;
    if (cardsToAdd > 0) {
        drawCards(cardsToAdd);
    }
    
    // 更新资源显示
    updateResourceDisplay();
    
    // 添加日志
    addLog(`回合 ${gameState.currentRound} 开始`, "info");
    
    // 检查游戏状态
    checkGameStatus();
}

// 换牌
function swapCards() {
    // 检查是否有足够的金钱
    if (gameState.money < gameConfig.cardSwapCost) {
        addLog(`金钱不足以交换手牌`, "error");
        return;
    }
    
    // 支付费用
    gameState.money -= gameConfig.cardSwapCost;
    
    // 清空当前手牌
    gameState.handCards = [];
    elements.handCardsContainer.innerHTML = '';
    
    // 抽取新手牌
    drawCards(gameConfig.cardsPerHand);
    
    // 更新资源显示
    updateResourceDisplay();
    
    // 添加日志
    addLog(`支付 ${gameConfig.cardSwapCost} 金钱更换了所有手牌`, "info");
}

// 申请贷款
function applyForLoan() {
    // 检查是否已经有贷款
    if (gameState.loanAmount > 0) {
        addLog("你已经有一笔未偿还的贷款", "error");
        return;
    }
    
    // 获得贷款
    gameState.money += gameConfig.loanAmount;
    gameState.loanAmount = gameConfig.loanAmount;
    
    // 更新资源显示
    updateResourceDisplay();
    
    // 添加日志
    addLog(`申请了 ${gameConfig.loanAmount} 金钱的贷款`, "warning");
}

// 检查游戏状态
function checkGameStatus() {
    // 检查破产
    if (gameState.money < 0) {
        endGameWithResult("破产", "你的金钱降到了0以下，游戏结束！");
        return;
    }
    
    // 检查幸福值
    if (gameState.happiness <= 0) {
        endGameWithResult("心灰意冷", "你的幸福值降到了0，游戏结束！");
        return;
    }
    
    // 检查回合数
    if (gameState.currentRound > gameConfig.maxRounds) {
        // 计算最终得分
        const finalScore = gameState.money + (gameState.happiness * 10) - gameState.loanAmount;
        
        // 根据最终得分判断结局
        let outcome;
        if (finalScore >= 2000) {
            outcome = "赢家人生";
        } else if (finalScore >= 1000) {
            outcome = "小康生活";
        } else {
            outcome = "勉强度日";
        }
        
        endGameWithResult(outcome, `游戏结束！你的最终得分：${finalScore}`);
    }
}

// 结束游戏
function endGameWithResult(title, message) {
    gameState.gameOver = true;
    
    // 设置结果
    elements.gameOverTitle.textContent = title;
    elements.gameOverMessage.textContent = message;
    
    // 显示游戏结束遮罩
    elements.gameOverOverlay.classList.remove('hidden');
    
    // 添加日志
    addLog(`游戏结束：${title}`, "info");
}

// 绑定事件处理
function bindEvents() {
    // 回合结束按钮
    elements.endTurnBtn.addEventListener('click', endTurn);
    
    // 换牌按钮
    elements.swapCardsBtn.addEventListener('click', swapCards);
    
    // 贷款按钮
    elements.loanBtn.addEventListener('click', applyForLoan);
    
    // 重新开始按钮
    elements.restartBtn.addEventListener('click', initGame);
    
    // 关闭按钮
    elements.closeBtn.addEventListener('click', () => {
        alert('感谢你的游戏体验！');
    });
}

// 页面加载完成后初始化游戏
window.addEventListener('DOMContentLoaded', () => {
    initDragAndDrop();
    bindEvents();
    initGame();
}); 