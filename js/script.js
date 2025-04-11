// 游戏状态
const gameState = {
    money: 1000,
    happiness: 50,
    rounds: 1,
    loans: 0,
    gameOver: false,
    handCards: [],
    playedCards: [],
    logs: [],
    usedCardsInCurrentRound: 0  // 添加当前回合已使用卡牌计数
};

// 卡牌数据
const cardTypes = {
    investment: {
        name: "投资",
        color: "#27ae60"
    },
    event: {
        name: "事件",
        color: "#e74c3c"
    },
    special: {
        name: "特殊",
        color: "#9b59b6"
    }
};

// 卡牌库
const cardDeck = [
    {
        id: 1,
        title: "股票投资",
        type: "investment",
        cost: 300,
        description: "投资股票市场，有机会获得不错的回报，但也有风险。",
        effects: {
            money: "±200",
            happiness: "+5"
        },
        action: () => {
            // 随机决定投资结果
            const success = Math.random() > 0.4;
            if (success) {
                updateResources({money: 200, happiness: 5});
                addLog("你的股票投资获得了回报！获得200金钱和5点幸福感。", "success");
            } else {
                updateResources({money: -200, happiness: -5});
                addLog("你的股票投资亏损了！损失200金钱和5点幸福感。", "error");
            }
        }
    },
    {
        id: 2,
        title: "创业项目",
        type: "investment",
        cost: 500,
        description: "投资一个有潜力的创业项目，高风险高回报。",
        effects: {
            money: "±400",
            happiness: "±10"
        },
        action: () => {
            const success = Math.random() > 0.6;
            if (success) {
                updateResources({money: 400, happiness: 10});
                addLog("你投资的创业项目大获成功！获得400金钱和10点幸福感。", "success");
            } else {
                updateResources({money: -400, happiness: -10});
                addLog("你投资的创业项目失败了！损失400金钱和10点幸福感。", "error");
            }
        }
    },
    {
        id: 3,
        title: "储蓄账户",
        type: "investment",
        cost: 100,
        description: "将钱存入银行，获得稳定但较低的收益。",
        effects: {
            money: "+50",
            happiness: "+2"
        },
        action: () => {
            updateResources({money: 50, happiness: 2});
            addLog("你的储蓄账户产生了利息！获得50金钱和2点幸福感。", "success");
        }
    },
    {
        id: 4,
        title: "意外支出",
        type: "event",
        cost: 0,
        description: "突发情况需要额外支出，影响你的财务状况。",
        effects: {
            money: "-200",
            happiness: "-5"
        },
        action: () => {
            updateResources({money: -200, happiness: -5});
            addLog("你遇到了意外支出！损失200金钱和5点幸福感。", "warning");
        }
    },
    {
        id: 5,
        title: "幸运彩票",
        type: "event",
        cost: 50,
        description: "购买彩票，有小概率获得大奖。",
        effects: {
            money: "-50/+500",
            happiness: "+3/+15"
        },
        action: () => {
            const win = Math.random() > 0.8;
            if (win) {
                updateResources({money: 500, happiness: 15});
                addLog("恭喜你中了彩票大奖！获得500金钱和15点幸福感。", "success");
            } else {
                // 已经在打出卡牌时扣了50金钱，这里只加幸福感
                updateResources({happiness: 3});
                addLog("很遗憾，你的彩票没有中奖，但是购买过程很愉快。获得3点幸福感。", "info");
            }
        }
    },
    {
        id: 6,
        title: "健康问题",
        type: "event",
        cost: 0,
        description: "你生病了，需要支付医疗费用。",
        effects: {
            money: "-300",
            happiness: "-15"
        },
        action: () => {
            updateResources({money: -300, happiness: -15});
            addLog("你遇到了健康问题！损失300金钱和15点幸福感。", "error");
        }
    },
    {
        id: 7,
        title: "职业晋升",
        type: "special",
        cost: 200,
        description: "投资自己的职业发展，有机会获得晋升。",
        effects: {
            money: "+300",
            happiness: "+20"
        },
        action: () => {
            updateResources({money: 300, happiness: 20});
            addLog("你获得了职业晋升！获得300金钱和20点幸福感。", "success");
        }
    },
    {
        id: 8,
        title: "理财学习",
        type: "special",
        cost: 100,
        description: "学习理财知识，提高未来投资成功率。",
        effects: {
            money: "-100/特殊",
            happiness: "+5"
        },
        action: () => {
            // 增加游戏中投资卡牌的成功率（在这里只是加幸福感）
            updateResources({happiness: 5});
            addLog("你学习了理财知识，感到更有自信！获得5点幸福感，未来投资成功率提高。", "info");
            // 这里可以添加全局状态修改投资成功率的逻辑
        }
    },
    {
        id: 9,
        title: "慈善捐款",
        type: "special",
        cost: 200,
        description: "向慈善机构捐款，提升自己的幸福感。",
        effects: {
            money: "-200",
            happiness: "+25"
        },
        action: () => {
            updateResources({happiness: 25});
            addLog("你做了慈善捐款，感到非常满足！获得25点幸福感。", "success");
        }
    },
    {
        id: 10,
        title: "度假旅行",
        type: "special",
        cost: 300,
        description: "去一个梦想中的地方度假，放松身心。",
        effects: {
            money: "-300",
            happiness: "+30"
        },
        action: () => {
            updateResources({happiness: 30});
            addLog("你享受了一次美妙的假期！获得30点幸福感。", "success");
        }
    }
];

// DOM 元素
const elements = {
    moneyValue: document.getElementById('money-value'),
    happinessValue: document.getElementById('happiness-value'),
    roundsValue: document.getElementById('rounds-value'),
    loansValue: document.getElementById('loans-value'),
    handCards: document.querySelector('.hand-cards'),
    dropZone: document.querySelector('.drop-zone'),
    logContent: document.querySelector('.log-content'),
    swapCardsBtn: document.getElementById('swap-cards'),
    loanBtn: document.getElementById('get-loan'),
    gameOverOverlay: document.querySelector('.game-over-overlay'),
    gameOverTitle: document.querySelector('.game-over-modal h2'),
    gameOverMessage: document.querySelector('.game-over-modal p'),
    restartBtn: document.getElementById('restart-game'),
    closeGameBtn: document.getElementById('close-game'),
    usedCardsValue: document.createElement('div') // 用于显示已使用卡牌计数
};

// 游戏初始化
function initGame() {
    // 设置初始状态
    gameState.money = 1000;
    gameState.happiness = 50;
    gameState.rounds = 1;
    gameState.loans = 0;
    gameState.gameOver = false;
    gameState.handCards = [];
    gameState.playedCards = [];
    gameState.logs = [];
    gameState.usedCardsInCurrentRound = 0;
    
    // 清空UI
    elements.handCards.innerHTML = '';
    elements.logContent.innerHTML = '';
    
    // 添加已使用卡牌计数显示
    elements.usedCardsValue.className = 'used-cards-counter';
    elements.usedCardsValue.innerHTML = '已使用: 0/3 卡牌';
    document.querySelector('.resource-bar').appendChild(elements.usedCardsValue);
    
    // 隐藏游戏结束界面
    elements.gameOverOverlay.classList.add('hidden');
    
    // 更新资源显示
    updateResourceDisplay();
    
    // 添加初始日志
    addLog("游戏开始！你有1000金钱和50点幸福感。尝试通过明智的选择来增加你的资源！", "info");
    
    // 发初始手牌
    drawCards(5);
    
    // 初始化事件监听
    setupEventListeners();
}

// 设置事件监听
function setupEventListeners() {
    // 移除所有现有的事件监听器（防止重复绑定）
    elements.swapCardsBtn.removeEventListener('click', swapCards);
    elements.loanBtn.removeEventListener('click', getLoan);
    elements.restartBtn.removeEventListener('click', initGame);
    if (elements.closeGameBtn) {
        elements.closeGameBtn.removeEventListener('click', closeGameHandler);
    }
    
    // 重新绑定事件监听器
    elements.swapCardsBtn.addEventListener('click', swapCards);
    elements.loanBtn.addEventListener('click', getLoan);
    elements.restartBtn.addEventListener('click', initGame);
    elements.closeGameBtn.addEventListener('click', closeGameHandler);
    
    // 设置拖放区域事件
    setupDropZone();
}

// 关闭游戏处理函数
function closeGameHandler() {
    alert('感谢游玩！');
    // 这里可以添加更多关闭游戏的逻辑
}

// 设置拖放区域
function setupDropZone() {
    // 移除所有现有的拖放事件监听器
    document.removeEventListener('dragstart', dragStartHandler);
    document.removeEventListener('dragend', dragEndHandler);
    elements.dropZone.removeEventListener('dragenter', dragEnterHandler);
    elements.dropZone.removeEventListener('dragover', dragOverHandler);
    elements.dropZone.removeEventListener('dragleave', dragLeaveHandler);
    elements.dropZone.removeEventListener('drop', dropHandler);
    document.removeEventListener('click', cardClickHandler);
    
    // 重新绑定拖放事件监听器
    document.addEventListener('dragstart', dragStartHandler);
    document.addEventListener('dragend', dragEndHandler);
    elements.dropZone.addEventListener('dragenter', dragEnterHandler);
    elements.dropZone.addEventListener('dragover', dragOverHandler);
    elements.dropZone.addEventListener('dragleave', dragLeaveHandler);
    elements.dropZone.addEventListener('drop', dropHandler);
    
    // 使用事件委托为卡牌绑定点击事件（优化性能）
    document.addEventListener('click', cardClickHandler);
}

// 拖拽开始处理函数
function dragStartHandler(e) {
    if (e.target.classList.contains('card')) {
        e.dataTransfer.setData('text/plain', e.target.dataset.id);
        setTimeout(() => {
            e.target.classList.add('dragging');
        }, 0);
    }
}

// 拖拽结束处理函数
function dragEndHandler(e) {
    if (e.target.classList.contains('card')) {
        e.target.classList.remove('dragging');
    }
}

// 拖拽进入区域处理函数
function dragEnterHandler(e) {
    e.preventDefault();
    elements.dropZone.classList.add('highlight');
}

// 拖拽在区域上方处理函数
function dragOverHandler(e) {
    e.preventDefault();
}

// 拖拽离开区域处理函数
function dragLeaveHandler() {
    elements.dropZone.classList.remove('highlight');
}

// 放下卡牌处理函数
function dropHandler(e) {
    e.preventDefault();
    elements.dropZone.classList.remove('highlight');
    
    const cardId = e.dataTransfer.getData('text/plain');
    playCard(cardId);
}

// 卡牌点击处理函数
function cardClickHandler(e) {
    const card = e.target.closest('.card');
    if (card) {
        const cardId = card.dataset.id;
        playCard(cardId);
    }
}

// 抽取卡牌
function drawCards(count) {
    // 创建文档片段，减少DOM操作次数
    const fragment = document.createDocumentFragment();
    const newCards = [];
    
    // 预先计算一次可用卡牌，减少重复计算
    const usedCardIds = new Set([...gameState.handCards.map(card => card.id), ...gameState.playedCards]);
    let availableCards = cardDeck.filter(card => !usedCardIds.has(card.id));
    
    // 从牌库中随机抽取卡牌
    for (let i = 0; i < count; i++) {
        if (gameState.handCards.length >= 5) {
            addLog("你的手牌已满！", "warning");
            break;
        }
        
        // 如果没有可用卡牌，重置牌库
        if (availableCards.length === 0) {
            // 重置已打出的牌，除了当前手牌
            gameState.playedCards = [...gameState.handCards.map(card => card.id)];
            
            // 重新计算可用卡牌
            const currentHandIds = new Set(gameState.handCards.map(card => card.id));
            availableCards = cardDeck.filter(card => !currentHandIds.has(card.id));
            
            // 如果还是没有可用卡牌，跳过当前循环
            if (availableCards.length === 0) {
                continue;
            }
        }
        
        const randomIndex = Math.floor(Math.random() * availableCards.length);
        const newCard = availableCards[randomIndex];
        
        // 从可用卡牌中移除已选的卡牌
        availableCards.splice(randomIndex, 1);
        
        gameState.handCards.push(newCard);
        newCards.push(newCard);
        
        // 将卡牌添加到文档片段中
        const cardElement = renderCard(newCard);
        fragment.appendChild(cardElement);
    }
    
    // 一次性将文档片段添加到DOM中
    if (fragment.childNodes.length > 0) {
        elements.handCards.appendChild(fragment);
    }
    
    // 添加日志
    newCards.forEach(card => {
        addLog(`你抽到了一张【${card.title}】卡牌！`, "info");
    });
}

// 渲染卡牌
function renderCard(card) {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    cardElement.dataset.id = card.id;
    cardElement.dataset.type = card.type;
    cardElement.draggable = true;
    
    cardElement.innerHTML = `
        <div class="card-header">
            <div class="card-title">${card.title}</div>
            <div class="card-type">${cardTypes[card.type].name}</div>
        </div>
        <div class="card-cost">${card.cost}</div>
        <div class="card-description">${card.description}</div>
        <div class="card-effects">${formatEffects(card.effects)}</div>
    `;
    
    return cardElement;
}

// 格式化效果文本
function formatEffects(effects) {
    let formattedEffects = '';
    
    if (effects.money) {
        formattedEffects += `金钱: ${effects.money} `;
    }
    
    if (effects.happiness) {
        formattedEffects += `幸福感: ${effects.happiness}`;
    }
    
    return formattedEffects;
}

// 打出卡牌
function playCard(cardId) {
    // 记录开始时间（性能优化）
    const startTime = performance.now();
    
    const cardIndex = gameState.handCards.findIndex(card => card.id == cardId);
    
    if (cardIndex === -1) return;
    
    const card = gameState.handCards[cardIndex];
    
    // 检查是否有足够的金钱
    if (gameState.money < card.cost) {
        addLog(`你没有足够的金钱来打出【${card.title}】卡牌！`, "error");
        return;
    }
    
    // 检查是否已经使用了3张牌
    if (gameState.usedCardsInCurrentRound >= 3) {
        addLog(`本回合已经使用了3张牌，无法再使用更多牌！`, "warning");
        return;
    }
    
    // 扣除卡牌费用
    updateResources({money: -card.cost});
    addLog(`你打出了【${card.title}】卡牌，支付了${card.cost}金钱！`, "info");
    
    try {
        // 执行卡牌效果
        card.action();
        
        // 从手牌中移除
        gameState.handCards.splice(cardIndex, 1);
        
        // 添加到已打出的牌中
        gameState.playedCards.push(card.id);
        
        // 增加已使用卡牌计数
        gameState.usedCardsInCurrentRound++;
        
        // 更新卡牌计数的日志提示
        if (gameState.usedCardsInCurrentRound < 3) {
            addLog(`本回合已使用 ${gameState.usedCardsInCurrentRound}/3 张牌`, "info");
        } else {
            addLog(`已使用 ${gameState.usedCardsInCurrentRound}/3 张牌，回合即将结束`, "success");
        }
        
        // 更新UI
        refreshHandCards();
        updateResourceDisplay(); // 确保计数显示更新
        
        // 先检查游戏是否结束
        const gameEndStatus = checkGameOver();
        
        // 如果游戏没有结束，且已使用3张牌，则延迟结束回合
        if (!gameEndStatus && gameState.usedCardsInCurrentRound >= 3) {
            // 使用更长的延迟，以确保动画和效果能够完成
            setTimeout(() => {
                nextRound();
            }, 1500);
        }
    } catch (error) {
        console.error("执行卡牌效果时出错:", error);
        addLog("使用卡牌时出现错误！", "error");
    }
    
    // 记录执行时间（性能优化）
    const endTime = performance.now();
    console.log(`卡牌操作耗时: ${endTime - startTime}ms`);
}

// 刷新手牌显示
function refreshHandCards() {
    elements.handCards.innerHTML = '';
    
    // 使用文档片段减少DOM操作
    const fragment = document.createDocumentFragment();
    
    gameState.handCards.forEach(card => {
        const cardElement = renderCard(card);
        fragment.appendChild(cardElement);
    });
    
    // 一次性将所有卡牌添加到DOM
    elements.handCards.appendChild(fragment);
}

// 下一回合
function nextRound() {
    // 检查是否使用了恰好3张牌
    if (gameState.usedCardsInCurrentRound !== 3) {
        addLog("每回合必须使用恰好3张牌才能结束回合！", "warning");
        return;
    }
    
    gameState.rounds++;
    // 重置已使用卡牌计数
    gameState.usedCardsInCurrentRound = 0;
    updateResourceDisplay();
    
    // 计算贷款利息
    if (gameState.loans > 0) {
        const interest = Math.floor(gameState.loans * 0.1); // 10% 利息
        updateResources({money: -interest});
        addLog(`你支付了贷款利息 ${interest} 金钱！`, "warning");
    }
    
    // 计算需要补充的手牌数量
    const cardsNeeded = 5 - gameState.handCards.length;
    
    // 抽新卡牌补充到5张
    if (cardsNeeded > 0) {
        addLog(`补充 ${cardsNeeded} 张手牌...`, "info");
        drawCards(cardsNeeded);
    }
    
    addLog(`第 ${gameState.rounds} 回合开始！`, "info");
    
    // 检查游戏是否结束
    checkGameOver();
}

// 交换手牌
function swapCards() {
    if (gameState.money < 50) {
        addLog("你没有足够的金钱来交换手牌！", "error");
        return;
    }
    
    updateResources({money: -50});
    addLog("你花费了50金钱来交换手牌！", "info");
    
    // 清空手牌
    const oldCards = [...gameState.handCards];
    gameState.handCards = [];
    elements.handCards.innerHTML = '';
    
    // 将旧牌加入已打出的牌中（使用更高效的方式）
    gameState.playedCards = [...gameState.playedCards, ...oldCards.map(card => card.id)];
    
    // 重置已使用卡牌计数
    gameState.usedCardsInCurrentRound = 0;
    
    // 抽新手牌
    drawCards(5);
    
    // 检查游戏是否结束
    checkGameOver();
}

// 申请贷款
function getLoan() {
    const loanAmount = 500;
    
    updateResources({money: loanAmount});
    gameState.loans += loanAmount;
    updateResourceDisplay();
    
    addLog(`你申请了 ${loanAmount} 金钱的贷款！注意每回合需支付10%的利息。`, "warning");
    
    // 检查是否需要禁用贷款按钮（可选）
    if (gameState.loans >= 1500) {
        elements.loanBtn.disabled = true;
    }
}

// 更新资源
function updateResources(changes) {
    if (changes.money !== undefined) {
        gameState.money += changes.money;
    }
    
    if (changes.happiness !== undefined) {
        gameState.happiness += changes.happiness;
    }
    
    // 更新所有UI显示
    updateResourceDisplay();
}

// 更新资源显示
function updateResourceDisplay() {
    elements.moneyValue.textContent = gameState.money;
    elements.happinessValue.textContent = gameState.happiness;
    elements.roundsValue.textContent = gameState.rounds;
    elements.loansValue.textContent = gameState.loans;
    
    // 更新已使用卡牌计数显示
    elements.usedCardsValue.innerHTML = `已使用: ${gameState.usedCardsInCurrentRound}/3 卡牌`;
}

// 添加日志
function addLog(message, type = "info") {
    // 限制日志条数，防止内存泄漏
    const MAX_LOG_ENTRIES = 100;
    
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    logEntry.textContent = message;
    
    elements.logContent.appendChild(logEntry);
    
    // 滚动到最新的日志
    elements.logContent.scrollTop = elements.logContent.scrollHeight;
    
    // 保存到游戏状态中
    gameState.logs.push({message, type});
    
    // 如果日志超过最大数量，则删除旧日志
    if (gameState.logs.length > MAX_LOG_ENTRIES) {
        gameState.logs.shift();
        
        // 可选：同时从DOM中移除最旧的日志元素
        if (elements.logContent.childNodes.length > MAX_LOG_ENTRIES) {
            elements.logContent.removeChild(elements.logContent.firstChild);
        }
    }
}

// 检查游戏是否结束
function checkGameOver() {
    if (gameState.money <= 0 || gameState.happiness <= 0) {
        endGame(false);
        return true;
    } else if (gameState.money >= 5000 && gameState.happiness >= 100) {
        endGame(true);
        return true;
    }
    return false;
}

// 游戏结束
function endGame(isWin) {
    gameState.gameOver = true;
    
    elements.gameOverOverlay.classList.remove('hidden');
    
    if (isWin) {
        elements.gameOverTitle.textContent = "恭喜你，胜利！";
        elements.gameOverMessage.textContent = 
            `你成功地积累了足够的财富和幸福感！金钱: ${gameState.money}, 幸福感: ${gameState.happiness}, 回合数: ${gameState.rounds}`;
    } else {
        elements.gameOverTitle.textContent = "游戏结束";
        
        let reason = "";
        if (gameState.money <= 0) {
            reason = "你破产了！";
        } else if (gameState.happiness <= 0) {
            reason = "你的幸福感耗尽了！";
        }
        
        elements.gameOverMessage.textContent = 
            `${reason} 金钱: ${gameState.money}, 幸福感: ${gameState.happiness}, 回合数: ${gameState.rounds}`;
    }
}

// 游戏启动
document.addEventListener('DOMContentLoaded', initGame); 