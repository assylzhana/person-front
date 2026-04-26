import i18n from '../i18n';

const getLocaleCode = () => {
  const lang = i18n.language;
  if (lang === 'kk') return 'kk-KZ';
  if (lang === 'en') return 'en-US';
  return 'ru-RU';
};

export const formatCurrency = (amount: number, currency = '₸') => {
  return new Intl.NumberFormat(getLocaleCode()).format(amount) + ' ' + currency;
};

export const formatDate = (date: string) => {
  return new Intl.DateTimeFormat(getLocaleCode(), {
    day: '2-digit', month: 'short', year: 'numeric',
  }).format(new Date(date));
};

export const formatDateTime = (date: string) => {
  return new Intl.DateTimeFormat(getLocaleCode(), {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(date));
};

export const getDaysUntil = (deadline: string) => {
  const today = new Date();
  const target = new Date(deadline);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};
