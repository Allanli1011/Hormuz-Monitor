// 历史基准：2022-2023 年霍尔木兹海峡日均过境船只数（来源：JMIC/IMF PortWatch）
export const BASELINE_DAILY = 138;

// 各商品船型的历史基准（占总过境量的比例，基于 EIA/Kpler 历史数据估算）
export const COMMODITY_BASELINES = {
  '甲醇':          { dailyCount: 2.1 },
  '原油及成品油':   { dailyCount: 58.0 },
  '液化石油气（LPG）': { dailyCount: 8.5 },
  '化肥（尿素及磷肥）': { dailyCount: 3.2 },
  '液化天然气（LNG）': { dailyCount: 12.0 },
  '铝及铝制品':    { dailyCount: 1.8 },
};

/**
 * 计算行业通行压力系数
 * 压力系数 = 1 - (当前过境量 / 历史基准均值)
 * 含义：过境越少 → 压力越高 → 系数越大
 * @param {number} currentDaily  当前日均过境船只数
 * @param {number} [baselineDaily] 历史基准（默认用 BASELINE_DAILY 静态值）
 * @returns {number} 压力系数百分比 (0-100)
 */
export function calcPressureCoefficient(currentDaily, baselineDaily = BASELINE_DAILY) {
  const ratio = currentDaily / baselineDaily;
  return Math.min(100, Math.max(0, (1 - ratio) * 100));
}

/**
 * 计算各商品的压力系数
 * @param {Record<string, number>} currentCommodityCounts 各商品当前日均过境数
 * @returns {Array<{name, value}>}
 */
export function calcCommodityPressure(currentCommodityCounts) {
  return Object.entries(COMMODITY_BASELINES).map(([name, { dailyCount }]) => {
    const current = currentCommodityCounts[name] ?? 0;
    const value = Math.min(100, Math.max(0, (1 - current / dailyCount) * 100));
    return { name, value };
  });
}

/**
 * 计算与基准日的变化百分比
 * @param {number} current 当前值
 * @param {number} baseline 基准值（如3月1日的数值）
 * @returns {number} 变化百分比
 */
export function calcChangePercent(current, baseline) {
  if (baseline === 0) return 0;
  return ((current - baseline) / baseline) * 100;
}
