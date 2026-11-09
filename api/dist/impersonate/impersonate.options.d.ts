import type { DynamicModule } from '@nestjs/common';
export interface ImpersonationUser {
    id: number | string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    roles: readonly {
        id: number | string;
    }[];
    active: boolean;
}
export interface ImpersonationTokenInput {
    subjectUserId: number | string;
    subjectRoleIds: readonly (number | string)[];
    actorUserId: number | string;
    actorSessionId: number | string;
    impersonationId: string;
    expiresInSeconds: number;
}
export interface ImpersonateModuleOptions {
    /** Host lifecycle gate; impersonation routes are unavailable while inactive. */
    isModuleActive?: () => boolean | Promise<boolean>;
    /** Resolve a target through the host user service, including its current roles/status. */
    findUserById(userId: number | string): Promise<ImpersonationUser | null>;
    /** Search users through the host user service; never query the host user table directly. */
    searchUsers(input: {
        query: string;
        page: number;
        limit: number;
        excludeUserId: number | string;
    }): Promise<{
        data: ImpersonationUser[];
        total: number;
    }>;
    /** Verify that actorId/sessionId is still a valid host session. */
    validateActorSession(actorId: number | string, sessionId: number | string): Promise<boolean>;
    /** Resolve a signed refresh-token session only when its hash still matches the host session. */
    resolveActorSession(sessionId: number | string, hash: string): Promise<{
        actorId: number | string;
    } | null>;
    /** Delegate permission checks to the central Brocoders authorization core. */
    authorize(actorId: number | string, permission: string): Promise<boolean>;
    /** Sign using the host JWT configuration; claims must include subject, roles, actor and impersonation ID. */
    issueAccessToken(input: ImpersonationTokenInput): Promise<{
        accessToken: string;
        expiresAt: Date;
    }>;
    /** Maximum lifetime for a temporary impersonation access token. */
    tokenLifetimeSeconds?: number;
}
export interface ImpersonateModuleAsyncOptions {
    imports?: DynamicModule['imports'];
    inject?: any[];
    useFactory: (...dependencies: any[]) => ImpersonateModuleOptions | Promise<ImpersonateModuleOptions>;
}
export declare const IMPERSONATE_MODULE_OPTIONS: unique symbol;
