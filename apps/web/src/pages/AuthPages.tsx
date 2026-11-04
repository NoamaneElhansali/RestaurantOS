import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { useAuth } from '../auth/AuthProvider';
import { ApiError, identity } from '../lib/api';

type AuthMode = 'login' | 'register' | 'forgot' | 'reset';

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const first = Object.values(error.errors)[0]?.[0];
    return first ?? error.message;
  }
  return 'The request could not be completed. Check your connection.';
}

export function AuthPage({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [params] = useSearchParams();
  const { user, refresh } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState(params.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const titles = {
    login: t('phase2.loginTitle'),
    register: t('phase2.registerTitle'),
    forgot: t('phase2.forgotTitle'),
    reset: t('phase2.resetTitle'),
  };

  if (user && mode !== 'reset' && mode !== 'forgot') {
    return <Navigate to={user.email_verified ? '/dashboard' : '/verify-email'} replace />;
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if ((mode === 'register' || mode === 'reset') && password !== confirmation) {
      setError(t('phase2.mismatch'));
      return;
    }
    setPending(true);
    try {
      if (mode === 'login') {
        await identity.login(email, password);
        await refresh();
        navigate('/dashboard', { replace: true });
      } else if (mode === 'register') {
        await identity.register(name, email, password, confirmation);
        await refresh();
        navigate('/verify-email', { replace: true });
      } else if (mode === 'forgot') {
        await identity.forgot(email);
        setSuccess(t('phase2.forgotSuccess'));
      } else {
        const token = params.get('token');
        if (!token) throw new Error(t('phase2.missingToken'));
        await identity.reset(email, token, password, confirmation);
        setSuccess(t('phase2.resetSuccess'));
      }
    } catch (exception) {
      setError(errorMessage(exception));
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-lg px-5 py-14">
      <section className="rounded-3xl border border-rs-card-border bg-white p-7 shadow-sm sm:p-10" aria-labelledby="auth-heading">
        <h1 id="auth-heading" className="text-3xl font-bold tracking-tight">{titles[mode]}</h1>
        <p className="mt-3 text-sm text-rs-muted">{t('phase2.authIntro')}</p>
        <form className="mt-8 space-y-5" onSubmit={(event) => void submit(event)}>
          {mode === 'register' && <label className="block text-sm font-medium">
            {t('phase2.fullName')}
            <input name="name" autoComplete="name" minLength={2} maxLength={120} required value={name} onChange={(e) => setName(e.target.value)} className="auth-input" />
          </label>}
          <label className="block text-sm font-medium">
            {t('phase2.email')}
            <input name="email" type="email" autoComplete="email" maxLength={255} required value={email} onChange={(e) => setEmail(e.target.value)} className="auth-input" />
          </label>
          {mode !== 'forgot' && <label className="block text-sm font-medium">
            {mode === 'login' ? t('phase2.password') : t('phase2.passwordRule')}
            <input name="password" type="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required minLength={mode === 'login' ? undefined : 12} value={password} onChange={(e) => setPassword(e.target.value)} className="auth-input" />
          </label>}
          {(mode === 'register' || mode === 'reset') && <label className="block text-sm font-medium">
            {t('phase2.confirmPassword')}
            <input name="confirmation" type="password" autoComplete="new-password" required minLength={12} value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className="auth-input" />
          </label>}
          {error && <p role="alert" className="rounded-lg bg-rs-error-bg p-3 text-sm text-rs-error-text">{error}</p>}
          {success && <p role="status" className="rounded-lg bg-rs-success-bg p-3 text-sm text-rs-success-text">{success}</p>}
          <Button disabled={pending} className="w-full" type="submit">{pending ? t('phase2.working') : mode === 'login' ? t('phase2.signIn') : mode === 'register' ? t('phase2.createAccount') : mode === 'forgot' ? t('phase2.sendReset') : t('phase2.updatePassword')}</Button>
        </form>
        <nav aria-label="Account links" className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm underline underline-offset-4">
          {mode !== 'login' && <Link to="/login">{t('phase2.signIn')}</Link>}
          {mode !== 'register' && <Link to="/register">{t('phase2.createAccount')}</Link>}
          {mode === 'login' && <Link to="/forgot-password">{t('phase2.forgotPassword')}</Link>}
        </nav>
      </section>
    </main>
  );
}

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user, pending, refresh } = useAuth();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  if (pending) return <main role="status" className="mx-auto max-w-xl p-10">{t('phase2.checkingVerify')}</main>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.email_verified) return <Navigate to="/dashboard" replace />;

  async function refreshAndContinue() {
    await refresh();
    navigate('/dashboard');
  }

  async function resend() {
    setSending(true);
    setError('');
    try {
      await identity.verify();
      setMessage(t('phase2.verifySent'));
    } catch (exception) {
      setError(errorMessage(exception));
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto max-w-xl px-5 py-20">
      <section className="rounded-3xl border border-rs-card-border bg-white p-8">
        <h1 className="text-3xl font-semibold">{t('phase2.verifyTitle')}</h1>
        <p className="mt-4 text-rs-secondary">{t('phase2.verifyIntro', { email: user.email })}</p>
        {params.get('verified') === '1' && <p role="status" className="mt-5">{t('phase2.verifyProcessed')}</p>}
        {message && <p role="status" className="mt-5">{message}</p>}
        {error && <p role="alert" className="mt-5 text-rs-error-text">{error}</p>}
        <div className="mt-8 flex flex-wrap gap-3">
          <Button onClick={() => void refreshAndContinue()}>{t('phase2.verifyButton')}</Button>
          <Button variant="subtle" disabled={sending} onClick={() => void resend()}>{sending ? t('phase2.sending') : t('phase2.resend')}</Button>
        </div>
      </section>
    </main>
  );
}
