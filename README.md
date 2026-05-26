# 2026 FIFA World Cup Predictor

一个用 **Vite + React + TypeScript + Tailwind CSS** 开发的 2026 美加墨世界杯预测网页 MVP。

## 功能

- 48 支球队、A-L 共 12 个小组展示
- 球队搜索、小组筛选、预测阶段筛选、冠军热门/黑马筛选
- 球队详情弹窗：排名、评分、预测阶段、教练、阵型、简介、球员候选名单
- 球员详情弹窗：头像、位置、俱乐部、身价、德转搜索链接、数据更新时间
- 32 强到冠军的 bracket 预测
- 点击 bracket 槽位选择胜者，自动进入下一轮
- 小组赛比分预测器：输入比分后自动计算积分、净胜球、小组排名和出线状态
- localStorage 自动保存预测
- JSON 导入 / 导出预测和运行时数据
- 深色 / 浅色模式
- 中文 / English 语言切换，语言偏好保存到 localStorage
- 中文模式下球队名、球员名、俱乐部名显示中文；英文模式显示英文
- 中文模式下主教练名也会通过本地映射显示中文
- 球队详情包含“新手看球指南”：风格、优势、隐患、推荐关注球员和历史背景
- “推荐关注球员”可点击打开球员详情
- 响应式布局，移动端 bracket 可横向滚动

## 运行

```bash
npm install
npm run dev
```

然后打开终端显示的本地地址，通常是：

```text
http://127.0.0.1:5173
```

## GitHub Pages 部署

本项目的 Vite 构建产物输出到 `docs/`，GitHub Pages 发布源应设置为：

- Branch: `master`
- Folder: `/docs`

重新部署时运行：

```bash
npm run build
git add vite.config.ts README.md docs
git commit -m "Deploy Vite build to GitHub Pages"
git push
```

## 数据位置

- `src/data/teams.ts`: 球队基础信息、组别、排名、评分、预测阶段、教练、阵型
- `src/data/players.ts`: 球员候选名单、照片、位置、年龄、俱乐部、身价、德转链接
- `src/data/groups.ts`: A-L 小组结构
- `src/data/bracket.ts`: 32 强到冠军的淘汰赛槽位结构
- `src/data/sources.ts`: 数据来源说明
- `src/data/teamGuides.ts`: 12 支重点球队的新手看球指南，中英文分开维护
- `src/data/localizedNames.ts`: 球队、球员、俱乐部的中文显示名
- `src/types/worldCup.ts`: TypeScript 数据类型
- `src/i18n/`: 中文/英文翻译字典和语言上下文

## 语言切换

语言模块位于页面右上角，支持：

- 中文
- English

首次打开时会根据浏览器语言判断：`zh` 开头默认中文，否则默认英文。用户手动切换后，选择会保存到 `localStorage` 的 `wc2026.language`，下次打开自动使用上次选择的语言。

代码里仍建议把 `team.name`、`player.name`、`player.club`、`team.coach` 保持为英文标准名，方便后续导入 CSV/JSON 和匹配外部数据源。页面显示时会通过 `src/data/localizedNames.ts` 自动切换：中文模式显示中文名，英文模式显示英文名。

## 添加球队

在 `src/data/teams.ts` 中添加一个 `Team` 对象，并确保：

- `id` 唯一，例如 `argentina`
- `group` 是 `"A"` 到 `"L"`
- `strengthRank` 越小代表越强
- `strengthScore` 越高代表越强
- `predictedGroupPosition` 只能是 `1 | 2 | 3 | 4`
- `predictedStage` 使用类型中已有阶段
- `lastUpdated` 写清楚更新时间
- `sourceUrls` 保留来源链接

同时在 `src/data/groups.ts` 对应小组的 `teamIds` 中加入这个球队 `id`。

如果要让中文模式显示中文球队名、主教练名，也在 `src/data/localizedNames.ts` 的 `teamNamesZh`、`coachNamesZh` 中补充对应映射。

## 添加球队新手介绍

在 `src/data/teamGuides.ts` 中按球队 `id` 添加中英文介绍：

- `beginnerIntro`: 给足球新人的简短介绍
- `playStyle`: 常见打法
- `keyStrengths`: 优势
- `weaknesses`: 可能的弱点
- `playersToWatch`: 推荐关注球员
- `historicalNote`: 历史背景
- `whyTheyMatter`: 为什么值得关注

中文内容可以写中文球队名和中文球员名；英文内容写英文名。

如果某支球队还没有手写指南，页面会根据球队组别、实力排名、预测阶段和球员样本自动生成一份基础“新手看球指南”，保证 48 支球队详情页都有内容。

## 添加球员

在 `src/data/players.ts` 的 `seeds` 数组中添加一条记录：

```ts
{
  teamId: "argentina",
  name: "Example Player",
  position: "MF",
  age: 24,
  club: "Example Club",
  marketValue: "€20.00m",
  marketValueEurM: 20,
  isKeyPlayer: true,
  predictedStarter: true,
  shirtNumber: 8
}
```

`photoUrl`、`transfermarktUrl`、`lastUpdated` 会由当前 helper 自动生成。以后如果你有真实照片或精确德转链接，可以把 helper 改成允许手动覆盖。

如果要让中文模式显示中文球员名或中文俱乐部名，也在 `src/data/localizedNames.ts` 的 `playerNamesZh`、`clubNamesZh` 中补充映射。

## 更新德转身价

本项目不直接爬取 Transfermarkt。推荐流程：

1. 手动整理 CSV/JSON，包含 `playerId`, `marketValue`, `marketValueEurM`, `transfermarktUrl`, `lastUpdated`。
2. 在网页中使用“导入 JSON”更新浏览器运行时数据。
3. 确认无误后，再手动更新 `src/data/players.ts`。

## 替换照片

当前照片使用 `ui-avatars.com` 生成占位头像。你可以把 `photoUrl` 改成：

- 你自己有权使用的本地图片路径
- 合法授权的 CDN 图片地址
- 自己维护的静态资源地址
- 俱乐部官网球员头像、国家队官网头像、FIFA 官方资料页或其他合法授权图片链接

球员照片字段包括：

- `photoUrl`: 图片地址，没有时自动使用默认头像
- `photoSource`: `club_website` / `national_team_website` / `fifa` / `manual` / `placeholder`
- `photoCredit`: 图片署名或维护说明
- `photoLastUpdated`: 照片更新时间

请不要写自动爬虫批量抓取 Transfermarkt 或俱乐部官网图片。照片建议手动维护，或通过你有权使用的合法授权数据源导入。图片加载失败时，页面会自动回退到默认头像。

当前前端会在显示头像时，少量、懒加载地调用 Wikipedia/Wikimedia 公开 API 尝试获取球员公开缩略图，并缓存结果；这不是对俱乐部官网或 Transfermarkt 的爬虫，也不会一次性批量请求全部球员。拿不到公开缩略图时继续使用默认头像。

## 国旗显示

球队国旗通过 `src/components/TeamFlag.tsx` 统一渲染，优先使用 `src/utils/flags.ts` 中的图片国旗，加载失败时回退到 emoji。球队卡片、详情、淘汰赛槽位、Top 10 和对比模块都会显示国旗。

## 数据质量说明

数据对象里有 `dataQuality` 字段：

- `official`: 官方确认
- `official-placeholder`: 官方占位
- `estimated`: 估算
- `projected`: 预测候选
- `mock`: 占位
- `manual`: 手动维护

MVP 中球队小组结构尽量按公开资料核对；球员名单、俱乐部、身价属于预测/估算数据，适合后续手动维护。
