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
- 离线机器学习预测管线：可读取历史国家队比赛 CSV，训练模型并导出前端轻量预测结果

## 本次增强

- 机器学习预测层：前端优先读取 `src/data/modelPredictions.ts`，缺失时回退到现有规则评分
- Dashboard 新增 ML 冠军候选、置信度最高球队和爆冷风险观察
- Bracket 支持“使用 ML 推荐路线”，一键填满 32 强到冠军的预测路径
- Bracket 胜率条：综合本届状态、人员可用性、战术适配、阵容默契、教练调整和时间衰减历史数据
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
- `src/data/modelPredictions.ts`：前端使用的轻量 ML 预测画像
- `src/data/localizedNames.ts`：中文姓名映射
- `src/data/teamGuides.ts`：球队新手观赛指南
- `src/data/offFieldStories.ts`：场外花絮公开来源摘要
- `src/data/sources.ts`：公开来源说明

类型定义位于：

- `src/types/worldCup.ts`

## 场外花絮与安全采集

情报中心新增“场外花絮”板块，用来展示世界杯赛场之外的高关注新闻、赛区故事和赛事运营话题。当前网页数据来自人工复核后的公开来源摘要，源码位于：

```text
src/data/offFieldStories.ts
```

D 盘保留了可追踪的资料目录：

```text
D:\世界杯场外花絮
```

其中：
- `off_field_stories_curated.json`：人工整理后的摘要数据
- `off_field_story_fetch_log.json`：安全采集脚本生成的元数据日志
- `crawler_policy.md`：采集安全策略

如果以后要更新公开来源元数据，可以运行：

```bash
npm run stories:fetch
```

脚本位于 `scripts/fetch_off_field_stories.py`，默认只抓取标题、描述、状态码和来源链接，不保存全文。它会使用白名单域名、`robots.txt` 检查、低频请求和单页大小限制；不会登录网站、绕过付费墙、处理验证码或对抗反爬机制。

## 机器学习预测管线

### 当前状态模型（2026-06-23 快照）

当前版本不再只依赖历史国家队比赛。预测画像由以下证据共同构成：

- 历史比赛采用指数时间衰减，越接近 2026 年权重越高
- 世界杯正赛权重最高，友谊赛权重最低
- 纳入截至 `2026-06-21` 已结束的 40 场本届世界杯比赛
- 纳入当前预测名单的位置覆盖、关键球员、预计首发、阵容可用性、关键伤停、球员角色适配、战术适配、角色默契和教练调整能力
- 单场淘汰赛根据具体对手重新计算，不直接照搬球队总排名
- 胜率极接近时使用综合实力与模型置信度稳定结果，避免小样本造成机械翻转

当前赛事快照位于 `data/current/world_cup_2026_state.json`。人工维护的人员和战术评分属于分析估计，不是官方评级；伤停或首发信息变化后，应先更新该文件再重新训练。

`data/current/team_baseline_signals.json` 保存冻结的赛前基础信号，防止模型把上一次输出再次当作输入而产生反馈漂移。相同输入快照会生成相同的 `modelPredictions.ts`。

本项目采用“离线训练 + 前端展示”的方式，不需要后端，也不会影响 GitHub Pages 部署。

### 目录约定

- `data/raw/`：放原始历史比赛 CSV，不提交 Git
- `data/processed/`：放清洗后的中间数据，不提交 Git
- `models/`：放本地训练产物，不提交 Git
- `src/data/modelPredictions.ts`：提交到 Git 的前端预测结果

### 数据来源

推荐使用你有权下载和使用的历史国家队比赛数据，例如：

- `openfootball/worldcup`
- `openfootball/worldcup.json`
- Kaggle 上的 international football results 类数据集

请手动把合法下载的 CSV 放到：

```text
data/raw/results.csv
```

脚本期待字段：

```text
date,home_team,away_team,home_score,away_score,tournament,neutral
```

项目不会自动绕过网站限制抓取数据，也不会批量爬取受限制网站。

### 训练步骤

先安装 Python 依赖：

```bash
python -m pip install -r requirements-ml.txt
```

然后训练并导出前端预测文件：

```bash
npm run ml:train
```

`npm run ml:train` 会自动尝试系统 `python`、Windows `py -3` 和 Codex 自带 Python。若你安装了 Python 但不在 PATH 中，也可以设置 `PYTHON` 环境变量指向完整的 `python.exe`。

如果使用 Vincent 当前下载的历史资料，推荐运行：

```bash
npm run ml:train -- --input "D:\世界杯历史资料\results.csv"
```

这会保留所有已赛国家队比赛，同时让 `FIFA World Cup` 正赛拥有最高训练权重。像 2026 年未赛赛程这种比分为空的行会自动排除。

如果你只想做世界杯正赛实验，也可以额外加：

```bash
npm run ml:train -- --input "D:\世界杯历史资料\results.csv" --world-cup-only
```

训练脚本会：

- 读取历史比赛结果
- 构建 Elo、近 10 场状态、净胜球、进攻趋势、防守趋势、比赛类型与时间衰减等特征
- 使用样本权重训练：世界杯正赛最高，洲际杯次之，预选赛和友谊赛较低，并让近期比赛获得更高权重
- 训练 `HistGradientBoostingClassifier`
- 同时训练 Logistic Regression 作为基线对照
- 选择验证准确率更好的模型
- 叠加当前世界杯赛果、阵容可用性与战术情境
- 输出 `src/data/modelPredictions.ts` 和本地审计文件 `outputs/current_model_profiles.json`

如果没有 `data/raw/results.csv`，脚本会给出提示并安全退出，前端仍会使用已提交的基线预测画像。

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
