import { cn } from '../../utils/cn';

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: 'primary' | 'emerald' | 'amber' | 'rose' | 'blue' | 'violet';
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const colors = {
  primary: 'bg-primary-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  rose: 'bg-rose-500',
  blue: 'bg-blue-500',
  violet: 'bg-violet-500',
};

const sizes = { sm: 'h-1.5', md: 'h-2.5', lg: 'h-4' };

export function ProgressBar({ value, max = 100, color = 'primary', size = 'md', showLabel, className }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <div className={cn('w-full', className)}>
      <div className={cn('w-full bg-slate-800 rounded-full overflow-hidden', sizes[size])}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', colors[color])}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-slate-500 mt-1 text-right">{Math.round(pct)}%</p>
      )}
    </div>
  );
}
