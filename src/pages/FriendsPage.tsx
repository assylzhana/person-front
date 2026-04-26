import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../api/users';
import { useAuthStore } from '../stores/authStore';
import { PageHeader } from '../components/layout/PageHeader';
import { PageLoader } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { toast } from '../components/ui/Toast';
import type { FriendRecord, UserProfile } from '../types';
import { Users, UserPlus, UserCheck, Trash2, Check, Search, ChevronRight } from 'lucide-react';
import { cn } from '../utils/cn';
import { AxiosError } from 'axios';

function Avatar({ name, url, size = 'md' }: { name: string; url?: string | null; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-9 w-9 text-xs', md: 'h-11 w-11 text-sm', lg: 'h-14 w-14 text-base' };
  const initials = name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase()).join('');
  if (url) return <img src={url} alt={name} className={cn('rounded-full object-cover flex-shrink-0', sizes[size])} />;
  return (
    <div className={cn('rounded-full bg-primary-600/20 text-primary-400 font-semibold flex items-center justify-center flex-shrink-0', sizes[size])}>
      {initials}
    </div>
  );
}

export function FriendsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { userId: currentUserId } = useAuthStore();
  const [tab, setTab] = useState<'friends' | 'pending' | 'discover'>('friends');
  const [search, setSearch] = useState('');
  const [sentRequests, setSentRequests] = useState<Set<number>>(new Set());

  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ['friends'],
    queryFn: usersApi.getFriends,
  });

  const { data: pending = [], isLoading: loadingPending } = useQuery({
    queryKey: ['pending-requests'],
    queryFn: usersApi.getPendingRequests,
  });

  const { data: allUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ['all-users'],
    queryFn: usersApi.getAll,
    enabled: tab === 'discover',
  });

  // PUT /users/friends/{friendshipId}/accept
  const acceptMutation = useMutation({
    mutationFn: (friendshipId: number) => usersApi.acceptFriendRequest(friendshipId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['friends'] });
      qc.invalidateQueries({ queryKey: ['pending-requests'] });
      toast.success(t('friends.accepted'));
    },
  });

  // DELETE /users/friends/{friendshipId}
  const removeMutation = useMutation({
    mutationFn: (friendshipId: number) => usersApi.removeFriend(friendshipId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['friends'] });
      toast.success(t('friends.removed'));
    },
  });

  // POST /users/friends/request/{userId}
  const requestMutation = useMutation({
    mutationFn: (userId: number) => usersApi.sendFriendRequest(userId),
    onSuccess: (data) => {
      setSentRequests(prev => new Set(prev).add(data.addresseeId));
      toast.success(t('friends.requestSent'));
    },
    onError: (e: AxiosError<{ message: string }>) => {
      if (e.response?.status === 409 || e.response?.status === 400) toast.error(t('friends.alreadySent'));
      else toast.error(t('friends.requestError'));
    },
  });

  const excludedIds = new Set<number>([
    ...(currentUserId ? [currentUserId] : []),
    ...friends.map((f: FriendRecord) => f.friend.userId),
    ...pending.map((p: FriendRecord) => p.friend.userId),
    ...Array.from(sentRequests),
  ]);

  const filteredUsers = allUsers.filter((u: UserProfile) =>
    !excludedIds.has(u.userId) &&
    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase())
  );

  if (loadingFriends || loadingPending) return <PageLoader />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={t('friends.title')} subtitle={t('friends.subtitle')} />

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
        {[
          { key: 'friends', label: t('friends.tabFriends', { count: friends.length }) },
          { key: 'pending', label: t('friends.tabPending', { count: pending.length }) },
          { key: 'discover', label: t('friends.tabDiscover') },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key as typeof tab)}
            className={cn(
              'relative px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === key ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            {label}
            {key === 'pending' && pending.length > 0 && tab !== 'pending' && (
              <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {pending.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Friends tab ── */}
      {tab === 'friends' && (
        friends.length === 0 ? (
          <EmptyState
            icon={<Users className="h-10 w-10" />}
            title={t('friends.noFriends')}
            description={t('friends.noFriendsDesc')}
            action={<button onClick={() => setTab('discover')} className="btn-primary">{t('friends.findFriends')}</button>}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {friends.map((friendship: FriendRecord) => {
              const friend = friendship.friend;
              const fullName = `${friend.firstName} ${friend.lastName}`;
              return (
                <div key={friendship.id} className="card flex items-center gap-4 group cursor-pointer hover:border-primary-600/30 transition-all"
                  onClick={() => navigate(`/friends/${friend.userId}`)}>
                  <Avatar name={fullName} url={friend.avatarUrl} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-100 truncate group-hover:text-primary-400 transition-colors">
                      {fullName}
                    </p>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{friend.email}</p>
                  </div>
                  {/* Remove button — stop propagation so click doesn't navigate */}
                  <button
                    onClick={e => { e.stopPropagation(); removeMutation.mutate(friendship.id); }}
                    disabled={removeMutation.isPending}
                    className="p-2 rounded-xl hover:bg-rose-600/20 text-slate-600 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <ChevronRight className="h-4 w-4 text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Pending tab ── */}
      {tab === 'pending' && (
        pending.length === 0 ? (
          <EmptyState
            icon={<UserPlus className="h-10 w-10" />}
            title={t('friends.noPending')}
            description={t('friends.noPendingDesc')}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {pending.map((req: FriendRecord) => {
              const friend = req.friend;
              const fullName = `${friend.firstName} ${friend.lastName}`;
              return (
                <div key={req.id} className="card flex items-center gap-4">
                  <button
                    onClick={() => navigate(`/friends/${friend.userId}`)}
                    className="flex-shrink-0 focus:outline-none"
                  >
                    <Avatar name={fullName} url={friend.avatarUrl} size="md" />
                  </button>
                  <div
                    className="flex-1 min-w-0 cursor-pointer"
                    onClick={() => navigate(`/friends/${friend.userId}`)}
                  >
                    <p className="font-semibold text-slate-100 truncate hover:text-primary-400 transition-colors">
                      {fullName}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">{t('friends.wantsToAdd')}</p>
                    <p className="text-xs text-slate-600 truncate mt-0.5">{friend.email}</p>
                  </div>
                  {/* Accept uses req.id = friendshipId */}
                  <button
                    onClick={() => acceptMutation.mutate(req.id)}
                    disabled={acceptMutation.isPending}
                    className="p-2 rounded-xl hover:bg-emerald-600/20 text-slate-500 hover:text-emerald-400 transition-colors flex-shrink-0"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* ── Discover tab ── */}
      {tab === 'discover' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder={t('friends.searchPlaceholder')}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input pl-10"
            />
          </div>
          {loadingUsers ? (
            <PageLoader />
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              icon={<Search className="h-10 w-10" />}
              title={t('friends.noUsers')}
              description={search ? t('friends.noUsersSearch') : t('friends.noUsersEmpty')}
            />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredUsers.map((user: UserProfile) => {
                const isSent = sentRequests.has(user.userId);
                return (
                  <div key={user.id} className="card flex items-center gap-4 group">
                    <button
                      onClick={() => navigate(`/friends/${user.userId}`)}
                      className="flex-shrink-0 focus:outline-none"
                    >
                      <Avatar name={`${user.firstName} ${user.lastName}`} url={user.avatarUrl} size="md" />
                    </button>
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => navigate(`/friends/${user.userId}`)}
                    >
                      <p className="font-semibold text-slate-100 truncate group-hover:text-primary-400 transition-colors">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      {user.bio && (
                        <p className="text-xs text-slate-600 truncate mt-0.5">{user.bio}</p>
                      )}
                    </div>
                    {/* POST /users/friends/request/{userId} */}
                    <button
                      onClick={() => !isSent && requestMutation.mutate(user.userId)}
                      disabled={isSent || requestMutation.isPending}
                      className={cn(
                        'p-2 rounded-xl transition-colors flex-shrink-0',
                        isSent
                          ? 'text-primary-400 bg-primary-600/20 cursor-default'
                          : 'hover:bg-primary-600/20 text-slate-500 hover:text-primary-400'
                      )}
                    >
                      {isSent ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
