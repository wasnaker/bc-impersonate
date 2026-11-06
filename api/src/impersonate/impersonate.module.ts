import { DynamicModule, Module, Provider } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ImpersonationSessionEntity } from './infrastructure/persistence/relational/entities/impersonation-session.entity';
import { ImpersonateController } from './impersonate.controller';
import { ImpersonateService } from './impersonate.service';
import { IMPERSONATE_MODULE_OPTIONS, ImpersonateModuleAsyncOptions } from './impersonate.options';

export const IMPERSONATE_SERVICE = Symbol.for('@wasnaker/module-impersonate/service');

@Module({
  imports: [TypeOrmModule.forFeature([ImpersonationSessionEntity])],
  controllers: [ImpersonateController],
  providers: [
    ImpersonateService,
    { provide: IMPERSONATE_SERVICE, useExisting: ImpersonateService },
  ],
  exports: [ImpersonateService, IMPERSONATE_SERVICE],
})
export class ImpersonateModule {
  static registerAsync(options: ImpersonateModuleAsyncOptions): DynamicModule {
    const optionsProvider: Provider = {
      provide: IMPERSONATE_MODULE_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject ?? [],
    };
    return {
      module: ImpersonateModule,
      imports: options.imports ?? [],
      providers: [optionsProvider],
    };
  }
}
