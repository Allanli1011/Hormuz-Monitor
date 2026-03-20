import { useState, useEffect } from 'react';
import {
  fetchRecentTransits,
  fetchHistoricalBaseline,
  computeBaseline,
} from '../services/imfPortWatch';
import { calcPressureCoefficient, calcChangePercent } from '../data/calc';

// 历史基准期：2022-01-01 ~ 2023-12-31
const BASELINE_START = '2022-01-01';
const BASELINE_END   = '2023-12-31';

// 商品/船型压力映射（IMF PortWatch 字段 → 商品名）
function buildCommodityPressure(latest, baseline) {
  if (!baseline) return [];
  return [
    { name: '原油及成品油',       current: latest.n_tanker,    base: baseline.n_tanker },
    { name: '液化天然气（LNG）',  current: latest.n_tanker * 0.20, base: baseline.n_tanker * 0.20 },
    { name: '液化石油气（LPG）',  current: latest.n_tanker * 0.15, base: baseline.n_tanker * 0.15 },
    { name: '甲醇',               current: latest.n_tanker * 0.05, base: baseline.n_tanker * 0.05 },
    { name: '化肥（尿素及磷肥）', current: latest.n_dry_bulk,  base: baseline.n_dry_bulk },
    { name: '铝及铝制品',         current: latest.n_cargo,     base: baseline.n_cargo },
  ].map(({ name, current, base }) => ({
    name,
    value: base > 0 ? Math.min(100, Math.max(0, (1 - current / base) * 100)) : 0,
  }));
}

export function usePortWatchData() {
  const [state, setState] = useState({
    dailyStats: null,
    pressureCoefficient: null,
    commodityPressure: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // 并行请求近期数据 + 历史基准
        const [recent, historical] = await Promise.all([
          fetchRecentTransits(60),
          fetchHistoricalBaseline(BASELINE_START, BASELINE_END),
        ]);

        if (cancelled) return;

        const baseline = computeBaseline(historical);
        const latest = recent[0]; // 最新一天
        // 找30天前的数据作为"较近期基准"显示变化幅度
        const thirtyDaysAgo = recent[29] ?? recent[recent.length - 1];

        const dailyStats = [
          {
            source: 'IMF PortWatch',
            date: latest.date,
            count: latest.n_total,
            changePercent: calcChangePercent(latest.n_total, thirtyDaysAgo.n_total),
            subLabel: '全船型',
          },
          {
            source: 'IMF PortWatch',
            date: latest.date,
            count: latest.n_tanker,
            changePercent: calcChangePercent(latest.n_tanker, thirtyDaysAgo.n_tanker),
            subLabel: '油轮',
          },
          {
            source: 'IMF PortWatch',
            date: latest.date,
            count: latest.n_dry_bulk + latest.n_cargo,
            changePercent: calcChangePercent(
              latest.n_dry_bulk + latest.n_cargo,
              thirtyDaysAgo.n_dry_bulk + thirtyDaysAgo.n_cargo
            ),
            subLabel: '散货/杂货',
          },
        ];

        const pressureCoefficient = baseline
          ? calcPressureCoefficient(latest.n_total, baseline.n_total)
          : null;

        const commodityPressure = buildCommodityPressure(latest, baseline);

        setState({
          dailyStats,
          pressureCoefficient,
          commodityPressure,
          recentRecords: recent,
          loading: false,
          error: null,
        });
      } catch (err) {
        if (!cancelled) {
          setState((s) => ({ ...s, loading: false, error: err.message }));
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return state;
}
