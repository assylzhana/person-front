import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Target, Wallet, BarChart3, Brain, Users, Bell,
  User, LogOut, Zap, X,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../../api/notifications';
import { usersApi } from '../../api/users';
import { cn } from '../../utils/cn';
import { useTranslation } from 'react-i18next';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const { logout, userEmail } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    { to: '/goals',     icon: Target,           label: t('nav.goals') },
    { to: '/finance',   icon: Wallet,            label: t('nav.finance') },
    { to: '/analytics', icon: BarChart3,          label: t('nav.analytics') },
    { to: '/tests',     icon: Brain,             label: t('nav.tests') },
    { to: '/friends',   icon: Users,             label: t('nav.friends') },
    { to: '/notifications', icon: Bell,          label: t('nav.notifications') },
    { to: '/profile',   icon: User,              label: t('nav.profile') },
  ];

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-count'],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: 30000,
  });

  const { data: pendingRequests = [] } = useQuery({
    queryKey: ['pending-requests'],
    queryFn: usersApi.getPendingRequests,
    refetchInterval: 60000,
  });
  const pendingCount = pendingRequests.length;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarContent = (
    <aside className="h-full w-60 bg-slate-950 border-r border-slate-800/50 flex flex-col">
      <div className="px-4 py-5 border-b border-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-600 rounded-xl">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-100">Person</p>
              <p className="text-xs text-slate-500">{t('brand.tagline')}</p>
            </div>
          </div>
          <button onClick={onClose} className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link'}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1">{label}</span>
            {to === '/notifications' && unreadCount > 0 && (
              <span className="bg-primary-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
            {to === '/friends' && pendingCount > 0 && (
              <span className="bg-rose-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-slate-800/50 space-y-2">
        <div className="px-3">
          <LanguageSwitcher />
        </div>
        <div className="px-3 py-1">
          <p className="text-xs text-slate-500 truncate">{userEmail}</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400 hover:bg-rose-600/10 hover:text-rose-300 transition-all duration-200 font-medium text-sm"
        >
          <LogOut className="h-4 w-4" />
          {t('common.logout')}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      <div className="hidden lg:flex fixed left-0 top-0 h-screen w-60 z-40">
        {sidebarContent}
      </div>
      <div className={cn('lg:hidden fixed inset-0 z-50 flex transition-all duration-300', open ? 'visible' : 'invisible')}>
        <div className={cn('absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300', open ? 'opacity-100' : 'opacity-0')} onClick={onClose} />
        <div className={cn('relative w-60 h-full transition-transform duration-300 ease-out', open ? 'translate-x-0' : '-translate-x-full')}>
          {sidebarContent}
        </div>
      </div>
    </>
  );
}
