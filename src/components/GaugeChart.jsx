import { PieChart, Pie, Cell } from 'recharts';

const RADIAN = Math.PI / 180;

// Arc segments: green (0-60%), yellow-green (60-75%), yellow (75-85%), orange (85-95%), red (95-100%)
const segments = [
  { limit: 60, color: '#4caf50' },
  { limit: 75, color: '#8bc34a' },
  { limit: 85, color: '#ffeb3b' },
  { limit: 95, color: '#ff9800' },
  { limit: 100, color: '#f44336' },
];

function buildGaugeData() {
  const data = [];
  let prev = 0;
  for (const seg of segments) {
    data.push({ value: seg.limit - prev, color: seg.color });
    prev = seg.limit;
  }
  // empty half
  data.push({ value: 100, color: 'transparent' });
  return data;
}

const gaugeData = buildGaugeData();

function getNeedleCoords(value, cx, cy, r) {
  // value: 0-100, mapped to 180deg..0deg (left to right)
  const angle = 180 - (value / 100) * 180;
  const rad = angle * RADIAN;
  return {
    x: cx + r * Math.cos(rad),
    y: cy - r * Math.sin(rad),
  };
}

export default function GaugeChart({ value = 86.67 }) {
  const cx = 100;
  const cy = 100;
  const r = 70;
  const needle = getNeedleCoords(value, cx, cy, r);

  return (
    <div style={{ position: 'relative', width: 200, height: 110 }}>
      <PieChart width={200} height={110}>
        <Pie
          data={gaugeData}
          cx={cx}
          cy={cy}
          startAngle={180}
          endAngle={0}
          innerRadius={50}
          outerRadius={r}
          dataKey="value"
          strokeWidth={0}
          isAnimationActive={false}
        >
          {gaugeData.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
      </PieChart>
      <svg
        style={{ position: 'absolute', top: 0, left: 0 }}
        width={200}
        height={110}
      >
        {/* needle */}
        <line
          x1={cx}
          y1={cy}
          x2={needle.x}
          y2={needle.y}
          stroke="#1565c0"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={6} fill="#1565c0" />
      </svg>
    </div>
  );
}
