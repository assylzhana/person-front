import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '../ui/Toast';
import { Menu, Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../../api/notifications';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  const pageTitles: Record<string, string> = {
    '/dashboard':     t('nav.dashboard'),
    '/goals':         t('nav.goals'),
    '/finance':       t('nav.finance'),
    '/analytics':     t('nav.analytics'),
    '/tests':         t('nav.tests'),
    '/friends':       t('nav.friends'),
    '/notifications': t('nav.notifications'),
    '/profile':       t('nav.profile'),
  };

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-count'],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 30000,
  });

  return (
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-h-screen lg:ml-60">
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800/50">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
            <Menu className="h-5 w-5" />
          </button>
          <p className="text-sm font-semibold text-slate-100">{pageTitles[location.pathname] ?? 'Person'}</p>
          <Link to="/notifications" className="relative p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-primary-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
        </header>
        <main className="flex-1 px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      <ToastContainer />
    </div>
  );
}
