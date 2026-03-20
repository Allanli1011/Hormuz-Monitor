import { dailyStats } from '../data/mockData';

export default function DailyStats() {
  return (
    <section className="section">
      <h2 className="section-title">每日船只通行统计</h2>
      <div className="stats-grid">
        {dailyStats.map((stat) => (
          <div key={stat.source} className="stat-card">
            <div className="stat-source">
              {stat.source} <span className="info-icon">?</span>
            </div>
            <div className="stat-date">{stat.date}</div>
            <div className="stat-count">{stat.count}<span className="stat-unit">艘</span></div>
            <div className={`stat-change ${stat.changePercent < 0 ? 'negative' : 'positive'}`}>
              较03-01 {stat.changePercent > 0 ? '+' : ''}{stat.changePercent.toFixed(1)}%
            </div>
          </div>
        ))}
      </div>
      <p className="disclaimer">注释：不同机构的统计口径不尽相同，故统计结果可能不完全一致。</p>
    </section>
  );
}
