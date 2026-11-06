'use client';
import { useContext, useEffect, useState } from 'react';
import useFetch from '@/services/api/use-fetch';
import { API_URL } from '@/services/api/config';
import { AuthTokensContext } from '@/services/auth/auth-context';
import { getTokensInfo } from '@/services/auth/auth-tokens-info';
import { Button } from '@/components/ui/button';

interface JwtClaims { impersonationId?: string; actorId?: number; id?: number; }
interface ActorTokens { token: string; refreshToken: string; tokenExpires: number; }

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
  const [active, setActive] = useState(false);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const token = getTokensInfo()?.token;
  const claims = readClaims(token);

  useEffect(() => {
    let cancelled = false;
    let renewalTimer: ReturnType<typeof setTimeout> | undefined;

    const readActorContext = () => {
      const raw = sessionStorage.getItem('bc-impersonate:actor-tokens');
      const impersonationId = sessionStorage.getItem('bc-impersonate:active-id') ?? claims?.impersonationId;
      if (!raw || !impersonationId) return null;
      try { return { tokens: JSON.parse(raw) as ActorTokens, impersonationId }; }
      catch { return null; }
    };

    const restoreActor = async () => {
      const actor = readActorContext();
      if (!actor) return false;
      let response: Response | undefined;
      try {
        response = await globalThis.fetch(`${API_URL}/v1/impersonate/stop`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${actor.tokens.refreshToken}` },
          body: JSON.stringify({ impersonationId: actor.impersonationId }),
        });
      } catch {
        // Restore locally on network failure; the short-lived subject token will expire.
      }
      sessionStorage.removeItem('bc-impersonate:actor-tokens');
      sessionStorage.removeItem('bc-impersonate:active-id');
      setTokensInfo(response?.status === 401 ? null : actor.tokens);
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
        if (!response.ok) throw new Error('Unable to verify impersonation status');
        return response.json();
      })
      .then((data) => {
        if (cancelled || !data?.active) return;
        setActive(true);
        setTargetId(data.targetUserId);
        const actor = readActorContext();
        if (!actor) {
          setError('Original administrator session is unavailable in this tab');
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
            if (!cancelled) setError(cause instanceof Error ? cause.message : 'Unable to renew impersonation');
          }
        }, delay);
      })
      .catch((cause) => {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Unable to verify impersonation status');
      });

    return () => {
      cancelled = true;
      if (renewalTimer) clearTimeout(renewalTimer);
    };
  }, [fetchWithAuth, claims?.impersonationId, claims?.actorId, setTokensInfo]);

  async function stop() {
    setError('');
    try {
      const raw = sessionStorage.getItem('bc-impersonate:actor-tokens');
      const impersonationId = sessionStorage.getItem('bc-impersonate:active-id') ?? claims?.impersonationId;
      if (!raw || !impersonationId) throw new Error('Original administrator session is not available in this tab');
      const original = JSON.parse(raw) as ActorTokens;
      const response = await globalThis.fetch(`${API_URL}/v1/impersonate/stop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${original.refreshToken}` },
        body: JSON.stringify({ impersonationId }),
      });
      if (!response.ok && response.status !== 404 && response.status !== 401) {
        throw new Error('Unable to stop impersonation');
      }
      sessionStorage.removeItem('bc-impersonate:actor-tokens');
      sessionStorage.removeItem('bc-impersonate:active-id');
      setTokensInfo(response.status === 401 ? null : original);
      setActive(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to stop impersonation');
    }
  }

  if (!active) return error ? <div role="alert" className="border-b bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div> : null;
  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-400 bg-amber-50 px-4 py-2 text-sm text-amber-950 dark:bg-amber-950 dark:text-amber-100">
      <span><strong>Impersonation active.</strong> You are viewing the application as user #{targetId}.</span>
      <div className="flex items-center gap-3">
        {error && <span role="alert">{error}</span>}
        <Button size="sm" variant="outline" onClick={stop}>Stop impersonating</Button>
      </div>
    </div>
  );
}
