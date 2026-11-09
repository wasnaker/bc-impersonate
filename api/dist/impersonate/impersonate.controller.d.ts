import { StartImpersonationDto } from './dto/start-impersonation.dto';
import { StopImpersonationDto } from './dto/stop-impersonation.dto';
import { ImpersonateService } from './impersonate.service';
interface AuthenticatedPayload {
    id: number;
    sessionId: number;
    impersonationId?: string;
    actorId?: number;
}
interface AuthenticatedRequest {
    user: AuthenticatedPayload;
}
interface RefreshPayload {
    sessionId: number;
    hash: string;
}
interface RefreshRequest {
    user: RefreshPayload;
}
export declare class ImpersonateController {
    private readonly service;
    constructor(service: ImpersonateService);
    users(request: AuthenticatedRequest, query?: string, page?: string, limit?: string): Promise<{
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
    start(request: AuthenticatedRequest, dto: StartImpersonationDto): Promise<{
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
    stop(request: RefreshRequest, dto: StopImpersonationDto): Promise<{
        stopped: boolean;
        alreadyStopped: boolean;
        impersonationId?: undefined;
    } | {
        stopped: boolean;
        impersonationId: string;
        alreadyStopped?: undefined;
    }>;
    renew(request: RefreshRequest, dto: StopImpersonationDto): Promise<{
        impersonationId: string;
        accessToken: string;
        expiresAt: Date;
    }>;
    current(request: AuthenticatedRequest): Promise<{
        impersonationId: string;
        actorUserId: number;
        targetUserId: number;
        startedAt: Date;
        expiresAt: Date;
        reason: string | null;
        active: boolean;
    }> | {
        active: boolean;
    };
}
export {};
