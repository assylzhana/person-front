import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { usersApi } from '../api/users';
import { PageLoader } from '../components/ui/Spinner';
import { ProgressBar } from '../components/ui/ProgressBar';
import { EmptyState } from '../components/ui/EmptyState';
import {
  ArrowLeft, Lock, Mail, Target, Brain, TrendingUp,
  Star, Trophy, Zap,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { formatDate } from '../utils/format';

function levelColor(level: number): string {
  if (level <= 1) return 'from-slate-600 to-slate-700';
  if (level <= 3) return 'from-blue-600 to-blue-700';
  if (level <= 5) return 'from-primary-600 to-primary-700';
  if (level <= 8) return 'from-violet-600 to-violet-700';
  if (level <= 11) return 'from-amber-500 to-orange-600';
  return 'from-rose-500 to-pink-600';
}

function Avatar({ name, url }: { name: string; url?: string | null }) {
  const initials = name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase()).join('');
  if (url) return <img src={url} alt={name} className="h-20 w-20 rounded-2xl object-cover flex-shrink-0" />;
  return (
    <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-primary-600 to-violet-600 text-white text-2xl font-bold flex items-center justify-center flex-shrink-0">
      {initials}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="card text-center py-4">
      <p className="text-2xl font-bold text-slate-100">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-600 mt-0.5">{sub}</p>}
    </div>
  );
}

export function FriendProfilePage() {
  const { t } = useTranslation();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const numericId = Number(userId);

  const { data: profile, isLoading, isError } = useQuery({
    queryKey: ['user-full-profile', numericId],
    queryFn: () => usersApi.getFullProfile(numericId),
    retry: false,
    enabled: !!numericId,
  });

  const backBtn = (
    <button
      onClick={() => navigate('/friends')}
      className="flex items-center gap-2 text-slate-400 hover:text-slate-100 transition-colors text-sm font-medium"
    >
      <ArrowLeft className="h-4 w-4" />
      {t('nav.friends')}
    </button>
  );

  if (isLoading) return <PageLoader />;

  if (isError || !profile) {
    return (
      <div className="animate-fade-in space-y-6 max-w-5xl">
        {backBtn}
        <div className="card text-center py-16">
          <Lock className="h-12 w-12 text-slate-700 mx-auto mb-3" />
          <p className="text-slate-300 font-semibold text-lg mb-1">{t('friends.profilePrivate')}</p>
        </div>
      </div>
    );
  }

  const fullName = `${profile.firstName} ${profile.lastName}`;
  const xpTotal = profile.xp + profile.xpToNextLevel;
  const xpPct = xpTotal > 0 ? (profile.xp / xpTotal) * 100 : 0;

  const motivationPct = profile.avgMotivationLevel;
  const productivityPct = profile.avgProductivityLevel;
  const stressPct = profile.avgStressLevel;
  const antiStressPct = Math.max(0, 100 - stressPct);

  return (
    <div className="animate-fade-in space-y-6 max-w-5xl">
      {backBtn}

      {/* ── Profile header ── */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start gap-5">
          <Avatar name={fullName} url={profile.avatarUrl} />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-100">{fullName}</h1>
            <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
              <Mail className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{profile.email}</span>
            </div>
            {profile.bio && (
              <p className="text-slate-400 text-sm mt-2 leading-relaxed">{profile.bio}</p>
            )}
            <p className="text-xs text-slate-600 mt-2">
              {t('profile.memberSince')}: {formatDate(profile.memberSince)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Level Banner ── */}
      <div className={cn('rounded-2xl p-6 bg-gradient-to-r border border-white/10', levelColor(profile.level))}>
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-5 w-5 text-white/80" />
              <p className="text-white/70 text-xs font-medium uppercase tracking-wide">
                {t('dashboard.developmentLevel')}
              </p>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">{profile.levelTitle}</h2>
            <p className="text-white/70 text-sm mt-0.5">Level {profile.level}</p>
          </div>
          <div className="w-36 flex-shrink-0">
            <div className="flex items-center justify-between text-white/70 text-xs mb-1">
              <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> XP</span>
              <span>{profile.xp} / {xpTotal}</span>
            </div>
            <ProgressBar value={xpPct} color="primary" size="md" />
          </div>
        </div>
      </div>

      {/* ── Goal stats ── */}
      <div>
        <p className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-blue-400" />
          {t('nav.goals')}
        </p>
        {profile.totalGoals === 0 ? (
          <EmptyState icon={<Target className="h-10 w-10" />} title={t('goals.empty')} description="" />
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label={t('goals.statTotal')}     value={profile.totalGoals} />
            <StatCard label={t('goals.statActive')}    value={profile.activeGoals} />
            <StatCard label={t('goals.statCompleted')} value={profile.completedGoals} />
            <StatCard
              label={t('goals.statRate')}
              value={`${profile.completionRate.toFixed(0)}%`}
              sub={`${t('goals.statAvgProgress')}: ${profile.avgProgress.toFixed(0)}%`}
            />
          </div>
        )}
      </div>

      {/* ── Productivity ── */}
      {profile.totalTestsTaken > 0 && (
        <div className="card">
          <p className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Brain className="h-4 w-4 text-amber-400" />
            {t('analytics.productivity')}
          </p>

          <div className="space-y-4 mb-4">
            {[
              { label: t('analytics.motivation'),         value: motivationPct,   color: 'primary' as const },
              { label: t('analytics.productivityLabel'), value: productivityPct,  color: 'emerald' as const },
              { label: t('analytics.stress'),            value: stressPct,        color: 'rose' as const },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">{label}</span>
                  <span className={cn('font-medium', `text-${color}-400`)}>{value.toFixed(0)}%</span>
                </div>
                <ProgressBar value={value} color={color} size="sm" />
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-800/50 rounded-xl text-center">
            <p className="text-xs text-slate-500 mb-0.5">{t('analytics.status')}</p>
            <p className="text-sm font-semibold text-slate-200">{profile.overallStatus}</p>
            <p className="text-xs text-slate-500 mt-0.5">
              {profile.totalTestsTaken} {t('analytics.testsTaken')}
            </p>
          </div>
        </div>
      )}

      {/* ── Development Profile radar-style summary ── */}
      <div className="card">
        <p className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary-400" />
          {t('analytics.developmentProfile')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { label: t('analytics.radar.motivation'),   value: motivationPct,  icon: <Star className="h-4 w-4 text-primary-400" /> },
            { label: t('analytics.radar.productivity'), value: productivityPct, icon: <Zap className="h-4 w-4 text-emerald-400" /> },
            { label: t('analytics.radar.antistress'),   value: antiStressPct,  icon: <Brain className="h-4 w-4 text-amber-400" /> },
          ].map(({ label, value, icon }) => (
            <div key={label} className="p-3 bg-slate-800/50 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                {icon}
                <span className="text-xs text-slate-400">{label}</span>
              </div>
              <p className="text-xl font-bold text-slate-100 mb-1">{value.toFixed(0)}%</p>
              <ProgressBar value={value} color="primary" size="sm" />
            </div>
          ))}
        </div>
        {profile.totalGoals > 0 && (
          <div className="mt-3 p-3 bg-slate-800/50 rounded-xl flex items-center justify-between">
            <span className="text-xs text-slate-400">{t('analytics.radar.goals')}</span>
            <span className="text-sm font-bold text-slate-100">{profile.completionRate.toFixed(0)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
