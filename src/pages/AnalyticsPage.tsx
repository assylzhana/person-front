import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { analyticsApi } from '../api/analytics';
import { PageHeader } from '../components/layout/PageHeader';
import { PageLoader } from '../components/ui/Spinner';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Lightbulb, Target, Wallet, Brain, TrendingUp, AlertTriangle } from 'lucide-react';
import { cn } from '../utils/cn';
import { formatCurrency } from '../utils/format';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, CartesianGrid,
} from 'recharts';
import type { DevelopmentLevel } from '../types';

const levelGradient: Record<DevelopmentLevel, { gradient: string; score: string }> = {
  STARTER:      { gradient: 'from-slate-600 to-slate-700',    score: 'text-slate-300' },
  BEGINNER:     { gradient: 'from-blue-600 to-blue-700',       score: 'text-blue-300' },
  INTERMEDIATE: { gradient: 'from-primary-600 to-primary-700', score: 'text-primary-300' },
  ADVANCED:     { gradient: 'from-violet-600 to-violet-700',   score: 'text-violet-300' },
  ELITE:        { gradient: 'from-amber-500 to-orange-600',    score: 'text-amber-300' },
};

const PIE_COLORS = ['#6366f1', '#10b981', '#f43f5e'];
const TOOLTIP_STYLE = { background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 };

export function AnalyticsPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery({
    queryKey: ['analytics-overview'],
    queryFn: analyticsApi.getOverview,
  });

  if (isLoading) return <PageLoader />;
  if (!data) return null;

  const level = levelGradient[data.developmentLevel];

  const radarData = [
    { subject: t('analytics.radar.motivation'),   A: data.productivity.avgMotivationLevel },
    { subject: t('analytics.radar.productivity'), A: data.productivity.avgProductivityLevel },
    { subject: t('analytics.radar.antistress'),   A: Math.max(0, 100 - data.productivity.avgStressLevel) },
    { subject: t('analytics.radar.goals'),        A: data.goals.completionRate },
    { subject: t('analytics.radar.finance'),      A: data.finance.overBudget ? 20 : Math.min(100, 100 - data.finance.spentPercentage) },
  ];

  const goalsPie = [
    { name: t('analytics.active'),    value: data.goals.activeGoals },
    { name: t('analytics.completed'), value: data.goals.completedGoals },
    { name: t('dashboard.failed'),    value: data.goals.failedGoals },
  ].filter(d => d.value > 0);

  const productivityBars = [
    { name: t('analytics.stress'),            value: data.productivity.avgStressLevel,      fill: '#f43f5e' },
    { name: t('analytics.motivation'),         value: data.productivity.avgMotivationLevel,  fill: '#6366f1' },
    { name: t('analytics.productivityLabel'), value: data.productivity.avgProductivityLevel, fill: '#10b981' },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={t('analytics.title')} subtitle={t('analytics.subtitle')} />

      {/* Development Level Hero */}
      <div className={cn('rounded-2xl p-6 bg-gradient-to-r border border-white/10', level.gradient)}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/60 text-sm font-medium mb-1">{t('analytics.developmentLevel')}</p>
            <h2 className="text-3xl font-bold text-white">{t(`analytics.levels.${data.developmentLevel}`)}</h2>
            <p className="text-white/70 text-sm mt-1">
              {t('analytics.levelScore', { level: data.developmentLevel, score: data.overallDevelopmentScore.toFixed(1) })}
            </p>
          </div>
          <div className="text-right">
            <div className="w-32">
              <p className="text-white/60 text-xs mb-2">{t('analytics.overallProgress')}</p>
              <ProgressBar value={data.overallDevelopmentScore} color="primary" size="lg" />
              <p className="text-white font-bold text-lg mt-1">{data.overallDevelopmentScore.toFixed(0)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Full Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <p className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary-400" /> {t('analytics.developmentProfile')}
          </p>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Radar name={t('analytics.title')} dataKey="A" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Goals */}
        <div className="card">
          <p className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Target className="h-4 w-4 text-blue-400" /> {t('analytics.goalStats')}
          </p>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-4">
            {[
              { label: t('analytics.total'),     value: data.goals.totalGoals,     color: 'text-slate-300' },
              { label: t('analytics.active'),    value: data.goals.activeGoals,    color: 'text-blue-400' },
              { label: t('analytics.completed'), value: data.goals.completedGoals, color: 'text-emerald-400' },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center p-3 bg-slate-800/50 rounded-xl">
                <p className={cn('text-xl font-bold', color)}>{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
          <div className="mb-2">
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>{t('analytics.completionRate')}</span><span>{data.goals.completionRate.toFixed(0)}%</span>
            </div>
            <ProgressBar value={data.goals.completionRate} color="emerald" />
          </div>
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>{t('analytics.avgProgress')}</span><span>{data.goals.avgProgressPercentage.toFixed(0)}%</span>
            </div>
            <ProgressBar value={data.goals.avgProgressPercentage} color="primary" />
          </div>
          {goalsPie.length > 0 && (
            <ResponsiveContainer width="100%" height={130} className="mt-3">
              <PieChart>
                <Pie data={goalsPie} cx="50%" cy="50%" innerRadius={30} outerRadius={55} paddingAngle={3} dataKey="value">
                  {goalsPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Finance + Productivity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Finance */}
        <div className="card">
          <p className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-violet-400" /> {t('analytics.finance')}
          </p>
          <div className="space-y-3 mb-4">
            {[
              { label: t('analytics.totalIncome'),   value: formatCurrency(data.finance.totalIncome),   color: 'text-emerald-400' },
              { label: t('analytics.totalExpenses'), value: formatCurrency(data.finance.totalExpenses), color: 'text-rose-400' },
              { label: t('analytics.balance'),       value: formatCurrency(data.finance.balance),       color: data.finance.balance >= 0 ? 'text-primary-400' as const : 'text-rose-400' as const },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex justify-between items-center">
                <span className="text-sm text-slate-400">{label}</span>
                <span className={cn('font-semibold text-sm', color)}>{value}</span>
              </div>
            ))}
          </div>
          <div>
            <div className="flex justify-between text-xs text-slate-500 mb-1">
              <span>{t('analytics.spentOfIncome')}</span>
              <span className={data.finance.overBudget ? 'text-rose-400 font-medium' : ''}>{data.finance.spentPercentage.toFixed(1)}%</span>
            </div>
            <ProgressBar value={Math.min(100, data.finance.spentPercentage)} color={data.finance.overBudget ? 'rose' : 'blue'} size="md" />
          </div>
          {data.finance.overBudget && (
            <div className="mt-3 flex items-center gap-2 p-2.5 bg-rose-600/10 border border-rose-600/20 rounded-xl">
              <AlertTriangle className="h-4 w-4 text-rose-400 flex-shrink-0" />
              <p className="text-xs text-rose-400">{t('analytics.overBudgetWarn')}</p>
            </div>
          )}
          <ResponsiveContainer width="100%" height={120} className="mt-4">
            <BarChart data={[
              { name: t('finance.income'),  value: data.finance.totalIncome,   fill: '#10b981' },
              { name: t('finance.expense'), value: data.finance.totalExpenses, fill: '#f43f5e' },
            ]} barSize={36}>
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: unknown) => formatCurrency(v as number)} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {[0, 1].map(i => <Cell key={i} fill={i === 0 ? '#10b981' : '#f43f5e'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Productivity */}
        <div className="card">
          <p className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Brain className="h-4 w-4 text-amber-400" /> {t('analytics.productivity')}
          </p>
          <div className="space-y-4 mb-4">
            {[
              { label: t('analytics.stress'),            value: data.productivity.avgStressLevel,      color: 'rose' as const,    inverse: true },
              { label: t('analytics.motivation'),         value: data.productivity.avgMotivationLevel,  color: 'primary' as const },
              { label: t('analytics.productivityLabel'), value: data.productivity.avgProductivityLevel, color: 'emerald' as const },
            ].map(({ label, value, color, inverse }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">{label}</span>
                  <span className={cn(
                    'font-medium',
                    color === 'rose' ? (inverse && value > 70 ? 'text-rose-400' : 'text-slate-400') : `text-${color}-400`
                  )}>{value.toFixed(0)}%</span>
                </div>
                <ProgressBar value={value} color={color} size="sm" />
              </div>
            ))}
          </div>
          <div className="p-3 bg-slate-800/50 rounded-xl text-center mb-3">
            <p className="text-xs text-slate-500 mb-0.5">{t('analytics.status')}</p>
            <p className="text-sm font-semibold text-slate-200">{data.productivity.overallStatus}</p>
            <p className="text-xs text-slate-500 mt-0.5">{data.productivity.totalTestsTaken} {t('analytics.testsTaken')}</p>
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={productivityBars} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v: unknown) => `${(v as number).toFixed(0)}%`} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {productivityBars.map((d, i) => <Cell key={i} fill={d.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recommendations */}
      <div className="card">
        <p className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-400" /> {t('analytics.recommendations')}
        </p>
        {data.recommendations.recommendations.length === 0 ? (
          <p className="text-slate-600 text-sm text-center py-6">{t('analytics.noRecs')}</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {data.recommendations.recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 p-4 bg-amber-600/5 border border-amber-600/20 rounded-xl">
                <div className="p-1.5 bg-amber-600/20 rounded-lg flex-shrink-0">
                  <Lightbulb className="h-3.5 w-3.5 text-amber-400" />
                </div>
                <p className="text-sm text-slate-300">{rec}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
