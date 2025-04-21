/**
 * DeckManager 类 - 牌库管理器
 * 
 * 负责管理玩家的牌库、手牌和弃牌堆，提供抽牌、洗牌、弃牌等功能。
 */

import { Card } from './Card';
import { EventSystem } from './events/EventSystem';

export class DeckManager {
  private _deck: Card[] = [];      // 牌库
  private _hand: Card[] = [];      // 手牌
  private _discardPile: Card[] = []; // 弃牌堆
  private _eventSystem: EventSystem;
  
  constructor(eventSystem: EventSystem) {
    this._eventSystem = eventSystem;
  }
  
  /**
   * 初始化牌库，从牌库数据中加载初始牌库
   */
  public initializeDeck(): void {
    // 清空现有卡牌
    this._deck = [];
    this._hand = [];
    this._discardPile = [];
    
    // 这里应该从卡牌数据库中加载初始牌库
    // 暂时使用空数组，实际实现时需要替换
    
    // 洗牌
    this.shuffleDeck();
    
    // 触发牌库初始化事件
    this._eventSystem.emit('deck_initialized', { 
      deckSize: this._deck.length 
    });
  }
  
  /**
   * 洗牌，将牌库随机打乱
   */
  public shuffleDeck(): void {
    // Fisher-Yates 洗牌算法
    for (let i = this._deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this._deck[i], this._deck[j]] = [this._deck[j], this._deck[i]];
    }
    
    // 触发洗牌事件
    this._eventSystem.emit('deck_shuffled', { 
      deckSize: this._deck.length 
    });
  }
  
  /**
   * 抽取指定数量的牌
   * @param count 要抽取的牌数量
   * @returns 实际抽到的牌数量
   */
  public drawCards(count: number): number {
    let drawnCount = 0;
    
    for (let i = 0; i < count; i++) {
      if (this._deck.length === 0) {
        // 牌库已空，将弃牌堆洗入牌库
        if (this._discardPile.length === 0) {
          // 如果弃牌堆也是空的，无法继续抽牌
          break;
        }
        
        this.reshuffleDiscardPile();
      }
      
      // 从牌库顶部抽一张牌
      const card = this._deck.pop();
      if (card) {
        this._hand.push(card);
        drawnCount++;
        
        // 触发抽牌事件
        this._eventSystem.emit('card_drawn', { 
          card, 
          handSize: this._hand.length,
          deckSize: this._deck.length
        });
      }
    }
    
    return drawnCount;
  }
  
  /**
   * 将弃牌堆洗入牌库
   */
  private reshuffleDiscardPile(): void {
    // 将所有弃牌移到牌库
    this._deck = [...this._discardPile];
    this._discardPile = [];
    
    // 洗牌
    this.shuffleDeck();
    
    // 触发弃牌堆洗入事件
    this._eventSystem.emit('discard_pile_reshuffled', {
      deckSize: this._deck.length,
      discardPileSize: 0
    });
  }
  
  /**
   * 弃掉手牌中的特定卡牌
   * @param cardIndex 要弃掉的手牌索引
   * @returns 是否成功弃牌
   */
  public discardCard(cardIndex: number): boolean {
    if (cardIndex < 0 || cardIndex >= this._hand.length) {
      return false;
    }
    
    // 从手牌中移除卡牌并加入弃牌堆
    const card = this._hand.splice(cardIndex, 1)[0];
    this._discardPile.push(card);
    
    // 触发弃牌事件
    this._eventSystem.emit('card_discarded', {
      card,
      handSize: this._hand.length,
      discardPileSize: this._discardPile.length
    });
    
    return true;
  }
  
  /**
   * 将所有手牌弃掉
   * @returns 弃掉的卡牌数量
   */
  public discardHand(): number {
    const count = this._hand.length;
    
    // 将所有手牌加入弃牌堆
    this._discardPile.push(...this._hand);
    this._hand = [];
    
    // 如果有卡牌被弃掉，触发事件
    if (count > 0) {
      this._eventSystem.emit('hand_discarded', {
        count,
        discardPileSize: this._discardPile.length
      });
    }
    
    return count;
  }
  
  /**
   * 从牌库中添加一张卡牌
   * @param card 要添加的卡牌
   * @param position 'top' 添加到牌库顶部, 'bottom' 添加到牌库底部, 'random' 随机位置
   */
  public addCardToDeck(card: Card, position: 'top' | 'bottom' | 'random' = 'top'): void {
    switch (position) {
      case 'top':
        this._deck.push(card);
        break;
      case 'bottom':
        this._deck.unshift(card);
        break;
      case 'random':
        const index = Math.floor(Math.random() * (this._deck.length + 1));
        this._deck.splice(index, 0, card);
        break;
    }
    
    // 触发添加卡牌事件
    this._eventSystem.emit('card_added_to_deck', {
      card,
      position,
      deckSize: this._deck.length
    });
  }
  
  /**
   * 从弃牌堆中移回一张卡
   * @param cardIndex 弃牌堆中的卡牌索引
   * @param destination 目标位置：'hand' 加入手牌, 'deck' 加入牌库顶部
   * @returns 是否成功
   */
  public recoverCard(cardIndex: number, destination: 'hand' | 'deck' = 'hand'): boolean {
    if (cardIndex < 0 || cardIndex >= this._discardPile.length) {
      return false;
    }
    
    // 从弃牌堆中移除卡牌
    const card = this._discardPile.splice(cardIndex, 1)[0];
    
    // 根据目标位置处理
    if (destination === 'hand') {
      this._hand.push(card);
    } else {
      this._deck.push(card);
    }
    
    // 触发回收卡牌事件
    this._eventSystem.emit('card_recovered', {
      card,
      destination,
      handSize: this._hand.length,
      deckSize: this._deck.length,
      discardPileSize: this._discardPile.length
    });
    
    return true;
  }
  
  /**
   * 向手牌中添加一张卡牌
   * @param card 要添加的卡牌
   */
  public addCardToHand(card: Card): void {
    this._hand.push(card);
    
    // 触发添加卡牌事件
    this._eventSystem.emit('card_added_to_hand', {
      card,
      handSize: this._hand.length
    });
  }
  
  // Getters
  get deck(): Card[] { return this._deck; }
  get hand(): Card[] { return this._hand; }
  get discardPile(): Card[] { return this._discardPile; }
  
  // 状态查询
  get deckSize(): number { return this._deck.length; }
  get handSize(): number { return this._hand.length; }
  get discardPileSize(): number { return this._discardPile.length; }
  get isEmpty(): boolean { return this._deck.length === 0 && this._discardPile.length === 0; }
} 