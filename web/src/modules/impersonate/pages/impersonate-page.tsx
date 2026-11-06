'use client';
import { useState, useContext } from 'react';
import { AuthTokensContext } from '@/services/auth/auth-context';
import { getTokensInfo } from '@/services/auth/auth-tokens-info';
import { useTranslation } from '@/services/i18n/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useImpersonateApi, type ImpersonateUser } from '../services/impersonate-api';

export function ImpersonatePage() {
  const { t } = useTranslation('module-impersonate');
  const { setTokensInfo } = useContext(AuthTokensContext);
  const { searchUsers, start } = useImpersonateApi();
  const [query, setQuery] = useState('');
  const [reason, setReason] = useState('');
  const [users, setUsers] = useState<ImpersonateUser[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 30;
  const [selected, setSelected] = useState<ImpersonateUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function handleSearch() {
    setLoading(true); setError(''); setSelected(null);
    try {
      const result = await searchUsers(query, 1);
      setUsers(result.data);
      setPage(1);
      setTotal(result.total);
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : t('errors.search')); }
    finally { setLoading(false); }
  }
  async function changePage(nextPage: number) {
    setLoading(true); setError('');
    try {
      const result = await searchUsers(query, nextPage);
      setUsers(result.data);
      setPage(nextPage);
      setTotal(result.total);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t('errors.search'));
    } finally {
      setLoading(false);
    }
  }
  async function handleStart() {
    if (!selected) return;
    setLoading(true); setError('');
    try {
      const actorTokens = getTokensInfo();
      if (!actorTokens?.token || !actorTokens.refreshToken) throw new Error(t('errors.missingSession'));
      const result = await start(selected.id, reason);
      localStorage.setItem('bc-impersonate:actor-tokens', JSON.stringify(actorTokens));
      localStorage.setItem('bc-impersonate:active-id', result.impersonationId);
      setTokensInfo({ token: result.accessToken, refreshToken: null, tokenExpires: new Date(result.expiresAt).getTime() });
    } catch (cause) { setError(cause instanceof Error ? cause.message : t('errors.start')); }
    finally { setLoading(false); }
  }
  const displayName = (item: ImpersonateUser) => [item.firstName, item.lastName].filter(Boolean).join(' ') || item.email || `#${item.id}`;
  return (
    <div className="page-content--wide"><div className="page-content--body space-y-6">
      <div><h1 className="page-title">{t('title')}</h1><p className="page-subtitle">{t('subtitle')}</p></div>
      <section className="max-w-3xl rounded-lg border bg-card p-5">
        <h2 className="text-base font-semibold">{t('select.title')}</h2><p className="mt-1 text-sm text-muted-foreground">{t('select.description')}</p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('select.searchPlaceholder')} aria-label={t('select.searchPlaceholder')} />
          <Button onClick={handleSearch} disabled={loading}>{t('actions.search')}</Button>
        </div>
        {users.length > 0 && <ul className="mt-4 divide-y rounded-md border">{users.map((item) => <li key={item.id}>
          <button type="button" onClick={() => setSelected(item)} className={`flex w-full items-center justify-between px-3 py-3 text-left hover:bg-muted ${selected?.id === item.id ? 'bg-muted' : ''}`}>
            <span><span className="block font-medium">{displayName(item)}</span><span className="text-xs text-muted-foreground">{item.email ?? t('select.noEmail')} · #{item.id}</span></span>
            {selected?.id === item.id && <span className="text-xs font-medium">{t('select.selected')}</span>}
          </button>
        </li>)}</ul>}
        {users.length === 0 && query && !loading && <p className="mt-4 text-sm text-muted-foreground">{t('select.noResults')}</p>}
        {total > pageSize && <div className="mt-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t('select.page', { page, pages: Math.ceil(total / pageSize), total })}</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => changePage(page - 1)} disabled={loading || page <= 1}>{t('select.previous')}</Button>
            <Button size="sm" variant="outline" onClick={() => changePage(page + 1)} disabled={loading || page >= Math.ceil(total / pageSize)}>{t('select.next')}</Button>
          </div>
        </div>}
        {selected && <div className="mt-5 space-y-3 border-t pt-4">
          <div className="text-sm"><span className="text-muted-foreground">{t('select.target')}: </span><strong>{displayName(selected)}</strong></div>
          <label className="block space-y-1 text-sm"><span className="font-medium">{t('select.reason')}</span><Input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} placeholder={t('select.reasonPlaceholder')} /></label>
          <Button onClick={handleStart} disabled={loading}>{t('actions.start')}</Button>
        </div>}
        {error && <p role="alert" className="mt-4 text-sm text-destructive">{error}</p>}
      </section>
      <p className="max-w-3xl text-xs text-muted-foreground">{t('securityNote')}</p>
    </div></div>
  );
}
