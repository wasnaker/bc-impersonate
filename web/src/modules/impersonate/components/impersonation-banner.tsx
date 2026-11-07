'use client';
import { useContext, useEffect, useState } from 'react';
import useFetch from '@/services/api/use-fetch';
import { API_URL } from '@/services/api/config';
import { AuthTokensContext } from '@/services/auth/auth-context';
import { getTokensInfo } from '@/services/auth/auth-tokens-info';
import { Button } from '@/components/ui/button';
import useAuth from '@/services/auth/use-auth';
import { useTranslation } from '@/services/i18n/client';

interface JwtClaims { impersonationId?: string; actorId?: number; id?: number; }
interface ActorTokens { token: string; refreshToken: string; tokenExpires: number; }
interface ImpersonatedScope { branch: string | null; customer: string | null; }

function readClaims(token: string | null | undefined): JwtClaims | null {
  if (!token) return null;
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    return JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))) as JwtClaims;
  } catch { return null; }
}

export function ImpersonationBanner() {
  const fetchWithAuth = useFetch();
  const { setTokensInfo } = useContext(AuthTokensContext);
  const { user } = useAuth();
  const { t } = useTranslation('module-impersonate');
  const [active, setActive] = useState(false);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [scope, setScope] = useState<ImpersonatedScope | null>(null);
  const [error, setError] = useState('');
  const token = getTokensInfo()?.token;
  const claims = readClaims(token);

  useEffect(() => {
    let cancelled = false;
    let renewalTimer: ReturnType<typeof setTimeout> | undefined;

    const readActorContext = () => {
      const raw = localStorage.getItem('bc-impersonate:actor-tokens');
      const impersonationId = localStorage.getItem('bc-impersonate:active-id') ?? claims?.impersonationId;
      if (!raw || !impersonationId) return null;
      try { return { tokens: JSON.parse(raw) as ActorTokens, impersonationId }; }
      catch { return null; }
    };

    const restoreActor = async () => {
      const actor = readActorContext();
      if (!actor) return false;
      let response: Response;
      try {
        response = await globalThis.fetch(`${API_URL}/v1/impersonate/stop`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${actor.tokens.refreshToken}` },
          body: JSON.stringify({ impersonationId: actor.impersonationId }),
        });
      } catch {
        setError(t('banner.stopError'));
        return false;
      }
      if (!response.ok && response.status !== 404 && response.status !== 401) {
        setError(t('banner.stopError'));
        return false;
      }
      localStorage.removeItem('bc-impersonate:actor-tokens');
      localStorage.removeItem('bc-impersonate:active-id');
      setTokensInfo(response.status === 401 ? null : actor.tokens);
      setActive(false);
      return true;
    };

    if (!claims?.impersonationId || !claims.actorId) {
      setActive(false);
      setError('');
      return;
    }

    fetchWithAuth(`${API_URL}/v1/impersonate/current`, { method: 'GET' })
      .then(async (response) => {
        if (response.status === 401) {
          if (await restoreActor()) return null;
        }
        if (!response.ok) throw new Error(t('banner.verifyError'));
        return response.json();
      })
      .then((data) => {
        if (cancelled || !data?.active) return;
        setActive(true);
        setTargetId(data.targetUserId);
        const actor = readActorContext();
        if (!actor) {
          setError(t('banner.unavailable'));
          return;
        }
        const delay = Math.max(1000, new Date(data.expiresAt).getTime() - Date.now() - 60_000);
        renewalTimer = setTimeout(async () => {
          try {
            const response = await globalThis.fetch(`${API_URL}/v1/impersonate/renew`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${actor.tokens.refreshToken}` },
              body: JSON.stringify({ impersonationId: actor.impersonationId }),
            });
            if (response.status === 401) {
              await restoreActor();
              return;
            }
            const body = await response.json();
            if (!response.ok) throw new Error(body?.message ?? 'Unable to renew impersonation');
            if (!cancelled) {
              setTokensInfo({
                token: body.accessToken,
                refreshToken: null,
                tokenExpires: new Date(body.expiresAt).getTime(),
              });
            }
          } catch (cause) {
            if (!cancelled) setError(cause instanceof Error ? cause.message : t('banner.renewError'));
          }
        }, delay);
      })
      .catch((cause) => {
        if (!cancelled) {
          setActive(true);
          setTargetId(claims.id ?? null);
          setError(cause instanceof Error ? cause.message : t('banner.verifyError'));
        }
      });

    return () => {
      cancelled = true;
      if (renewalTimer) clearTimeout(renewalTimer);
    };
  }, [fetchWithAuth, claims?.impersonationId, claims?.actorId, setTokensInfo, t]);

  // Branch & customer of the impersonated account. The endpoint derives the
  // scope from the authenticated user's own staff record, so it cannot be
  // used to read another customer's data. Missing staff link (404) or any
  // other failure simply leaves the fields empty in the banner.
  useEffect(() => {
    if (!active) {
      setScope(null);
      return;
    }
    let cancelled = false;
    fetchWithAuth(`${API_URL}/v1/customer/me/branch`, { method: 'GET' })
      .then(async (response) => {
        if (response.status === 404) {
          return { branch: null, customer: null } satisfies ImpersonatedScope;
        }
        if (!response.ok) return null;
        const data = (await response.json()) as {
          name?: string | null;
          customerName?: string | null;
        };
        return {
          branch: data?.name ?? null,
          customer: data?.customerName ?? null,
        } satisfies ImpersonatedScope;
      })
      .then((next) => {
        if (!cancelled) setScope(next);
      })
      .catch(() => {
        if (!cancelled) setScope(null);
      });
    return () => {
      cancelled = true;
    };
  }, [active, fetchWithAuth]);

  async function stop() {
    setError('');
    try {
      const raw = localStorage.getItem('bc-impersonate:actor-tokens');
      const impersonationId = localStorage.getItem('bc-impersonate:active-id') ?? claims?.impersonationId;
      if (!raw || !impersonationId) throw new Error(t('banner.unavailable'));
      const original = JSON.parse(raw) as ActorTokens;
      const response = await globalThis.fetch(`${API_URL}/v1/impersonate/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${original.refreshToken}` },
        body: JSON.stringify({ impersonationId }),
      });
      if (!response.ok && response.status !== 404 && response.status !== 401) {
        throw new Error(t('banner.stopError'));
      }
      localStorage.removeItem('bc-impersonate:actor-tokens');
      localStorage.removeItem('bc-impersonate:active-id');
      setTokensInfo(response.status === 401 ? null : original);
      setActive(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to stop impersonation');
    }
  }

  if (!active) return error ? <div role="alert" className="border-b bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div> : null;
  const targetName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || `#${targetId}`;
  const roleNames = (user?.roles ?? [])
    .map((role) => role.name)
    .filter((name): name is string => Boolean(name));
  return (
    <div role="status" className="flex flex-wrap items-start justify-between gap-3 border-b border-amber-400 bg-amber-50 px-4 py-2 text-sm text-amber-950 dark:bg-amber-950 dark:text-amber-100">
      <div className="flex min-w-0 flex-col gap-1">
        <span><strong>{t('banner.title')}.</strong> {t('banner.description', { user: targetName })}</span>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span><span className="font-semibold">{t('banner.branch')}:</span> {scope?.branch ?? '—'}</span>
          <span><span className="font-semibold">{t('banner.customer')}:</span> {scope?.customer ?? '—'}</span>
          <span className="flex flex-wrap items-center gap-1">
            <span className="font-semibold">{t('banner.roles')}:</span>
            {roleNames.length > 0
              ? roleNames.map((name) => (
                  <span key={name} className="rounded-full border border-amber-400/70 bg-amber-100/70 px-1.5 py-0.5 font-medium dark:bg-amber-900/40">
                    {name}
                  </span>
                ))
              : '—'}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {error && <span role="alert" className="text-xs">{error}</span>}
        <Button size="sm" variant="outline" onClick={stop}>{t('banner.stop')}</Button>
      </div>
    </div>
  );
}
