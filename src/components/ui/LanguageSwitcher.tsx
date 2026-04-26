import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';

const LANGS = [
  { code: 'ru', label: 'РУС' },
  { code: 'en', label: 'ENG' },
  { code: 'kk', label: 'ҚАЗ' },
];

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation();

  return (
    <div className={cn('flex items-center gap-1', compact ? 'gap-0.5' : 'gap-1')}>
      {LANGS.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => i18n.changeLanguage(code)}
          className={cn(
            'text-xs font-semibold px-2 py-1 rounded-lg transition-all duration-200',
            i18n.language === code
              ? 'bg-primary-600 text-white'
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
