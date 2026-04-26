import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { usersApi } from '../api/users';
import { PageHeader } from '../components/layout/PageHeader';
import { PageLoader } from '../components/ui/Spinner';
import { Modal } from '../components/ui/Modal';
import { toast } from '../components/ui/Toast';
import { User, Edit2, Globe, Lock, Calendar, Mail, FileText } from 'lucide-react';
import { cn } from '../utils/cn';
import { formatDate } from '../utils/format';
import { AxiosError } from 'axios';

function Avatar({ name, url, size = 'xl' }: { name: string; url?: string | null; size?: 'xl' | '2xl' }) {
  const sizes = { xl: 'h-20 w-20 text-2xl', '2xl': 'h-28 w-28 text-3xl' };
  const initials = name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase()).join('');
  if (url) return <img src={url} alt={name} className={cn('rounded-2xl object-cover', sizes[size])} />;
  return (
    <div className={cn('rounded-2xl bg-gradient-to-br from-primary-600 to-violet-600 text-white font-bold flex items-center justify-center', sizes[size])}>
      {initials}
    </div>
  );
}

export function ProfilePage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);

  const schema = z.object({
    firstName: z.string().min(1, t('profile.firstName')),
    lastName: z.string().min(1, t('profile.lastName')),
    bio: z.string().optional(),
    avatarUrl: z.string().optional(),
    privacyType: z.enum(['PUBLIC', 'PRIVATE']),
  });
  type FormData = z.infer<typeof schema>;

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile-me'],
    queryFn: usersApi.getMe,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    values: profile ? {
      firstName: profile.firstName,
      lastName: profile.lastName,
      bio: profile.bio ?? '',
      avatarUrl: profile.avatarUrl ?? '',
      privacyType: profile.privacyType,
    } : undefined,
  });

  const updateMutation = useMutation({
    mutationFn: usersApi.updateMe,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile-me'] });
      setEditOpen(false);
      toast.success(t('profile.saved'));
    },
    onError: (e: AxiosError<{ message: string }>) => {
      toast.error(e.response?.data?.message ?? t('profile.saveError'));
    },
  });

  if (isLoading) return <PageLoader />;
  if (!profile) return null;

  const fullName = `${profile.firstName} ${profile.lastName}`;

  return (
    <div className="animate-fade-in space-y-6 max-w-2xl">
      <PageHeader
        title={t('profile.title')}
        action={
          <button onClick={() => setEditOpen(true)} className="btn-secondary flex items-center gap-2">
            <Edit2 className="h-4 w-4" /> {t('profile.edit')}
          </button>
        }
      />

      {/* Profile Card */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
          <Avatar name={fullName} url={profile.avatarUrl} size="xl" />
          <div className="flex-1">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-100">{fullName}</h2>
            <div className="flex items-center gap-2 mt-1">
              {profile.privacyType === 'PUBLIC' ? (
                <span className="badge bg-emerald-600/20 text-emerald-400 border border-emerald-600/30">
                  <Globe className="h-3 w-3" /> {t('profile.public')}
                </span>
              ) : (
                <span className="badge bg-slate-700 text-slate-400 border border-slate-600">
                  <Lock className="h-3 w-3" /> {t('profile.private')}
                </span>
              )}
            </div>
            {profile.bio && <p className="text-slate-400 text-sm mt-3">{profile.bio}</p>}
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-slate-800 space-y-3">
          {[
            { icon: Mail,     label: t('profile.email'),        value: profile.email },
            { icon: Calendar, label: t('profile.registeredAt'), value: formatDate(profile.createdAt) },
            { icon: User,     label: t('profile.userId'),       value: `#${profile.userId}` },
            ...(profile.bio ? [{ icon: FileText, label: t('profile.bio'), value: profile.bio }] : []),
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3">
              <div className="p-2 bg-slate-800 rounded-lg">
                <Icon className="h-3.5 w-3.5 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-600">{label}</p>
                <p className="text-sm text-slate-300">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Modal */}
      <Modal open={editOpen} onClose={() => { setEditOpen(false); reset(); }} title={t('profile.editTitle')}>
        <form onSubmit={handleSubmit(d => updateMutation.mutate(d))} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">{t('profile.firstName')}</label>
              <input {...register('firstName')} className="input" />
              {errors.firstName && <p className="text-xs text-rose-400 mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="label">{t('profile.lastName')}</label>
              <input {...register('lastName')} className="input" />
              {errors.lastName && <p className="text-xs text-rose-400 mt-1">{errors.lastName.message}</p>}
            </div>
          </div>
          <div>
            <label className="label">{t('profile.bio')}</label>
            <textarea {...register('bio')} rows={3} placeholder={t('profile.bioPlaceholder')} className="input resize-none" />
          </div>
          <div>
            <label className="label">{t('profile.avatarUrl')}</label>
            <input {...register('avatarUrl')} type="url" placeholder={t('profile.avatarPlaceholder')} className="input" />
          </div>
          <div>
            <label className="label">{t('profile.privacy')}</label>
            <select {...register('privacyType')} className="input">
              <option value="PUBLIC">{t('profile.public')}</option>
              <option value="PRIVATE">{t('profile.private')}</option>
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={() => { setEditOpen(false); reset(); }} className="btn-secondary flex-1">{t('common.cancel')}</button>
            <button type="submit" disabled={updateMutation.isPending} className="btn-primary flex-1">{t('common.save')}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
