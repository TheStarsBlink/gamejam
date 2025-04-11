/**
 * 卡牌类
 */
class Card {
    /**
     * 创建卡牌
     * @param {string} suit - 花色: 'hearts'(红桃), 'diamonds'(方片), 'clubs'(梅花), 'spades'(黑桃)
     * @param {number} value - 卡牌数值
     * @param {boolean} isSpecial - 是否为特殊卡
     */
    constructor(suit, value, isSpecial = false) {
        this.suit = suit;
        this.value = value;
        this.isSpecial = isSpecial;
        
        // 设置卡牌类型和效果描述
        switch (suit) {
            case 'hearts': // 红桃 - 慈善卡
                this.type = '慈善卡';
                this.moneyEffect = -Math.floor(value / 2);
                this.happinessEffect = value;
                this.description = `花费${Math.abs(this.moneyEffect)}资金，获得${this.happinessEffect}幸福`;
                this.specialEffectDesc = isSpecial ? '下张卡效果翻倍' : '';
                break;
            
            case 'diamonds': // 方片 - 建设卡
                this.type = '建设卡';
                this.moneyEffect = -value;
                this.happinessEffect = value;
                this.description = `花费${Math.abs(this.moneyEffect)}资金，获得${this.happinessEffect}幸福`;
                this.specialEffectDesc = isSpecial ? '下两张卡资金消耗无效' : '';
                break;
            
            case 'clubs': // 梅花 - 收集卡
                this.type = '收集卡';
                this.moneyEffect = Math.floor(value / 2);
                this.happinessEffect = -value;
                this.description = `获得${this.moneyEffect}资金，失去${Math.abs(this.happinessEffect)}幸福`;
                this.specialEffectDesc = '';
                break;
            
            case 'spades': // 黑桃 - 投资卡
                this.type = '投资卡';
                this.moneyEffect = value;
                this.happinessEffect = -value;
                this.description = `获得${this.moneyEffect}资金，失去${Math.abs(this.happinessEffect)}幸福`;
                this.specialEffectDesc = '';
                break;
        }
    }

    /**
     * 获取卡牌的HTML表示
     * @returns {string} 卡牌HTML
     */
    getHTML() {
        const suitSymbols = {
            'hearts': '♥',
            'diamonds': '♦',
            'clubs': '♣',
            'spades': '♠'
        };

        return `
            <div class="card card-${this.suit}" data-card-id="${this.id}">
                <div class="card-header">
                    <div class="card-value">${this.value}</div>
                    <div class="card-suit">${suitSymbols[this.suit]}</div>
                </div>
                <div class="card-type">${this.type}</div>
                <div class="card-description">${this.description}</div>
                ${this.isSpecial ? `<div class="card-effect">特</div>` : ''}
                ${this.specialEffectDesc ? `<div class="card-special-effect">${this.specialEffectDesc}</div>` : ''}
            </div>
        `;
    }

    /**
     * 计算卡牌效果（考虑特殊效果和事件）
     * @param {Object} gameState - 游戏状态
     * @returns {Object} 包含资金和幸福变化的对象
     */
    calculateEffects(gameState) {
        let moneyChange = this.moneyEffect;
        let happinessChange = this.happinessEffect;
        
        // 考虑特殊效果1：翻倍
        if (gameState.activeEffect.type === 'effect1') {
            moneyChange *= 2;
            happinessChange *= 2;
            // 使用后清除
            gameState.activeEffect.type = null;
            gameState.activeEffect.remaining = 0;
        }
        
        // 考虑特殊效果2：资金消耗无效
        if (gameState.activeEffect.type === 'effect2' && moneyChange < 0) {
            moneyChange = 0; // 资金消耗无效
            gameState.activeEffect.remaining -= 1;
            if (gameState.activeEffect.remaining <= 0) {
                gameState.activeEffect.type = null;
            }
        }
        
        // 考虑事件：金融危机
        if (gameState.eventStatus.isCrisis && this.suit === 'spades') {
            moneyChange = Math.floor(moneyChange / 2); // 黑桃收益减半
        }
        
        return {
            moneyChange: moneyChange,
            happinessChange: happinessChange
        };
    }

    /**
     * 应用卡牌的特殊效果（如果有）
     * @param {Object} gameState - 游戏状态
     */
    applySpecialEffect(gameState) {
        if (!this.isSpecial) return;
        
        if (this.suit === 'hearts') {
            // 红桃特殊卡：下一张卡效果翻倍
            gameState.activeEffect.type = 'effect1';
            gameState.activeEffect.remaining = 1;
        } else if (this.suit === 'diamonds') {
            // 方片特殊卡：下两张卡资金消耗无效
            gameState.activeEffect.type = 'effect2';
            gameState.activeEffect.remaining = 2;
        }
    }
}

/**
 * 创建初始牌堆（24张牌）
 * @returns {Array} 包含24张卡牌的数组
 */
function createDeck() {
    const deck = [];
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    let id = 1;
    
    suits.forEach(suit => {
        // 每种花色5张普通牌
        for (let i = 0; i < 5; i++) {
            // 普通牌数值范围 5-15
            const value = Math.floor(Math.random() * 11) + 5;
            const card = new Card(suit, value);
            card.id = id++;
            deck.push(card);
        }
        
        // 红桃和方片各1张特殊牌
        if (suit === 'hearts' || suit === 'diamonds') {
            const specialValue = Math.floor(Math.random() * 6) + 10; // 特殊卡数值 10-15
            const specialCard = new Card(suit, specialValue, true);
            specialCard.id = id++;
            deck.push(specialCard);
        }
    });
    
    return deck;
}

/**
 * Fisher-Yates 洗牌算法
 * @param {Array} deck - 牌堆
 * @returns {Array} 洗牌后的牌堆
 */
function shuffleDeck(deck) {
    const newDeck = [...deck];
    for (let i = newDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
} 