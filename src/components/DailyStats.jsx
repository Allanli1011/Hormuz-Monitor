export default function DailyStats({ stats, loading, error }) {
  if (loading) return (
    <section className="section">
      <h2 className="section-title">每日船只通行统计</h2>
      <div className="loading-placeholder">加载中…</div>
    </section>
  );

  if (error) return (
    <section className="section">
      <h2 className="section-title">每日船只通行统计</h2>
      <div className="error-msg">{error}</div>
    </section>
  );

  return (
    <section className="section">
      <h2 className="section-title">每日船只通行统计</h2>
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div key={i} className="stat-card">
            <div className="stat-source">
              {stat.source}
            </div>
            <div className="stat-sublabel">{stat.subLabel}</div>
            <div className="stat-date">{stat.date}</div>
            <div className="stat-count">
              {stat.count}<span className="stat-unit">艘</span>
            </div>
            <div className={`stat-change ${stat.changePercent <= 0 ? 'negative' : 'positive'}`}>
              较30日前 {stat.changePercent > 0 ? '+' : ''}{stat.changePercent.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
      <p className="disclaimer">数据来源：IMF PortWatch（卫星 AIS，每周更新）</p>
    </section>
  );
}
