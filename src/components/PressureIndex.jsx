import GaugeChart from './GaugeChart';

export default function PressureIndex({ pressureCoefficient, commodityPressure, loading, error }) {
  if (loading) return (
    <section className="section">
      <h2 className="section-title">行业通行压力系数</h2>
      <div className="loading-placeholder">加载中…</div>
    </section>
  );

  if (error || pressureCoefficient == null) return (
    <section className="section">
      <h2 className="section-title">行业通行压力系数</h2>
      <div className="error-msg">{error ?? '暂无数据'}</div>
    </section>
  );

  return (
    <section className="section">
      <div className="pressure-header">
        <div>
          <div className="pressure-title-row">
            <h2 className="section-title" style={{ marginBottom: 4 }}>行业通行压力系数</h2>
            <span className="info-icon" style={{ marginLeft: 6 }} title="1 - (当前过境量 / 2022-2023年均值)">?</span>
          </div>
          <div className="pressure-value">{pressureCoefficient.toFixed(2)}%</div>
        </div>
        <GaugeChart value={pressureCoefficient} />
      </div>
      {commodityPressure?.length > 0 && (
        <div className="commodity-grid">
          {commodityPressure.map((item) => (
            <div key={item.name} className="commodity-card">
              <div className="commodity-name">{item.name}</div>
              <div className="commodity-value">{item.value.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      )}
      <p className="disclaimer" style={{ marginTop: 10 }}>
        压力系数 = 1 − (当前过境量 ÷ 2022-2023日均基准)，数据来源：IMF PortWatch
      </p>
    </section>
  );
}
