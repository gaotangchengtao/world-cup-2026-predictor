# 2026 FIFA World Cup Predictor

一个用 **Vite + React + TypeScript + Tailwind CSS** 开发的 2026 美加墨世界杯预测网页 MVP。

## 功能

- 48 支球队、A-L 共 12 个小组展示
- 球队搜索、小组筛选、预测阶段筛选、冠军热门/黑马筛选
- 球队详情弹窗：排名、评分、预测阶段、教练、阵型、简介、球员候选名单
- 球员详情弹窗：头像、位置、俱乐部、身价、德转搜索链接、数据更新时间
- 32 强到冠军的 bracket 预测
- 点击 bracket 槽位选择胜者，自动进入下一轮
- localStorage 自动保存预测
- JSON 导入 / 导出预测和运行时数据
- 深色 / 浅色模式
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

## 数据位置

- `src/data/teams.ts`: 球队基础信息、组别、排名、评分、预测阶段、教练、阵型
- `src/data/players.ts`: 球员候选名单、照片、位置、年龄、俱乐部、身价、德转链接
- `src/data/groups.ts`: A-L 小组结构
- `src/data/bracket.ts`: 32 强到冠军的淘汰赛槽位结构
- `src/data/sources.ts`: 数据来源说明
- `src/types/worldCup.ts`: TypeScript 数据类型

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

## 数据质量说明

数据对象里有 `dataQuality` 字段：

- `official`: 官方确认
- `official-placeholder`: 官方占位
- `estimated`: 估算
- `projected`: 预测候选
- `mock`: 占位
- `manual`: 手动维护

MVP 中球队小组结构尽量按公开资料核对；球员名单、俱乐部、身价属于预测/估算数据，适合后续手动维护。
