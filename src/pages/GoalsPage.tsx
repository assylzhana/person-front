import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { goalsApi } from '../api/goals';
import { PageHeader } from '../components/layout/PageHeader';
import { PageLoader } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { ProgressBar } from '../components/ui/ProgressBar';
import { StatCard } from '../components/ui/StatCard';
import { toast } from '../components/ui/Toast';
import type { Goal, GoalCategory, GoalStatus } from '../types';
import { Target, Plus, CheckCircle, Trash2, Edit2, TrendingUp, Clock, XCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import { formatDate, getDaysUntil } from '../utils/format';
import { AxiosError } from 'axios';

const CATEGORIES: GoalCategory[] = ['HEALTH', 'EDUCATION', 'FINANCE', 'CAREER', 'PERSONAL', 'SOCIAL', 'OTHER'];
const PERIODS = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM'] as const;

const catColors: Record<GoalCategory, string> = {
  HEALTH: 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30',
  EDUCATION: 'bg-blue-600/20 text-blue-400 border-blue-600/30',
  FINANCE: 'bg-violet-600/20 text-violet-400 border-violet-600/30',
  CAREER: 'bg-amber-600/20 text-amber-400 border-amber-600/30',
  PERSONAL: 'bg-pink-600/20 text-pink-400 border-pink-600/30',
  SOCIAL: 'bg-cyan-600/20 text-cyan-400 border-cyan-600/30',
  OTHER: 'bg-slate-600/20 text-slate-400 border-slate-600/30',
};
const statusColors: Record<GoalStatus, string> = {
  ACTIVE: 'bg-blue-600/20 text-blue-400',
  COMPLETED: 'bg-emerald-600/20 text-emerald-400',
  FAILED: 'bg-rose-600/20 text-rose-400',
};

function GoalCard({ goal, onComplete, onDelete, onEdit }: {
  goal: Goal; onComplete: () => void; onDelete: () => void; onEdit: () => void;
}) {
  const { t } = useTranslation();
  const days = getDaysUntil(goal.deadline);
  const isOverdue = days < 0 && goal.status === 'ACTIVE';
  const statusIcons: Record<GoalStatus, React.ReactNode> = {
    ACTIVE: <Clock className="h-3 w-3" />,
    COMPLETED: <CheckCircle className="h-3 w-3" />,
    FAILED: <XCircle className="h-3 w-3" />,
  };

  return (
    <div className="card hover:border-slate-700 transition-all animate-slide-up group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={cn('badge border', catColors[goal.category])}>{t(`goals.categories.${goal.category}`)}</span>
            <span className={cn('badge', statusColors[goal.status])}>
              {statusIcons[goal.status]} {t(`goals.status.${goal.status}`)}
            </span>
          </div>
          <h3 className="font-semibold text-slate-100 truncate">{goal.title}</h3>
          {goal.description && <p className="text-sm text-slate-500 mt-0.5 line-clamp-2">{goal.description}</p>}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {goal.status === 'ACTIVE' && (
            <>
              <button onClick={onEdit} className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-slate-300 transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
              <button onClick={onComplete} className="p-1.5 rounded-lg hover:bg-emerald-600/20 text-slate-500 hover:text-emerald-400 transition-colors"><CheckCircle className="h-3.5 w-3.5" /></button>
            </>
          )}
          <button onClick={onDelete} className="p-1.5 rounded-lg hover:bg-rose-600/20 text-slate-500 hover:text-rose-400 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
        </div>
      </div>
      <div className="mb-3">
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>{t('goals.progress')}</span><span>{goal.progressPercentage}%</span>
        </div>
        <ProgressBar value={goal.progressPercentage}
          color={goal.status === 'COMPLETED' ? 'emerald' : goal.status === 'FAILED' ? 'rose' : 'primary'} size="sm" />
      </div>
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span>{t('goals.deadline')}: {formatDate(goal.deadline)}</span>
        {goal.status === 'ACTIVE' && (
          <span className={cn('font-medium', isOverdue ? 'text-rose-400' : days <= 3 ? 'text-amber-400' : 'text-slate-500')}>
            {isOverdue
              ? t('goals.overdue', { days: Math.abs(days) })
              : days === 0 ? t('goals.today') : t('goals.daysLeft', { days })}
          </span>
        )}
      </div>
    </div>
  );
}

export function GoalsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [filterStatus, setFilterStatus] = useState<GoalStatus | ''>('');
  const [filterCat, setFilterCat] = useState<GoalCategory | ''>('');

  const schema = z.object({
    title:      z.string().min(1, t('goals.titleRequired')),
    description: z.string().optional(),
    category:   z.enum(['HEALTH', 'EDUCATION', 'FINANCE', 'CAREER', 'PERSONAL', 'SOCIAL', 'OTHER']),
    periodType: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM']),
    deadline:   z.string().min(1, t('goals.deadlineRequired')),
  });
  type FormData = z.infer<typeof schema>;
  const progressSchema = z.object({ progressPercentage: z.number().min(0).max(100) });
  type ProgressData = z.infer<typeof progressSchema>;

  const { data: goals = [], isLoading } = useQuery({
    queryKey: ['goals', filterStatus, filterCat],
    queryFn: () => goalsApi.getAll({ status: filterStatus || undefined, category: filterCat || undefined }),
  });
  const { data: stats } = useQuery({ queryKey: ['goal-stats'], queryFn: goalsApi.getStats });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'PERSONAL', periodType: 'MONTHLY' },
  });
  const { register: regProgress, handleSubmit: handleProgress, setValue } = useForm<ProgressData>({
    resolver: zodResolver(progressSchema),
  });

  const createMutation = useMutation({
    mutationFn: goalsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['goals'] });
      qc.invalidateQueries({ queryKey: ['goal-stats'] });
      qc.invalidateQueries({ queryKey: ['analytics-overview'] });
      setCreateOpen(false); reset(); toast.success(t('goals.created'));
    },
    onError: (err: AxiosError<{ message: string }>) => toast.error(err.response?.data?.message ?? t('goals.createError')),
  });

  const completeMutation = useMutation({
    mutationFn: goalsApi.complete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); qc.invalidateQueries({ queryKey: ['goal-stats'] }); toast.success(t('goals.completedMsg')); },
  });

  const deleteMutation = useMutation({
    mutationFn: goalsApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); qc.invalidateQueries({ queryKey: ['goal-stats'] }); toast.success(t('goals.deleted')); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProgressData }) => goalsApi.update(id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['goals'] }); setEditGoal(null); toast.success(t('goals.progressUpdated')); },
  });

  if (isLoading) return <PageLoader />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={t('goals.title')} subtitle={t('goals.subtitle')}
        action={<button onClick={() => setCreateOpen(true)} className="btn-primary flex items-center gap-2"><Plus className="h-4 w-4" />{t('goals.newGoal')}</button>} />

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard title={t('goals.statTotal')}    value={stats.totalGoals}    icon={<Target className="h-5 w-5" />} color="blue" />
          <StatCard title={t('goals.statActive')}   value={stats.activeGoals}   icon={<Clock className="h-5 w-5" />} color="violet" />
          <StatCard title={t('goals.statCompleted')} value={stats.completedGoals} icon={<CheckCircle className="h-5 w-5" />} color="emerald" />
          <StatCard title={t('goals.statRate')} value={`${stats.completionRate.toFixed(0)}%`}
            subtitle={`${t('goals.statAvgProgress')}: ${stats.avgProgressPercentage.toFixed(0)}%`}
            icon={<TrendingUp className="h-5 w-5" />} color="amber" />
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as GoalStatus | '')} className="input w-auto">
          <option value="">{t('goals.allStatuses')}</option>
          {(['ACTIVE', 'COMPLETED', 'FAILED'] as GoalStatus[]).map(s => (
            <option key={s} value={s}>{t(`goals.status.${s}`)}</option>
          ))}
        </select>
        <select value={filterCat} onChange={e => setFilterCat(e.target.value as GoalCategory | '')} className="input w-auto">
          <option value="">{t('goals.allCategories')}</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{t(`goals.categories.${c}`)}</option>)}
        </select>
      </div>

      {goals.length === 0 ? (
        <EmptyState icon={<Target className="h-10 w-10" />} title={t('goals.empty')} description={t('goals.emptyDesc')}
          action={<button onClick={() => setCreateOpen(true)} className="btn-primary flex items-center gap-2"><Plus className="h-4 w-4" />{t('goals.newGoal')}</button>} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {goals.map(goal => (
            <GoalCard key={goal.id} goal={goal}
              onComplete={() => completeMutation.mutate(goal.id)}
              onDelete={() => deleteMutation.mutate(goal.id)}
              onEdit={() => { setEditGoal(goal); setValue('progressPercentage', goal.progressPercentage); }} />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); reset(); }} title={t('goals.createTitle')}>
        <form onSubmit={handleSubmit(d => createMutation.mutate(d))} className="space-y-4">
          <div>
            <label className="label">{t('goals.fieldTitle')}</label>
            <input {...register('title')} placeholder={t('goals.fieldTitlePlaceholder')} className="input" />
            {errors.title && <p className="text-xs text-rose-400 mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="label">{t('goals.fieldDesc')}</label>
            <textarea {...register('description')} placeholder={t('goals.fieldDescPlaceholder')} rows={2} className="input resize-none" />
          </div>
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
            <div>
              <label className="label">{t('goals.fieldCategory')}</label>
              <select {...register('category')} className="input">
                {CATEGORIES.map(c => <option key={c} value={c}>{t(`goals.categories.${c}`)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('goals.fieldPeriod')}</label>
              <select {...register('periodType')} className="input">
                {PERIODS.map(p => <option key={p} value={p}>{t(`goals.periods.${p}`)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">{t('goals.fieldDeadline')}</label>
            <input {...register('deadline')} type="date" min={new Date().toISOString().split('T')[0]} className="input" />
            {errors.deadline && <p className="text-xs text-rose-400 mt-1">{errors.deadline.message}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setCreateOpen(false); reset(); }} className="btn-secondary flex-1">{t('common.cancel')}</button>
            <button type="submit" disabled={createMutation.isPending} className="btn-primary flex-1">{t('common.create')}</button>
          </div>
        </form>
      </Modal>

      {/* Edit Progress Modal */}
      <Modal open={!!editGoal} onClose={() => setEditGoal(null)} title={t('goals.editProgressTitle')} size="sm">
        {editGoal && (
          <form onSubmit={handleProgress(d => updateMutation.mutate({ id: editGoal.id, data: d }))} className="space-y-4">
            <div>
              <p className="text-sm text-slate-400 mb-3">{editGoal.title}</p>
              <label className="label">{t('goals.progress')}: {editGoal.progressPercentage}%</label>
              <input {...regProgress('progressPercentage', { valueAsNumber: true })} type="range" min={0} max={100}
                className="w-full accent-primary-500"
                onChange={e => setValue('progressPercentage', Number(e.target.value))}
                defaultValue={editGoal.progressPercentage} />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setEditGoal(null)} className="btn-secondary flex-1">{t('common.cancel')}</button>
              <button type="submit" disabled={updateMutation.isPending} className="btn-primary flex-1">{t('common.save')}</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
