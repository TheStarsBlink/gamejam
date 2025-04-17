/**
 * 游戏UI管理模块
 * 处理游戏的DOM界面元素
 */

// 游戏状态接口定义
export interface GameState {
  player: {
    health: number;
    maxHealth: number;
    mana: number;
    maxMana: number;
    deck: number;
    discard: number;
    hand: Card[];
  };
  enemy: {
    health: number;
    maxHealth: number;
  };
  battle: {
    currentTurn: number;
    activePlayer: string;
  };
}

// 卡牌接口定义
export interface Card {
  id: string;
  name: string;
  type: string;
  cost: number;
  description: string;
  hp?: number;
  atk?: number;
}

// 回调函数接口
interface Callbacks {
  cardClick: (index: number) => void;
  endTurn: () => void;
}

/**
 * 初始化游戏UI
 * @param gameState 游戏状态对象
 * @param callbacks 回调函数集合
 */
export function initUI(gameState: GameState, callbacks: Callbacks): void {
  const body = document.body;
  body.style.margin = '0';
  body.style.padding = '0';
  body.style.overflow = 'hidden';
  body.style.backgroundColor = '#000';
  
  // 创建游戏容器
  const gameContainer = document.createElement('div');
  gameContainer.id = 'game-container';
  gameContainer.style.position = 'relative';
  gameContainer.style.width = '100vw';
  gameContainer.style.height = '100vh';
  gameContainer.style.backgroundImage = 'linear-gradient(to bottom, #1a2a3a, #0a1a2a)';
  body.appendChild(gameContainer);
  
  // 创建玩家信息区域
  const playerInfo = document.createElement('div');
  playerInfo.id = 'player-info';
  playerInfo.style.position = 'absolute';
  playerInfo.style.top = '10px';
  playerInfo.style.left = '10px';
  playerInfo.style.padding = '10px';
  playerInfo.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  playerInfo.style.borderRadius = '5px';
  playerInfo.style.color = 'white';
  playerInfo.style.fontFamily = 'Arial, sans-serif';
  
  // 玩家生命值
  const healthInfo = document.createElement('div');
  healthInfo.id = 'health-info';
  healthInfo.style.marginBottom = '5px';
  
  // 玩家能量
  const manaInfo = document.createElement('div');
  manaInfo.id = 'mana-info';
  manaInfo.style.marginBottom = '5px';
  
  // 牌库信息
  const deckInfo = document.createElement('div');
  deckInfo.id = 'deck-info';
  
  playerInfo.appendChild(healthInfo);
  playerInfo.appendChild(manaInfo);
  playerInfo.appendChild(deckInfo);
  gameContainer.appendChild(playerInfo);
  
  // 创建手牌区域
  const handContainer = document.createElement('div');
  handContainer.id = 'hand-container';
  handContainer.style.position = 'absolute';
  handContainer.style.bottom = '10px';
  handContainer.style.left = '50%';
  handContainer.style.transform = 'translateX(-50%)';
  handContainer.style.display = 'flex';
  handContainer.style.justifyContent = 'center';
  handContainer.style.gap = '10px';
  gameContainer.appendChild(handContainer);
  
  // 创建回合结束按钮
  const endTurnButton = document.createElement('button');
  endTurnButton.id = 'end-turn-button';
  endTurnButton.textContent = '结束回合';
  endTurnButton.style.position = 'absolute';
  endTurnButton.style.bottom = '20px';
  endTurnButton.style.right = '20px';
  endTurnButton.style.padding = '10px 20px';
  endTurnButton.style.backgroundColor = '#4CAF50';
  endTurnButton.style.color = 'white';
  endTurnButton.style.border = 'none';
  endTurnButton.style.borderRadius = '5px';
  endTurnButton.style.cursor = 'pointer';
  endTurnButton.style.fontSize = '16px';
  endTurnButton.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.2)';
  endTurnButton.addEventListener('mouseover', () => {
    endTurnButton.style.backgroundColor = '#45a049';
  });
  endTurnButton.addEventListener('mouseout', () => {
    endTurnButton.style.backgroundColor = '#4CAF50';
  });
  endTurnButton.addEventListener('click', () => {
    window.gameEngine?.endTurn();
  });
  gameContainer.appendChild(endTurnButton);
  
  // 创建消息区域
  const messageArea = document.createElement('div');
  messageArea.id = 'message-area';
  messageArea.style.position = 'absolute';
  messageArea.style.top = '50%';
  messageArea.style.left = '50%';
  messageArea.style.transform = 'translate(-50%, -50%)';
  messageArea.style.padding = '20px';
  messageArea.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
  messageArea.style.color = 'white';
  messageArea.style.borderRadius = '10px';
  messageArea.style.fontSize = '24px';
  messageArea.style.fontWeight = 'bold';
  messageArea.style.textAlign = 'center';
  messageArea.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.3)';
  messageArea.style.display = 'none';
  gameContainer.appendChild(messageArea);
  
  // 创建牌库UI（右侧）
  createDeckUI(gameContainer, gameState);
  
  // 创建弃牌堆UI（左侧）
  createDiscardPileUI(gameContainer, gameState);
  
  // 初始化UI状态
  updateUI(gameState);
}

/**
 * 更新游戏UI显示
 * @param gameState 当前游戏状态
 */
export function updateUI(gameState: GameState): void {
  // 更新玩家信息
  updatePlayerInfo(gameState);
  
  // 更新敌人信息
  updateEnemyInfo(gameState);
  
  // 更新手牌区域
  updateHandCards(gameState);
  
  // 更新牌库和弃牌堆UI
  updateDeckUI(gameState);
  updateDiscardPileUI(gameState);
}

/**
 * 显示游戏消息
 * @param message 要显示的消息
 */
export function showMessage(message: string): void {
  const messageArea = document.getElementById('message-area');
  if (messageArea) {
    messageArea.textContent = message;
    messageArea.style.opacity = '1';
    
    // 3秒后消息淡出
    setTimeout(() => {
      messageArea.style.opacity = '0';
    }, 3000);
  }
}

/**
 * 创建玩家信息面板
 */
function createPlayerPanel(container: HTMLElement, gameState: GameState): void {
  const playerPanel = document.createElement('div');
  playerPanel.id = 'player-panel';
  playerPanel.style.position = 'absolute';
  playerPanel.style.bottom = '10px';
  playerPanel.style.left = '10px';
  playerPanel.style.padding = '10px';
  playerPanel.style.backgroundColor = 'rgba(0, 0, 100, 0.7)';
  playerPanel.style.color = 'white';
  playerPanel.style.borderRadius = '5px';
  playerPanel.style.pointerEvents = 'none';
  
  // 生命值
  const healthBar = document.createElement('div');
  healthBar.id = 'player-health';
  healthBar.style.marginBottom = '5px';
  
  // 法力值
  const manaBar = document.createElement('div');
  manaBar.id = 'player-mana';
  manaBar.style.marginBottom = '5px';
  
  // 牌库信息
  const deckInfo = document.createElement('div');
  deckInfo.id = 'player-deck';
  
  playerPanel.appendChild(healthBar);
  playerPanel.appendChild(manaBar);
  playerPanel.appendChild(deckInfo);
  container.appendChild(playerPanel);
}

/**
 * 创建敌人信息面板
 */
function createEnemyPanel(container: HTMLElement, gameState: GameState): void {
  const enemyPanel = document.createElement('div');
  enemyPanel.id = 'enemy-panel';
  enemyPanel.style.position = 'absolute';
  enemyPanel.style.top = '10px';
  enemyPanel.style.right = '10px';
  enemyPanel.style.padding = '10px';
  enemyPanel.style.backgroundColor = 'rgba(100, 0, 0, 0.7)';
  enemyPanel.style.color = 'white';
  enemyPanel.style.borderRadius = '5px';
  enemyPanel.style.pointerEvents = 'none';
  
  // 敌人生命值
  const healthBar = document.createElement('div');
  healthBar.id = 'enemy-health';
  
  enemyPanel.appendChild(healthBar);
  container.appendChild(enemyPanel);
}

/**
 * 创建手牌区域
 */
function createHandArea(container: HTMLElement, gameState: GameState, onCardClick: (index: number) => void): void {
  const handArea = document.createElement('div');
  handArea.id = 'hand-area';
  handArea.style.position = 'absolute';
  handArea.style.bottom = '100px';
  handArea.style.left = '50%';
  handArea.style.transform = 'translateX(-50%)';
  handArea.style.display = 'flex';
  handArea.style.gap = '10px';
  handArea.style.pointerEvents = 'auto';
  
  container.appendChild(handArea);
}

/**
 * 创建牌库UI（右侧）
 */
function createDeckUI(container: HTMLElement, gameState: GameState): void {
  const deckUI = document.createElement('div');
  deckUI.id = 'deck-ui';
  deckUI.style.position = 'absolute';
  deckUI.style.top = '50%';
  deckUI.style.right = '30px';
  deckUI.style.transform = 'translateY(-50%)';
  deckUI.style.width = '130px';
  deckUI.style.height = '180px';
  deckUI.style.backgroundColor = 'rgba(25, 40, 80, 0.9)';
  deckUI.style.borderRadius = '12px';
  deckUI.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.6), 0 0 20px rgba(50, 100, 200, 0.4)';
  deckUI.style.display = 'flex';
  deckUI.style.flexDirection = 'column';
  deckUI.style.alignItems = 'center';
  deckUI.style.justifyContent = 'center';
  deckUI.style.color = 'white';
  deckUI.style.border = '3px solid rgba(80, 120, 220, 0.8)';
  deckUI.style.pointerEvents = 'none';
  deckUI.style.zIndex = '100';
  
  // 牌库图标
  const deckIcon = document.createElement('div');
  deckIcon.style.width = '100px';
  deckIcon.style.height = '120px';
  deckIcon.style.marginBottom = '15px';
  deckIcon.style.background = 'linear-gradient(135deg, #0f2027, #203a43, #2c5364)';
  deckIcon.style.borderRadius = '8px';
  deckIcon.style.display = 'flex';
  deckIcon.style.alignItems = 'center';
  deckIcon.style.justifyContent = 'center';
  deckIcon.style.fontSize = '24px';
  deckIcon.style.fontWeight = 'bold';
  deckIcon.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.5)';
  deckIcon.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.5)';
  deckIcon.textContent = '牌库';
  
  // 牌库数量
  const deckCount = document.createElement('div');
  deckCount.id = 'deck-count';
  deckCount.style.fontSize = '18px';
  deckCount.style.fontWeight = 'bold';
  deckCount.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.5)';
  deckCount.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
  deckCount.style.padding = '5px 10px';
  deckCount.style.borderRadius = '15px';
  
  deckUI.appendChild(deckIcon);
  deckUI.appendChild(deckCount);
  container.appendChild(deckUI);
}

/**
 * 创建弃牌堆UI（左侧）
 */
function createDiscardPileUI(container: HTMLElement, gameState: GameState): void {
  const discardUI = document.createElement('div');
  discardUI.id = 'discard-ui';
  discardUI.style.position = 'absolute';
  discardUI.style.top = '50%';
  discardUI.style.left = '30px';
  discardUI.style.transform = 'translateY(-50%)';
  discardUI.style.width = '130px';
  discardUI.style.height = '180px';
  discardUI.style.backgroundColor = 'rgba(80, 30, 30, 0.9)';
  discardUI.style.borderRadius = '12px';
  discardUI.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.6), 0 0 20px rgba(200, 50, 50, 0.4)';
  discardUI.style.display = 'flex';
  discardUI.style.flexDirection = 'column';
  discardUI.style.alignItems = 'center';
  discardUI.style.justifyContent = 'center';
  discardUI.style.color = 'white';
  discardUI.style.border = '3px solid rgba(180, 60, 60, 0.8)';
  discardUI.style.pointerEvents = 'none';
  discardUI.style.zIndex = '100';
  
  // 弃牌堆图标
  const discardIcon = document.createElement('div');
  discardIcon.style.width = '100px';
  discardIcon.style.height = '120px';
  discardIcon.style.marginBottom = '15px';
  discardIcon.style.background = 'linear-gradient(135deg, #4A0E0E, #7A1010, #A52A2A)';
  discardIcon.style.borderRadius = '8px';
  discardIcon.style.display = 'flex';
  discardIcon.style.alignItems = 'center';
  discardIcon.style.justifyContent = 'center';
  discardIcon.style.fontSize = '24px';
  discardIcon.style.fontWeight = 'bold';
  discardIcon.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.5)';
  discardIcon.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.5)';
  discardIcon.textContent = '弃牌堆';
  
  // 弃牌数量
  const discardCount = document.createElement('div');
  discardCount.id = 'discard-count';
  discardCount.style.fontSize = '18px';
  discardCount.style.fontWeight = 'bold';
  discardCount.style.textShadow = '0 2px 4px rgba(0, 0, 0, 0.5)';
  discardCount.style.backgroundColor = 'rgba(0, 0, 0, 0.4)';
  discardCount.style.padding = '5px 10px';
  discardCount.style.borderRadius = '15px';
  
  discardUI.appendChild(discardIcon);
  discardUI.appendChild(discardCount);
  container.appendChild(discardUI);
}

/**
 * 更新牌库UI
 */
function updateDeckUI(gameState: GameState): void {
  const deckCount = document.getElementById('deck-count');
  if (deckCount) {
    deckCount.textContent = `剩余: ${gameState.player.deck}张`;
    
    // 根据牌库剩余数量改变颜色
    if (gameState.player.deck <= 5) {
      deckCount.style.color = '#ff6b6b'; // 牌库少时显示红色
    } else if (gameState.player.deck <= 10) {
      deckCount.style.color = '#feca57'; // 牌库中等时显示黄色
    } else {
      deckCount.style.color = 'white'; // 牌库充足时显示白色
    }
  }
}

/**
 * 更新弃牌堆UI
 */
function updateDiscardPileUI(gameState: GameState): void {
  const discardCount = document.getElementById('discard-count');
  if (discardCount) {
    // 确保弃牌堆属性存在，如果不存在则默认为0
    const discardAmount = gameState.player.discard !== undefined ? gameState.player.discard : 0;
    discardCount.textContent = `数量: ${discardAmount}张`;
    
    // 根据弃牌堆数量改变颜色
    if (discardAmount >= 15) {
      discardCount.style.color = '#ff6b6b'; // 弃牌多时显示红色
    } else if (discardAmount >= 8) {
      discardCount.style.color = '#feca57'; // 弃牌适中时显示黄色
    } else {
      discardCount.style.color = 'white'; // 弃牌少时显示白色
    }
  }
}

/**
 * 更新玩家信息显示
 */
function updatePlayerInfo(gameState: GameState): void {
  const healthBar = document.getElementById('player-health');
  if (healthBar) {
    healthBar.textContent = `生命: ${gameState.player.health}/${gameState.player.maxHealth}`;
  }
  
  const manaBar = document.getElementById('player-mana');
  if (manaBar) {
    manaBar.textContent = `法力: ${gameState.player.mana}/${gameState.player.maxMana}`;
  }
  
  const deckInfo = document.getElementById('player-deck');
  if (deckInfo) {
    deckInfo.textContent = `牌库: ${gameState.player.deck}/30`;
  }
}

/**
 * 更新敌人信息显示
 */
function updateEnemyInfo(gameState: GameState): void {
  const healthBar = document.getElementById('enemy-health');
  if (healthBar) {
    healthBar.textContent = `敌人生命: ${gameState.enemy.health}/${gameState.enemy.maxHealth}`;
  }
}

/**
 * 更新手牌区域
 */
function updateHandCards(gameState: GameState): void {
  const handArea = document.getElementById('hand-area');
  if (!handArea) return;
  
  // 清空现有手牌
  handArea.innerHTML = '';
  
  // 为每张手牌创建DOM元素
  gameState.player.hand.forEach((card, index) => {
    const cardElement = document.createElement('div');
    cardElement.className = 'card';
    cardElement.style.width = '120px';
    cardElement.style.height = '180px';
    cardElement.style.backgroundColor = getCardColor(card);
    cardElement.style.borderRadius = '10px';
    cardElement.style.padding = '10px';
    cardElement.style.boxSizing = 'border-box';
    cardElement.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.3)';
    cardElement.style.color = 'white';
    cardElement.style.display = 'flex';
    cardElement.style.flexDirection = 'column';
    cardElement.style.cursor = 'pointer';
    cardElement.style.transition = 'transform 0.2s';
    cardElement.style.position = 'relative';
    
    // 鼠标悬停效果
    cardElement.addEventListener('mouseover', () => {
      cardElement.style.transform = 'translateY(-20px) scale(1.1)';
      cardElement.style.zIndex = '5';
    });
    
    cardElement.addEventListener('mouseout', () => {
      cardElement.style.transform = 'translateY(0) scale(1)';
      cardElement.style.zIndex = '1';
    });
    
    // 卡牌名称
    const cardName = document.createElement('div');
    cardName.style.fontWeight = 'bold';
    cardName.style.marginBottom = '5px';
    cardName.style.fontSize = '14px';
    cardName.textContent = card.name;
    
    // 卡牌费用
    const cardCost = document.createElement('div');
    cardCost.style.position = 'absolute';
    cardCost.style.top = '5px';
    cardCost.style.right = '5px';
    cardCost.style.width = '25px';
    cardCost.style.height = '25px';
    cardCost.style.borderRadius = '50%';
    cardCost.style.backgroundColor = '#4169E1';
    cardCost.style.display = 'flex';
    cardCost.style.justifyContent = 'center';
    cardCost.style.alignItems = 'center';
    cardCost.style.fontWeight = 'bold';
    cardCost.textContent = card.cost.toString();
    
    // 卡牌描述
    const cardDesc = document.createElement('div');
    cardDesc.style.fontSize = '12px';
    cardDesc.style.marginTop = 'auto';
    cardDesc.textContent = card.description;
    
    // 添加属性（如果是单位卡）
    if (card.type === 'unit' && card.hp !== undefined && card.atk !== undefined) {
      const cardStats = document.createElement('div');
      cardStats.style.marginTop = '5px';
      cardStats.style.fontWeight = 'bold';
      cardStats.textContent = `${card.atk}/${card.hp}`;
      cardElement.appendChild(cardStats);
    }
    
    // 点击事件
    cardElement.addEventListener('click', () => {
      if (gameState.player.mana >= card.cost) {
        // 触发卡牌点击回调
        callbacks.cardClick(index);
      } else {
        showMessage('法力不足!');
      }
    });
    
    cardElement.appendChild(cardName);
    cardElement.appendChild(cardCost);
    cardElement.appendChild(cardDesc);
    
    handArea.appendChild(cardElement);
  });
}

/**
 * 获取卡牌背景颜色
 */
function getCardColor(card: Card): string {
  switch(card.type) {
    case 'unit':
      return 'linear-gradient(135deg, #3a6186, #89253e)';
    case 'spell':
      return 'linear-gradient(135deg, #904e95, #3f51b5)';
    case 'buff':
      return 'linear-gradient(135deg, #76b852, #8DC26F)';
    default:
      return 'linear-gradient(135deg, #485563, #29323c)';
  }
} 