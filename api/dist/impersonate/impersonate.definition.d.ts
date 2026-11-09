import type { DynamicModule } from '@nestjs/common';
import type { ImpersonateModuleAsyncOptions } from './impersonate.options';
export declare const moduleDefinition: {
    manifest: import("./impersonate.manifest").BackendModuleManifest;
    registerAsync: (options: ImpersonateModuleAsyncOptions) => DynamicModule;
    entities: readonly [typeof import("..").ImpersonationSessionEntity];
    migrations: readonly [typeof import("./database/migrations/1793928000000-CreateImpersonationSession").CreateImpersonationSession1793928000000];
    seedServices: readonly (new (...args: any[]) => unknown)[];
};
