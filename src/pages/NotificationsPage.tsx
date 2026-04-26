import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { notificationsApi } from '../api/notifications';
import { PageHeader } from '../components/layout/PageHeader';
import { PageLoader } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { toast } from '../components/ui/Toast';
import type { Notification, NotificationType } from '../types';
import { Bell, CheckCheck, Target, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { cn } from '../utils/cn';
import { formatDateTime } from '../utils/format';

const typeConfig: Record<NotificationType, { icon: React.ReactNode; color: string; bg: string }> = {
  GOAL_DEADLINE: { icon: <AlertTriangle className="h-4 w-4" />, color: 'text-amber-400', bg: 'bg-amber-600/20' },
  GOAL_EXPIRED:  { icon: <Target className="h-4 w-4" />,       color: 'text-rose-400',  bg: 'bg-rose-600/20' },
  GOAL_COMPLETED:{ icon: <CheckCircle className="h-4 w-4" />,  color: 'text-emerald-400', bg: 'bg-emerald-600/20' },
  SYSTEM:        { icon: <Info className="h-4 w-4" />,          color: 'text-blue-400',  bg: 'bg-blue-600/20' },
};

function NotifCard({ notif, onRead }: { notif: Notification; onRead: () => void }) {
  const { icon, color, bg } = typeConfig[notif.type];
  const isUnread = notif.status === 'UNREAD';
  return (
    <div
      className={cn(
        'card flex items-start gap-4 transition-all cursor-pointer',
        isUnread ? 'border-slate-700 hover:border-primary-600/30' : 'opacity-70 hover:opacity-90'
      )}
      onClick={() => isUnread && onRead()}
    >
      <div className={cn('p-2.5 rounded-xl flex-shrink-0', bg, color)}>{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('font-semibold text-sm', isUnread ? 'text-slate-100' : 'text-slate-400')}>{notif.title}</p>
          {isUnread && <span className="h-2 w-2 rounded-full bg-primary-500 flex-shrink-0 mt-1.5" />}
        </div>
        <p className={cn('text-sm mt-0.5', isUnread ? 'text-slate-300' : 'text-slate-500')}>{notif.message}</p>
        <p className="text-xs text-slate-600 mt-1">{formatDateTime(notif.createdAt)}</p>
      </div>
    </div>
  );
}

export function NotificationsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationsApi.getAll,
  });

  const readMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  const readAllMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
      toast.success(t('notifications.allReadSuccess'));
    },
  });

  const unreadCount = notifications.filter(n => n.status === 'UNREAD').length;

  if (isLoading) return <PageLoader />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        title={t('notifications.title')}
        subtitle={unreadCount > 0 ? t('notifications.unreadCount', { count: unreadCount }) : t('notifications.allRead')}
        action={
          unreadCount > 0 ? (
            <button
              onClick={() => readAllMutation.mutate()}
              disabled={readAllMutation.isPending}
              className="btn-secondary flex items-center gap-2"
            >
              <CheckCheck className="h-4 w-4" /> {t('notifications.markAllRead')}
            </button>
          ) : undefined
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-10 w-10" />}
          title={t('notifications.empty')}
          description={t('notifications.emptyDesc')}
        />
      ) : (
        <div className="space-y-3 max-w-2xl">
          {notifications.map(notif => (
            <NotifCard
              key={notif.id}
              notif={notif}
              onRead={() => readMutation.mutate(notif.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
