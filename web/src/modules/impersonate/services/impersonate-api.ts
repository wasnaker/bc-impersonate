'use client';
import { useCallback } from 'react';
import useFetch from '@/services/api/use-fetch';
import { API_URL } from '@/services/api/config';
export interface ImpersonateUser { id: number; email: string | null; firstName: string | null; lastName: string | null; }
export interface ImpersonationStartResponse { impersonationId: string; accessToken: string; expiresAt: string; actorUserId: number; subject: ImpersonateUser; }
export function useImpersonateApi() {
  const fetch = useFetch();
  const searchUsers = useCallback(async (query: string) => {
    const url = new URL(`${API_URL}/v1/impersonate/users`); url.searchParams.set('q', query); url.searchParams.set('page', '1'); url.searchParams.set('limit', '30');
    const response = await fetch(url, { method: 'GET' }); if (!response.ok) throw new Error('Unable to search users');
    return response.json() as Promise<{ data: ImpersonateUser[]; total: number }>;
  }, [fetch]);
  const start = useCallback(async (targetUserId: number, reason?: string) => {
    const response = await fetch(`${API_URL}/v1/impersonate/start`, { method: 'POST', body: JSON.stringify({ targetUserId, reason }) });
    const body = await response.json(); if (!response.ok) throw new Error(body?.message ?? 'Unable to start impersonation'); return body as ImpersonationStartResponse;
  }, [fetch]);
  const renew = useCallback(async (impersonationId: string, actorToken: string) => {
    const response = await globalThis.fetch(`${API_URL}/v1/impersonate/renew`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${actorToken}` },
      body: JSON.stringify({ impersonationId }),
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body?.message ?? 'Unable to renew impersonation');
    return body as { impersonationId: string; accessToken: string; expiresAt: string };
  }, []);

  return { searchUsers, start, renew };
}
