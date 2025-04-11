/**
 * 卡牌类
 */
class Card {
    /**
     * 创建卡牌
     * @param {string} suit - 花色: 'hearts'(红桃), 'diamonds'(方片), 'clubs'(梅花), 'spades'(黑桃)
     * @param {number|string} value - 卡牌数值或点数
     * @param {number} specialType - 特殊卡类型: 0(普通卡), 1-4(特殊卡)
     */
    constructor(suit, value, specialType = 0) {
        this.suit = suit;
        this.value = value;
        this.isSpecial = specialType > 0;
        this.specialType = specialType;
        
        // 将字母牌转换为数值
        let numericValue = this.value;
        if (typeof this.value === 'string') {
            switch(this.value) {
                case 'J': numericValue = 11; break;
                case 'Q': numericValue = 12; break;
                case 'K': numericValue = 13; break;
                case 'A': numericValue = 14; break;
                default: numericValue = parseInt(this.value);
            }
        }
        
        // 设置卡牌类型和效果描述
        switch (suit) {
            case 'hearts': // 红桃 - 慈善卡
                this.type = '慈善卡';
                this.moneyEffect = -Math.floor(numericValue / 2);
                this.happinessEffect = numericValue;
                this.description = `花费${Math.abs(this.moneyEffect)}资金，获得${this.happinessEffect}幸福`;
                break;
            
            case 'diamonds': // 方片 - 建设卡
                this.type = '建设卡';
                this.moneyEffect = -numericValue;
                this.happinessEffect = numericValue;
                this.description = `花费${Math.abs(this.moneyEffect)}资金，获得${this.happinessEffect}幸福`;
                break;
            
            case 'clubs': // 梅花 - 收集卡
                this.type = '收集卡';
                this.moneyEffect = Math.floor(numericValue / 2);
                this.happinessEffect = -numericValue;
                this.description = `获得${this.moneyEffect}资金，失去${Math.abs(this.happinessEffect)}幸福`;
                break;
            
            case 'spades': // 黑桃 - 投资卡
                this.type = '投资卡';
                this.moneyEffect = numericValue;
                this.happinessEffect = -numericValue;
                this.description = `获得${this.moneyEffect}资金，失去${Math.abs(this.happinessEffect)}幸福`;
                break;
        }
        
        // 设置特殊卡效果描述
        if (this.isSpecial) {
            switch (specialType) {
                case 1:
                    this.specialEffectDesc = '下一张卡效果翻倍';
                    break;
                case 2:
                    this.specialEffectDesc = '下两张卡资金消耗无效';
                    break;
                case 3:
                    this.specialEffectDesc = '下两张卡幸福减少无效';
                    break;
                case 4:
                    this.specialEffectDesc = '额外抽2张增加资金的卡';
                    break;
                default:
                    this.specialEffectDesc = '';
            }
        } else {
            this.specialEffectDesc = '';
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
            <div class="card card-${this.suit}" data-card-id="${this.id}" draggable="true">
                <div class="card-header">
                    <div class="card-value">${this.value}</div>
                    <div class="card-suit">${suitSymbols[this.suit]}</div>
                </div>
                <div class="card-type">${this.type}</div>
                <div class="card-description">${this.description}</div>
                ${this.isSpecial ? `<div class="card-effect">特${this.specialType}</div>` : ''}
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
        
        // 考虑特殊效果3：幸福减少无效
        if (gameState.activeEffect.type === 'effect3' && happinessChange < 0) {
            happinessChange = 0; // 幸福减少无效
            gameState.activeEffect.remaining -= 1;
            if (gameState.activeEffect.remaining <= 0) {
                gameState.activeEffect.type = null;
            }
        }
        
        // 考虑事件：金融危机
        if (gameState.eventStatus.isCrisis && this.suit === 'spades') {
            moneyChange = Math.floor(moneyChange / 2); // 黑桃收益减半
        }
        
        // 考虑事件：消费低迷
        if (gameState.eventStatus.isConsumerDepression && happinessChange > 0) {
            happinessChange = Math.floor(happinessChange / 2); // 幸福增加减半
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
        
        switch (this.specialType) {
            case 1:
                // 红桃特殊卡：下一张卡效果翻倍
                gameState.activeEffect.type = 'effect1';
                gameState.activeEffect.remaining = 1;
                break;
            case 2:
                // 方片特殊卡：下两张卡资金消耗无效
                gameState.activeEffect.type = 'effect2';
                gameState.activeEffect.remaining = 2;
                break;
            case 3:
                // 特殊卡3：下两张卡幸福减少无效
                gameState.activeEffect.type = 'effect3';
                gameState.activeEffect.remaining = 2;
                break;
            case 4:
                // 特殊卡4：额外抽2张增加资金的卡
                gameState.drawSpecificCards(2, card => card.moneyEffect > 0);
                break;
        }
    }
}

/**
 * 创建标准52张牌的牌堆
 * @returns {Array} 包含52张卡牌的数组
 */
function createDeck() {
    const deck = [];
    const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
    const values = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
    let id = 1;
    
    suits.forEach(suit => {
        values.forEach(value => {
            // 决定是否为特殊卡
            let specialType = 0;
            
            // 根据不同花色和点数添加特殊卡
            if (suit === 'hearts' && value === 'K') {
                specialType = 1; // 红桃K：特殊卡1
            } else if (suit === 'diamonds' && value === 'K') {
                specialType = 2; // 方片K：特殊卡2
            } else if (suit === 'clubs' && value === 'K') {
                specialType = 3; // 梅花K：特殊卡3 
            } else if (suit === 'spades' && value === 'K') {
                specialType = 4; // 黑桃K：特殊卡4
            }
            
            const card = new Card(suit, value, specialType);
            card.id = id++;
            deck.push(card);
        });
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