import { Repository } from 'typeorm';
import { ImpersonationSessionEntity } from './infrastructure/persistence/relational/entities/impersonation-session.entity';
import { ImpersonateModuleOptions } from './impersonate.options';
export declare class ImpersonateService {
    private readonly sessions;
    private readonly options?;
    constructor(sessions: Repository<ImpersonationSessionEntity>, options?: ImpersonateModuleOptions | undefined);
    private get adapter();
    searchUsers(actorId: number, query: string, page?: number, limit?: number): Promise<{
        data: {
            id: string | number;
            email: string | null;
            firstName: string | null;
            lastName: string | null;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    start(input: {
        actorId: number;
        actorSessionId: number;
        targetUserId: number;
        reason?: string;
    }): Promise<{
        impersonationId: `${string}-${string}-${string}-${string}-${string}`;
        accessToken: string;
        expiresAt: Date;
        actorUserId: number;
        subject: {
            id: string | number;
            email: string | null;
            firstName: string | null;
            lastName: string | null;
        };
    }>;
    stopWithRefreshToken(actorSessionId: number, refreshHash: string, impersonationId: string): Promise<{
        stopped: boolean;
        alreadyStopped: boolean;
        impersonationId?: undefined;
    } | {
        stopped: boolean;
        impersonationId: string;
        alreadyStopped?: undefined;
    }>;
    renewWithRefreshToken(actorSessionId: number, refreshHash: string, impersonationId: string): Promise<{
        impersonationId: string;
        accessToken: string;
        expiresAt: Date;
    }>;
    endForActorLogout(actorId: number, actorSessionId: number, impersonationId: string): Promise<{
        ended: boolean;
        alreadyEnded: boolean;
        impersonationId?: undefined;
    } | {
        ended: boolean;
        impersonationId: string;
        alreadyEnded?: undefined;
    }>;
    getCurrent(impersonationId: string, actorId: number, subjectId: number): Promise<{
        impersonationId: string;
        actorUserId: number;
        targetUserId: number;
        startedAt: Date;
        expiresAt: Date;
        reason: string | null;
    }>;
    /** Host refresh strategy must reject the actor refresh token while impersonation is active. */
    assertActorSessionCanRefresh(actorSessionId: number): Promise<void>;
    /** Host JWT strategy must call this for every request carrying an impersonation claim. */
    assertActiveToken(input: {
        impersonationId: string;
        actorId: number;
        subjectId: number;
        actorSessionId: number;
    }): Promise<Array<number | string>>;
    private toSafeUser;
}
