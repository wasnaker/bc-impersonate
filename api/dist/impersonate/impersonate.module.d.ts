import { DynamicModule } from '@nestjs/common';
import { ImpersonateModuleAsyncOptions } from './impersonate.options';
export declare const IMPERSONATE_SERVICE: unique symbol;
export declare class ImpersonateModule {
    static registerAsync(options: ImpersonateModuleAsyncOptions): DynamicModule;
}
