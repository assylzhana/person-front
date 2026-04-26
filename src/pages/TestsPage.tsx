import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { usersApi } from '../api/users';
import { PageHeader } from '../components/layout/PageHeader';
import { PageLoader } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { ProgressBar } from '../components/ui/ProgressBar';
import { toast } from '../components/ui/Toast';
import type { PsychTest, TestResult } from '../types';
import { Brain, CheckCircle, ChevronRight, Clock, Star, TrendingUp } from 'lucide-react';
import { cn } from '../utils/cn';
import { formatDateTime } from '../utils/format';

function ResultCard({ result }: { result: TestResult }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="card hover:border-slate-700 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="font-semibold text-slate-100 text-sm">{result.testTitle}</p>
          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
            <Clock className="h-3 w-3" /> {formatDateTime(result.createdAt)}
          </p>
        </div>
        <button onClick={() => setExpanded(v => !v)} className="text-slate-500 hover:text-slate-300 transition-colors">
          <ChevronRight className={cn('h-4 w-4 transition-transform', expanded && 'rotate-90')} />
        </button>
      </div>
      <div className="space-y-2.5">
        {[
          { label: t('tests.stress'),       value: result.stressLevel,       color: 'rose' as const },
          { label: t('tests.motivation'),   value: result.motivationLevel,   color: 'primary' as const },
          { label: t('tests.productivity'), value: result.productivityLevel, color: 'emerald' as const },
        ].map(({ label, value, color }) => (
          <div key={label}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-400">{label}</span>
              <span className="text-slate-300 font-medium">{value}%</span>
            </div>
            <ProgressBar value={value} color={color} size="sm" />
          </div>
        ))}
      </div>
      {expanded && result.recommendations.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-800 space-y-1.5">
          <p className="text-xs font-medium text-slate-500">{t('tests.recommendations')}</p>
          {result.recommendations.map((r, i) => (
            <div key={i} className="flex items-start gap-2">
              <Star className="h-3 w-3 text-amber-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-slate-400">{r}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TestModal({ test, onClose }: { test: PsychTest; onClose: () => void }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<TestResult | null>(null);

  const allAnswered = test.questions.every(q => answers[q.id] !== undefined);

  const takeMutation = useMutation({
    mutationFn: () => usersApi.takeTest(test.id, Object.fromEntries(
      Object.entries(answers).map(([k, v]) => [k, v])
    )),
    onSuccess: (res) => {
      setResult(res);
      qc.invalidateQueries({ queryKey: ['test-results'] });
      qc.invalidateQueries({ queryKey: ['test-stats'] });
      qc.invalidateQueries({ queryKey: ['analytics-overview'] });
      toast.success(t('tests.testDone'));
    },
    onError: () => toast.error(t('tests.testError')),
  });

  if (result) {
    return (
      <div className="space-y-4">
        <div className="text-center p-4 bg-emerald-600/10 border border-emerald-600/20 rounded-xl">
          <CheckCircle className="h-10 w-10 text-emerald-400 mx-auto mb-2" />
          <p className="font-semibold text-slate-100">{t('tests.testSuccess')}</p>
        </div>
        <div className="space-y-3">
          {[
            { label: t('tests.stress'),       value: result.stressLevel,       color: 'rose' as const },
            { label: t('tests.motivation'),   value: result.motivationLevel,   color: 'primary' as const },
            { label: t('tests.productivity'), value: result.productivityLevel, color: 'emerald' as const },
          ].map(({ label, value, color }) => (
            <div key={label}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-slate-400">{label}</span>
                <span className="font-semibold text-slate-200">{value}%</span>
              </div>
              <ProgressBar value={value} color={color} size="md" />
            </div>
          ))}
        </div>
        {result.recommendations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-slate-500">{t('tests.recommendations')}</p>
            {result.recommendations.map((r, i) => (
              <div key={i} className="flex items-start gap-2 p-2.5 bg-slate-800/50 rounded-lg">
                <Star className="h-3.5 w-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-slate-300">{r}</p>
              </div>
            ))}
          </div>
        )}
        <button onClick={onClose} className="btn-primary w-full">{t('common.close')}</button>
      </div>
    );
  }

  const question = test.questions[step];
  const progress = ((step) / test.questions.length) * 100;

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between text-xs text-slate-500 mb-1.5">
          <span>{t('tests.questionOf', { current: step + 1, total: test.questions.length })}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <ProgressBar value={progress} size="sm" />
      </div>
      <p className="font-medium text-slate-100">{question.questionText}</p>
      <div className="space-y-2">
        {question.options.map(opt => (
          <button
            key={opt.id}
            onClick={() => setAnswers(a => ({ ...a, [question.id]: opt.id }))}
            className={cn(
              'w-full text-left px-4 py-3 rounded-xl border transition-all text-sm',
              answers[question.id] === opt.id
                ? 'border-primary-600/50 bg-primary-600/10 text-primary-300'
                : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
            )}
          >
            {opt.optionText}
          </button>
        ))}
      </div>
      <div className="flex gap-3">
        {step > 0 && (
          <button onClick={() => setStep(s => s - 1)} className="btn-secondary flex-1">{t('common.back')}</button>
        )}
        {step < test.questions.length - 1 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!answers[question.id]}
            className="btn-primary flex-1"
          >{t('common.next')}</button>
        ) : (
          <button
            onClick={() => takeMutation.mutate()}
            disabled={!allAnswered || takeMutation.isPending}
            className="btn-primary flex-1"
          >{t('common.finish')}</button>
        )}
      </div>
    </div>
  );
}

export function TestsPage() {
  const { t } = useTranslation();
  const [activeTest, setActiveTest] = useState<PsychTest | null>(null);
  const [tab, setTab] = useState<'tests' | 'results'>('tests');

  const { data: tests = [], isLoading: loadingTests } = useQuery({
    queryKey: ['tests'],
    queryFn: usersApi.getTests,
  });

  const { data: results = [], isLoading: loadingResults } = useQuery({
    queryKey: ['test-results'],
    queryFn: usersApi.getTestResults,
  });

  const { data: stats } = useQuery({
    queryKey: ['test-stats'],
    queryFn: usersApi.getTestStats,
  });

  if (loadingTests || loadingResults) return <PageLoader />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader title={t('tests.title')} subtitle={t('tests.subtitle')} />

      {/* Stats */}
      {stats && stats.totalTestsTaken > 0 && (
        <div className="card">
          <p className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary-400" /> {t('tests.yourMetrics')}
          </p>
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            {[
              { label: t('tests.stress'),       value: stats.avgStressLevel,       color: 'rose' as const },
              { label: t('tests.motivation'),   value: stats.avgMotivationLevel,   color: 'primary' as const },
              { label: t('tests.productivity'), value: stats.avgProductivityLevel, color: 'emerald' as const },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-400">{label}</span>
                  <span className="text-slate-300 font-medium">{value.toFixed(0)}%</span>
                </div>
                <ProgressBar value={value} color={color} size="sm" />
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-3">{stats.overallStatus} • {stats.totalTestsTaken} {t('tests.testsTaken')}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl w-fit">
        {(['tests', 'results'] as const).map(tabKey => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={cn(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all',
              tab === tabKey ? 'bg-primary-600 text-white' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            {tabKey === 'tests'
              ? t('tests.tabTests', { count: tests.length })
              : t('tests.tabHistory', { count: results.length })}
          </button>
        ))}
      </div>

      {tab === 'tests' && (
        tests.length === 0 ? (
          <EmptyState icon={<Brain className="h-10 w-10" />} title={t('tests.noTests')} description={t('tests.noTestsDesc')} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {tests.map(test => (
              <div key={test.id} className="card hover:border-primary-600/30 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 bg-primary-600/20 rounded-xl">
                    <Brain className="h-5 w-5 text-primary-400" />
                  </div>
                  <span className="badge bg-slate-800 text-slate-400">{t('tests.questions', { count: test.questions.length })}</span>
                </div>
                <h3 className="font-semibold text-slate-100 mb-1">{test.title}</h3>
                <p className="text-sm text-slate-500 mb-4 line-clamp-2">{test.description}</p>
                <button onClick={() => setActiveTest(test)} className="btn-primary w-full flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4" /> {t('tests.takeTest')}
                </button>
              </div>
            ))}
          </div>
        )
      )}

      {tab === 'results' && (
        results.length === 0 ? (
          <EmptyState
            icon={<Brain className="h-10 w-10" />}
            title={t('tests.noResults')}
            description={t('tests.noResultsDesc')}
            action={<button onClick={() => setTab('tests')} className="btn-primary">{t('tests.toTests')}</button>}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {results.map(result => <ResultCard key={result.id} result={result} />)}
          </div>
        )
      )}

      {activeTest && (
        <Modal
          open={!!activeTest}
          onClose={() => setActiveTest(null)}
          title={activeTest.title}
          size="md"
        >
          <TestModal test={activeTest} onClose={() => setActiveTest(null)} />
        </Modal>
      )}
    </div>
  );
}
