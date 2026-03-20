import { usePortWatchData } from './hooks/usePortWatchData';
import DailyStats from './components/DailyStats';
import PressureIndex from './components/PressureIndex';
import VesselMap from './components/VesselMap';
import './App.css';

export default function App() {
  const {
    dailyStats,
    pressureCoefficient,
    commodityPressure,
    loading,
    error,
  } = usePortWatchData();

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">霍尔木兹海峡航运监控</h1>
      </header>
      <main className="app-main">
        <DailyStats stats={dailyStats} loading={loading} error={error} />
        <PressureIndex
          pressureCoefficient={pressureCoefficient}
          commodityPressure={commodityPressure}
          loading={loading}
          error={error}
        />
        <VesselMap />
      </main>
    </div>
  );
}
