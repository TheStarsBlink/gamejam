// 为了保持兼容性，重新导出combinedGameStore中的内容
import { useSudokuGameStore } from './combinedGameStore';
export * from './combinedGameStore';

// 为兼容现有代码，导出useSudokuGameStore作为useGameStore
export const useGameStore = useSudokuGameStore; 