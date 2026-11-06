import type { DynamicModule } from '@nestjs/common';
import { ImpersonateModule } from './impersonate.module';
import { moduleManifest } from './impersonate.manifest';
import { moduleEntities } from './impersonate.entities';
import { moduleMigrations } from './database/migrations';
import { moduleSeedServices } from './impersonate.seeds';
import type { ImpersonateModuleAsyncOptions } from './impersonate.options';

export const moduleDefinition = {
  manifest: moduleManifest,
  registerAsync: (options: ImpersonateModuleAsyncOptions): DynamicModule =>
    ImpersonateModule.registerAsync(options),
  entities: moduleEntities,
  migrations: moduleMigrations,
  seedServices: moduleSeedServices,
};
