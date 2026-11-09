export declare class ImpersonationSessionEntity {
    id: string;
    actorUserId: number;
    targetUserId: number;
    actorSessionId: number;
    status: 'active' | 'stopped' | 'expired' | 'revoked';
    reason: string | null;
    expiresAt: Date;
    startedAt: Date;
    updatedAt: Date;
    endedAt: Date | null;
    endedByUserId: number | null;
    terminationReason: string | null;
}
