import { Outlet } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { ToastContainer } from '../ui/Toast';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { useTranslation } from 'react-i18next';

export function AuthLayout() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary-600 rounded-xl">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-slate-100">Person</p>
              <p className="text-sm text-slate-500">{t('brand.tagline')}</p>
            </div>
          </div>
          <LanguageSwitcher />
        </div>
        <div className="card">
          <Outlet />
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
