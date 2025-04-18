# 卡牌资源管理游戏

一个基于"卡牌+资源管理"机制的小游戏，通过使用不同花色卡牌，在资金与幸福指数间平衡，达成幸福指数100点胜利。

## 游戏规则

### 卡牌系统（4花色，24张卡牌）

| 花色   | 类型       | 效果描述                          | 特殊效果（仅特殊卡）         |
|--------|------------|-----------------------------------|------------------------------|
| 红桃   | 慈善卡     | 资金 - 数值/2，幸福 + 数值         | **效果1**：下张卡效果翻倍    |
| 方片   | 建设卡     | 资金 - 数值，幸福 + 数值            | **效果2**：下两张卡资金消耗无效 |
| 梅花   | 收集卡     | 资金 + 数值/2，幸福 - 数值         | 无                           |
| 黑桃   | 投资卡     | 资金 + 数值，幸福 - 数值            | 无                           |

### 资源与状态

- **基础资源**：
  - 资金（初始 100，不能低于 0，否则破产）
  - 幸福指数（初始 0，达到 100 胜利）
- **回合机制**：每回合持有 5 张牌，必须使用恰好 3 张牌，使用第3张牌后会自动结束回合，剩余 2 张牌保留到下一回合，并在回合结束时补充手牌至 5 张
- **随机事件**：每 3 回合触发**金融危机**（持续 2 回合，黑桃收益减半）

## 游戏目标

通过策略性地使用手牌，在维持资金流的同时提升幸福指数，最终达到100点幸福指数获得胜利。要注意避免资金耗尽导致破产。

## 技术实现

- 纯前端实现，使用HTML, CSS和JavaScript
- 模块化设计：卡牌系统、游戏状态管理、UI交互
- 无需安装，直接在浏览器中运行

## 如何开始游戏

1. 下载或克隆本仓库
2. 在浏览器中打开`index.html`文件
3. 开始游戏，阅读游戏日志了解规则详情

## 操作说明

- 点击卡牌使用它
- 每回合可以使用"换牌"按钮替换一张手牌
- 使用第3张牌后会自动结束回合

祝您游戏愉快！ 