import { useState, useEffect, useRef } from 'react';
import { connectAisStream } from '../services/aisStream';

const API_KEY = import.meta.env.VITE_AISSTREAM_API_KEY;

/**
 * 管理 aisstream.io WebSocket 连接，返回实时船只列表
 * 若无 API Key 则返回空列表（UI 降级为 mock 数据）
 */
export function useAisStream() {
  const [vessels, setVessels] = useState({});   // mmsi → vessel
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!API_KEY) {
      setError('未配置 VITE_AISSTREAM_API_KEY，地图使用模拟数据');
      return;
    }

    const close = connectAisStream(API_KEY, {
      onConnect: () => setConnected(true),
      onError: (err) => setError(err.message),
      onVessel: (vessel) => {
        setVessels((prev) => {
          const existing = prev[vessel.mmsi] ?? {};
          // 合并 PositionReport 和 ShipStaticData 字段
          return {
            ...prev,
            [vessel.mmsi]: {
              ...existing,
              ...Object.fromEntries(
                Object.entries(vessel).filter(([, v]) => v != null)
              ),
            },
          };
        });
      },
    });

    closeRef.current = close;
    return () => close();
  }, []);

  // 转为数组，过滤掉坐标无效的条目
  const vesselList = Object.values(vessels).filter(
    (v) => v.lat && v.lng && Math.abs(v.lat) <= 90 && Math.abs(v.lng) <= 180
  );

  return { vessels: vesselList, connected, error, hasApiKey: !!API_KEY };
}
