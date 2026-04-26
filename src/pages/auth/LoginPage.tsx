import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { toast } from '../../components/ui/Toast';
import { Spinner } from '../../components/ui/Spinner';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { AxiosError } from 'axios';
import { useTranslation } from 'react-i18next';

export function LoginPage() {
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [showPwd, setShowPwd] = useState(false);
  const { t } = useTranslation();

  const schema = z.object({
    email: z.string().email(t('auth.emailInvalid')),
    password: z.string().min(1, t('auth.passwordMin')),
  });
  type FormData = z.infer<typeof schema>;

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data);
      navigate('/dashboard');
    } catch (err) {
      const e = err as AxiosError<{ message: string }>;
      toast.error(e.response?.data?.message ?? t('auth.loginError'));
    }
  };

  return (
    <div className="animate-fade-in">
      <h2 className="text-xl font-bold text-slate-100 mb-1">{t('auth.loginTitle')}</h2>
      <p className="text-sm text-slate-500 mb-6">{t('auth.loginSubtitle')}</p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="label">{t('auth.email')}</label>
          <input {...register('email')} type="email" placeholder="user@example.com" className="input" />
          {errors.email && <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="label">{t('auth.password')}</label>
          <div className="relative">
            <input {...register('password')} type={showPwd ? 'text' : 'password'} placeholder="••••••" className="input pr-10" />
            <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors">
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-rose-400 mt-1">{errors.password.message}</p>}
        </div>
        <button type="submit" disabled={isLoading} className="btn-primary w-full flex items-center justify-center gap-2 mt-2">
          {isLoading ? <Spinner size="sm" /> : null}
          {t('auth.loginBtn')}
        </button>
      </form>
      <p className="text-center text-sm text-slate-500 mt-5">
        {t('auth.noAccount')}{' '}
        <Link to="/register" className="text-primary-400 hover:text-primary-300 font-medium transition-colors">
          {t('auth.goRegister')}
        </Link>
      </p>
    </div>
  );
}
