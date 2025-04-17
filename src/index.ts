import Phaser from 'phaser';
import { MainMenuScene } from './scenes/MainMenuScene';
import { BattleScene } from './scenes/BattleScene';
import { SudokuBattleScene } from './scenes/SudokuBattleScene';
import { CardSelectionScene } from './scenes/CardSelectionScene';
import { LoadingScene } from './scenes/LoadingScene';
import { ShopScene } from './scenes/ShopScene';
import { SudokuScene } from './scenes/SudokuScene';
import * as UI from './ui';
import { GameState, Card } from './ui';

// 游戏引擎接口 (本地定义，可选)
interface GameEngine {
  endTurn: () => void;
  updateUI: () => void;
  showMessage: (message: string) => void;
  onCardClick: (index: number) => void;
}

// 全局类型已在 src/global/types.d.ts 中定义

// 游戏配置
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game',
  scene: [
    LoadingScene, 
    MainMenuScene, 
    BattleScene, 
    SudokuBattleScene, 
    SudokuScene,
    CardSelectionScene, 
    ShopScene
  ],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  }
};

// 创建游戏实例并初始化DOM UI
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

  // 创建游戏实例
  const game = new Phaser.Game(config);

  // 创建一个局部 gameEngine 对象
  const localGameEngine: GameEngine = {
    endTurn: () => {
      gameState.battle.currentTurn++;
      gameState.battle.activePlayer = gameState.battle.activePlayer === 'player' ? 'enemy' : 'player';
      localGameEngine.updateUI(); // 使用局部引用
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
          localGameEngine.updateUI(); // 使用局部引用
        } else {
          UI.showMessage("法力不足!");
        }
      }
    }
  };

  // 将局部对象赋值给全局变量（使用类型断言避免TS错误）
  (window as any).gameEngine = localGameEngine;

  // 初始化UI，确保传递的是已定义的函数
  UI.initUI(gameState, {
    endTurn: localGameEngine.endTurn,
    cardClick: localGameEngine.onCardClick
  });
  
  // 初始化后立即更新UI显示
  localGameEngine.updateUI(); // 使用局部引用
});