import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { vessels, trackHistory } from '../data/mockData';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TYPE_COLORS = {
  tanker: '#e53935',
  cargo: '#1e88e5',
  lng: '#8e24aa',
  lpg: '#fb8c00',
};

function createVesselIcon(type, status) {
  const color = TYPE_COLORS[type] || '#555';
  const opacity = status === 'Anchored' ? 0.6 : 1;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 14 14">
      <polygon points="7,1 13,13 7,10 1,13" fill="${color}" opacity="${opacity}" stroke="white" stroke-width="1"/>
    </svg>
  `;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

function TrackLines() {
  return (
    <>
      {Object.entries(trackHistory).map(([id, points]) => (
        <Polyline
          key={id}
          positions={points.map((p) => [p.lat, p.lng])}
          color="#1e88e5"
          weight={2}
          opacity={0.7}
          dashArray="4 4"
        />
      ))}
    </>
  );
}

function ReplayAnimation({ playing }) {
  // Simple replay: just show tracks when playing
  return null;
}

export default function VesselMap() {
  const [tab, setTab] = useState('realtime');
  const [playing, setPlaying] = useState(false);

  const center = [26.5, 56.5];
  const zoom = 7;

  return (
    <section className="section">
      <div className="map-header">
        <h2 className="section-title">船只地图动态标记</h2>
        <div className="tab-group">
          <button
            className={`tab-btn ${tab === 'track' ? 'active' : ''}`}
            onClick={() => setTab('track')}
          >
            24h航迹回溯
          </button>
          <button
            className={`tab-btn ${tab === 'realtime' ? 'active' : ''}`}
            onClick={() => setTab('realtime')}
          >
            实时快照
          </button>
        </div>
      </div>

      {tab === 'track' && (
        <div className="replay-controls">
          <button className="replay-btn" onClick={() => setPlaying((p) => !p)}>
            {playing ? '⏸ 暂停' : '▶ 播放航迹'}
          </button>
          <span className="replay-hint">显示过去24小时船只轨迹</span>
        </div>
      )}

      <div className="map-container">
        <MapContainer
          center={center}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          {tab === 'track' && <TrackLines />}
          {vessels.map((v) => (
            <Marker
              key={v.id}
              position={[v.lat, v.lng]}
              icon={createVesselIcon(v.type, v.status)}
            >
              <Popup>
                <div className="vessel-popup">
                  <strong>{v.name}</strong>
                  <div>类型: {v.type.toUpperCase()}</div>
                  <div>速度: {v.speed} kn</div>
                  <div>状态: {v.status}</div>
                  {v.heading > 0 && <div>航向: {v.heading}°</div>}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="map-legend">
        <div className="legend-title">图例</div>
        <div className="legend-items">
          {Object.entries(TYPE_COLORS).map(([type, color]) => (
            <div key={type} className="legend-item">
              <span className="legend-dot" style={{ background: color }} />
              <span>{type.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>

      <p className="disclaimer">来源：OpenStreetMap + 模拟船只数据</p>
    </section>
  );
}
