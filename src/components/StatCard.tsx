'use client';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: string;
  subtitle?: string;
}

export default function StatCard({ label, value, icon, color = 'text-blue-400', subtitle }: StatCardProps) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`p-3 rounded-lg bg-slate-700/50 ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-slate-400 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}
