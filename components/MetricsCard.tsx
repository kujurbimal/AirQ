
import React from 'react';

interface MetricsCardProps {
  label: string;
  value: number | string;
  unit: string;
  status: 'good' | 'moderate' | 'poor';
}

const MetricsCard: React.FC<MetricsCardProps> = ({ label, value, unit, status }) => {
  const statusColors = {
    good: 'bg-green-100 text-green-700',
    moderate: 'bg-yellow-100 text-yellow-700',
    poor: 'bg-red-100 text-red-700',
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col items-center text-center">
      <span className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-2">{label}</span>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-slate-800">{value}</span>
        <span className="text-xs text-slate-400 font-medium">{unit}</span>
      </div>
      <div className={`mt-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${statusColors[status]}`}>
        {status}
      </div>
    </div>
  );
};

export default MetricsCard;
