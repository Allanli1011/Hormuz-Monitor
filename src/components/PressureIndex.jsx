import GaugeChart from './GaugeChart';
import { pressureCoefficient, commodityPressure } from '../data/mockData';

export default function PressureIndex() {
  return (
    <section className="section">
      <div className="pressure-header">
        <div>
          <div className="pressure-title-row">
            <h2 className="section-title" style={{ marginBottom: 4 }}>行业通行压力系数</h2>
            <span className="info-icon" style={{ marginLeft: 6 }}>?</span>
          </div>
          <div className="pressure-value">{pressureCoefficient.toFixed(2)}%</div>
        </div>
        <GaugeChart value={pressureCoefficient} />
      </div>
      <div className="commodity-grid">
        {commodityPressure.map((item) => (
          <div key={item.name} className="commodity-card">
            <div className="commodity-name">{item.name}</div>
            <div className="commodity-value">{item.value.toFixed(1)}%</div>
          </div>
        ))}
      </div>
    </section>
  );
}
