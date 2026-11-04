import { ArrowUpRight, ChefHat, Globe2, ShieldCheck, Sparkles } from 'lucide-react';
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, RequireAuth } from './auth/AuthProvider';
import { AuthPage, VerifyEmailPage } from './pages/AuthPages';
import { Dashboard } from './pages/Dashboard';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { StatusPanel } from './components/StatusPanel';
import { setLanguage, supportedLanguages, type Language } from './i18n';
import { getApiHealth } from './lib/health';

export function HomePage() {
  const { t, i18n } = useTranslation();
  const health = useQuery({
    queryKey: ['api-health', 'v1'],
    queryFn: () => getApiHealth(),
    retry: 1,
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });

  return (
    <div className="min-h-screen bg-rs-canvas text-rs-ink">
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4 border-b border-rs-border py-6">
          <div className="flex items-center gap-3" aria-label="RestaurantOS">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rs-forest-deep text-rs-gold-bright shadow-sm">
              <ChefHat aria-hidden="true" size={24} strokeWidth={1.7} />
            </div>
            <span className="text-xl font-bold tracking-[-0.055em]">Restaurant<span className="text-rs-gold-dark">OS</span></span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Globe2 aria-hidden="true" size={18} className="hidden text-rs-text-subtle sm:block" />
            <label className="sr-only" htmlFor="locale-select">{t('lang')}</label>
            <select
              id="locale-select"
              aria-label={t('lang')}
              value={i18n.language}
              onChange={(event) => void setLanguage(event.target.value as Language)}
              className="cursor-pointer rounded-lg border border-rs-input-border bg-white px-3 py-2 font-medium focus-visible:outline-3 focus-visible:outline-rs-gold"
            >
              {supportedLanguages.map((language) => (
                <option value={language} key={language}>{language === 'ar' ? 'العربية' : language === 'fr' ? 'Français' : 'English'}</option>
              ))}
            </select>
          </div>
        </header>

        <main className="grid items-center gap-12 py-16 md:py-24 lg:grid-cols-[1.25fr_0.85fr] lg:gap-20 lg:py-32">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-rs-tag-line bg-rs-tag-bg px-4 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-rs-tag-text">
              <Sparkles size={14} aria-hidden="true" /> {t('phase')}
            </div>
            <p className="mt-8 text-sm font-semibold tracking-widest text-rs-gold-label uppercase">{t('product')}</p>
            <h1 className="mt-4 max-w-3xl text-5xl font-semibold leading-[1.1] tracking-[-0.055em] sm:text-6xl lg:text-[4.8rem]">{t('headline')}</h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-rs-secondary">{t('subtitle')}</p>
            <div className="mt-8 flex flex-wrap gap-3"><Link to="/login" className="rounded-xl bg-rs-forest px-5 py-3 font-semibold text-white">Sign in</Link><Link to="/register" className="rounded-xl border border-rs-border px-5 py-3 font-semibold">Create account</Link></div>
            <div className="mt-9 border-s-2 border-rs-gold ps-5">
              <p className="text-xs font-semibold uppercase tracking-[0.17em] text-rs-gold-muted-2">{t('next')}</p>
              <p className="mt-2 text-sm font-medium leading-relaxed text-rs-detail">{t('planned')} <ArrowUpRight size={14} className="inline" aria-hidden="true" /></p>
            </div>
          </div>
          <StatusPanel health={health.data} isPending={health.isPending} isError={health.isError} isFetching={health.isFetching} onRetry={() => void health.refetch()} />
        </main>

        <footer className="flex flex-col justify-between gap-4 border-t border-rs-border py-8 text-sm text-rs-footer sm:flex-row sm:items-center">
          <span>{t('footer')}</span>
          <span className="inline-flex items-center gap-2"><ShieldCheck aria-hidden="true" size={16} />{t('security')}</span>
        </footer>
      </div>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/forgot-password" element={<AuthPage mode="forgot" />} />
          <Route path="/reset-password" element={<AuthPage mode="reset" />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
