import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { analyticsApi } from '../api/analytics';
import { PageHeader } from '../components/layout/PageHeader';
import { StatCard } from '../components/ui/StatCard';
import { PageLoader } from '../components/ui/Spinner';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Target, Wallet, Brain, TrendingUp, CheckCircle, AlertTriangle, Lightbulb, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../utils/format';
import { cn } from '../utils/cn';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell,
} from 'recharts';
import type { DevelopmentLevel } from '../types';

const levelBg: Record<DevelopmentLevel, string> = {
  STARTER:      'bg-slate-600/20 border-slate-600/30',
  BEGINNER:     'bg-blue-600/20 border-blue-600/30',
  INTERMEDIATE: 'bg-primary-600/20 border-primary-600/30',
  ADVANCED:     'bg-violet-600/20 border-violet-600/30',
  ELITE:        'bg-amber-600/20 border-amber-600/30',
};
const levelColor: Record<DevelopmentLevel, string> = {
  STARTER: 'text-slate-400', BEGINNER: 'text-blue-400', INTERMEDIATE: 'text-primary-400',
  ADVANCED: 'text-violet-400', ELITE: 'text-amber-400',
};
const PIE_COLORS = ['#6366f1', '#10b981', '#f43f5e'];

export function DashboardPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({ queryKey: ['analytics-overview'], queryFn: analyticsApi.getOverview });

  if (isLoading) return <PageLoader />;
  if (!data) return null;

  const radarData = [
    { subject: t('analytics.radar.motivation'),    value: data.productivity.avgMotivationLevel },
    { subject: t('analytics.radar.productivity'),  value: data.productivity.avgProductivityLevel },
    { subject: t('analytics.radar.antistress'),    value: Math.max(0, 100 - data.productivity.avgStressLevel) },
    { subject: t('analytics.radar.goals'),         value: data.goals.completionRate },
    { subject: t('analytics.radar.finance'),       value: Math.min(100, data.finance.overBudget ? 0 : 100 - data.finance.spentPercentage) },
  ];

  const pieData = [
    { name: t('dashboard.active'),      value: data.goals.activeGoals },
    { name: t('dashboard.completedPl'), value: data.goals.completedGoals },
    { name: t('dashboard.failed'),      value: data.goals.failedGoals },
  ].filter(d => d.value > 0);

  const financeBar = [
    { name: t('finance.income'),  value: data.finance.totalIncome,   fill: '#10b981' },
    { name: t('finance.expense'), value: data.finance.totalExpenses, fill: '#f43f5e' },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.subtitle')} />

      {/* Level Banner */}
      <div className={cn('card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border', levelBg[data.developmentLevel])}>
        <div>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">{t('dashboard.developmentLevel')}</p>
          <p className={cn('text-xl sm:text-2xl font-bold', levelColor[data.developmentLevel])}>
            {t(`dashboard.levels.${data.developmentLevel}`)}
          </p>
          <p className="text-sm text-slate-400 mt-1">{t('dashboard.overallScore')}: {data.overallDevelopmentScore.toFixed(1)} / 100</p>
        </div>
        <div className="sm:flex-shrink-0">
          <ProgressBar value={data.overallDevelopmentScore} color="primary" size="md" className="w-full sm:w-40" />
          <p className="text-xs text-slate-500 mt-1 sm:text-right">{data.overallDevelopmentScore.toFixed(0)}%</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard title={t('dashboard.activeGoals')} value={data.goals.activeGoals}
          subtitle={`${data.goals.completedGoals} ${t('dashboard.completed')}`}
          icon={<Target className="h-5 w-5" />} color="blue" />
        <StatCard title={t('dashboard.completedGoals')} value={`${data.goals.completionRate.toFixed(0)}%`}
          subtitle={`${data.goals.totalGoals} ${t('dashboard.total')}`}
          icon={<CheckCircle className="h-5 w-5" />} color="emerald" />
        <StatCard title={t('dashboard.balance')} value={formatCurrency(data.finance.balance)}
          subtitle={data.finance.overBudget ? t('dashboard.overBudget') : t('dashboard.withinBudget')}
          icon={<Wallet className="h-5 w-5" />} color={data.finance.overBudget ? 'rose' : 'violet'} />
        <StatCard title={t('dashboard.productivity')} value={`${data.productivity.avgProductivityLevel.toFixed(0)}%`}
          subtitle={`${data.productivity.totalTestsTaken} ${t('dashboard.testsTaken')}`}
          icon={<Brain className="h-5 w-5" />} color="amber" />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-1">
          <p className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary-400" />{t('dashboard.radarTitle')}
          </p>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10 }} />
              <Radar name={t('dashboard.title')} dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <p className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-400" />{t('dashboard.pieTitle')}
          </p>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-2 mt-2">
                {pieData.map((d, i) => (
                  <span key={d.name} className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i] }} />
                    {d.name}: {d.value}
                  </span>
                ))}
              </div>
            </>
          ) : <p className="text-slate-600 text-sm text-center py-8">{t('dashboard.noData')}</p>}
        </div>

        <div className="card">
          <p className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-violet-400" />{t('dashboard.financeTitle')}
          </p>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={financeBar} barSize={32}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }}
                formatter={(v: unknown) => formatCurrency(v as number)} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {financeBar.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recommendations */}
      {data.recommendations.recommendations.length > 0 && (
        <div className="card">
          <p className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-400" />{t('dashboard.recommendations')}
          </p>
          <div className="space-y-2">
            {data.recommendations.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-xl">
                <AlertTriangle className="h-4 w-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-300">{rec}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { to: '/goals',     label: t('dashboard.manageGoals'),       icon: Target,    color: 'text-blue-400' },
          { to: '/finance',   label: t('dashboard.viewFinance'),       icon: Wallet,    color: 'text-violet-400' },
          { to: '/tests',     label: t('dashboard.takeTest'),          icon: Brain,     color: 'text-amber-400' },
          { to: '/analytics', label: t('dashboard.detailedAnalytics'), icon: TrendingUp, color: 'text-emerald-400' },
        ].map(({ to, label, icon: Icon, color }) => (
          <Link key={to} to={to} className="card-sm flex items-center justify-between hover:border-primary-600/30 hover:bg-slate-800/50 transition-all group">
            <div className="flex items-center gap-2">
              <Icon className={cn('h-4 w-4', color)} />
              <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">{label}</span>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-slate-600 group-hover:text-slate-400 transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  );
}
