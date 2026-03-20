// aisstream.io — 实时 AIS 数据 WebSocket
// 免费注册获取 API Key: https://aisstream.io
// 文档: https://aisstream.io/documentation

// 霍尔木兹海峡地理范围 [minLat, minLon], [maxLat, maxLon]
export const HORMUZ_BBOX = [[22.0, 55.5], [27.5, 60.5]];

const WS_URL = 'wss://stream.aisstream.io/v0/stream';

// AIS 船型代码 → 内部类型
const AIS_TYPE_MAP = [
  { range: [80, 89], type: 'tanker' },
  { range: [83, 83], type: 'tanker_lng' },   // Hazardous A (LNG/LPG)
  { range: [84, 84], type: 'tanker_lpg' },
  { range: [70, 79], type: 'cargo' },
  { range: [60, 69], type: 'passenger' },
  { range: [30, 30], type: 'fishing' },
];

export function getVesselType(shipTypeCode) {
  for (const { range, type } of AIS_TYPE_MAP) {
    if (shipTypeCode >= range[0] && shipTypeCode <= range[1]) return type;
  }
  return 'other';
}

/**
 * 建立 aisstream.io WebSocket 连接
 *
 * @param {string} apiKey  aisstream.io API Key (VITE_AISSTREAM_API_KEY)
 * @param {object} handlers
 * @param {function} handlers.onVessel   收到船只位置时回调 (vessel) => void
 * @param {function} handlers.onConnect  连接成功回调
 * @param {function} handlers.onError    错误回调 (err) => void
 * @returns {function} close — 关闭连接的函数
 */
export function connectAisStream(apiKey, { onVessel, onConnect, onError } = {}) {
  const ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    ws.send(
      JSON.stringify({
        APIKey: apiKey,
        BoundingBoxes: [HORMUZ_BBOX],
        FilterMessageTypes: ['PositionReport', 'ShipStaticData'],
      })
    );
    onConnect?.();
  };

  ws.onmessage = (evt) => {
    try {
      const msg = JSON.parse(evt.data);
      const type = msg.MessageType;

      if (type === 'PositionReport') {
        const p = msg.Message.PositionReport;
        const meta = msg.MetaData;
        onVessel?.({
          mmsi: meta.MMSI,
          name: meta.ShipName?.trim() || `MMSI:${meta.MMSI}`,
          lat: p.Latitude,
          lng: p.Longitude,
          speed: p.Sog,
          heading: p.TrueHeading < 360 ? p.TrueHeading : p.Cog,
          status: p.NavigationalStatus === 1 ? 'Anchored' : 'Underway',
          type: 'unknown', // 由 ShipStaticData 补充
          shipTypeCode: null,
        });
      } else if (type === 'ShipStaticData') {
        const s = msg.Message.ShipStaticData;
        const meta = msg.MetaData;
        onVessel?.({
          mmsi: meta.MMSI,
          name: s.Name?.trim() || `MMSI:${meta.MMSI}`,
          lat: meta.latitude,
          lng: meta.longitude,
          speed: null,
          heading: null,
          status: null,
          type: getVesselType(s.Type ?? 0),
          shipTypeCode: s.Type,
        });
      }
    } catch (e) {
      // 忽略单条解析错误
    }
  };

  ws.onerror = (e) => onError?.(new Error('AIS WebSocket error'));
  ws.onclose = () => {};

  return () => ws.close();
}
