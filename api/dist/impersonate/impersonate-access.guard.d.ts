import { CanActivate, ExecutionContext } from '@nestjs/common';
import { ImpersonateModuleOptions } from './impersonate.options';
export declare class ImpersonateAccessGuard implements CanActivate {
    private readonly options?;
    constructor(options?: ImpersonateModuleOptions | undefined);
    canActivate(_context: ExecutionContext): Promise<boolean>;
}
