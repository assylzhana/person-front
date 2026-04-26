import { create } from 'zustand';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react';
import { useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastStore {
  toasts: Toast[];
  add: (message: string, type?: ToastType) => void;
  remove: (id: number) => void;
}

let counter = 0;

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (message, type = 'info') => {
    const id = ++counter;
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })), 4000);
  },
  remove: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}));

export const toast = {
  success: (msg: string) => useToastStore.getState().add(msg, 'success'),
  error: (msg: string) => useToastStore.getState().add(msg, 'error'),
  info: (msg: string) => useToastStore.getState().add(msg, 'info'),
};

const icons = {
  success: <CheckCircle className="h-4 w-4 text-emerald-400" />,
  error: <XCircle className="h-4 w-4 text-red-400" />,
  info: <AlertCircle className="h-4 w-4 text-blue-400" />,
};

const colors = {
  success: 'border-emerald-600/30 bg-emerald-600/10',
  error: 'border-red-600/30 bg-red-600/10',
  info: 'border-blue-600/30 bg-blue-600/10',
};

function ToastItem({ toast: t }: { toast: Toast }) {
  const remove = useToastStore(s => s.remove);
  useEffect(() => () => remove(t.id), []);
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${colors[t.type]} backdrop-blur-sm shadow-lg animate-slide-up`}>
      {icons[t.type]}
      <p className="text-sm text-slate-200 flex-1">{t.message}</p>
      <button onClick={() => remove(t.id)} className="text-slate-500 hover:text-slate-300 transition-colors">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore(s => s.toasts);
  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm w-full">
      {toasts.map(t => <ToastItem key={t.id} toast={t} />)}
    </div>
  );
}
