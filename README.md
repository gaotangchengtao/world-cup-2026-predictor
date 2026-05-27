# 2026 FIFA World Cup Predictor

一个基于 `Vite + React + TypeScript + Tailwind CSS` 的 2026 世界杯预测项目，支持 48 队、12 小组、32 强淘汰赛、双语界面和浏览器本地持久化。

## 核心功能

- 48 支参赛队浏览，按 A-L 12 个小组展示
- 球队搜索、分组筛选、预测阶段筛选、黑马筛选
- 小组赛比分预测器，自动计算积分、净胜球和排名
- 32 强到冠军的 bracket 预测，支持手动改签和自动晋级
- `localStorage` 自动保存语言、主题、运行时数据和预测结果
- JSON 导入 / 导出预测结果与运行时数据
- 中英文切换，中文模式下球队、球员、俱乐部、主教练显示中文
- 响应式布局，移动端可横向查看 bracket

## 本次增强

- Bracket 胜率条：基于 `strengthScore`、`strengthRank`、预测阶段和阵容身价给出简单可解释的胜率
- 预测解释卡片：在球队详情和 bracket 中解释为什么模型更看好某支球队
- 足球术语小词典：帮助新手理解控球、高位逼抢、反击、低位防守、净胜球、最好第三名等概念
- “怎么看这场球”模块：按小组推荐重点对决和观赛角度
- 球队风格标签：如传控、反击、身体流、防守反击、青年风暴、老牌强队
- 球员照片维护面板：区分公开缩略图、手动照片、占位头像，并列出优先补图球员
- 数据可信度摘要：统计 `official` / `estimated` / `projected` / `mock` / `manual`
- CSV 导入模板下载：方便后续维护球员身价、俱乐部、照片 URL
- 区域视图：按北美、南美、欧洲、非洲、亚洲、大洋洲分组展示参赛队
- 关键球员三人组：球队详情页展示最值得关注的 3 名球员
- 海报导出替代方案：支持导出预测摘要 JSON 和轻量 HTML 海报

## 数据结构

主要数据位于：

- `src/data/teams.ts`：球队基础信息、实力、预测阶段、教练、阵型等
- `src/data/players.ts`：球员名单、俱乐部、身价、照片来源、Transfermarkt 搜索链接
- `src/data/groups.ts`：12 个小组
- `src/data/bracket.ts`：32 强淘汰赛结构
- `src/data/localizedNames.ts`：中文姓名映射
- `src/data/teamGuides.ts`：球队新手观赛指南
- `src/data/sources.ts`：公开来源说明

类型定义位于：

- `src/types/worldCup.ts`

## 数据质量说明

项目中的 `dataQuality` 字段含义如下：

- `official`：官方确认
- `official-placeholder`：结构来自官方，但部分字段仍是占位
- `estimated`：基于公开信息估算
- `projected`：用于预测或后续维护的预计数据
- `mock`：临时占位数据
- `manual`：人工维护数据

注意：

- 本项目不直接抓取 Transfermarkt
- 球员真实照片建议手动维护，或使用你有权使用的合法公开来源
- 当前前端会优先尝试公开 Wikimedia / Wikipedia 缩略图，失败后回退到占位头像

## 名单状态

当前 `src/data/players.ts` 中的球员是“预测/初选名单”，不是官方 Final Squad。页面会在球队详情、球员卡片和球员详情中显示 `squadStatus`：

- `projected`：预测/初选
- `preliminary`：初选名单
- `final`：Final Squad

建议等 6 月 2 日后，再根据官方确认名单统一更新为 `final`。在此之前，先保持结构完整、展示清晰、数据可维护。

## CSV 模板

页面中的 CSV 模板下载用于后续维护以下字段：

- `playerId`
- `teamId`
- `name`
- `club`
- `marketValue`
- `marketValueEurM`
- `photoUrl`
- `photoSource`
- `photoCredit`
- `photoLastUpdated`
- `transfermarktUrl`
- `lastUpdated`
- `dataQuality`

推荐流程：

1. 先下载 CSV 模板
2. 在表格软件中维护球员身价、俱乐部和照片地址
3. 确认字段无误后，再同步回 `src/data/players.ts` 或转换成运行时 JSON 导入

## 本地运行

```bash
npm install
npm run dev
```

默认开发地址通常为：

```text
http://127.0.0.1:5173
```

## 构建与 GitHub Pages

Vite 构建输出目录为 `docs/`，适合 GitHub Pages 使用：

- Branch: `master`
- Folder: `/docs`

常用流程：

```bash
npm run build
git add .
git commit -m "Add remaining World Cup predictor enhancements"
git push origin master
```

## 维护建议

- 如果新增球队，请同步更新 `src/data/teams.ts`、`src/data/groups.ts` 和 `src/data/localizedNames.ts`
- 如果新增球员，请更新 `src/data/players.ts`，并补充中文姓名 / 俱乐部映射
- 如果要提高中文展示质量，优先维护 `src/data/localizedNames.ts`
- 如果要补充新手内容，可继续扩展 `src/data/teamGuides.ts`
