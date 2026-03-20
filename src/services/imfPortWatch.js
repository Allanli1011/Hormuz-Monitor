// IMF PortWatch — Daily Chokepoint Transit Calls
// Endpoint: ArcGIS FeatureServer (no auth required)
// Update frequency: weekly (Tuesdays)

const BASE_URL =
  'https://services9.arcgis.com/weJ1QsnbMYJlCHdG/ArcGIS/rest/services/Daily_Chokepoints_Data/FeatureServer/0/query';

const HORMUZ_FIELDS = 'date,n_total,n_tanker,n_container,n_dry_bulk,n_cargo,capacity_tanker,capacity';

function buildQuery(extraParams = {}) {
  const params = new URLSearchParams({
    where: "portname='Strait of Hormuz'",
    outFields: HORMUZ_FIELDS,
    orderByFields: 'date DESC',
    f: 'json',
    ...extraParams,
  });
  return `${BASE_URL}?${params}`;
}

function parseRecord(attr) {
  return {
    date: new Date(attr.date).toISOString().slice(0, 10),
    n_total: attr.n_total ?? 0,
    n_tanker: attr.n_tanker ?? 0,
    n_container: attr.n_container ?? 0,
    n_dry_bulk: attr.n_dry_bulk ?? 0,
    n_cargo: attr.n_cargo ?? 0,
    capacity_tanker: attr.capacity_tanker ?? 0,
    capacity: attr.capacity ?? 0,
  };
}

/**
 * 获取最近 N 天的过境数据
 */
export async function fetchRecentTransits(days = 90) {
  const url = buildQuery({ resultRecordCount: days });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`IMF PortWatch fetch failed: ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(`IMF PortWatch error: ${json.error.message}`);
  return json.features.map((f) => parseRecord(f.attributes));
}

/**
 * 获取指定日期范围的数据，用于计算历史基准
 * @param {string} startDate 'YYYY-MM-DD'
 * @param {string} endDate   'YYYY-MM-DD'
 */
export async function fetchHistoricalBaseline(startDate, endDate) {
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const url = buildQuery({
    where: `portname='Strait of Hormuz' AND date >= ${start} AND date <= ${end}`,
    resultRecordCount: 1000,
    orderByFields: 'date ASC',
  });
  const res = await fetch(url);
  if (!res.ok) throw new Error(`IMF PortWatch baseline fetch failed: ${res.status}`);
  const json = await res.json();
  if (json.error) throw new Error(`IMF PortWatch error: ${json.error.message}`);
  return json.features.map((f) => parseRecord(f.attributes));
}

/**
 * 由历史记录计算各船型日均基准
 */
export function computeBaseline(records) {
  if (!records.length) return null;
  const sum = records.reduce(
    (acc, r) => ({
      n_total: acc.n_total + r.n_total,
      n_tanker: acc.n_tanker + r.n_tanker,
      n_container: acc.n_container + r.n_container,
      n_dry_bulk: acc.n_dry_bulk + r.n_dry_bulk,
      n_cargo: acc.n_cargo + r.n_cargo,
    }),
    { n_total: 0, n_tanker: 0, n_container: 0, n_dry_bulk: 0, n_cargo: 0 }
  );
  const n = records.length;
  return {
    n_total: sum.n_total / n,
    n_tanker: sum.n_tanker / n,
    n_container: sum.n_container / n,
    n_dry_bulk: sum.n_dry_bulk / n,
    n_cargo: sum.n_cargo / n,
  };
}
