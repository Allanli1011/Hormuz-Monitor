import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAisStream } from '../hooks/useAisStream';
import { vessels as mockVessels, trackHistory } from '../data/mockData';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TYPE_COLORS = {
  tanker: '#e53935',
  tanker_lng: '#8e24aa',
  tanker_lpg: '#fb8c00',
  cargo: '#1e88e5',
  passenger: '#00897b',
  fishing: '#43a047',
  other: '#757575',
  // mock fallback types
  lng: '#8e24aa',
  lpg: '#fb8c00',
};

function createVesselIcon(type, status) {
  const color = TYPE_COLORS[type] || '#757575';
  const opacity = status === 'Anchored' ? 0.6 : 1;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14">
    <polygon points="7,1 13,13 7,10 1,13" fill="${color}" opacity="${opacity}" stroke="white" stroke-width="1"/>
  </svg>`;
  return L.divIcon({ html: svg, className: '', iconSize: [14, 14], iconAnchor: [7, 7] });
}

export default function VesselMap() {
  const [tab, setTab] = useState('realtime');
  const { vessels: liveVessels, connected, error: aisError, hasApiKey } = useAisStream();

  const displayVessels = hasApiKey && liveVessels.length > 0 ? liveVessels : mockVessels;
  const isLive = hasApiKey && liveVessels.length > 0;

  return (
    <section className="section">
      <div className="map-header">
        <div>
          <h2 className="section-title">船只地图动态标记</h2>
          {isLive && (
            <span className="live-badge">● 实时</span>
          )}
        </div>
        <div className="tab-group">
          <button className={`tab-btn ${tab === 'track' ? 'active' : ''}`} onClick={() => setTab('track')}>
            24h航迹回溯
          </button>
          <button className={`tab-btn ${tab === 'realtime' ? 'active' : ''}`} onClick={() => setTab('realtime')}>
            实时快照
          </button>
        </div>
      </div>

      {aisError && (
        <div className="info-banner">{aisError}</div>
      )}

      <div className="map-container">
        <MapContainer center={[26.5, 56.5]} zoom={7} style={{ height: '100%', width: '100%' }} scrollWheelZoom>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          {tab === 'track' && Object.entries(trackHistory).map(([id, points]) => (
            <Polyline key={id} positions={points.map((p) => [p.lat, p.lng])}
              color="#1e88e5" weight={2} opacity={0.7} dashArray="4 4" />
          ))}
          {displayVessels.map((v, i) => (
            <Marker key={v.mmsi ?? v.id ?? i} position={[v.lat, v.lng]} icon={createVesselIcon(v.type, v.status)}>
              <Popup>
                <div className="vessel-popup">
                  <strong>{v.name}</strong>
                  <div>类型: {v.type?.toUpperCase()}</div>
                  {v.speed != null && <div>速度: {v.speed} kn</div>}
                  {v.status && <div>状态: {v.status}</div>}
                  {v.heading > 0 && <div>航向: {v.heading}°</div>}
                  {v.mmsi && <div>MMSI: {v.mmsi}</div>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="map-legend">
        <span className="legend-title">图例</span>
        <div className="legend-items">
          {[['tanker','油轮'],['tanker_lng','LNG'],['tanker_lpg','LPG'],['cargo','货船']].map(([type, label]) => (
            <div key={type} className="legend-item">
              <span className="legend-dot" style={{ background: TYPE_COLORS[type] }} />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="disclaimer">
        {isLive
          ? `来源：aisstream.io 实时 AIS，显示 ${liveVessels.length} 艘船`
          : '来源：OpenStreetMap + 模拟船只数据（配置 VITE_AISSTREAM_API_KEY 启用实时数据）'}
      </p>
    </section>
  );
}
