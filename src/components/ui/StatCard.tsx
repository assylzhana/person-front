import { cn } from '../../utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color?: 'blue' | 'emerald' | 'violet' | 'amber' | 'rose' | 'primary';
  className?: string;
}

const colorMap = {
  blue:    { icon: 'bg-blue-600/20 text-blue-400' },
  emerald: { icon: 'bg-emerald-600/20 text-emerald-400' },
  violet:  { icon: 'bg-violet-600/20 text-violet-400' },
  amber:   { icon: 'bg-amber-600/20 text-amber-400' },
  rose:    { icon: 'bg-rose-600/20 text-rose-400' },
  primary: { icon: 'bg-primary-600/20 text-primary-400' },
};

export function StatCard({ title, value, subtitle, icon, trend, color = 'blue', className }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={cn('card flex items-start justify-between gap-3', className)}>
      <div className="flex-1 min-w-0">
        <p className="text-xs sm:text-sm text-slate-500 font-medium leading-tight">{title}</p>
        <p className="text-xl sm:text-2xl font-bold text-slate-100 mt-1 break-all">{value}</p>
        {subtitle && <p className="text-xs text-slate-500 mt-0.5 leading-tight">{subtitle}</p>}
        {trend && (
          <p className={cn('text-xs font-medium mt-1', trend.value >= 0 ? 'text-emerald-400' : 'text-rose-400')}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
          </p>
        )}
      </div>
      <div className={cn('p-2 sm:p-2.5 rounded-xl flex-shrink-0', c.icon)}>
        {icon}
      </div>
    </div>
  );
}
