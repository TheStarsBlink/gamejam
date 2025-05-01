# 项目文件结构与 Unity (PuerTS) 迁移指南

本文档旨在清晰地描述当前 Vue 项目的文件结构，并提供将核心逻辑迁移到 Unity 项目（使用 PuerTS 运行 TypeScript）的详细计划。

## 当前 Vue 项目文件结构

*   **`/` (根目录)**
    *   `vite.config.ts`: Vite 构建工具的配置文件，包含插件（如 Vue、VueMcp）、服务器设置、别名解析等。
    *   `package.json`: Node.js 项目描述文件，定义依赖项和脚本。
    *   `tsconfig.json`, `tsconfig.node.json`: TypeScript 配置文件。
    *   `index.html`: Web 应用的入口 HTML 文件。
    *   `PROJECT_STRUCTURE.md`: (本文档) 项目结构和迁移指南。
    *   `README.md`: 项目介绍和基本说明。
*   **`public/`**: 存放静态资源，会被直接复制到构建输出目录。
*   **`src/`**: 包含项目的主要源代码。
    *   `main.ts`: Vue 应用的入口点，负责创建 Vue 实例、设置路由和 Pinia 状态管理，并将应用挂载到 `index.html`。
    *   `App.vue`: 根 Vue 组件，组织布局主要的 UI 视图。
    *   `GameContainer.vue`: 可能用于包裹主要游戏区域的 Vue 组件。
    *   `style.css`: 全局 CSS 样式。
    *   `index.ts`: 可能包含一些全局导出或配置。
    *   `ui.ts`: 可能包含与 UI 相关的工具函数或配置。
    *   **`assets/`**: 存放 Vue 组件可能使用的本地资源（如图标、图片）。
    *   **`components/`**: 存放所有的 Vue 组件。
        *   `GameHeader.vue`: 显示顶部游戏信息（回合、生命、能量等）。
        *   `GameBoard.vue`: 渲染游戏棋盘和单位。
        *   `CardHand.vue`: 显示玩家手牌。
        *   `GameControls.vue`: 提供游戏控制按钮（结束回合等）。
        *   `GameMessage.vue`: 显示临时游戏消息。
        *   `GameStart.vue`: 游戏开始界面/按钮。
        *   `BattleLogs.vue`: 显示战斗日志。
        *   `*.vue`: 其他辅助 UI 组件。
    *   **`core/`**: **(迁移重点)** 存放与框架无关的核心游戏逻辑。
        *   `GameManager.ts`: 游戏主管理器（单例），协调游戏流程、状态和各个子系统。**(需要迁移并移除对 `window` 的依赖)**
        *   `Player.ts`: 玩家类，管理玩家属性（HP, ATK, 能量等）。
        *   `DeckManager.ts`: 牌库管理器（抽牌、洗牌、弃牌）。
        *   `GridSystem.ts`: 棋盘网格系统，管理格子状态和单位位置。
        *   `BattleManager.ts`: 战斗管理器，处理战斗流程、单位行动、伤害计算。
        *   `Card.ts`: 卡牌基类。
        *   `cards/`: 存放具体的卡牌类型实现 (`UnitCard.ts`, `SpellCard.ts`, `TrapCard.ts`)。
        *   `events/EventSystem.ts`: 一个简单的发布/订阅事件系统。**(可直接迁移或替换)**
    *   **`store/`**: **(需要重构)** 存放状态管理逻辑 (Pinia)。
        *   `combinedGameStore.ts`: **(主要重构对象)** Pinia store，目前混合了核心游戏逻辑、状态管理、Vue 响应式处理、本地存储以及部分 UI 逻辑。**需要将其中的核心逻辑提取到 `core` 或新的 PuerTS 控制器中，并移除所有 Pinia 和 Vue 的依赖。**
    *   **`router/`**: (如果使用 Vue Router) 存放路由配置。
    *   **`types/`**: 存放共享的 TypeScript 类型定义 (`Card.ts`, `Unit.ts`, `GameTypes.ts` 等)。**(可直接迁移)**
    *   **`utils/`**: 存放通用工具函数。
        *   `SudokuGenerator.ts`: 数独生成器。**(可直接迁移)**
        *   `CombatUtils.ts`, `GridUtils.ts`, `CardUtils.ts`, `GameRules.ts`: 其他游戏相关的工具函数。**(可直接迁移)**
    *   **`levels/`**: 存放关卡相关的逻辑和配置。
        *   `levelManager.ts`: 关卡管理器，负责加载关卡配置和生成敌人。**(可直接迁移)**
    *   **`scenes/`**: (可能包含旧的 Phaser 代码，根据实际情况决定是否迁移或移除)。
    *   **`bridge/`**: (根据旧文档，可能计划用于 UI 和核心逻辑的桥接，但目前为空或未实现)。

*   **`node_modules/`**: 存放项目依赖。
*   **`dist/`**: 构建输出目录。

---

## Unity (PuerTS) 迁移计划

本计划的目标是将项目的核心游戏逻辑从 Vue 环境迁移到 Unity 环境，并使用 PuerTS 来运行 TypeScript 代码，而**非**将 TypeScript 转换为 C#。这样可以最大程度地复用现有的 TypeScript 逻辑。

### 阶段一：环境准备与基础设置 (Unity & PuerTS)

1.  **创建 Unity 项目**: 创建一个新的 Unity 3D 或 2D 项目。
2.  **安装 PuerTS**:
    *   通过 Unity Package Manager 从 Git URL 安装 PuerTS 核心包。
    *   根据 PuerTS 文档，进行必要的初始配置（如生成代码、配置 Scripting Define Symbols）。
3.  **设置 TypeScript 环境**:
    *   在 Unity 项目的 `Assets` 目录下创建一个用于存放 TypeScript 源码的目录，例如 `Assets/TsProject` 或 `Assets/Scripts/Ts`。
    *   在该目录下初始化一个新的 `package.json` (`npm init -y`)。
    *   创建 `tsconfig.json` 文件，配置编译选项：
        *   `target`: 建议 `ES2015` 或更高。
        *   `module`: `CommonJS` (PuerTS 常用)。
        *   `outDir`: 设置为 Unity 可以识别的目录，例如 `Assets/Gen/Resources/ts` (需要与 PuerTS 配置对应)。
        *   `rootDir`: 指向你的 TS 源码目录 (`./src`)。
        *   `declaration`: `true` (生成 `.d.ts` 文件，有助于 C# 与 TS 交互)。
        *   `sourceMap`: `true` (方便调试)。
        *   配置 `typeRoots` 或 `types` 以包含 PuerTS 提供的类型定义。
4.  **安装 PuerTS 类型定义**: `npm install @puerts/runtime --save-dev` (或者根据 PuerTS 最新文档)。

### 阶段二：核心逻辑迁移

1.  **复制核心代码**: 将 Vue 项目 `src/core/` 目录下的所有 `.ts` 文件完整复制到 Unity 项目的 TypeScript 源码目录中（例如 `Assets/TsProject/src/core/`）。
2.  **复制类型定义**: 将 Vue 项目 `src/types/` 目录下的所有 `.ts` 文件复制到 Unity 的 TS 源码目录（例如 `Assets/TsProject/src/types/`）。
3.  **复制工具和关卡**: 将 Vue 项目 `src/utils/` 和 `src/levels/` 目录下的 `.ts` 文件复制到 Unity 的 TS 源码目录（例如 `Assets/TsProject/src/utils/` 和 `Assets/TsProject/src/levels/`）。
4.  **检查和调整依赖**:
    *   打开 Unity 项目中的 TypeScript 代码。
    *   检查 `import` 路径是否正确。根据新的目录结构调整相对路径。
    *   编译 TypeScript 代码 (`tsc -w` 或通过 IDE 插件)，解决路径错误和编译错误。
5.  **处理环境特定 API**:
    *   **查找 `window`**: 全局搜索 `window` 对象的使用，例如 `GameManager.ts` 中的 `window.setTimeout`。将其替换为 PuerTS 提供的定时器 API 或通过 C# 桥接实现。
    *   **查找 `localStorage`**: 全局搜索 `localStorage` 的使用 (主要在 `combinedGameStore.ts` 的 `saveGameState`/`loadGameState` 中)。这部分逻辑将在状态管理重构阶段处理，暂时标记。
    *   **查找其他 Web API**: 检查是否有其他浏览器或 Node.js 特有的 API 调用，并寻找 PuerTS 或 C# 的替代方案。

### 阶段三：状态管理重构

这是迁移中最关键和工作量最大的部分，目标是**完全移除 Pinia 和 Vue 的依赖**。

1.  **创建主控制器**: 在 Unity 的 TS 源码目录中创建一个新的主控制器文件，例如 `Assets/TsProject/src/GameController.ts`。
2.  **实例化核心管理器**: 在 `GameController.ts` 的构造函数或初始化方法中，实例化 `GameManager`, `Player`, `DeckManager`, `GridSystem`, `BattleManager`, `EventSystem` 等核心类。`GameManager` 应该仍然是单例模式，可以通过 `GameManager.getInstance()` 获取。
3.  **提取状态逻辑**:
    *   仔细阅读 Vue 项目的 `src/store/combinedGameStore.ts` 文件。
    *   将其中定义的游戏状态（原本使用 `ref()` 的变量，如 `turn`, `phase`, `player` 数据, `deck`, `hand`, `grid`, `playerUnits`, `enemyUnits` 等）**移动**到 `GameController.ts` 或相应的核心管理器类（如 `Player` 类应包含 HP、能量等）中，作为普通的类属性。
    *   将核心的游戏逻辑函数（原本是 Pinia actions，如 `startNewGame`, `endTurn`, `drawCards`, `playCard`, `deployUnit`, `startBattlePhase`, `handleVictory`, `handleDefeat` 等）**移动**到 `GameController.ts` 或 `GameManager.ts` 中，作为类的方法。移除所有对 `ref().value` 的访问，直接操作类属性。
4.  **移除 Vue/Pinia 代码**: 删除 `combinedGameStore.ts` 文件或将其内容完全替换。确保所有 Vue (`ref`, `computed`, `onMounted`, `watch` 等) 和 Pinia (`defineStore`) 的代码都被移除。
5.  **重构事件系统使用**: 检查原 `combinedGameStore.ts` 中通过 `emit` 触发事件或更新状态的地方。确保这些逻辑在新的 `GameController` 或 `GameManager` 中通过调用方法或 `EventSystem` 正确触发。
6.  **实现状态持久化**:
    *   在 `GameController.ts` 中创建 `saveGame()` 和 `loadGame()` 方法。
    *   使用 PuerTS 提供的与 C# 交互的能力，调用 C# 方法来读写持久化数据（例如，使用 `UnityEngine.PlayerPrefs` 或文件 I/O）。
    *   编写一个 C# 脚本 (`SaveLoadManager.cs`) 提供静态方法 `Save(string data)` 和 `Load(): string`，并使用 PuerTS 的代码生成或 API 将其暴露给 TypeScript。
    *   在 TS 的 `saveGame()` 中，序列化需要保存的状态 (可以使用 `JSON.stringify`)，然后调用 C# 的 `SaveLoadManager.Save()`。
    *   在 TS 的 `loadGame()` 中，调用 C# 的 `SaveLoadManager.Load()` 获取 JSON 字符串，然后反序列化 (`JSON.parse`) 并恢复 `GameController` 和核心管理器的状态。

### 阶段四：UI 桥接与交互

目标是让 PuerTS 中的游戏逻辑能够驱动 Unity 的 UI 显示，并响应用户的 UI 操作。

1.  **确定交互边界**: 明确哪些信息需要从 TS 传递到 Unity UI（如玩家 HP、手牌、棋盘状态、游戏消息），以及哪些用户操作需要从 Unity UI 传递到 TS（如点击卡牌、点击格子、点击结束回合按钮）。
2.  **创建 C# UI 管理器**: 在 Unity 中创建 C# 脚本，例如 `UIManager.cs`，负责管理 UI 元素的更新。
    *   添加对场景中 UI 元素（Text, Image, Button 等）的引用。
    *   提供公共方法来更新这些 UI 元素，例如 `UpdateHpText(int currentHp, int maxHp)`, `UpdateEnergyText(int currentEnergy, int maxEnergy)`, `ShowMessage(string message)`, `DisplayHand(List<CardData> cards)`, `UpdateGrid(List<CellData> cells)` 等。`CardData` 和 `CellData` 是简单的数据结构，用于在 C# 和 TS 之间传递信息。
3.  **暴露 C# 方法给 TS**: 使用 PuerTS 的代码生成或 API (`puerts.registerBuildinModule`) 将 `UIManager.cs` 的公共方法暴露给 TypeScript。
4.  **在 TS 中调用 C# UI**:
    *   在 `GameController.ts` 或其他需要更新 UI 的地方，获取对 `UIManager` 实例的引用（可以通过 PuerTS 的机制实现，例如通过全局对象或注入）。
    *   在游戏状态改变时（例如，玩家受伤、抽牌、单位移动），调用 `UIManager` 暴露的方法来更新 UI。例如，在 `Player.takeDamage` 后调用 `UIManager.UpdateHpText()`。
    *   使用 `EventSystem`：可以监听核心逻辑触发的事件 (如 `hp_changed`, `hand_updated`)，在事件回调中调用 C# UI 更新方法。
5.  **处理 Unity UI 事件**:
    *   在 Unity 的 Button 点击事件或其他 UI 事件的回调中（在 C# 脚本中处理），调用 PuerTS 提供的方法来执行相应的 TypeScript 函数。
    *   例如，当用户点击"结束回合"按钮时，C# 的回调函数调用 TS 中 `GameController` 实例的 `endTurn()` 方法。
    *   需要将 `GameController` 的实例或相关方法暴露给 C#。
6.  **资源路径处理**: Vue 项目中直接引用的图片等资源路径 (`assets/...`) 在 TS 代码中需要修改。一种方法是：
    *   在 Unity 中使用 `Resources` 文件夹或 `Addressables` 管理资源。
    *   在 TS 中定义卡牌或单位数据时，只包含资源的逻辑名称或 ID。
    *   在 C# 的 `UIManager` 中，根据 TS 传递过来的名称/ID 加载对应的 Unity 资源并显示。

### 阶段五：测试与调试

1.  **编译 TypeScript**: 持续使用 `tsc` 编译 TS 代码，确保没有编译错误。
2.  **Unity 编辑器测试**: 在 Unity 编辑器中运行游戏。
3.  **PuerTS 调试**: 使用 PuerTS 提供的调试功能（通常需要配合 VS Code），设置断点，检查 TS 代码的执行流程和变量状态。
4.  **日志输出**: 在 TS 和 C# 中添加必要的日志输出 (`console.log` 在 PuerTS 中通常会重定向到 Unity Console)，帮助定位问题。
5.  **单元测试 (可选)**: 对核心的 TS 模块（如 `CombatUtils`, `SudokuGenerator`）编写单元测试，确保其逻辑正确性。

### 注意事项

*   **性能**: PuerTS 的性能通常很好，但对于非常频繁的 C#<->TS 调用，需要关注性能开销。尽量批量更新 UI 或优化交互方式。
*   **异步操作**: 如果 TS 代码中有异步操作，需要了解 PuerTS 如何处理 `async/await` 以及与 Unity 主线程的交互。
*   **PuerTS 版本**: 确保参考你使用的 PuerTS 版本的官方文档，API 和配置可能随版本更新。
*   **错误处理**: 在 C# 和 TS 的交互边界添加健壮的错误处理逻辑。

这个计划提供了一个清晰的迁移路径，将 Vue 项目的核心逻辑带到 Unity 中，同时利用 PuerTS 保留 TypeScript 的优势。 