'use client';

interface ScoreRingProps {
  score: number;
  size?: number;
}

export default function ScoreRing({ score, size = 120 }: ScoreRingProps) {
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const getColor = () => {
    if (score >= 80) return '#22c55e';
    if (score >= 60) return '#eab308';
    if (score >= 40) return '#f97316';
    return '#ef4444';
  };

  const getLabel = () => {
    if (score >= 80) return '우수';
    if (score >= 60) return '양호';
    if (score >= 40) return '주의';
    return '개선 필요';
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="#334155"
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 1s ease-out' }}
          />
        </svg>
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
        >
          <div className="text-3xl font-bold" style={{ color: getColor() }}>{score}</div>
        </div>
      </div>
      <span className="text-sm font-medium" style={{ color: getColor() }}>{getLabel()}</span>
    </div>
  );
}
