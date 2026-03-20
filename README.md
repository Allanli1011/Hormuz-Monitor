# 霍尔木兹海峡航运监控

霍尔木兹海峡是全球最重要的石油运输咽喉要道，每日约有 20% 的全球石油贸易量经此通过。本项目提供一个可视化监控面板，实时追踪过境船只数量、各商品通行压力，以及地图上的船只动态。

## 功能

- **每日过境统计**：展示全船型、油轮、散货/杂货船的每日过境量及与近30日的对比变化
- **行业通行压力系数**：基于历史基准计算当前航运阻断程度（0% = 正常，100% = 完全中断）
- **商品维度压力**：原油、LNG、LPG、甲醇、化肥、铝制品各自的通行受阻情况
- **船只实时地图**：Leaflet 地图标注过境船只，支持 24h 航迹回溯与实时快照切换

## 快速开始

```bash
npm install
cp .env.example .env     # 填入 aisstream.io API Key（可选，见下文）
npm run dev
```

## 项目结构

```
src/
├── services/            # 外部数据源接入层（见下方详细说明）
│   ├── imfPortWatch.js  # IMF PortWatch REST API
│   └── aisStream.js     # aisstream.io WebSocket
├── hooks/               # React 数据管理层
│   ├── usePortWatchData.js
│   └── useAisStream.js
├── data/
│   ├── calc.js          # 压力系数计算公式
│   └── mockData.js      # 降级用模拟数据
└── components/
    ├── DailyStats.jsx
    ├── PressureIndex.jsx
    ├── GaugeChart.jsx
    └── VesselMap.jsx
```

---

## 数据来源详解

本项目采用分层数据架构：所有外部数据源的接入逻辑集中在 `src/services/`，上层组件通过 `src/hooks/` 消费数据，不直接依赖数据源实现。**替换数据源只需修改对应的 service 文件，无需改动任何组件。**

---

### 数据源一：IMF PortWatch（统计数据 + 压力系数）

**文件：** `src/services/imfPortWatch.js`
**性质：** 完全免费，无需注册
**更新频率：** 每周二，覆盖日粒度历史数据（2019 年至今）
**官网：** https://portwatch.imf.org

#### 数据内容

IMF PortWatch 基于全球约 9 万艘船的卫星 AIS 信号，统计 28 个主要航运咽喉要道（包括霍尔木兹、苏伊士、马六甲等）的每日过境情况。本项目使用的字段：

| 字段 | 含义 |
|------|------|
| `date` | 日期（毫秒时间戳） |
| `n_total` | 当日过境总船只数 |
| `n_tanker` | 油轮数量（含原油、成品油轮，**不区分 LNG/LPG**） |
| `n_dry_bulk` | 干散货船数量（化肥、矿石、铝等） |
| `n_cargo` | 杂货船数量 |
| `n_container` | 集装箱船数量 |
| `capacity_tanker` | 油轮运力（吨） |
| `capacity` | 全部船型总运力（吨） |

#### 调用接口

```
GET https://services9.arcgis.com/weJ1QsnbMYJlCHdG/ArcGIS/rest/services/Daily_Chokepoints_Data/FeatureServer/0/query
  ?where=portname='Strait of Hormuz'
  &outFields=date,n_total,n_tanker,...
  &orderByFields=date DESC
  &resultRecordCount=90
  &f=json
```

本项目启动时并行发起两个请求：
1. **近 60 天数据** — 用于展示当前统计和计算月度变化幅度
2. **2022–2023 年历史数据** — 用于动态计算日均基准值

#### 已知局限

- **无法区分 LNG / LPG / 甲醇 / 原油**：`n_tanker` 将所有油气液体运输船合并计数，无法拆分为具体商品。当前实现对 LNG、LPG、甲醇按固定比例从 `n_tanker` 估算，**仅供参考**。
- **每周更新，非实时**：最新数据通常滞后 3–7 天。
- **遮蔽船只不在统计范围内**：关闭 AIS 的船只（常见于制裁规避）无法被卫星捕获。

#### 升级为付费数据（替换指引）

若需要每日更新、商品级别拆分，可替换为以下付费平台。**替换时只需重写 `imfPortWatch.js` 中的 `fetchRecentTransits` 和 `fetchHistoricalBaseline` 函数，返回相同数据结构即可，其余代码无需修改。**

**Kpler / MarineTraffic**（https://www.kpler.com）
- 提供按商品（原油、LNG、LPG、成品油等）分类的每日过境量
- 支持实时更新
- 需企业合同，价格面议
- 返回数据中可直接获取 `cargo_type` 字段，可完整替换当前的比例估算逻辑

```js
// 替换示例（伪代码）
export async function fetchRecentTransits(days = 90) {
  const res = await fetch('https://api.kpler.com/v1/flows', {
    headers: { Authorization: `Bearer ${import.meta.env.VITE_KPLER_API_KEY}` },
    // ... 其他参数
  });
  const data = await res.json();
  return data.map(toStandardRecord); // 转换为本项目的字段格式
}
```

**Windward**（https://windward.ai）
- 提供行为智能分析，可识别"影子船队"（关闭 AIS 的船只）
- 数据颗粒度更细，支持制裁风险评分
- 需企业合同

**UKMTO / JMIC**
- 每周发布 PDF 报告（免费），包含人工核实的过境数字
- 无结构化 API，需自行解析 PDF 或手动录入
- 报告地址：https://www.ukmto.org/partner-products/jmic-products

---

### 数据源二：aisstream.io（实时船只地图）

**文件：** `src/services/aisStream.js`
**性质：** 免费，需注册获取 API Key
**注册地址：** https://aisstream.io
**传输方式：** WebSocket 长连接，实时推送

#### 数据内容

aisstream.io 聚合全球地面 AIS 基站数据，通过 WebSocket 实时推送指定地理范围内的船只信号。本项目监听两类消息：

| 消息类型 | 主要字段 | 用途 |
|----------|---------|------|
| `PositionReport` | 经纬度、航速（SOG）、航向、航行状态 | 船只位置更新 |
| `ShipStaticData` | 船名、MMSI、AIS 船型代码 | 船只识别与分类 |

#### 地理过滤范围

```js
// 霍尔木兹海峡边界框
const HORMUZ_BBOX = [[22.0, 55.5], [27.5, 60.5]];
// [最小纬度, 最小经度], [最大纬度, 最大经度]
```

#### AIS 船型代码映射

AIS 协议中，船型由一个两位数字代码表示，本项目的映射规则：

| AIS 代码范围 | 官方含义 | 本项目类型 | 地图颜色 |
|-------------|---------|-----------|---------|
| 80–89 | Tanker（各类油轮） | `tanker` | 红色 |
| 83 | Tanker, Hazardous A（通常为 LNG） | `tanker_lng` | 紫色 |
| 84 | Tanker, Hazardous B（通常为 LPG） | `tanker_lpg` | 橙色 |
| 70–79 | Cargo（散货/杂货） | `cargo` | 蓝色 |
| 60–69 | Passenger | `passenger` | 青色 |

> **局限**：AIS 船型代码仅区分大类，代码 83/84 并非专属 LNG/LPG，实际中两者存在混用。精确判断货物类型需结合船只 IMO 号查询船舶数据库（如 IMO GISIS）。

#### 配置方式

在项目根目录创建 `.env` 文件：

```
VITE_AISSTREAM_API_KEY=你的API Key
```

未配置时，地图自动降级为内置模拟数据，其他功能不受影响。

#### 已知局限

- **仅覆盖有地面基站的区域**：霍尔木兹海峡沿岸（阿曼、UAE）基站密度有限，部分区域信号不稳定
- **"暗船"不可见**：主动关闭 AIS 的船只（制裁规避常见手段）不会出现在数据流中
- **无历史轨迹**：免费版不提供历史 AIS 数据，24h 航迹回溯当前使用模拟数据

#### 升级为付费数据（替换指引）

若需要卫星 AIS（覆盖"暗船"）或历史轨迹数据，可替换为以下方案。**同样只需修改 `aisStream.js` 中的 `connectAisStream` 函数，`useAisStream.js` 及地图组件无需改动。**

**MarineTraffic / Kpler AIS API**（https://www.kpler.com）
- 卫星 + 地面双源融合，覆盖率显著高于纯地面基站
- 提供历史轨迹 API，可实现真实的 24h 航迹回溯
- 按 API 调用量计费，基础套餐约 $10/月起

**Windward（影子船队追踪）**
- 通过行为分析识别关闭 AIS 的船只
- 可追踪制裁规避船只的历史活动轨迹
- 需企业合同

**Spire Maritime**（https://spire.com/maritime）
- 自有卫星星座，全球 AIS 覆盖率极高
- 提供 WebSocket 流式接口，可直接替换 aisstream.io 的接入方式

---

## 压力系数计算方法

```
行业通行压力系数 = 1 − (当前日均过境量 ÷ 历史基准日均值)
```

- **当前值**：来自 IMF PortWatch 最新一天的 `n_total`
- **历史基准**：IMF PortWatch 2022–2023 年 `n_total` 的日均值（动态从 API 获取）
- **含义**：0% 表示过境量与历史正常水平相当；86.67% 表示当前过境量仅为历史正常水平的 13.3%
- **代码位置**：`src/data/calc.js` → `calcPressureCoefficient()`

各商品压力系数采用相同公式，以各自船型的历史基准分别计算。

---

## 数据局限性说明

| 模块 | 当前精度 | 提升方向 |
|------|---------|---------|
| 每日统计 | 每周更新，滞后 3–7 天 | 接入 Kpler/Windward 实现日更 |
| 商品拆分（LNG/LPG/甲醇） | 按固定比例从 `n_tanker` 估算 | 接入 Kpler 商品级数据 |
| 实时船只位置 | 地面 AIS，存在覆盖盲区 | 接入卫星 AIS（Spire/MarineTraffic） |
| 暗船追踪 | 不支持 | 接入 Windward 行为分析 |
| 24h 航迹回溯 | 当前为模拟数据 | 接入 MarineTraffic 历史轨迹 API |

---

## 技术栈

- React 19 + Vite
- react-leaflet（地图）
- recharts（仪表盘图表）
- IMF PortWatch ArcGIS REST API
- aisstream.io WebSocket
