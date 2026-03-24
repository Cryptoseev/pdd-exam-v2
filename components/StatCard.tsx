interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  colorClass?: string;
}

export function StatCard({ label, value, sub, colorClass = 'text-brand-blue' }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className={`text-2xl font-bold ${colorClass}`}>{value}</div>
      <div className="text-sm text-gray-700 dark:text-gray-300 font-medium mt-0.5">{label}</div>
      {sub && <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</div>}
    </div>
  );
}
