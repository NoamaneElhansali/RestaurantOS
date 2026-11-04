import { Activity, RefreshCw, Server } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ApiHealth } from '../lib/health';
import { Button } from './Button';

type Props = {
  health?: ApiHealth;
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  onRetry: () => void;
};

export function StatusPanel({ health, isPending, isError, isFetching, onRetry }: Props) {
  const { t } = useTranslation();
  const connected = !isPending && !isError && health?.status === 'ok';
  const status = isPending ? t('checking') : connected ? t('online') : t('offline');

  return (
    <section className="status-card" aria-labelledby="connection-heading">
      <div className="flex items-start justify-between gap-5">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rs-green-soft text-rs-green-deep" aria-hidden="true">
          <Activity size={23} strokeWidth={1.75} />
        </div>
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-rs-gold-muted">Live check</span>
      </div>
      <h2 id="connection-heading" className="mt-8 text-2xl font-semibold tracking-tight text-rs-heading">{t('statusTitle')}</h2>
      <p className="mt-2 text-sm leading-relaxed text-rs-muted">{t('statusDescription')}</p>
      <div className="mt-8 rounded-2xl border border-rs-line bg-rs-surface-soft p-4">
        <div className="flex items-center gap-3">
          <Server aria-hidden="true" size={19} className="text-rs-icon" />
          <span className="flex-1 text-sm font-medium text-rs-label">{t('service')}</span>
          <span role="status" aria-live="polite" className={['inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold', connected ? 'bg-rs-success-bg text-rs-success-text' : isPending ? 'bg-rs-neutral-bg text-rs-neutral-text' : 'bg-rs-error-bg text-rs-error-text'].join(' ')}>
            <span aria-hidden="true" className={['h-1.5 w-1.5 rounded-full', connected ? 'bg-rs-success-dot' : isPending ? 'bg-rs-neutral-dot' : 'bg-rs-error-dot'].join(' ')} />
            {status}
          </span>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-rs-divider pt-3 text-sm">
          <span className="text-rs-muted">{t('version')}</span>
          <span className="font-mono font-medium text-rs-code">{connected ? health.version : '—'}</span>
        </div>
      </div>
      <Button variant="subtle" className="mt-5 w-full" disabled={isFetching} onClick={onRetry}>
        <RefreshCw aria-hidden="true" size={16} className={isFetching ? 'animate-spin' : ''} />
        {isFetching ? t('checking') : t('retry')}
      </Button>
    </section>
  );
}
