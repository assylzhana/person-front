import { cn } from '../../utils/cn';
import { useTranslation } from 'react-i18next';

interface SpinnerProps { size?: 'sm' | 'md' | 'lg'; className?: string; }

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-10 w-10' };
  return <div className={cn('animate-spin rounded-full border-2 border-slate-700 border-t-primary-500', sizes[size], className)} />;
}

export function PageLoader() {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <p className="text-slate-500 text-sm">{t('common.loading')}</p>
      </div>
    </div>
  );
}
