'use client';
import { useContext, useEffect, useState } from 'react';
import useFetch from '@/services/api/use-fetch';
import { API_URL } from '@/services/api/config';
import { AuthTokensContext } from '@/services/auth/auth-context';
import { getTokensInfo } from '@/services/auth/auth-tokens-info';
import { Button } from '@/components/ui/button';
interface JwtClaims { impersonationId?: string; actorId?: number; id?: number; }
function readClaims(token: string | null | undefined): JwtClaims | null {
  if (!token) return null;
  try { const part = token.split('.')[1]; if (!part) return null; return JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/'))) as JwtClaims; }
  catch { return null; }
}
export function ImpersonationBanner() {
  const fetch = useFetch();
  const { setTokensInfo } = useContext(AuthTokensContext);
  const [active, setActive] = useState(false);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const token = getTokensInfo()?.token;
  const claims = readClaims(token);
  useEffect(() => {
    let cancelled = false;
    if (!claims?.impersonationId || !claims.actorId) { setActive(false); return; }
    fetch(`${API_URL}/v1/impersonate/current`, { method: 'GET' })
      .then(async (response) => { if (!response.ok) throw new Error('Session is no longer active'); return response.json(); })
      .then((data) => { if (!cancelled && data.active) { setActive(true); setTargetId(data.targetUserId); } })
      .catch(() => { if (!cancelled) setError('Unable to verify impersonation status'); });
    return () => { cancelled = true; };
  }, [fetch, claims?.impersonationId, claims?.actorId]);
  async function stop() {
    setError('');
    try {
      const actorTokens = sessionStorage.getItem('bc-impersonate:actor-tokens');
      const impersonationId = sessionStorage.getItem('bc-impersonate:active-id') ?? claims?.impersonationId;
      if (!actorTokens || !impersonationId) throw new Error('Original administrator session is not available in this tab');
      const original = JSON.parse(actorTokens) as { token: string; refreshToken: string; tokenExpires: number };
      const response = await fetch(`${API_URL}/v1/impersonate/stop`, { method: 'POST', headers: { Authorization: `Bearer ${original.token}` }, body: JSON.stringify({ impersonationId }) });
      if (!response.ok) throw new Error('Unable to stop impersonation');
      sessionStorage.removeItem('bc-impersonate:actor-tokens'); sessionStorage.removeItem('bc-impersonate:active-id');
      setTokensInfo(original);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to stop impersonation'); }
  }
  if (!active) return error ? <div role="alert" className="border-b bg-destructive/10 px-4 py-2 text-sm text-destructive">{error}</div> : null;
  return <div role="status" className="flex flex-wrap items-center justify-between gap-3 border-b border-amber-400 bg-amber-50 px-4 py-2 text-sm text-amber-950 dark:bg-amber-950 dark:text-amber-100">
    <span><strong>Impersonation active.</strong> You are viewing the application as user #{targetId}.</span>
    <div className="flex items-center gap-3">{error && <span role="alert">{error}</span>}<Button size="sm" variant="outline" onClick={stop}>Stop impersonating</Button></div>
  </div>;
}
