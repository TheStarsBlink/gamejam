 # 项目文件结构说明

本文档总结了项目中主要文件的用途。

## 现有文件结构

*   **`src/store/gameStore.ts`**: 核心游戏状态管理 (Pinia store)。管理回合、阶段、玩家/敌人状态、卡牌（牌库、手牌、弃牌堆）、棋盘、单位等。包含核心游戏逻辑，如开始新游戏、抽牌、出牌、结束回合、开始战斗、处理胜负等。

*   **`src/components/GameControls.vue`**: Vue 组件，提供游戏控制按钮，如 "结束回合" 和 "开始战斗"。根据游戏状态 (阶段、能量、场上单位) 控制按钮的可用性和文本。

*   **`src/components/CardHand.vue`**: Vue 组件，显示玩家的手牌。处理卡牌的选择、显示卡牌信息（消耗、描述等），并根据玩家能量和游戏阶段禁用无法使用的卡牌。还包含查看牌库和弃牌堆的功能。

*   **`src/components/GameBoard.vue`**: Vue 组件，代表游戏的主棋盘区域。它可能负责渲染 81 个格子，并根据 `gameStore.grid` 和 `gameStore.playerUnits`/`gameStore.enemyUnits` 来显示单位的位置。

*   **`src/components/GameHeader.vue`**: Vue 组件，显示在游戏界面顶部的信息栏。它从 `gameStore` 获取并展示当前回合、阶段、玩家生命值/能量/金币、牌库数量等关键信息。

*   **`src/components/GameMessage.vue`**: Vue 组件，用于在屏幕中央弹出临时的游戏消息，例如 "战斗开始！"、"能量不足！" 等。消息内容由 `gameStore.message` 控制。

*   **`src/App.vue`**: 主 Vue 组件，负责组织和布局其他核心 UI 组件 (`GameHeader`, `GameBoard`, `CardHand`, `GameControls`, `GameMessage`)，构成游戏的主界面。

*   **`src/types/Card.ts`**: 定义了项目中使用的 TypeScript 类型和接口，例如 `Card`, `Unit`, `Cell`。这有助于保持数据结构的一致性和代码的可维护性。

*   **`src/utils/SudokuGenerator.ts`**: 一个工具类，提供生成数独谜题和对应解的功能，被 `gameStore` 用于生成棋盘上的数字。

*   **`src/levels/levelManager.ts`**: 管理不同游戏关卡的配置（如敌人、难度、奖励等），并提供根据当前关卡生成敌人的函数 (`generateEnemiesForLevel`)。

*   **`src/index.ts`**: 项目的入口 TypeScript 文件。可能负责初始化 Vue 应用并将其挂载到 `index.html` 中的 DOM 元素上。

*   **`public/index.html`**: 应用程序的主 HTML 文件。它提供了基本的 HTML 骨架，包含一个用于挂载 Vue 应用的 `<div id="app">`。

*   **`public/styles.css`**: (如果存在) 全局 CSS 样式文件，定义了应用的基础样式和布局规则。

*   **`src/scenes/BattleScene.ts`**: (可能已部分弃用或与 Vue UI 集成) Phaser 场景类，可能最初用于处理战斗的视觉效果和逻辑，但部分功能似乎已被 Vue 组件和 Pinia store 取代。

## Unity迁移重构方案

为了降低与Vue框架的耦合度，并为Unity迁移做准备，建议进行以下重构：

### 1. 核心游戏逻辑重构

*   **`src/core/GameManager.ts`**: 新建核心游戏管理器类，替代gameStore的状态管理功能，负责游戏的整体控制流程。具有单例模式设计，管理游戏的生命周期。

*   **`src/core/Player.ts`**: 玩家类，封装玩家属性和行为，包括生命值、能量、护甲等，以及相关的能量消耗、恢复等方法。

*   **`src/core/BattleManager.ts`**: 战斗管理器，处理战斗逻辑，包括单位攻击、受伤、死亡等事件。

*   **`src/core/Card.ts`**: 卡牌基类，定义通用卡牌属性和方法。

*   **`src/core/cards/UnitCard.ts`**: 单位卡牌类，继承自Card类。

*   **`src/core/cards/SpellCard.ts`**: 法术卡牌类，继承自Card类。

*   **`src/core/DeckManager.ts`**: 牌库管理器，处理洗牌、抽牌、弃牌等逻辑。

*   **`src/core/GridSystem.ts`**: 棋盘网格系统，处理棋盘位置、单位放置、移动等。

*   **`src/core/Unit.ts`**: 单位基类，定义单位的通用属性和方法。

*   **`src/core/units/PlayerUnit.ts`**: 玩家单位类，继承自Unit。

*   **`src/core/units/EnemyUnit.ts`**: 敌方单位类，继承自Unit。

*   **`src/core/events/EventSystem.ts`**: 事件系统，采用发布-订阅模式，处理游戏中的各类事件通知。

### 2. 数据和配置

*   **`src/data/CardDatabase.ts`**: 卡牌数据库，存储所有卡牌配置。

*   **`src/data/LevelConfigurations.ts`**: 关卡配置，定义不同关卡的敌人、奖励等。

*   **`src/utils/SudokuGenerator.ts`**: 保留现有工具类，仅做内部实现优化。

### 3. 与UI层的连接

*   **`src/bridge/GameBridge.ts`**: 创建一个桥接层，负责连接核心游戏逻辑与UI层。它会暴露给UI层必要的方法和属性，但核心逻辑与UI完全解耦。

*   **`src/store/uiStore.ts`**: 用于纯UI状态管理的store，与核心游戏逻辑无关。

### 迁移路径

1. 先创建核心类的基本结构
2. 逐步将gameStore中的功能迁移到对应的核心类中
3. 通过GameBridge连接核心逻辑和Vue组件
4. 在确保功能正常的情况下，逐步减少对Vue特定特性的依赖

此架构设计将使核心游戏逻辑完全独立于UI框架，便于将来迁移到Unity或其他平台。 