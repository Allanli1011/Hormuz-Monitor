import { calcPressureCoefficient, calcCommodityPressure, calcChangePercent } from './calc';

// 3月1日基准（用于计算"较03-01"的变化幅度）
const MAR1_BASELINE = {
  'UKMTO/JMIC': 21,
  'Windward': 7,
  'Kpler': 8,
};

// 当前各数据源最新过境数（模拟，后续替换为 API 数据）
const currentCounts = {
  'UKMTO/JMIC': { date: '2026-03-17', count: 4 },
  'Windward':   { date: '2026-03-16', count: 2 },
  'Kpler':      { date: '2026-03-17', count: 0 },
};

export const dailyStats = Object.entries(currentCounts).map(([source, { date, count }]) => ({
  source,
  date,
  count,
  changePercent: calcChangePercent(count, MAR1_BASELINE[source]),
}));

// 当前各商品每日过境数（模拟，后续替换为 aisstream.io 计数 + 船型映射）
const currentCommodityCounts = {
  '甲醇':              0.02,
  '原油及成品油':       2.6,
  '液化石油气（LPG）':  0.42,
  '化肥（尿素及磷肥）': 0.25,
  '液化天然气（LNG）':  0.96,
  '铝及铝制品':         0.21,
};

// 总过境量取三个数据源的均值
const avgCurrentDaily = (4 + 2 + 0) / 3;

export const pressureCoefficient = calcPressureCoefficient(avgCurrentDaily);

export const commodityPressure = calcCommodityPressure(currentCommodityCounts);

// Mock vessel data near Strait of Hormuz
export const vessels = [
  { id: 1, name: 'OCEAN FURY', lat: 26.5, lng: 56.3, type: 'tanker', speed: 12.3, heading: 270, status: 'Underway' },
  { id: 2, name: 'GULF STAR', lat: 26.8, lng: 56.8, type: 'tanker', speed: 10.1, heading: 90, status: 'Underway' },
  { id: 3, name: 'NEPTUNE 12', lat: 26.2, lng: 57.1, type: 'cargo', speed: 8.5, heading: 180, status: 'Underway' },
  { id: 4, name: 'HORMUZ PEARL', lat: 26.6, lng: 55.9, type: 'tanker', speed: 13.2, heading: 270, status: 'Underway' },
  { id: 5, name: 'AL MANSOORI', lat: 26.4, lng: 57.4, type: 'lng', speed: 11.0, heading: 90, status: 'Underway' },
  { id: 6, name: 'CASPIA', lat: 27.1, lng: 56.0, type: 'cargo', speed: 0, heading: 0, status: 'Anchored' },
  { id: 7, name: 'STANFORD PURA', lat: 26.3, lng: 56.6, type: 'tanker', speed: 9.8, heading: 270, status: 'Underway' },
  { id: 8, name: 'OCEAN PETTY', lat: 27.3, lng: 57.2, type: 'lpg', speed: 7.6, heading: 135, status: 'Underway' },
  { id: 9, name: 'BELL TOWER', lat: 26.9, lng: 55.5, type: 'tanker', speed: 14.1, heading: 270, status: 'Underway' },
  { id: 10, name: 'HARMONY OCEAN', lat: 26.1, lng: 57.8, type: 'cargo', speed: 6.2, heading: 45, status: 'Underway' },
  { id: 11, name: 'GOLDEN HORIZON', lat: 25.8, lng: 57.9, type: 'tanker', speed: 11.5, heading: 270, status: 'Underway' },
  { id: 12, name: 'TRAYCE', lat: 26.7, lng: 55.2, type: 'cargo', speed: 0, heading: 0, status: 'Anchored' },
  { id: 13, name: 'AL HANNAWI', lat: 26.0, lng: 56.9, type: 'tanker', speed: 10.3, heading: 90, status: 'Underway' },
  { id: 14, name: 'PORTLAND', lat: 26.5, lng: 55.0, type: 'lpg', speed: 8.9, heading: 270, status: 'Underway' },
  { id: 15, name: 'MILANO EXPLORER', lat: 26.2, lng: 55.7, type: 'cargo', speed: 9.1, heading: 180, status: 'Underway' },
];

// Track history for 24h replay (simplified path)
export const trackHistory = {
  1: [
    { lat: 25.8, lng: 58.2, time: '2026-03-17 08:00' },
    { lat: 25.9, lng: 57.8, time: '2026-03-17 10:00' },
    { lat: 26.1, lng: 57.3, time: '2026-03-17 12:00' },
    { lat: 26.3, lng: 56.8, time: '2026-03-17 14:00' },
    { lat: 26.5, lng: 56.3, time: '2026-03-17 16:00' },
  ],
  2: [
    { lat: 26.9, lng: 55.1, time: '2026-03-17 08:00' },
    { lat: 26.8, lng: 55.7, time: '2026-03-17 10:00' },
    { lat: 26.8, lng: 56.3, time: '2026-03-17 12:00' },
    { lat: 26.8, lng: 56.8, time: '2026-03-17 16:00' },
  ],
};
