import * as UI from './ui';
import { GameState } from './ui';

// 游戏引擎接口
interface GameEngine {
  endTurn: () => void;
  updateUI: () => void;
  showMessage: (message: string) => void;
  onCardClick: (index: number) => void;
}

// 全局类型已在 src/global/types.d.ts 中定义

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
  // 创建游戏状态
  const gameState: GameState = {
    player: {
      health: 100,
      maxHealth: 100,
      mana: 3,
      maxMana: 3,
      deck: 20,
      discard: 0,
      hand: [
        { id: 'card1', name: '火球术', type: 'spell', cost: 2, description: '造成5点伤害' },
        { id: 'card2', name: '战士', type: 'unit', cost: 3, description: '召唤一个战士单位', hp: 4, atk: 3 },
        { id: 'card3', name: '治疗术', type: 'spell', cost: 1, description: '恢复3点生命值' }
      ]
    },
    enemy: {
      health: 100,
      maxHealth: 100
    },
    battle: {
      currentTurn: 1,
      activePlayer: 'player'
    }
  };

  // 创建游戏引擎实例
  const localGameEngine: GameEngine = {
    endTurn: () => {
      gameState.battle.currentTurn++;
      gameState.battle.activePlayer = gameState.battle.activePlayer === 'player' ? 'enemy' : 'player';
      localGameEngine.updateUI();
    },
    updateUI: () => {
      UI.updateUI(gameState);
    },
    showMessage: (message: string) => {
      UI.showMessage(message);
    },
    onCardClick: (index: number) => {
      const card = gameState.player.hand[index];
      if (card) {
        if (gameState.player.mana >= card.cost) {
          console.log(`使用卡牌: ${card.name}`);
          gameState.player.mana -= card.cost;
          UI.showMessage(`使用了卡牌: ${card.name}`);
          localGameEngine.updateUI();
        } else {
          UI.showMessage("法力不足!");
        }
      }
    }
  };

  // 将局部对象赋值给全局变量
  (window as any).gameEngine = localGameEngine;

  // 初始化UI
  UI.initUI(gameState, {
    endTurn: localGameEngine.endTurn,
    cardClick: localGameEngine.onCardClick
  });
  
  // 初始化后立即更新UI显示
  localGameEngine.updateUI();
});