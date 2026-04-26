import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { financeApi } from '../api/finance';
import { PageHeader } from '../components/layout/PageHeader';
import { PageLoader } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { StatCard } from '../components/ui/StatCard';
import { toast } from '../components/ui/Toast';
import type { MonthlyPlan, IncomeType, ExpenseCategory } from '../types';
import { Wallet, Plus, TrendingUp, TrendingDown, DollarSign, AlertTriangle, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { cn } from '../utils/cn';
import { formatCurrency, formatDate } from '../utils/format';
import { AxiosError } from 'axios';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const INCOME_TYPES: IncomeType[] = ['SALARY', 'FREELANCE', 'INVESTMENT', 'GIFT', 'OTHER'];
const EXPENSE_CATS: ExpenseCategory[] = ['FOOD', 'TRANSPORT', 'HOUSING', 'HEALTHCARE', 'EDUCATION', 'ENTERTAINMENT', 'CLOTHING', 'SAVINGS', 'OTHER'];
const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#f43f5e', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6', '#64748b'];

const monthSchema = z.object({ year: z.number().int().min(2020), month: z.number().int().min(1).max(12), baseIncome: z.number().positive() });
const incomeSchema = z.object({ amount: z.number().positive(), type: z.enum(['SALARY', 'FREELANCE', 'INVESTMENT', 'GIFT', 'OTHER']), date: z.string().min(1), description: z.string().optional() });
const expenseSchema = z.object({ amount: z.number().positive(), category: z.enum(['FOOD', 'TRANSPORT', 'HOUSING', 'HEALTHCARE', 'EDUCATION', 'ENTERTAINMENT', 'CLOTHING', 'SAVINGS', 'OTHER']), date: z.string().min(1), description: z.string().optional() });

type MonthForm = z.infer<typeof monthSchema>;
type IncomeForm = z.infer<typeof incomeSchema>;
type ExpenseForm = z.infer<typeof expenseSchema>;

function PlanCard({ plan, onSelect, isSelected, monthName }: { plan: MonthlyPlan; onSelect: () => void; isSelected: boolean; monthName: string }) {
  return (
    <button onClick={onSelect} className={cn('w-full text-left card-sm transition-all', isSelected ? 'border-primary-600/50 bg-primary-600/5' : 'hover:border-slate-700')}>
      <div className="flex items-center justify-between mb-2">
        <p className="font-semibold text-slate-200 text-sm">{monthName} {plan.year}</p>
        {plan.balance < 0 && <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />}
      </div>
      <p className="text-xs text-slate-500">Баланс: <span className={cn('font-medium', plan.balance >= 0 ? 'text-emerald-400' : 'text-rose-400')}>{formatCurrency(plan.balance)}</span></p>
      <p className="text-xs text-slate-500 mt-0.5">{plan.spentPercentage.toFixed(0)}%</p>
    </button>
  );
}

export function FinancePage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [selectedPlan, setSelectedPlan] = useState<MonthlyPlan | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const today = new Date();

  const { data: plans = [], isLoading } = useQuery({ queryKey: ['finance-plans'], queryFn: financeApi.getAllMonthly });
  const { data: stats } = useQuery({ queryKey: ['finance-stats'], queryFn: financeApi.getStats });
  const { data: detailedPlan } = useQuery({
    queryKey: ['finance-plan', selectedPlan?.id],
    queryFn: () => financeApi.getMonthlyById(selectedPlan!.id),
    enabled: !!selectedPlan,
  });

  useEffect(() => { if (!selectedPlan && plans.length > 0) setSelectedPlan(plans[0]); }, [plans]);

  const { register: regMonth, handleSubmit: handleMonth, reset: resetMonth, formState: { errors: mErr } } = useForm<MonthForm>({
    resolver: zodResolver(monthSchema),
    defaultValues: { year: today.getFullYear(), month: today.getMonth() + 1, baseIncome: 0 },
  });
  const { register: regIncome, handleSubmit: handleIncome, reset: resetIncome } = useForm<IncomeForm>({
    resolver: zodResolver(incomeSchema),
    defaultValues: { type: 'SALARY', date: today.toISOString().split('T')[0] },
  });
  const { register: regExpense, handleSubmit: handleExpense, reset: resetExpense } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: { category: 'FOOD', date: today.toISOString().split('T')[0] },
  });

  const createPlanMutation = useMutation({
    mutationFn: financeApi.createMonthly,
    onSuccess: (plan) => { qc.invalidateQueries({ queryKey: ['finance-plans'] }); qc.invalidateQueries({ queryKey: ['finance-stats'] }); setSelectedPlan(plan); setCreateOpen(false); resetMonth(); toast.success(t('finance.planCreated')); },
    onError: (e: AxiosError) => toast.error(e.response?.status === 409 ? t('finance.planExists') : t('finance.planCreated')),
  });
  const addIncomeMutation = useMutation({
    mutationFn: (data: IncomeForm) => financeApi.addIncome(selectedPlan!.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance-plan', selectedPlan?.id] }); qc.invalidateQueries({ queryKey: ['finance-stats'] }); setIncomeOpen(false); resetIncome(); toast.success(t('finance.incomeAdded')); },
  });
  const addExpenseMutation = useMutation({
    mutationFn: (data: ExpenseForm) => financeApi.addExpense(selectedPlan!.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance-plan', selectedPlan?.id] }); qc.invalidateQueries({ queryKey: ['finance-stats'] }); setExpenseOpen(false); resetExpense(); toast.success(t('finance.expenseAdded')); },
  });

  if (isLoading) return <PageLoader />;

  const plan = detailedPlan ?? selectedPlan;
  const expCatData = plan ? Object.entries(plan.expensesByCategory).map(([k, v], i) => ({
    name: t(`finance.expenseCategories.${k as ExpenseCategory}`), value: v, fill: PIE_COLORS[i % PIE_COLORS.length],
  })) : [];

  const getMonthName = (month: number) => t(`months.${month}`);

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={t('finance.title')} subtitle={t('finance.subtitle')}
        action={<button onClick={() => setCreateOpen(true)} className="btn-primary flex items-center gap-2"><Plus className="h-4 w-4" />{t('finance.newMonth')}</button>} />

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard title={t('finance.statTotalIncome')}   value={formatCurrency(stats.totalIncome)}   icon={<TrendingUp className="h-5 w-5" />} color="emerald" />
          <StatCard title={t('finance.statTotalExpenses')} value={formatCurrency(stats.totalExpenses)} icon={<TrendingDown className="h-5 w-5" />} color="rose" />
          <StatCard title={t('finance.statBalance')} value={formatCurrency(stats.balance)} icon={<DollarSign className="h-5 w-5" />} color={stats.balance >= 0 ? 'violet' : 'rose'} />
          <StatCard title={t('finance.statSpent')} value={`${stats.spentPercentage.toFixed(0)}%`}
            subtitle={stats.overBudget ? t('finance.overBudget') : t('finance.withinBudget')}
            icon={<Wallet className="h-5 w-5" />} color={stats.overBudget ? 'rose' : 'blue'} />
        </div>
      )}

      {/* Mobile plan selector */}
      {plans.length > 0 && (
        <div className="lg:hidden">
          <label className="label">{t('finance.selectMonth')}</label>
          <select className="input" value={selectedPlan?.id ?? ''} onChange={e => { const p = plans.find((pl: MonthlyPlan) => pl.id === Number(e.target.value)); if (p) setSelectedPlan(p); }}>
            {plans.map((p: MonthlyPlan) => <option key={p.id} value={p.id}>{getMonthName(p.month)} {p.year}</option>)}
          </select>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="hidden lg:block space-y-2">
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wide px-1 mb-3">{t('finance.monthlyPlans')}</p>
          {plans.length === 0 ? (
            <div className="text-center py-8"><Wallet className="h-8 w-8 text-slate-700 mx-auto mb-2" /><p className="text-sm text-slate-600">{t('finance.noPlans')}</p></div>
          ) : plans.map((p: MonthlyPlan) => (
            <PlanCard key={p.id} plan={p} isSelected={selectedPlan?.id === p.id} onSelect={() => setSelectedPlan(p)} monthName={getMonthName(p.month)} />
          ))}
        </div>

        <div className="lg:col-span-3 space-y-4">
          {!plan ? (
            <EmptyState icon={<Wallet className="h-10 w-10" />} title={t('finance.emptyPlanTitle')} description={t('finance.emptyPlanDesc')}
              action={<button onClick={() => setCreateOpen(true)} className="btn-primary flex items-center gap-2"><Plus className="h-4 w-4" />{t('finance.createPlan')}</button>} />
          ) : (
            <>
              <div className="card">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-slate-100">{getMonthName(plan.month)} {plan.year}</h2>
                    <p className="text-sm text-slate-500">{t('finance.baseIncome')}: {formatCurrency(plan.baseIncome)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setIncomeOpen(true)} className="btn-secondary flex items-center gap-2 text-sm py-2 flex-1 sm:flex-none justify-center">
                      <ArrowUpCircle className="h-4 w-4 text-emerald-400" />{t('finance.income')}
                    </button>
                    <button onClick={() => setExpenseOpen(true)} className="btn-secondary flex items-center gap-2 text-sm py-2 flex-1 sm:flex-none justify-center">
                      <ArrowDownCircle className="h-4 w-4 text-rose-400" />{t('finance.expense')}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  {[
                    { label: t('finance.income'),  value: plan.totalIncome,   color: 'text-emerald-400' },
                    { label: t('finance.expense'),  value: plan.totalExpenses, color: 'text-rose-400' },
                    { label: t('finance.statBalance'), value: plan.balance,    color: plan.balance >= 0 ? 'text-primary-400' : 'text-rose-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="text-center p-2 sm:p-3 bg-slate-800/50 rounded-xl">
                      <p className="text-xs text-slate-500 mb-1">{label}</p>
                      <p className={cn('font-bold text-xs sm:text-sm break-all', color)}>{formatCurrency(value)}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {expCatData.length > 0 && (
                  <div className="card">
                    <p className="text-sm font-semibold text-slate-300 mb-3">{t('finance.expensesByCategory')}</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={expCatData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                          {expCatData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} formatter={(v: unknown) => formatCurrency(v as number)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-1.5 mt-1">
                      {expCatData.map((d, i) => (
                        <span key={d.name} className="flex items-center gap-1 text-xs text-slate-500">
                          <span className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i] }} />{d.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                <div className="card">
                  <p className="text-sm font-semibold text-slate-300 mb-3">{t('finance.overview')}</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={[{ name: t('finance.income'), value: plan.totalIncome, fill: '#10b981' }, { name: t('finance.expense'), value: plan.totalExpenses, fill: '#f43f5e' }]} barSize={40}>
                      <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, fontSize: 12 }} formatter={(v: unknown) => formatCurrency(v as number)} />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>{[0, 1].map(i => <Cell key={i} fill={i === 0 ? '#10b981' : '#f43f5e'} />)}</Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="card">
                  <p className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <ArrowUpCircle className="h-4 w-4 text-emerald-400" />{t('finance.incomeCount', { count: plan.incomes?.length ?? 0 })}
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {!plan.incomes?.length ? <p className="text-sm text-slate-600 text-center py-4">{t('finance.noRecords')}</p>
                      : plan.incomes.map(inc => (
                        <div key={inc.id} className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-xl">
                          <div>
                            <p className="text-xs font-medium text-emerald-400">{t(`finance.incomeTypes.${inc.type}`)}</p>
                            {inc.description && <p className="text-xs text-slate-500">{inc.description}</p>}
                            <p className="text-xs text-slate-600">{formatDate(inc.date)}</p>
                          </div>
                          <p className="font-semibold text-emerald-400 text-sm">+{formatCurrency(inc.amount)}</p>
                        </div>
                      ))}
                  </div>
                </div>
                <div className="card">
                  <p className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
                    <ArrowDownCircle className="h-4 w-4 text-rose-400" />{t('finance.expenseCount', { count: plan.expenses?.length ?? 0 })}
                  </p>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {!plan.expenses?.length ? <p className="text-sm text-slate-600 text-center py-4">{t('finance.noRecords')}</p>
                      : plan.expenses.map(exp => (
                        <div key={exp.id} className="flex items-center justify-between p-2.5 bg-slate-800/40 rounded-xl">
                          <div>
                            <p className="text-xs font-medium text-rose-400">{t(`finance.expenseCategories.${exp.category}`)}</p>
                            {exp.description && <p className="text-xs text-slate-500">{exp.description}</p>}
                            <p className="text-xs text-slate-600">{formatDate(exp.date)}</p>
                          </div>
                          <p className="font-semibold text-rose-400 text-sm">-{formatCurrency(exp.amount)}</p>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create Monthly Plan Modal */}
      <Modal open={createOpen} onClose={() => { setCreateOpen(false); resetMonth(); }} title={t('finance.createPlan')} size="sm">
        <form onSubmit={handleMonth(d => createPlanMutation.mutate({ ...d }))} className="space-y-4">
          <div className="grid grid-cols-1 xs:grid-cols-2 gap-3">
            <div>
              <label className="label">{t('finance.fieldYear')}</label>
              <input {...regMonth('year', { valueAsNumber: true })} type="number" className="input" />
              {mErr.year && <p className="text-xs text-rose-400 mt-1">{mErr.year.message}</p>}
            </div>
            <div>
              <label className="label">{t('finance.fieldMonth')}</label>
              <select {...regMonth('month', { valueAsNumber: true })} className="input">
                {Array.from({ length: 12 }, (_, i) => <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="label">{t('finance.fieldBaseIncome')}</label>
            <input {...regMonth('baseIncome', { valueAsNumber: true })} type="number" step="0.01" placeholder="500000" className="input" />
            {mErr.baseIncome && <p className="text-xs text-rose-400 mt-1">{mErr.baseIncome.message}</p>}
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="btn-secondary flex-1">{t('common.cancel')}</button>
            <button type="submit" disabled={createPlanMutation.isPending} className="btn-primary flex-1">{t('common.create')}</button>
          </div>
        </form>
      </Modal>

      {/* Add Income Modal */}
      <Modal open={incomeOpen} onClose={() => { setIncomeOpen(false); resetIncome(); }} title={t('finance.addIncome')} size="sm">
        <form onSubmit={handleIncome(d => addIncomeMutation.mutate(d))} className="space-y-4">
          <div><label className="label">{t('finance.fieldAmount')}</label><input {...regIncome('amount', { valueAsNumber: true })} type="number" step="0.01" placeholder="300000" className="input" /></div>
          <div><label className="label">{t('finance.fieldType')}</label>
            <select {...regIncome('type')} className="input">{INCOME_TYPES.map(tp => <option key={tp} value={tp}>{t(`finance.incomeTypes.${tp}`)}</option>)}</select></div>
          <div><label className="label">{t('finance.fieldDate')}</label><input {...regIncome('date')} type="date" className="input" /></div>
          <div><label className="label">{t('finance.fieldDesc')}</label><input {...regIncome('description')} placeholder={t('finance.fieldComment')} className="input" /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setIncomeOpen(false)} className="btn-secondary flex-1">{t('common.cancel')}</button>
            <button type="submit" disabled={addIncomeMutation.isPending} className="btn-primary flex-1">{t('common.add')}</button>
          </div>
        </form>
      </Modal>

      {/* Add Expense Modal */}
      <Modal open={expenseOpen} onClose={() => { setExpenseOpen(false); resetExpense(); }} title={t('finance.addExpense')} size="sm">
        <form onSubmit={handleExpense(d => addExpenseMutation.mutate(d))} className="space-y-4">
          <div><label className="label">{t('finance.fieldAmount')}</label><input {...regExpense('amount', { valueAsNumber: true })} type="number" step="0.01" placeholder="15000" className="input" /></div>
          <div><label className="label">{t('finance.fieldCategory')}</label>
            <select {...regExpense('category')} className="input">{EXPENSE_CATS.map(c => <option key={c} value={c}>{t(`finance.expenseCategories.${c}`)}</option>)}</select></div>
          <div><label className="label">{t('finance.fieldDate')}</label><input {...regExpense('date')} type="date" className="input" /></div>
          <div><label className="label">{t('finance.fieldDesc')}</label><input {...regExpense('description')} placeholder={t('finance.fieldComment')} className="input" /></div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => setExpenseOpen(false)} className="btn-secondary flex-1">{t('common.cancel')}</button>
            <button type="submit" disabled={addExpenseMutation.isPending} className="btn-primary flex-1">{t('common.add')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
