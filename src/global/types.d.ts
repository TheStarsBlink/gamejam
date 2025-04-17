/**
 * 全局类型定义
 */
declare global {
  interface Window {
    gameEngine?: {
      // 来自 src/store/combinedGameStore.ts (SudokuGameStore) 的属性
      gameState?: any; // 可能需要更具体的类型
      updateGameState?: (state: any) => void; // 可能需要更具体的类型
      
      // 来自 src/index.ts 的属性
      endTurn?: () => void;
      updateUI?: () => void;
      showMessage?: (message: string) => void;
      onCardClick?: (index: number) => void;
    };
  }
}

// 这个空导出确保这个文件被视为模块而不是全局脚本
export {}; 