/**
 * 敌方角色类型定义
 */

export interface Enemy {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  row: number;
  col: number;
  number: number;  // 对应的数独数字
  image: string;
  isAlive: boolean;
}

/**
 * 敌方角色模板定义
 */
export interface EnemyTemplate {
  name: string;
  hp: number;
  attack: number;
  defense: number;
  image: string;
}

/**
 * 敌方角色模板库
 */
export const enemyTemplates: { [key: string]: EnemyTemplate } = {
  DEMON: {
    name: '恶魔战士',
    hp: 10,
    attack: 3,
    defense: 1,
    image: 'assets/images/enemies/demon.png'
  },
  SKELETON: {
    name: '骷髅兵',
    hp: 8,
    attack: 2,
    defense: 0,
    image: 'assets/images/enemies/skeleton.png'
  },
  GHOST: {
    name: '幽灵',
    hp: 6,
    attack: 4,
    defense: 0,
    image: 'assets/images/enemies/ghost.png'
  },
  DRAGON: {
    name: '小龙',
    hp: 15,
    attack: 5,
    defense: 2,
    image: 'assets/images/enemies/dragon.png'
  },
  ORC: {
    name: '兽人',
    hp: 12,
    attack: 3,
    defense: 2,
    image: 'assets/images/enemies/orc.png'
  }
};

/**
 * 生成唯一ID
 */
export const generateId = (): string => {
  return `enemy_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 创建敌方角色
 */
export const createEnemy = (type: string, row: number, col: number, number: number): Enemy => {
  const template = enemyTemplates[type];
  
  if (!template) {
    throw new Error(`Enemy template ${type} not found`);
  }
  
  return {
    id: generateId(),
    name: template.name,
    hp: template.hp,
    maxHp: template.hp,
    attack: template.attack,
    defense: template.defense,
    row,
    col,
    number,
    image: template.image,
    isAlive: true
  };
}; 